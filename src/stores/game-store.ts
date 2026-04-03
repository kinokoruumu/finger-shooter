import { GAME_CONFIG } from "@/config/game-config";
import { STAGES } from "@/config/stage-definitions";
import type { FireEvent, SharedState } from "@/types/shared";

/** MediaPipe↔Game 共有状態（ミュータブルオブジェクト） */
export const sharedState: SharedState = {
	aim: null,
	isGunPose: false,
	isHandDetected: false,
	fireEvents: [],
	lastFireTime: 0,
};

export const updateAim = (x: number, y: number) => {
	sharedState.aim = { x, y };
};

export const clearAim = () => {
	sharedState.aim = null;
};

export const setGunPose = (value: boolean) => {
	sharedState.isGunPose = value;
};

export const setHandDetected = (value: boolean) => {
	if (sharedState.isHandDetected !== value) {
		sharedState.isHandDetected = value;
		notifyListeners();
	}
};

export const pushFireEvent = (x: number, y: number) => {
	const now = Date.now();
	if (now - sharedState.lastFireTime < GAME_CONFIG.gesture.fireInterval) {
		return;
	}
	sharedState.lastFireTime = now;
	sharedState.fireEvents.push({ x, y, timestamp: now });
};

export const consumeFireEvents = (): FireEvent[] => {
	const events = [...sharedState.fireEvents];
	sharedState.fireEvents.length = 0;
	return events;
};

export const resetSharedState = () => {
	sharedState.aim = null;
	sharedState.isGunPose = false;
	sharedState.isHandDetected = false;
	sharedState.fireEvents.length = 0;
	sharedState.lastFireTime = 0;
};

// --- React UI 向け useSyncExternalStore ---

type Listener = () => void;
const listeners = new Set<Listener>();

export const subscribe = (listener: Listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export const notifyListeners = () => {
	for (const listener of listeners) {
		listener();
	}
};

// スコア等のUI状態
import type { GestureDebugValues } from "@/features/hand-tracking/gesture-detector";

export type GestureDebug = GestureDebugValues;

export type GamePhase = "title" | "playing" | "stage-transition" | "result";

export type GameUIState = {
	score: number;
	phase: GamePhase;
	currentStage: number;
	/** 各ステージ終了時のスコア（null=未プレイ） */
	stageScores: (number | null)[];
	isLoading: boolean;
	isHandDetected: boolean;
	isGunPose: boolean;
	gestureDebug: GestureDebug | null;
};

let gameUISnapshot: GameUIState = {
	score: 0,
	phase: "title",
	currentStage: 0,
	stageScores: [null, null, null],
	isLoading: true,
	isHandDetected: false,
	isGunPose: false,
	gestureDebug: null,
};

const updateSnapshot = (partial: Partial<GameUIState>) => {
	gameUISnapshot = { ...gameUISnapshot, ...partial };
	notifyListeners();
};

export const getGameUISnapshot = () => gameUISnapshot;

export const setLoading = (value: boolean) => {
	updateSnapshot({ isLoading: value });
};

export const setPhase = (phase: GamePhase) => {
	updateSnapshot({ phase });
};

export const setCurrentStage = (stage: number) => {
	updateSnapshot({ currentStage: stage });
};

export const nextStage = () => {
	// 現ステージのスコアを記録
	const current = gameUISnapshot.currentStage;
	const newStageScores = [...gameUISnapshot.stageScores];
	newStageScores[current] = gameUISnapshot.score;

	const next = current + 1;
	if (next >= STAGES.length) {
		updateSnapshot({ stageScores: newStageScores, phase: "result" });
	} else {
		updateSnapshot({
			stageScores: newStageScores,
			currentStage: next,
			score: 0,
			phase: "stage-transition",
		});
	}
};

// --- スコアポップアップ ---

export type ScorePopup = {
	id: number;
	points: number;
	label: string;
	x: number;
	y: number;
};

let nextPopupId = 0;
let scorePopups: ScorePopup[] = [];

export const addScore = (points: number) => {
	updateSnapshot({ score: gameUISnapshot.score + points });
};

export const addScoreWithPopup = (
	points: number,
	label: string,
	screenX: number,
	screenY: number,
) => {
	updateSnapshot({ score: Math.max(0, gameUISnapshot.score + points) });
	scorePopups.push({
		id: ++nextPopupId,
		points,
		label,
		x: screenX,
		y: screenY,
	});
	notifyListeners();
};

export const consumeScorePopups = (): ScorePopup[] => {
	const popups = [...scorePopups];
	scorePopups = [];
	return popups;
};

export const updateTrackingStatus = (
	isHandDetected: boolean,
	isGunPose: boolean,
	gestureDebug: GestureDebug | null,
) => {
	updateSnapshot({ isHandDetected, isGunPose, gestureDebug });
};

export const resetGameUI = () => {
	updateSnapshot({
		score: 0,
		currentStage: 0,
		stageScores: [null, null, null],
	});
};
