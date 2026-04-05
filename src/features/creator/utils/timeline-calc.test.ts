import { describe, expect, it } from "vitest";
import type { CreatorGroup, CreatorTargetSet } from "../types";
import {
	calcBalloonsDuration,
	calcDraggedTime,
	calcGroupDuration,
	calcPxPerMs,
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
	const PX_PER_MS = 0.2;

	it("xToTime は timeToX の逆変換", () => {
		const x = timeToX(500, PX_PER_MS);
		expect(xToTime(x, PX_PER_MS)).toBe(500);
	});

	it("xToTime は 50ms 単位にスナップ", () => {
		const x = timeToX(51, PX_PER_MS);
		expect(xToTime(x, PX_PER_MS)).toBe(50);
	});

	it("pxPerMs が変わっても time→x→time は一貫する", () => {
		const scale = 0.5;
		const x = timeToX(1000, scale);
		expect(xToTime(x, scale)).toBe(1000);
	});
});

describe("calcDraggedTime", () => {
	const PX_PER_MS = 0.2;

	it("deltaX=0 なら元の時間", () => {
		expect(calcDraggedTime(500, 0, PX_PER_MS)).toBe(500);
	});

	it("往復で元に戻る", () => {
		const after = calcDraggedTime(500, 150, PX_PER_MS);
		expect(calcDraggedTime(after, -150, PX_PER_MS)).toBe(500);
	});
});

describe("calcResizeLeftTime", () => {
	const PX_PER_MS = 0.2;

	it("startTime は endTime - minDuration を超えない", () => {
		const result = calcResizeLeftTime(100, 500, 100, 9999, PX_PER_MS);
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

describe("calcPxPerMs", () => {
	it("zoomに比例する", () => {
		const z1 = calcPxPerMs(500, 1);
		const z2 = calcPxPerMs(500, 2);
		expect(z2).toBeCloseTo(z1 * 2, 6);
	});

	it("コンテナ幅に比例する", () => {
		const w1 = calcPxPerMs(500, 1);
		const w2 = calcPxPerMs(1000, 1);
		expect(w2).toBeCloseTo(w1 * 2, 6);
	});

	it("コンテンツのdurationに依存しない（引数にdurationがない）", () => {
		// 同じcontainerWidthとzoomなら常に同じ値
		const a = calcPxPerMs(500, 1);
		const b = calcPxPerMs(500, 1);
		expect(a).toBe(b);
	});
});
