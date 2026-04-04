import { describe, expect, it } from "vitest";
import type { CreatorGroup, CreatorStage } from "../types";
import { convertStageToSpawns } from "./convert-to-spawns";

const makeGroup = (partial: Partial<CreatorGroup> = {}): CreatorGroup => ({
	id: "g1",
	targets: [],
	balloons: [],
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
		it("1ステップ・1的を正しく変換する", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [{ targetIds: ["t1"], interval: 100 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(1);
			expect(spawns[0]).toMatchObject({
				time: 0,
				group: 0,
				type: "ground",
				gx: 0,
				gy: 0,
				visibleDuration: 4,
			});
		});

		it("1ステップ・複数的は interval 間隔で time が増える", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground-gold", visibleDuration: 4 },
					{ id: "t3", gx: 2, gy: 0, type: "ground-penalty", visibleDuration: 4 },
				],
				steps: [{ targetIds: ["t1", "t2", "t3"], interval: 100 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns.map((s) => s.time)).toEqual([0, 100, 200]);
			expect(spawns.map((s) => s.type)).toEqual([
				"ground",
				"ground-gold",
				"ground-penalty",
			]);
		});

		it("interval: 0 なら全的が同時出現（time: 0）", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t3", gx: 2, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [{ targetIds: ["t1", "t2", "t3"], interval: 0 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns.map((s) => s.time)).toEqual([0, 0, 0]);
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
					{ targetIds: ["t1", "t2"], interval: 100 },
					{ targetIds: ["t3", "t4"], interval: 100 },
				],
				stepDelay: 500,
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			// ステップ1: t1=0ms, t2=100ms
			// ステップ2開始 = (2-1)*100 + 500 = 600ms
			// ステップ2: t3=600ms, t4=700ms
			expect(spawns.map((s) => s.time)).toEqual([0, 100, 600, 700]);
		});

		it("V字パターン: 8的を左右交互にステップ1で出現", () => {
			const targets = [
				{ id: "t1", gx: 0, gy: 0, type: "ground" as const, visibleDuration: 4 },
				{ id: "t2", gx: 7, gy: 0, type: "ground" as const, visibleDuration: 4 },
				{ id: "t3", gx: 1, gy: 1, type: "ground" as const, visibleDuration: 4 },
				{ id: "t4", gx: 6, gy: 1, type: "ground" as const, visibleDuration: 4 },
				{ id: "t5", gx: 2, gy: 2, type: "ground" as const, visibleDuration: 4 },
				{ id: "t6", gx: 5, gy: 2, type: "ground" as const, visibleDuration: 4 },
				{ id: "t7", gx: 3, gy: 3, type: "ground" as const, visibleDuration: 4 },
				{ id: "t8", gx: 4, gy: 3, type: "ground" as const, visibleDuration: 4 },
			];

			const group = makeGroup({
				targets,
				steps: [
					{
						targetIds: ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"],
						interval: 100,
					},
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(8);
			expect(spawns.map((s) => s.time)).toEqual([
				0, 100, 200, 300, 400, 500, 600, 700,
			]);
			expect(spawns.map((s) => [s.gx, s.gy])).toEqual([
				[0, 0], [7, 0], [1, 1], [6, 1], [2, 2], [5, 2], [3, 3], [4, 3],
			]);
		});

		it("縦2本（時間差）: 2ステップで500ms間隔", () => {
			const targets = [
				{ id: "t1", gx: 2, gy: 0, type: "ground" as const, visibleDuration: 4 },
				{ id: "t2", gx: 2, gy: 1, type: "ground" as const, visibleDuration: 4 },
				{ id: "t3", gx: 2, gy: 2, type: "ground" as const, visibleDuration: 4 },
				{ id: "t4", gx: 2, gy: 3, type: "ground" as const, visibleDuration: 4 },
				{ id: "t5", gx: 5, gy: 0, type: "ground" as const, visibleDuration: 4 },
				{ id: "t6", gx: 5, gy: 1, type: "ground" as const, visibleDuration: 4 },
				{ id: "t7", gx: 5, gy: 2, type: "ground" as const, visibleDuration: 4 },
				{ id: "t8", gx: 5, gy: 3, type: "ground" as const, visibleDuration: 4 },
			];

			const group = makeGroup({
				targets,
				steps: [
					{ targetIds: ["t1", "t2", "t3", "t4"], interval: 100 },
					{ targetIds: ["t5", "t6", "t7", "t8"], interval: 100 },
				],
				stepDelay: 500,
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			// ステップ1: 0, 100, 200, 300
			// ステップ2開始: (4-1)*100 + 500 = 800
			// ステップ2: 800, 900, 1000, 1100
			expect(spawns.map((s) => s.time)).toEqual([
				0, 100, 200, 300, 800, 900, 1000, 1100,
			]);
		});
	});

	describe("複数グループ", () => {
		it("各グループに正しい group index が付与される", () => {
			const g0 = makeGroup({
				id: "g0",
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [{ targetIds: ["t1"], interval: 0 }],
			});
			const g1 = makeGroup({
				id: "g1",
				targets: [
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [{ targetIds: ["t2"], interval: 0 }],
			});

			const spawns = convertStageToSpawns(makeStage([g0, g1]));

			expect(spawns).toHaveLength(2);
			expect(spawns[0].group).toBe(0);
			expect(spawns[1].group).toBe(1);
		});

		it("各グループの time は 0 から始まる（グループ内相対時間）", () => {
			const g0 = makeGroup({
				id: "g0",
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [{ targetIds: ["t1", "t2"], interval: 100 }],
			});
			const g1 = makeGroup({
				id: "g1",
				targets: [
					{ id: "t3", gx: 2, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t4", gx: 3, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [{ targetIds: ["t3", "t4"], interval: 200 }],
			});

			const spawns = convertStageToSpawns(makeStage([g0, g1]));

			// g0: 0, 100
			// g1: 0, 200（グループ内相対時間）
			expect(spawns.map((s) => ({ group: s.group, time: s.time }))).toEqual([
				{ group: 0, time: 0 },
				{ group: 0, time: 100 },
				{ group: 1, time: 0 },
				{ group: 1, time: 200 },
			]);
		});
	});

	describe("風船", () => {
		it("風船がステップ内で正しく変換される", () => {
			const group = makeGroup({
				balloons: [
					{ id: "b1", nx: 0.3, speed: 2 },
					{ id: "b2", nx: 0.7, speed: 3 },
				],
				steps: [{ targetIds: ["b1", "b2"], interval: 500 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(2);
			expect(spawns[0]).toMatchObject({ time: 0, type: "balloon", nx: 0.3 });
			expect(spawns[1]).toMatchObject({ time: 500, type: "balloon", nx: 0.7 });
		});
	});

	describe("列車", () => {
		it("列車がグループに含まれる場合 time: 0 で変換される", () => {
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
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(1);
			expect(spawns[0]).toMatchObject({
				time: 0,
				type: "train",
				direction: 1,
				trainSpeed: 2.5,
				slotsOscillate: true,
				goldSlots: 1,
				penaltySlots: 1,
			});
		});
	});

	describe("混合グループ", () => {
		it("的 + 風船 + 列車が1グループに混在できる", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				balloons: [{ id: "b1", nx: 0.5, speed: 2 }],
				train: {
					direction: -1,
					speed: 2,
					slotsOscillate: false,
					slots: [],
				},
				steps: [{ targetIds: ["t1", "b1"], interval: 100 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			// 的1 + 風船1 + 列車1 = 3
			expect(spawns).toHaveLength(3);

			const types = spawns.map((s) => s.type);
			expect(types).toContain("ground");
			expect(types).toContain("balloon");
			expect(types).toContain("train");
		});
	});

	describe("エッジケース", () => {
		it("ステップに存在しないIDが含まれていてもクラッシュしない", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [{ targetIds: ["t1", "nonexistent"], interval: 100 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			// 存在しないIDはスキップ
			expect(spawns).toHaveLength(1);
			expect(spawns[0].gx).toBe(0);
		});

		it("ステップが空配列でもクラッシュしない", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [{ targetIds: [], interval: 100 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(0);
		});
	});
});
