import { GAME_CONFIG } from "@/config/game-config";
import type { FireEvent, SharedState } from "@/types/shared";

/** MediaPipe↔Phaser 共有状態（ミュータブルオブジェクト） */
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

// スコア等のUI状態 — snapshot はイミュータブルに差し替える
import type { GestureDebugValues } from "@/features/hand-tracking/gesture-detector";

export type GestureDebug = GestureDebugValues;

export type GameUIState = {
	score: number;
	timeRemaining: number;
	phase: "title" | "playing" | "result";
	isLoading: boolean;
	isHandDetected: boolean;
	isGunPose: boolean;
	gestureDebug: GestureDebug | null;
};

let gameUISnapshot: GameUIState = {
	score: 0,
	timeRemaining: GAME_CONFIG.game.timeLimit,
	phase: "title",
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

export const setPhase = (phase: GameUIState["phase"]) => {
	updateSnapshot({ phase });
};

export const addScore = (points: number) => {
	updateSnapshot({ score: gameUISnapshot.score + points });
};

export const setTimeRemaining = (time: number) => {
	updateSnapshot({ timeRemaining: time });
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
		timeRemaining: GAME_CONFIG.game.timeLimit,
	});
};
