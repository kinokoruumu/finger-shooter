import { describe, expect, it } from "vitest";
import type { CreatorGroup } from "../types";
import {
	calcBalloonsDuration,
	calcGroupDuration,
	calcTargetStepTimes,
	calcTargetsDuration,
} from "./timeline-calc";

const makeGroup = (partial: Partial<CreatorGroup> = {}): CreatorGroup => ({
	id: "g1",
	targets: [],
	targetSteps: [],
	targetStepDelay: 300,
	balloonEntries: [],
	train: null,
	trainStartTime: null,
	...partial,
});

describe("calcTargetsDuration", () => {
	it("ステップなしは 0", () => {
		expect(calcTargetsDuration(makeGroup())).toBe(0);
	});

	it("1ステップ3的は (3-1)*interval", () => {
		const group = makeGroup({
			targetSteps: [{ targetIds: ["a", "b", "c"], interval: 100 }],
		});
		expect(calcTargetsDuration(group)).toBe(200);
	});

	it("2ステップは delay を含む", () => {
		const group = makeGroup({
			targetSteps: [
				{ targetIds: ["a", "b"], interval: 100 },
				{ targetIds: ["c", "d"], interval: 100 },
			],
			targetStepDelay: 500,
		});
		// ステップ1: (2-1)*100 = 100
		// + delay 500
		// ステップ2: (2-1)*100 = 100
		// 合計: 100 + 500 + 100 = 700
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
			targetSteps: [{ targetIds: ["a", "b", "c", "d", "e"], interval: 100 }],
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
	it("各ステップの開始/終了時刻を返す", () => {
		const group = makeGroup({
			targetSteps: [
				{ targetIds: ["a", "b"], interval: 100 },
				{ targetIds: ["c", "d", "e"], interval: 50 },
			],
			targetStepDelay: 300,
		});

		const times = calcTargetStepTimes(group);

		expect(times).toEqual([
			{ startTime: 0, endTime: 100 },
			{ startTime: 400, endTime: 500 },
		]);
	});
});
