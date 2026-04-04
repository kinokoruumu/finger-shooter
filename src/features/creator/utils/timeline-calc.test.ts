import { describe, expect, it } from "vitest";
import type { CreatorGroup, CreatorTargetSet } from "../types";
import {
	calcBalloonsDuration,
	calcDraggedTime,
	calcGroupDuration,
	calcResizeLeftTime,
	calcTargetStepBarsForSet,
	calcTargetsDuration,
	getBalloonVisibleDuration,
	timeToX,
	trainDurationToSpeed,
	trainSpeedToDuration,
	xToTime,
} from "./timeline-calc";

const makeSet = (
	partial: Partial<CreatorTargetSet> = {},
): CreatorTargetSet => ({
	id: "s1",
	targets: [],
	steps: [],
	...partial,
});

const makeGroup = (partial: Partial<CreatorGroup> = {}): CreatorGroup => ({
	id: "g1",
	targetSets: [],
	balloonEntries: [],
	train: null,
	trainStartTime: null,
	...partial,
});

describe("calcTargetStepBarsForSet", () => {
	it("ステップなしは空配列", () => {
		expect(calcTargetStepBarsForSet(makeSet())).toEqual([]);
	});

	it("APPEAR_DELAY を含めて計算", () => {
		const set = makeSet({
			targets: [
				{ id: "a", gx: 0, gy: 0, type: "ground", visibleDuration: 3 },
				{ id: "b", gx: 1, gy: 0, type: "ground", visibleDuration: 3 },
			],
			steps: [{ targetIds: ["a", "b"], interval: 100, startTime: 500 }],
		});

		const bars = calcTargetStepBarsForSet(set);

		expect(bars).toHaveLength(1);
		expect(bars[0].startTime).toBe(500);
		expect(bars[0].delayEndTime).toBe(850);
		expect(bars[0].spawnEndTime).toBe(950);
		expect(bars[0].endTime).toBe(3950);
	});
});

describe("calcTargetsDuration", () => {
	it("セットなしは 0", () => {
		expect(calcTargetsDuration(makeGroup())).toBe(0);
	});

	it("複数セットの最大終了時刻を返す", () => {
		const group = makeGroup({
			targetSets: [
				makeSet({
					id: "s1",
					targets: [
						{ id: "a", gx: 0, gy: 0, type: "ground", visibleDuration: 2 },
					],
					steps: [{ targetIds: ["a"], interval: 0, startTime: 0 }],
				}),
				makeSet({
					id: "s2",
					targets: [
						{ id: "b", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
					],
					steps: [{ targetIds: ["b"], interval: 0, startTime: 1000 }],
				}),
			],
		});
		// s1: 0 + 350 + 2000 = 2350
		// s2: 1000 + 350 + 4000 = 5350
		expect(calcTargetsDuration(group)).toBe(5350);
	});
});

describe("calcBalloonsDuration", () => {
	it("エントリなしは 0", () => {
		expect(calcBalloonsDuration(makeGroup())).toBe(0);
	});

	it("interval ありの場合、最後の風船 + visibleDuration", () => {
		const group = makeGroup({
			balloonEntries: [
				{ id: "b1", time: 0, count: 3, interval: 500, spread: "center" },
			],
		});
		expect(calcBalloonsDuration(group)).toBe(6000);
	});
});

describe("calcGroupDuration", () => {
	it("最低 1000ms", () => {
		expect(calcGroupDuration(makeGroup())).toBe(1000);
	});

	it("列車の走行時間を含む", () => {
		const group = makeGroup({
			train: { direction: 1, speed: 2, slotsOscillate: false, slots: [] },
			trainStartTime: 1000,
		});
		expect(calcGroupDuration(group)).toBe(16000);
	});
});

describe("timeToX / xToTime", () => {
	const DURATION = 2000;
	const WIDTH = 600;

	it("xToTime は timeToX の逆変換", () => {
		const x = timeToX(500, DURATION, WIDTH);
		expect(xToTime(x, DURATION, WIDTH)).toBe(500);
	});

	it("xToTime は 50ms 単位にスナップ", () => {
		const x = timeToX(51, DURATION, WIDTH);
		expect(xToTime(x, DURATION, WIDTH)).toBe(50);
	});
});

describe("calcDraggedTime", () => {
	const DURATION = 2000;
	const WIDTH = 600;

	it("deltaX=0 なら元の時間", () => {
		expect(calcDraggedTime(500, 0, DURATION, WIDTH)).toBe(500);
	});

	it("往復で元に戻る", () => {
		const after = calcDraggedTime(500, 150, DURATION, WIDTH);
		expect(calcDraggedTime(after, -150, DURATION, WIDTH)).toBe(500);
	});
});

describe("calcResizeLeftTime", () => {
	const DURATION = 2000;
	const WIDTH = 600;

	it("startTime は endTime - minDuration を超えない", () => {
		const result = calcResizeLeftTime(100, 500, 100, 9999, DURATION, WIDTH);
		expect(result).toBeLessThanOrEqual(400);
	});
});

describe("trainDurationToSpeed / trainSpeedToDuration", () => {
	it("speed=2 → duration=15000ms", () => {
		expect(trainSpeedToDuration(2)).toBe(15000);
	});

	it("duration=15000ms → speed=2", () => {
		expect(trainDurationToSpeed(15000)).toBe(2);
	});

	it("往復変換で元に戻る", () => {
		expect(trainDurationToSpeed(trainSpeedToDuration(2.5))).toBe(2.5);
	});
});

describe("getBalloonVisibleDuration", () => {
	it("固定値 5000ms", () => {
		expect(getBalloonVisibleDuration()).toBe(5000);
	});
});
