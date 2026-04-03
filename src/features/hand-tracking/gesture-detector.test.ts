import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
	detectGesture,
	isCalibrated,
	resetGestureState,
} from "./gesture-detector";

afterEach(() => {
	resetGestureState();
	vi.restoreAllMocks();
});

/**
 * テスト用のランドマーク配列を生成する。
 * 21個のランドマーク（MediaPipe Hand の仕様）をデフォルト値で埋め、
 * overrides で任意のインデックスを上書きできる。
 */
const createLandmarks = (
	overrides: Record<number, Partial<NormalizedLandmark>> = {},
): NormalizedLandmark[] => {
	const defaults: NormalizedLandmark = { x: 0.5, y: 0.5, z: 0 };
	return Array.from({ length: 21 }, (_, i) => ({
		...defaults,
		...overrides[i],
	}));
};

// ランドマークインデックス
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_MCP = 2;
const INDEX_MCP = 5;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_TIP = 20;

/**
 * 全指を開いたパー状態のランドマークを生成する。
 * 各指先がMCPから十分離れ、指同士も離れている状態。
 */
const createOpenPalmLandmarks = (): NormalizedLandmark[] =>
	createLandmarks({
		[WRIST]: { x: 0.5, y: 0.8, z: 0 },
		[THUMB_MCP]: { x: 0.5, y: 0.6, z: 0 },
		[THUMB_TIP]: { x: 0.3, y: 0.4, z: 0 },
		[INDEX_MCP]: { x: 0.45, y: 0.55, z: 0 },
		[INDEX_TIP]: { x: 0.35, y: 0.3, z: 0 },
		[MIDDLE_MCP]: { x: 0.5, y: 0.55, z: 0 },
		[MIDDLE_TIP]: { x: 0.5, y: 0.28, z: 0 },
		[RING_MCP]: { x: 0.55, y: 0.55, z: 0 },
		[RING_TIP]: { x: 0.6, y: 0.3, z: 0 },
		[PINKY_MCP]: { x: 0.6, y: 0.58, z: 0 },
		[PINKY_TIP]: { x: 0.7, y: 0.35, z: 0 },
	});

describe("detectGesture", () => {
	test("手が検出されていることを返す", () => {
		const landmarks = createLandmarks();
		const result = detectGesture(landmarks);
		expect(result.isHandDetected).toBe(true);
	});

	test("照準座標が0-1の範囲内に収まる", () => {
		const landmarks = createLandmarks({
			[WRIST]: { x: 0.0, y: 0.0 },
			[MIDDLE_MCP]: { x: 1.0, y: 1.0 },
		});
		const result = detectGesture(landmarks);
		expect(result.aim).not.toBeNull();
		expect(result.aim?.x).toBeGreaterThanOrEqual(0);
		expect(result.aim?.x).toBeLessThanOrEqual(1);
		expect(result.aim?.y).toBeGreaterThanOrEqual(0);
		expect(result.aim?.y).toBeLessThanOrEqual(1);
	});

	test("ミラー変換が適用される（カメラ右の手は画面左に対応）", () => {
		// 右寄りの手
		const rightHand = createLandmarks({
			[WRIST]: { x: 0.8, y: 0.5 },
			[INDEX_MCP]: { x: 0.8, y: 0.4 },
			[MIDDLE_MCP]: { x: 0.8, y: 0.4 },
			[RING_MCP]: { x: 0.8, y: 0.4 },
			[PINKY_MCP]: { x: 0.8, y: 0.4 },
		});
		const rightResult = detectGesture(rightHand);
		resetGestureState();

		// 左寄りの手
		const leftHand = createLandmarks({
			[WRIST]: { x: 0.2, y: 0.5 },
			[INDEX_MCP]: { x: 0.2, y: 0.4 },
			[MIDDLE_MCP]: { x: 0.2, y: 0.4 },
			[RING_MCP]: { x: 0.2, y: 0.4 },
			[PINKY_MCP]: { x: 0.2, y: 0.4 },
		});
		const leftResult = detectGesture(leftHand);

		expect(rightResult.aim?.x).toBeLessThan(leftResult.aim?.x ?? 0);
	});
});

describe("スムージング", () => {
	test("スムージングフレーム数を超えると古いフレームが捨てられる", () => {
		const base = {
			[WRIST]: { x: 0.5, y: 0.6 },
			[INDEX_MCP]: { x: 0.5, y: 0.4 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.4 },
			[RING_MCP]: { x: 0.5, y: 0.4 },
			[PINKY_MCP]: { x: 0.5, y: 0.4 },
		};

		// smoothingFrames(7) を超える8回呼び出す
		for (let i = 0; i < 8; i++) {
			detectGesture(createLandmarks(base));
		}

		// 全く異なる位置で1フレーム追加
		const shifted = createLandmarks({
			[WRIST]: { x: 0.7, y: 0.6 },
			[INDEX_MCP]: { x: 0.7, y: 0.4 },
			[MIDDLE_MCP]: { x: 0.7, y: 0.4 },
			[RING_MCP]: { x: 0.7, y: 0.4 },
			[PINKY_MCP]: { x: 0.7, y: 0.4 },
		});
		const result = detectGesture(shifted);

		// 古いフレームが捨てられているため、baseの8フレーム全部が残っていない
		// → 平均がbase位置とは異なる
		const baseOnly = createLandmarks(base);
		resetGestureState();
		const baseResult = detectGesture(baseOnly);
		expect(result.aim?.x).not.toBe(baseResult.aim?.x);
	});

	test("複数フレームの入力で照準が平均化される", () => {
		const landmarks1 = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.6 },
			[INDEX_MCP]: { x: 0.5, y: 0.4 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.4 },
			[RING_MCP]: { x: 0.5, y: 0.4 },
			[PINKY_MCP]: { x: 0.5, y: 0.4 },
		});
		const result1 = detectGesture(landmarks1);

		// 少しずらした位置
		const landmarks2 = createLandmarks({
			[WRIST]: { x: 0.52, y: 0.6 },
			[INDEX_MCP]: { x: 0.52, y: 0.4 },
			[MIDDLE_MCP]: { x: 0.52, y: 0.4 },
			[RING_MCP]: { x: 0.52, y: 0.4 },
			[PINKY_MCP]: { x: 0.52, y: 0.4 },
		});
		const result2 = detectGesture(landmarks2);

		// 2フレーム目は平均化されるため、1フレーム目とは異なる
		expect(result2.aim).not.toEqual(result1.aim);
	});
});

describe("ピンチ検出（ヒステリシス）", () => {
	test("親指と人差し指が近いとピンチと判定される", () => {
		const landmarks = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.5 },
			[THUMB_TIP]: { x: 0.5, y: 0.5 },
			[INDEX_TIP]: { x: 0.5, y: 0.5 },
		});
		const result = detectGesture(landmarks);
		expect(result.debug.isPinching).toBe(true);
	});

	test("親指と人差し指が離れているとピンチでない", () => {
		const landmarks = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.5 },
			[THUMB_TIP]: { x: 0.2, y: 0.2 },
			[INDEX_TIP]: { x: 0.8, y: 0.8 },
		});
		const result = detectGesture(landmarks);
		expect(result.debug.isPinching).toBe(false);
	});

	test("ヒステリシスにより、ピンチ中はOFF閾値まで離さないと解除されない", () => {
		const handSize = 0.3; // WRIST(0.5,0.8) → MIDDLE_MCP(0.5,0.5)

		// ピンチON: dist2d / handSize < 0.2
		const pinchOn = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.5 },
			[THUMB_TIP]: { x: 0.5, y: 0.5 },
			[INDEX_TIP]: { x: 0.5, y: 0.5 },
		});
		const result1 = detectGesture(pinchOn);
		expect(result1.debug.isPinching).toBe(true);

		// ON閾値超え〜OFF閾値未満（ヒステリシス領域）
		// dist2d / handSize が 0.2〜0.24 の範囲
		const midDist = handSize * 0.22; // 0.066
		const pinchMid = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.5 },
			[THUMB_TIP]: { x: 0.5, y: 0.5 },
			[INDEX_TIP]: { x: 0.5, y: 0.5 + midDist },
		});
		const result2 = detectGesture(pinchMid);
		expect(result2.debug.isPinching).toBe(true);

		// OFF閾値超え: dist2d / handSize > 0.24
		const farDist = handSize * 0.3;
		const pinchOff = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.5 },
			[THUMB_TIP]: { x: 0.5, y: 0.5 },
			[INDEX_TIP]: { x: 0.5, y: 0.5 + farDist },
		});
		const result3 = detectGesture(pinchOff);
		expect(result3.debug.isPinching).toBe(false);
	});
});

describe("トリガー式発射", () => {
	test("ピンチし始めた瞬間のみshouldFireがtrue", () => {
		const pinchLandmarks = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.5 },
			[THUMB_TIP]: { x: 0.5, y: 0.5 },
			[INDEX_TIP]: { x: 0.5, y: 0.5 },
		});

		// 1フレーム目: ピンチ開始 → shouldFire = true
		const result1 = detectGesture(pinchLandmarks);
		expect(result1.shouldFire).toBe(true);

		// 2フレーム目: ピンチ継続 → shouldFire = false
		const result2 = detectGesture(pinchLandmarks);
		expect(result2.shouldFire).toBe(false);
	});

	test("ピンチを離してから再度ピンチするとshouldFireがtrue", () => {
		const pinch = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.5 },
			[THUMB_TIP]: { x: 0.5, y: 0.5 },
			[INDEX_TIP]: { x: 0.5, y: 0.5 },
		});
		const release = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.5 },
			[THUMB_TIP]: { x: 0.2, y: 0.2 },
			[INDEX_TIP]: { x: 0.8, y: 0.8 },
		});

		detectGesture(pinch); // ピンチ開始
		detectGesture(release); // リリース
		const result = detectGesture(pinch); // 再ピンチ
		expect(result.shouldFire).toBe(true);
	});
});

describe("キャリブレーション", () => {
	test("初期状態はキャリブレーション未完了", () => {
		expect(isCalibrated()).toBe(false);
	});

	test("パーを一定時間保持するとキャリブレーション完了", () => {
		const openPalm = createOpenPalmLandmarks();
		let time = 100;
		vi.spyOn(performance, "now").mockImplementation(() => time);

		// キャリブレーション開始
		const result1 = detectGesture(openPalm);
		expect(result1.debug.calibration).toBe("progress");

		// 1500ms 経過（CALIBRATION_HOLD_MS）
		time = 1600;
		const result2 = detectGesture(openPalm);
		expect(result2.debug.calibration).toBe("done");
		expect(isCalibrated()).toBe(true);
	});

	test("パーの途中で手を閉じるとキャリブレーションがリセットされる", () => {
		const openPalm = createOpenPalmLandmarks();
		// 指を閉じた状態（指先がMCPに近い＝握り拳に近い）
		const closedHand = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.55 },
			// 指先をMCPのすぐ近くに配置（屈曲状態）
			[INDEX_TIP]: { x: 0.45, y: 0.53 },
			[MIDDLE_TIP]: { x: 0.5, y: 0.53 },
			[RING_TIP]: { x: 0.55, y: 0.53 },
			[PINKY_TIP]: { x: 0.6, y: 0.56 },
			[THUMB_TIP]: { x: 0.48, y: 0.58 },
			[THUMB_MCP]: { x: 0.5, y: 0.6 },
			[INDEX_MCP]: { x: 0.45, y: 0.55 },
			[RING_MCP]: { x: 0.55, y: 0.55 },
			[PINKY_MCP]: { x: 0.6, y: 0.58 },
		});

		let time = 100;
		vi.spyOn(performance, "now").mockImplementation(() => time);

		detectGesture(openPalm); // progress開始
		time = 600;
		const result = detectGesture(closedHand); // 途中で閉じる
		expect(result.debug.calibration).toBe("none");
	});

	test("パー状態中はピンチと判定されない", () => {
		const openPalm = createOpenPalmLandmarks();
		const result = detectGesture(openPalm);
		expect(result.debug.isPinching).toBe(false);
		expect(result.shouldFire).toBe(false);
	});
});

describe("デバッグ値", () => {
	test("pinchDistとhandSizeが含まれる", () => {
		const landmarks = createLandmarks({
			[WRIST]: { x: 0.5, y: 0.8 },
			[MIDDLE_MCP]: { x: 0.5, y: 0.5 },
		});
		const result = detectGesture(landmarks);
		expect(typeof result.debug.raw.pinchDist).toBe("number");
		expect(typeof result.debug.raw.handSize).toBe("number");
	});

	test("calibrationProgressが0-1の範囲", () => {
		const openPalm = createOpenPalmLandmarks();
		let time = 100;
		vi.spyOn(performance, "now").mockImplementation(() => time);

		detectGesture(openPalm); // start at 100

		time = 850; // 750ms elapsed = 50%
		const result = detectGesture(openPalm);
		expect(result.debug.calibrationProgress).toBeCloseTo(0.5, 1);
	});
});

describe("resetGestureState", () => {
	test("リセット後はキャリブレーション未完了に戻る", () => {
		const openPalm = createOpenPalmLandmarks();
		let time = 100;
		vi.spyOn(performance, "now").mockImplementation(() => time);

		detectGesture(openPalm);
		time = 1600;
		detectGesture(openPalm);
		expect(isCalibrated()).toBe(true);

		resetGestureState();
		expect(isCalibrated()).toBe(false);
	});
});
