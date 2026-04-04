import { describe, expect, it } from "vitest";
import type { CreatorGroup } from "../types";
import {
	calcBalloonsDuration,
	calcDraggedTime,
	calcGroupDuration,
	calcTargetStepTimes,
	calcTargetsDuration,
	timeToX,
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

describe("calcTargetsDuration", () => {
	it("ステップなしは 0", () => {
		expect(calcTargetsDuration(makeGroup())).toBe(0);
	});

	it("1ステップ3的は startTime + (3-1)*interval", () => {
		const group = makeGroup({
			targetSteps: [{ targetIds: ["a", "b", "c"], interval: 100, startTime: 0 }],
		});
		expect(calcTargetsDuration(group)).toBe(200);
	});

	it("2ステップは各 startTime ベースで最大終了時刻", () => {
		const group = makeGroup({
			targetSteps: [
				{ targetIds: ["a", "b"], interval: 100, startTime: 0 },
				{ targetIds: ["c", "d"], interval: 100, startTime: 600 },
			],
		});
		// ステップ2: 600 + (2-1)*100 = 700
		expect(calcTargetsDuration(group)).toBe(700);
	});
});

describe("calcBalloonsDuration", () => {
	it("エントリなしは 0", () => {
		expect(calcBalloonsDuration(makeGroup())).toBe(0);
	});

	it("1エントリの終了時刻を返す", () => {
		const group = makeGroup({
			balloonEntries: [
				{ id: "b1", time: 500, count: 3, interval: 200, spread: "center" },
			],
		});
		// 500 + (3-1)*200 = 900
		expect(calcBalloonsDuration(group)).toBe(900);
	});

	it("複数エントリの最大終了時刻を返す", () => {
		const group = makeGroup({
			balloonEntries: [
				{ id: "b1", time: 0, count: 2, interval: 100, spread: "left" },
				{ id: "b2", time: 1000, count: 1, interval: 0, spread: "right" },
			],
		});
		expect(calcBalloonsDuration(group)).toBe(1000);
	});
});

describe("calcGroupDuration", () => {
	it("最低 1000ms", () => {
		expect(calcGroupDuration(makeGroup())).toBe(1000);
	});

	it("3種類の最大値を返す", () => {
		const group = makeGroup({
			targetSteps: [{ targetIds: ["a", "b", "c", "d", "e"], interval: 100, startTime: 0 }],
			balloonEntries: [
				{ id: "b1", time: 0, count: 1, interval: 0, spread: "random" },
			],
			trainStartTime: 2000,
		});
		// 的: (5-1)*100 = 400, 風船: 0, 列車: 2000
		expect(calcGroupDuration(group)).toBe(2000);
	});
});

describe("calcTargetStepTimes", () => {
	it("各ステップの startTime ベースで開始/終了時刻を返す", () => {
		const group = makeGroup({
			targetSteps: [
				{ targetIds: ["a", "b"], interval: 100, startTime: 0 },
				{ targetIds: ["c", "d", "e"], interval: 50, startTime: 400 },
			],
		});

		const times = calcTargetStepTimes(group);

		expect(times).toEqual([
			{ startTime: 0, endTime: 100 },
			{ startTime: 400, endTime: 500 },
		]);
	});
});

describe("timeToX / xToTime 変換", () => {
	const DURATION = 2000;
	const WIDTH = 600;

	it("time=0 は左端パディング位置", () => {
		const x = timeToX(0, DURATION, WIDTH);
		expect(x).toBe(12); // PADDING=12
	});

	it("time=duration は右端パディング位置", () => {
		const x = timeToX(DURATION, DURATION, WIDTH);
		expect(x).toBe(WIDTH - 12);
	});

	it("time=duration/2 は中央", () => {
		const x = timeToX(1000, DURATION, WIDTH);
		expect(x).toBe(12 + (600 - 24) / 2); // 300
	});

	it("xToTime は timeToX の逆変換", () => {
		const time = 500;
		const x = timeToX(time, DURATION, WIDTH);
		const recovered = xToTime(x, DURATION, WIDTH);
		expect(recovered).toBe(time);
	});

	it("xToTime は 50ms 単位にスナップする", () => {
		// 51ms 相当の位置 → 50ms にスナップ
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
		const result = calcDraggedTime(0, 100, DURATION, WIDTH);
		expect(result).toBeGreaterThan(0);
	});

	it("左にドラッグすると時間が減る", () => {
		const result = calcDraggedTime(1000, -100, DURATION, WIDTH);
		expect(result).toBeLessThan(1000);
	});

	it("結果は 0 未満にならない", () => {
		const result = calcDraggedTime(100, -9999, DURATION, WIDTH);
		expect(result).toBe(0);
	});

	it("往復ドラッグで元に戻る", () => {
		const delta = 150;
		const after = calcDraggedTime(500, delta, DURATION, WIDTH);
		const back = calcDraggedTime(after, -delta, DURATION, WIDTH);
		expect(back).toBe(500);
	});
});
