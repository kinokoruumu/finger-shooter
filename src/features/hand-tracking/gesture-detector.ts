import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { GAME_CONFIG } from "@/config/game-config";
import type { AimPosition } from "@/types/shared";

export type CalibrationState = "none" | "progress" | "done";

export type GestureDebugValues = {
	isPinching: boolean;
	calibration: CalibrationState;
	calibrationProgress: number;
	raw: {
		pinchDist: number;
		handSize: number;
	};
};

export type GestureResult = {
	isHandDetected: boolean;
	aim: AimPosition | null;
	shouldFire: boolean;
	debug: GestureDebugValues;
};

// ランドマークインデックス
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_MCP = 2;
const INDEX_TIP = 8;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_TIP = 20;

const aimHistory: AimPosition[] = [];

const dist2d = (a: NormalizedLandmark, b: NormalizedLandmark): number => {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};

const dist3d = (a: NormalizedLandmark, b: NormalizedLandmark): number => {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
};

const getHandSize = (landmarks: NormalizedLandmark[]): number => {
	return dist3d(landmarks[WRIST], landmarks[MIDDLE_MCP]);
};

// ピンチ閾値（厳しめ: しっかり閉じないと発射しない）
const PINCH_ON_THRESHOLD = 0.2;
const PINCH_OFF_THRESHOLD = 0.24;

let wasPinching = false;
/** 前フレームでピンチ中だったか（トリガー検出用） */
let prevPinching = false;

// --- キャリブレーション ---
const CALIBRATION_HOLD_MS = 1500;
let calibrationState: CalibrationState = "none";
let palmOpenStartTime = 0;
/** キャリブレーション時の手首位置（生の正規化座標） */
let centerWristX = 0.5;
let centerWristY = 0.5;
/** キャリブレーション時の向きベクトル */
let centerDirX = 0;
let centerDirY = -0.15;

/**
 * 5本指が全部しっかり伸びて開いているか（パーの状態）
 * 厳しめの判定：指がしっかり伸展 + 指同士が開いている
 */
const isOpenPalm = (
	landmarks: NormalizedLandmark[],
	handSize: number,
): boolean => {
	const fingers = [
		[INDEX_TIP, INDEX_MCP],
		[MIDDLE_TIP, MIDDLE_MCP],
		[RING_TIP, RING_MCP],
		[PINKY_TIP, PINKY_MCP],
	];

	// 4本の指がしっかり伸びている
	for (const [tipIdx, mcpIdx] of fingers) {
		const fingerLen = dist3d(landmarks[tipIdx], landmarks[mcpIdx]) / handSize;
		if (fingerLen < 0.65) return false;
	}

	// 親指もしっかり開いている
	const thumbLen =
		dist3d(landmarks[THUMB_TIP], landmarks[THUMB_MCP]) / handSize;
	if (thumbLen < 0.45) return false;

	// 指同士が開いている（隣り合う指先の距離）
	const fingerTips = [INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];
	for (let i = 0; i < fingerTips.length - 1; i++) {
		const spread =
			dist2d(landmarks[fingerTips[i]], landmarks[fingerTips[i + 1]]) / handSize;
		if (spread < 0.15) return false;
	}

	return true;
};

/**
 * 手首基準 + キャリブレーションオフセットで照準算出。
 *
 * キャリブレーション時の手首位置を画面中央(0.5, 0.5)として、
 * そこからの相対移動で照準を決める。
 */
const calculateAim = (landmarks: NormalizedLandmark[]): AimPosition => {
	const wrist = landmarks[WRIST];
	const middleMcp = landmarks[MIDDLE_MCP];

	// 手首の相対移動量（キャリブレーション中央からのずれ）
	const deltaX = wrist.x - centerWristX;
	const deltaY = wrist.y - centerWristY;

	// 手の向きベクトル
	const dirX = middleMcp.x - wrist.x;
	const dirY = middleMcp.y - wrist.y;

	// 向きの相対変化量
	const deltaDirX = dirX - centerDirX;
	const deltaDirY = dirY - centerDirY;

	// 位置移動をスケーリングして画面中央(0.5)からの相対座標にする
	const posScale = 3.0;
	const dirScale = GAME_CONFIG.gesture.aimExtensionMultiplier;

	const aimX = 0.5 + deltaX * posScale + deltaDirX * dirScale;
	const aimY = 0.5 + deltaY * posScale + deltaDirY * dirScale;

	// ミラー変換はここの1箇所のみ
	const x = Math.max(0, Math.min(1, 1 - aimX));
	const y = Math.max(0, Math.min(1, aimY));

	return { x, y };
};

const smoothAim = (aim: AimPosition): AimPosition => {
	const maxFrames = GAME_CONFIG.gesture.smoothingFrames;
	aimHistory.push(aim);

	if (aimHistory.length > maxFrames) {
		aimHistory.shift();
	}

	const sumX = aimHistory.reduce((sum, p) => sum + p.x, 0);
	const sumY = aimHistory.reduce((sum, p) => sum + p.y, 0);

	return {
		x: sumX / aimHistory.length,
		y: sumY / aimHistory.length,
	};
};

const checkPinch = (
	landmarks: NormalizedLandmark[],
	handSize: number,
): boolean => {
	// 2D距離で判定（正面向きでもz座標の影響を受けない）
	const pinchDist =
		dist2d(landmarks[THUMB_TIP], landmarks[INDEX_TIP]) / handSize;
	const threshold = wasPinching ? PINCH_OFF_THRESHOLD : PINCH_ON_THRESHOLD;
	return pinchDist < threshold;
};

export const detectGesture = (
	landmarks: NormalizedLandmark[],
): GestureResult => {
	const handSize = getHandSize(landmarks);
	const now = performance.now();

	// --- キャリブレーション処理 ---
	const palmOpen = isOpenPalm(landmarks, handSize);
	let calibrationProgress = 0;

	if (palmOpen) {
		if (palmOpenStartTime === 0) {
			palmOpenStartTime = now;
			calibrationState = "progress";
		}

		const elapsed = now - palmOpenStartTime;
		calibrationProgress = Math.min(elapsed / CALIBRATION_HOLD_MS, 1);

		if (elapsed >= CALIBRATION_HOLD_MS) {
			// キャリブレーション完了: 現在の手首位置と向きを中央として記録
			centerWristX = landmarks[WRIST].x;
			centerWristY = landmarks[WRIST].y;
			centerDirX = landmarks[MIDDLE_MCP].x - landmarks[WRIST].x;
			centerDirY = landmarks[MIDDLE_MCP].y - landmarks[WRIST].y;
			calibrationState = "done";
			palmOpenStartTime = 0;
			aimHistory.length = 0;
		}
	} else {
		palmOpenStartTime = 0;
		if (calibrationState === "progress") {
			calibrationState =
				calibrationState === "progress" && calibrationProgress < 1
					? "none"
					: calibrationState;
		}
	}

	// --- 照準 ---
	const rawAim = calculateAim(landmarks);
	const aim = smoothAim(rawAim);

	// --- ピンチ（パー状態中は発射しない、2D距離で判定） ---
	const pinchDist =
		dist2d(landmarks[THUMB_TIP], landmarks[INDEX_TIP]) / handSize;
	const isPinching = !palmOpen && checkPinch(landmarks, handSize);
	wasPinching = isPinching;

	// トリガー式: ピンチし始めた瞬間のみ発射
	const shouldFire = isPinching && !prevPinching;
	prevPinching = isPinching;

	const debug: GestureDebugValues = {
		isPinching,
		calibration: calibrationState,
		calibrationProgress,
		raw: {
			pinchDist: Math.round(pinchDist * 100) / 100,
			handSize: Math.round(handSize * 1000) / 1000,
		},
	};

	return {
		isHandDetected: true,
		aim,
		shouldFire,
		debug,
	};
};

export const resetGestureState = () => {
	aimHistory.length = 0;
	wasPinching = false;
	prevPinching = false;
	calibrationState = "none";
	palmOpenStartTime = 0;
};

export const isCalibrated = () => calibrationState === "done";
