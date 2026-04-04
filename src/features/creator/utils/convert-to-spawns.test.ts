import { describe, expect, it } from "vitest";
import type { CreatorAnimationStep, CreatorGroup, CreatorStage } from "../types";
import { convertStageToSpawns } from "./convert-to-spawns";

const emptyStep = (
	overrides: Partial<CreatorAnimationStep> = {},
): CreatorAnimationStep => ({
	targetIds: [],
	targetInterval: 100,
	balloonCount: 0,
	balloonInterval: 500,
	trainStart: false,
	...overrides,
});

const makeGroup = (partial: Partial<CreatorGroup> = {}): CreatorGroup => ({
	id: "g1",
	targets: [],
	balloon: null,
	train: null,
	steps: [],
	stepDelay: 300,
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
	it("空のステージは空配列を返す", () => {
		expect(convertStageToSpawns(makeStage([]))).toEqual([]);
	});

	it("空のグループは空配列を返す", () => {
		expect(convertStageToSpawns(makeStage([makeGroup()]))).toEqual([]);
	});

	describe("的の変換", () => {
		it("1ステップ・複数的は targetInterval 間隔で time が増える", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground-gold", visibleDuration: 4 },
					{ id: "t3", gx: 2, gy: 0, type: "ground-penalty", visibleDuration: 4 },
				],
				steps: [
					emptyStep({ targetIds: ["t1", "t2", "t3"], targetInterval: 100 }),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns.map((s) => s.time)).toEqual([0, 100, 200]);
			expect(spawns.map((s) => s.type)).toEqual(["ground", "ground-gold", "ground-penalty"]);
		});
	});

	describe("ステップ間 delay", () => {
		it("2ステップの場合、ステップ間 delay が正しく反映される", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t3", gx: 2, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t4", gx: 3, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [
					emptyStep({ targetIds: ["t1", "t2"], targetInterval: 100 }),
					emptyStep({ targetIds: ["t3", "t4"], targetInterval: 100 }),
				],
				stepDelay: 500,
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns.map((s) => s.time)).toEqual([0, 100, 600, 700]);
		});
	});

	describe("風船", () => {
		it("balloonCount で指定した数の風船が出現する", () => {
			const group = makeGroup({
				balloon: { spread: "center" },
				steps: [emptyStep({ balloonCount: 3, balloonInterval: 200 })],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(3);
			expect(spawns.every((s) => s.type === "balloon")).toBe(true);
			expect(spawns.map((s) => s.time)).toEqual([0, 200, 400]);
		});

		it("balloon が null でも balloonCount > 0 なら出現する（spread=random）", () => {
			const group = makeGroup({
				balloon: null,
				steps: [emptyStep({ balloonCount: 2, balloonInterval: 100 })],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(2);
		});
	});

	describe("列車", () => {
		it("trainStart: true のステップで列車が出現する", () => {
			const group = makeGroup({
				train: {
					direction: 1,
					speed: 2.5,
					slotsOscillate: true,
					slots: [
						{ index: 0, type: "normal" },
						{ index: 1, type: "gold" },
						{ index: 2, type: "penalty" },
					],
				},
				steps: [emptyStep({ trainStart: true })],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(1);
			expect(spawns[0]).toMatchObject({
				time: 0,
				type: "train",
				goldSlots: 1,
				penaltySlots: 1,
			});
		});

		it("trainStart: false では列車は出現しない", () => {
			const group = makeGroup({
				train: { direction: 1, speed: 2, slotsOscillate: false, slots: [] },
				steps: [emptyStep({ trainStart: false })],
			});

			expect(convertStageToSpawns(makeStage([group]))).toHaveLength(0);
		});
	});

	describe("並列タイムライン", () => {
		it("的と風船が同一ステップで並行して出現する", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				balloon: { spread: "center" },
				steps: [
					emptyStep({
						targetIds: ["t1"],
						targetInterval: 100,
						balloonCount: 2,
						balloonInterval: 300,
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(3);
			const targets = spawns.filter((s) => s.type === "ground");
			const balloons = spawns.filter((s) => s.type === "balloon");
			expect(targets.map((s) => s.time)).toEqual([0]);
			expect(balloons.map((s) => s.time)).toEqual([0, 300]);
		});

		it("ステップ間delayは的と風船の最大終了時刻を基準に計算される", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
				],
				balloon: { spread: "random" },
				train: { direction: 1, speed: 2, slotsOscillate: false, slots: [] },
				steps: [
					emptyStep({
						targetIds: ["t1", "t2"],
						targetInterval: 100,
						balloonCount: 3,
						balloonInterval: 200,
					}),
					emptyStep({ trainStart: true }),
				],
				stepDelay: 300,
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			// ステップ1: 的 0,100 / 風船 0,200,400
			// stepDuration = max(100, 400) = 400
			// ステップ2開始 = 400 + 300 = 700
			const train = spawns.find((s) => s.type === "train");
			expect(train?.time).toBe(700);
		});
	});

	describe("旧データ互換", () => {
		it("balloonCount が undefined のステップでもクラッシュしない", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [
					{ targetIds: ["t1"], targetInterval: 100 } as CreatorAnimationStep,
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(1);
		});

		it("旧形式（interval のみ）のステップでもクラッシュしない", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [
					{ targetIds: ["t1"], interval: 100 } as unknown as CreatorAnimationStep,
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(1);
		});
	});

	describe("エッジケース", () => {
		it("存在しないIDが含まれていてもクラッシュしない", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [emptyStep({ targetIds: ["t1", "nonexistent"] })],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(1);
		});

		it("全フィールドが空のステップでもクラッシュしない", () => {
			expect(convertStageToSpawns(makeStage([makeGroup({ steps: [emptyStep()] })]))).toEqual([]);
		});
	});
});
