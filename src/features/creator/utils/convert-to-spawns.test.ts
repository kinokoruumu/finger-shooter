import { describe, expect, it } from "vitest";
import type { CreatorGroup, CreatorStage, CreatorTargetSet } from "../types";
import { convertStageToSpawns } from "./convert-to-spawns";

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

const makeStage = (groups: CreatorGroup[]): CreatorStage => ({
	id: "s1",
	name: "test",
	groups,
	createdAt: 0,
	updatedAt: 0,
});

describe("convertStageToSpawns", () => {
	it("空のステージは空配列", () => {
		expect(convertStageToSpawns(makeStage([]))).toEqual([]);
	});

	describe("的セット", () => {
		it("1セット1ステップ", () => {
			const group = makeGroup({
				targetSets: [
					makeSet({
						targets: [
							{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
							{ id: "t2", gx: 1, gy: 0, type: "ground-gold", visibleDuration: 4 },
						],
						steps: [{ targetIds: ["t1", "t2"], interval: 100, startTime: 0 }],
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns.map((s) => s.time)).toEqual([0, 100]);
			expect(spawns.map((s) => s.type)).toEqual(["ground", "ground-gold"]);
		});

		it("複数セットが独立してスポーンする", () => {
			const group = makeGroup({
				targetSets: [
					makeSet({
						id: "sA",
						targets: [
							{ id: "a1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
						],
						steps: [{ targetIds: ["a1"], interval: 0, startTime: 0 }],
					}),
					makeSet({
						id: "sB",
						targets: [
							{ id: "b1", gx: 0, gy: 0, type: "ground-gold", visibleDuration: 4 },
						],
						steps: [{ targetIds: ["b1"], interval: 0, startTime: 2000 }],
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(2);
			expect(spawns[0]).toMatchObject({ time: 0, type: "ground" });
			expect(spawns[1]).toMatchObject({ time: 2000, type: "ground-gold" });
		});

		it("同じグリッド座標でも別セットなら両方出現する", () => {
			const group = makeGroup({
				targetSets: [
					makeSet({
						id: "sA",
						targets: [
							{ id: "a1", gx: 3, gy: 2, type: "ground", visibleDuration: 4 },
						],
						steps: [{ targetIds: ["a1"], interval: 0, startTime: 0 }],
					}),
					makeSet({
						id: "sB",
						targets: [
							{ id: "b1", gx: 3, gy: 2, type: "ground-penalty", visibleDuration: 4 },
						],
						steps: [{ targetIds: ["b1"], interval: 0, startTime: 5000 }],
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(2);
			expect(spawns.every((s) => s.gx === 3 && s.gy === 2)).toBe(true);
		});
	});

	describe("風船", () => {
		it("interval ありなら間隔を空けて出現", () => {
			const group = makeGroup({
				balloonEntries: [
					{ id: "b1", time: 0, count: 3, interval: 500, spread: "center" },
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns.map((s) => s.time)).toEqual([0, 500, 1000]);
		});
	});

	describe("列車", () => {
		it("trainStartTime で出現", () => {
			const group = makeGroup({
				train: {
					direction: 1,
					speed: 2.5,
					slotsOscillate: true,
					slots: [{ index: 0, type: "gold" }, { index: 1, type: "penalty" }],
				},
				trainStartTime: 2000,
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(1);
			expect(spawns[0]).toMatchObject({
				time: 2000,
				type: "train",
				goldSlots: 1,
				penaltySlots: 1,
			});
		});

		it("trainStartTime が null なら出現しない", () => {
			const group = makeGroup({
				train: { direction: 1, speed: 2, slotsOscillate: false, slots: [] },
				trainStartTime: null,
			});
			expect(convertStageToSpawns(makeStage([group]))).toHaveLength(0);
		});
	});

	describe("混合", () => {
		it("的セット + 風船 + 列車が独立したタイミングで出現", () => {
			const group = makeGroup({
				targetSets: [
					makeSet({
						targets: [
							{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
						],
						steps: [{ targetIds: ["t1"], interval: 0, startTime: 0 }],
					}),
				],
				balloonEntries: [
					{ id: "b1", time: 500, count: 2, interval: 0, spread: "center" },
				],
				train: { direction: -1, speed: 2, slotsOscillate: false, slots: [] },
				trainStartTime: 1500,
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(4);
		});
	});

	describe("エッジケース", () => {
		it("targetSets が undefined でもクラッシュしない", () => {
			const group = makeGroup();
			const broken = { ...group, targetSets: undefined } as unknown as CreatorGroup;
			expect(convertStageToSpawns(makeStage([broken]))).toEqual([]);
		});
	});
});
