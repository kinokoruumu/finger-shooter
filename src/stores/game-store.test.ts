import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	addScore,
	clearAim,
	consumeFireEvents,
	getGameUISnapshot,
	pushFireEvent,
	resetGameUI,
	resetSharedState,
	setHandDetected,
	setLoading,
	setPhase,
	setTimeRemaining,
	sharedState,
	subscribe,
	updateAim,
} from "./game-store";

beforeEach(() => {
	resetSharedState();
	resetGameUI();
});

describe("共有状態（MediaPipe↔Phaser）", () => {
	test("updateAimで照準座標が更新される", () => {
		updateAim(0.5, 0.3);
		expect(sharedState.aim).toEqual({ x: 0.5, y: 0.3 });
	});

	test("clearAimで照準がクリアされる", () => {
		updateAim(0.5, 0.3);
		clearAim();
		expect(sharedState.aim).toBeNull();
	});

	test("setHandDetectedは値が変わったときだけリスナーを通知する", () => {
		const listener = vi.fn();
		subscribe(listener);

		setHandDetected(true);
		expect(listener).toHaveBeenCalledTimes(1);

		// 同じ値では通知しない
		setHandDetected(true);
		expect(listener).toHaveBeenCalledTimes(1);

		setHandDetected(false);
		expect(listener).toHaveBeenCalledTimes(2);
	});

	test("resetSharedStateで初期状態に戻る", () => {
		updateAim(0.5, 0.3);
		pushFireEvent(0.1, 0.2);
		resetSharedState();

		expect(sharedState.aim).toBeNull();
		expect(sharedState.isGunPose).toBe(false);
		expect(sharedState.isHandDetected).toBe(false);
		expect(sharedState.fireEvents).toHaveLength(0);
		expect(sharedState.lastFireTime).toBe(0);
	});
});

describe("発射イベント", () => {
	test("pushFireEventでイベントが追加される", () => {
		pushFireEvent(0.5, 0.3);
		expect(sharedState.fireEvents).toHaveLength(1);
		expect(sharedState.fireEvents[0]).toMatchObject({ x: 0.5, y: 0.3 });
	});

	test("consumeFireEventsでイベントが取り出されキューが空になる", () => {
		pushFireEvent(0.5, 0.3);
		const events = consumeFireEvents();
		expect(events).toHaveLength(1);
		expect(sharedState.fireEvents).toHaveLength(0);
	});

	test("発射インターバル内の連続発射はスロットリングされる", () => {
		const now = Date.now();
		vi.setSystemTime(now);

		pushFireEvent(0.5, 0.3);
		expect(sharedState.fireEvents).toHaveLength(1);

		// 100ms後（500ms未満）→ 無視される
		vi.setSystemTime(now + 100);
		pushFireEvent(0.6, 0.4);
		expect(sharedState.fireEvents).toHaveLength(1);

		// 500ms後 → 追加される
		vi.setSystemTime(now + 500);
		pushFireEvent(0.7, 0.5);
		expect(sharedState.fireEvents).toHaveLength(2);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	beforeEach(() => {
		vi.useFakeTimers();
	});
});

describe("UI状態（useSyncExternalStore向け）", () => {
	test("addScoreでスコアが加算される", () => {
		addScore(100);
		expect(getGameUISnapshot().score).toBe(100);

		addScore(50);
		expect(getGameUISnapshot().score).toBe(150);
	});

	test("setPhaseでフェーズが変わる", () => {
		expect(getGameUISnapshot().phase).toBe("title");

		setPhase("playing");
		expect(getGameUISnapshot().phase).toBe("playing");

		setPhase("result");
		expect(getGameUISnapshot().phase).toBe("result");
	});

	test("setLoadingでローディング状態が変わる", () => {
		setLoading(false);
		expect(getGameUISnapshot().isLoading).toBe(false);
	});

	test("setTimeRemainingで残り時間が更新される", () => {
		setTimeRemaining(30);
		expect(getGameUISnapshot().timeRemaining).toBe(30);
	});

	test("resetGameUIでスコアと残り時間がリセットされる", () => {
		addScore(500);
		setTimeRemaining(10);
		resetGameUI();

		const snapshot = getGameUISnapshot();
		expect(snapshot.score).toBe(0);
		expect(snapshot.timeRemaining).toBe(60); // GAME_CONFIG.game.timeLimit
	});

	test("snapshotはイミュータブル（更新ごとに新しいオブジェクト）", () => {
		const snapshot1 = getGameUISnapshot();
		addScore(100);
		const snapshot2 = getGameUISnapshot();

		expect(snapshot1).not.toBe(snapshot2);
		expect(snapshot1.score).toBe(0);
		expect(snapshot2.score).toBe(100);
	});
});

describe("Pub/Sub", () => {
	test("subscribeしたリスナーが通知される", () => {
		const listener = vi.fn();
		subscribe(listener);

		setPhase("playing");
		expect(listener).toHaveBeenCalled();
	});

	test("unsubscribeで通知が止まる", () => {
		const listener = vi.fn();
		const unsubscribe = subscribe(listener);

		setPhase("playing");
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
		setPhase("result");
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
