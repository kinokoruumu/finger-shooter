import { describe, expect, it } from "vitest";
import type { CreatorGroup } from "../types";
import {
	calcBalloonsDuration,
	calcDraggedTime,
	calcGroupDuration,
	calcResizeLeftTime,
	calcTargetStepBars,
	calcTargetsDuration,
	getBalloonVisibleDuration,
	timeToX,
	trainDurationToSpeed,
	trainSpeedToDuration,
	xToTime,
} from "./timeline-calc";

const makeGroup = (partial: Partial<CreatorGroup> = {}): CreatorGroup => ({
	id: "g1",
	targets: [],
	targetSteps: [],
	balloonEntries: [],
	train: null,
	trainStartTime: null,
	...partial,
});

describe("calcTargetStepBars", () => {
	it("ステップなしは空配列", () => {
		expect(calcTargetStepBars(makeGroup())).toEqual([]);
	});

	it("startTime〜spawnEnd〜endTime を正しく計算", () => {
		const group = makeGroup({
			targets: [
				{ id: "a", gx: 0, gy: 0, type: "ground", visibleDuration: 3 },
				{ id: "b", gx: 1, gy: 0, type: "ground", visibleDuration: 3 },
			],
			targetSteps: [{ targetIds: ["a", "b"], interval: 100, startTime: 500 }],
		});

		const bars = calcTargetStepBars(group);

		expect(bars).toHaveLength(1);
		expect(bars[0].startTime).toBe(500);
		expect(bars[0].spawnEndTime).toBe(600); // 500 + (2-1)*100
		expect(bars[0].endTime).toBe(3600); // 600 + 3000
	});
});

describe("calcTargetsDuration", () => {
	it("ステップなしは 0", () => {
		expect(calcTargetsDuration(makeGroup())).toBe(0);
	});

	it("visibleDuration を含む最大終了時刻", () => {
		const group = makeGroup({
			targets: [
				{ id: "a", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				{ id: "b", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
			],
			targetSteps: [{ targetIds: ["a", "b"], interval: 100, startTime: 0 }],
		});
		// spawnEnd=100, endTime=100+4000=4100
		expect(calcTargetsDuration(group)).toBe(4100);
	});
});

describe("calcBalloonsDuration", () => {
	it("エントリなしは 0", () => {
		expect(calcBalloonsDuration(makeGroup())).toBe(0);
	});

	it("time + visibleDuration(5000ms) を返す", () => {
		const group = makeGroup({
			balloonEntries: [
				{ id: "b1", time: 1000, count: 3, spread: "center" },
			],
		});
		expect(calcBalloonsDuration(group)).toBe(6000); // 1000 + 5000
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
		// 1000 + trainSpeedToDuration(2) = 1000 + 15000 = 16000
		expect(calcGroupDuration(group)).toBe(16000);
	});
});

describe("timeToX / xToTime", () => {
	const DURATION = 2000;
	const WIDTH = 600;

	it("time=0 は左端パディング位置", () => {
		expect(timeToX(0, DURATION, WIDTH)).toBe(12);
	});

	it("xToTime は timeToX の逆変換", () => {
		const time = 500;
		const x = timeToX(time, DURATION, WIDTH);
		expect(xToTime(x, DURATION, WIDTH)).toBe(time);
	});

	it("xToTime は 50ms 単位にスナップ", () => {
		const x = timeToX(51, DURATION, WIDTH);
		expect(xToTime(x, DURATION, WIDTH)).toBe(50);
	});

	it("xToTime は 0 未満にならない", () => {
		expect(xToTime(-100, DURATION, WIDTH)).toBe(0);
	});
});

describe("calcDraggedTime", () => {
	const DURATION = 2000;
	const WIDTH = 600;

	it("deltaX=0 なら元の時間のまま", () => {
		expect(calcDraggedTime(500, 0, DURATION, WIDTH)).toBe(500);
	});

	it("右にドラッグすると時間が増える", () => {
		expect(calcDraggedTime(0, 100, DURATION, WIDTH)).toBeGreaterThan(0);
	});

	it("往復ドラッグで元に戻る", () => {
		const delta = 150;
		const after = calcDraggedTime(500, delta, DURATION, WIDTH);
		const back = calcDraggedTime(after, -delta, DURATION, WIDTH);
		expect(back).toBe(500);
	});
});

describe("calcResizeLeftTime", () => {
	const DURATION = 2000;
	const WIDTH = 600;

	it("deltaX=0 なら元の startTime", () => {
		expect(calcResizeLeftTime(100, 500, 50, 0, DURATION, WIDTH)).toBe(100);
	});

	it("左にドラッグすると startTime が減る", () => {
		expect(calcResizeLeftTime(200, 600, 50, -50, DURATION, WIDTH)).toBeLessThan(200);
	});

	it("startTime は endTime - minDuration を超えない", () => {
		const result = calcResizeLeftTime(100, 500, 100, 9999, DURATION, WIDTH);
		expect(result).toBeLessThanOrEqual(400); // 500 - 100
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
		const speed = 2.5;
		expect(trainDurationToSpeed(trainSpeedToDuration(speed))).toBe(speed);
	});

	it("duration=0 は最大速度", () => {
		expect(trainDurationToSpeed(0)).toBe(5);
	});
});

describe("getBalloonVisibleDuration", () => {
	it("固定値 5000ms を返す", () => {
		expect(getBalloonVisibleDuration()).toBe(5000);
	});
});
