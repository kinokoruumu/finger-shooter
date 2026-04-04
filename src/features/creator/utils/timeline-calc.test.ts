import { describe, expect, it } from "vitest";
import type { CreatorGroup } from "../types";
import {
	calcBalloonsDuration,
	calcDraggedTime,
	calcGroupDuration,
	calcResizeLeft,
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

	it("1ステップ3的は lastSpawn + visibleDuration", () => {
		const group = makeGroup({
			targets: [
				{ id: "a", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				{ id: "b", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
				{ id: "c", gx: 2, gy: 0, type: "ground", visibleDuration: 4 },
			],
			targetSteps: [{ targetIds: ["a", "b", "c"], interval: 100, startTime: 0 }],
		});
		// lastSpawn=200 + visibleDuration=4000ms = 4200
		expect(calcTargetsDuration(group)).toBe(4200);
	});

	it("2ステップは各 startTime ベースで最大終了時刻（visibleDuration含む）", () => {
		const group = makeGroup({
			targets: [
				{ id: "a", gx: 0, gy: 0, type: "ground", visibleDuration: 2 },
				{ id: "b", gx: 1, gy: 0, type: "ground", visibleDuration: 2 },
				{ id: "c", gx: 2, gy: 0, type: "ground", visibleDuration: 3 },
				{ id: "d", gx: 3, gy: 0, type: "ground", visibleDuration: 3 },
			],
			targetSteps: [
				{ targetIds: ["a", "b"], interval: 100, startTime: 0 },
				{ targetIds: ["c", "d"], interval: 100, startTime: 600 },
			],
		});
		// ステップ1: 100 + 2000 = 2100
		// ステップ2: 700 + 3000 = 3700
		expect(calcTargetsDuration(group)).toBe(3700);
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
			targets: [
				{ id: "a", gx: 0, gy: 0, type: "ground", visibleDuration: 1 },
				{ id: "b", gx: 1, gy: 0, type: "ground", visibleDuration: 1 },
				{ id: "c", gx: 2, gy: 0, type: "ground", visibleDuration: 1 },
				{ id: "d", gx: 3, gy: 0, type: "ground", visibleDuration: 1 },
				{ id: "e", gx: 4, gy: 0, type: "ground", visibleDuration: 1 },
			],
			targetSteps: [{ targetIds: ["a", "b", "c", "d", "e"], interval: 100, startTime: 0 }],
			balloonEntries: [
				{ id: "b1", time: 0, count: 1, interval: 0, spread: "random" },
			],
			trainStartTime: 2000,
		});
		// 的: 400+1000=1400, 風船: 0, 列車: 2000
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

describe("calcResizeLeft", () => {
	const DURATION = 2000;
	const WIDTH = 600;

	it("deltaX=0 なら元の startTime と interval のまま", () => {
		// startTime=100, endTime=500, count=5 → interval = (500-100)/4 = 100
		const result = calcResizeLeft(100, 500, 5, 0, DURATION, WIDTH);
		expect(result.startTime).toBe(100);
		expect(result.interval).toBe(100);
	});

	it("左に伸ばすと startTime が減り interval が増える（endTime 固定）", () => {
		const result = calcResizeLeft(200, 600, 5, -50, DURATION, WIDTH);
		expect(result.startTime).toBeLessThan(200);
		// endTime=600 は固定、startTime が小さくなるので interval は大きくなる
		expect(result.interval).toBeGreaterThan((600 - 200) / 4);
	});

	it("右に縮めると startTime が増え interval が減る（endTime 固定）", () => {
		const result = calcResizeLeft(200, 600, 5, 50, DURATION, WIDTH);
		expect(result.startTime).toBeGreaterThan(200);
		expect(result.interval).toBeLessThan((600 - 200) / 4);
	});

	it("startTime は endTime を超えない", () => {
		const result = calcResizeLeft(100, 500, 3, 9999, DURATION, WIDTH);
		expect(result.startTime).toBeLessThanOrEqual(500);
		expect(result.interval).toBe(0);
	});

	it("count=1 の場合は interval=0 で startTime のみ変更", () => {
		const result = calcResizeLeft(100, 100, 1, -50, DURATION, WIDTH);
		expect(result.interval).toBe(0);
		expect(result.startTime).toBeLessThan(100);
	});
});
