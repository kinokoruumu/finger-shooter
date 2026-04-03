import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	addScore,
	addScoreWithPopup,
	clearAim,
	consumeFireEvents,
	consumeScorePopups,
	getGameUISnapshot,
	nextStage,
	pushFireEvent,
	resetGameUI,
	resetSharedState,
	setCurrentStage,
	setGunPose,
	setHandDetected,
	setLoading,
	setPhase,
	sharedState,
	subscribe,
	updateAim,
	updateTrackingStatus,
} from "./game-store";

beforeEach(() => {
	resetSharedState();
	resetGameUI();
});

describe("共有状態（MediaPipe↔Game）", () => {
	test("updateAimで照準座標が更新される", () => {
		updateAim(0.5, 0.3);
		expect(sharedState.aim).toEqual({ x: 0.5, y: 0.3 });
	});

	test("clearAimで照準がクリアされる", () => {
		updateAim(0.5, 0.3);
		clearAim();
		expect(sharedState.aim).toBeNull();
	});

	test("setGunPoseでフラグが更新される", () => {
		setGunPose(true);
		expect(sharedState.isGunPose).toBe(true);
		setGunPose(false);
		expect(sharedState.isGunPose).toBe(false);
	});

	test("setHandDetectedは値が変わったときだけリスナーを通知する", () => {
		const listener = vi.fn();
		const unsubscribe = subscribe(listener);

		setHandDetected(true);
		expect(listener).toHaveBeenCalledTimes(1);

		// 同じ値では通知しない
		setHandDetected(true);
		expect(listener).toHaveBeenCalledTimes(1);

		setHandDetected(false);
		expect(listener).toHaveBeenCalledTimes(2);

		unsubscribe();
	});

	test("resetSharedStateで初期状態に戻る", () => {
		updateAim(0.5, 0.3);
		setGunPose(true);
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
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

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

		// 100ms後（150ms未満）→ 無視される
		vi.setSystemTime(now + 100);
		pushFireEvent(0.6, 0.4);
		expect(sharedState.fireEvents).toHaveLength(1);

		// 150ms後 → 追加される
		vi.setSystemTime(now + 150);
		pushFireEvent(0.7, 0.5);
		expect(sharedState.fireEvents).toHaveLength(2);
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

	test("setCurrentStageでステージが設定される", () => {
		setCurrentStage(2);
		expect(getGameUISnapshot().currentStage).toBe(2);
	});

	test("resetGameUIでスコアとステージがリセットされる", () => {
		addScore(500);
		setCurrentStage(2);
		resetGameUI();

		const snapshot = getGameUISnapshot();
		expect(snapshot.score).toBe(0);
		expect(snapshot.currentStage).toBe(0);
		expect(snapshot.stageScores).toEqual([null, null, null]);
	});

	test("snapshotはイミュータブル（更新ごとに新しいオブジェクト）", () => {
		const snapshot1 = getGameUISnapshot();
		addScore(100);
		const snapshot2 = getGameUISnapshot();

		expect(snapshot1).not.toBe(snapshot2);
		expect(snapshot1.score).toBe(0);
		expect(snapshot2.score).toBe(100);
	});

	test("updateTrackingStatusでトラッキング状態が更新される", () => {
		const debug = {
			isPinching: true,
			calibration: "done" as const,
			calibrationProgress: 1,
			raw: { pinchDist: 0.1, handSize: 0.3 },
		};
		updateTrackingStatus(true, true, debug);

		const snapshot = getGameUISnapshot();
		expect(snapshot.isHandDetected).toBe(true);
		expect(snapshot.isGunPose).toBe(true);
		expect(snapshot.gestureDebug).toEqual(debug);
	});
});

describe("nextStage", () => {
	test("次のステージに進む", () => {
		setPhase("playing");
		addScore(100);

		nextStage();

		const snapshot = getGameUISnapshot();
		expect(snapshot.currentStage).toBe(1);
		expect(snapshot.phase).toBe("stage-transition");
		expect(snapshot.score).toBe(0);
		expect(snapshot.stageScores[0]).toBe(100);
	});

	test("最終ステージの次はresultフェーズに遷移する", () => {
		setCurrentStage(2); // 最終ステージ（STAGES.length = 3）
		addScore(200);

		nextStage();

		const snapshot = getGameUISnapshot();
		expect(snapshot.phase).toBe("result");
		expect(snapshot.stageScores[2]).toBe(200);
	});
});

describe("スコアポップアップ", () => {
	test("addScoreWithPopupでスコア加算とポップアップが追加される", () => {
		addScoreWithPopup(100, "HIT!", 0.5, 0.3);

		expect(getGameUISnapshot().score).toBe(100);
		const popups = consumeScorePopups();
		expect(popups).toHaveLength(1);
		expect(popups[0]).toMatchObject({
			points: 100,
			label: "HIT!",
			x: 0.5,
			y: 0.3,
		});
	});

	test("consumeScorePopupsで取り出し後はキューが空になる", () => {
		addScoreWithPopup(100, "HIT!", 0.5, 0.3);
		consumeScorePopups();
		expect(consumeScorePopups()).toHaveLength(0);
	});

	test("スコアが0未満にならない", () => {
		addScoreWithPopup(-100, "MISS", 0.5, 0.3);
		expect(getGameUISnapshot().score).toBe(0);
	});

	test("ポップアップのIDは一意で増加する", () => {
		addScoreWithPopup(10, "A", 0, 0);
		addScoreWithPopup(20, "B", 0, 0);
		const popups = consumeScorePopups();
		expect(popups[0].id).toBeLessThan(popups[1].id);
	});
});

describe("Pub/Sub", () => {
	test("subscribeしたリスナーが通知される", () => {
		const listener = vi.fn();
		const unsubscribe = subscribe(listener);

		setPhase("playing");
		expect(listener).toHaveBeenCalled();

		unsubscribe();
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

	test("複数のリスナーが全て通知される", () => {
		const listener1 = vi.fn();
		const listener2 = vi.fn();
		const unsub1 = subscribe(listener1);
		const unsub2 = subscribe(listener2);

		setPhase("playing");
		expect(listener1).toHaveBeenCalledTimes(1);
		expect(listener2).toHaveBeenCalledTimes(1);

		unsub1();
		unsub2();
	});
});
