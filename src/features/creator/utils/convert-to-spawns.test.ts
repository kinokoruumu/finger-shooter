import { describe, expect, it } from "vitest";
import type { CreatorAnimationStep, CreatorGroup, CreatorStage } from "../types";
import { convertStageToSpawns } from "./convert-to-spawns";

const emptyStep = (
	overrides: Partial<CreatorAnimationStep> = {},
): CreatorAnimationStep => ({
	targetIds: [],
	targetInterval: 100,
	balloonIds: [],
	balloonInterval: 100,
	trainStart: false,
	...overrides,
});

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
				steps: [emptyStep({ targetIds: ["t1"] })],
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

		it("1ステップ・複数的は targetInterval 間隔で time が増える", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground-gold", visibleDuration: 4 },
					{ id: "t3", gx: 2, gy: 0, type: "ground-penalty", visibleDuration: 4 },
				],
				steps: [
					emptyStep({
						targetIds: ["t1", "t2", "t3"],
						targetInterval: 100,
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns.map((s) => s.time)).toEqual([0, 100, 200]);
			expect(spawns.map((s) => s.type)).toEqual([
				"ground",
				"ground-gold",
				"ground-penalty",
			]);
		});

		it("targetInterval: 0 なら全的が同時出現", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [
					emptyStep({
						targetIds: ["t1", "t2"],
						targetInterval: 0,
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns.map((s) => s.time)).toEqual([0, 0]);
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
					emptyStep({
						targetIds: ["t1", "t2"],
						targetInterval: 100,
					}),
					emptyStep({
						targetIds: ["t3", "t4"],
						targetInterval: 100,
					}),
				],
				stepDelay: 500,
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			// ステップ1: t1=0, t2=100
			// ステップ2開始 = max(100, 0) + 500 = 600
			// ステップ2: t3=600, t4=700
			expect(spawns.map((s) => s.time)).toEqual([0, 100, 600, 700]);
		});

		it("V字パターン: 8的を左右交互に出現", () => {
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
					emptyStep({
						targetIds: ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"],
						targetInterval: 100,
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(8);
			expect(spawns.map((s) => s.time)).toEqual([
				0, 100, 200, 300, 400, 500, 600, 700,
			]);
		});
	});

	describe("風船", () => {
		it("風船がステップ内で balloonInterval 間隔で変換される", () => {
			const group = makeGroup({
				balloons: [
					{ id: "b1", nx: 0.3, speed: 2, color: "#ff4466" },
					{ id: "b2", nx: 0.7, speed: 3, color: "#44aaff" },
				],
				steps: [
					emptyStep({
						balloonIds: ["b1", "b2"],
						balloonInterval: 500,
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(2);
			expect(spawns[0]).toMatchObject({ time: 0, type: "balloon", nx: 0.3 });
			expect(spawns[1]).toMatchObject({ time: 500, type: "balloon", nx: 0.7 });
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
				direction: 1,
				trainSpeed: 2.5,
				slotsOscillate: true,
				goldSlots: 1,
				penaltySlots: 1,
			});
		});

		it("trainStart: false のステップでは列車は出現しない", () => {
			const group = makeGroup({
				train: {
					direction: 1,
					speed: 2,
					slotsOscillate: false,
					slots: [],
				},
				steps: [emptyStep({ trainStart: false })],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(0);
		});
	});

	describe("並列タイムライン", () => {
		it("的と風船が同一ステップで並行して出現する", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
				],
				balloons: [
					{ id: "b1", nx: 0.3, speed: 2, color: "#ff4466" },
					{ id: "b2", nx: 0.7, speed: 3, color: "#44aaff" },
				],
				steps: [
					emptyStep({
						targetIds: ["t1", "t2"],
						targetInterval: 100,
						balloonIds: ["b1", "b2"],
						balloonInterval: 300,
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			// 的: 0ms, 100ms / 風船: 0ms, 300ms
			expect(spawns).toHaveLength(4);
			const targets = spawns.filter((s) => s.type === "ground");
			const balloons = spawns.filter((s) => s.type === "balloon");
			expect(targets.map((s) => s.time)).toEqual([0, 100]);
			expect(balloons.map((s) => s.time)).toEqual([0, 300]);
		});

		it("的 + 風船 + 列車が同一ステップで並行出現", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				balloons: [
					{ id: "b1", nx: 0.5, speed: 2, color: "#44dd66" },
				],
				train: {
					direction: -1,
					speed: 2,
					slotsOscillate: false,
					slots: [],
				},
				steps: [
					emptyStep({
						targetIds: ["t1"],
						balloonIds: ["b1"],
						trainStart: true,
					}),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(3);
			const types = spawns.map((s) => s.type);
			expect(types).toContain("ground");
			expect(types).toContain("balloon");
			expect(types).toContain("train");
			// 全て time: 0
			expect(spawns.every((s) => s.time === 0)).toBe(true);
		});

		it("ステップ間delayは的と風船の最大終了時刻を基準に計算される", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
				],
				balloons: [
					{ id: "b1", nx: 0.3, speed: 2, color: "#ff4466" },
					{ id: "b2", nx: 0.5, speed: 2, color: "#44aaff" },
					{ id: "b3", nx: 0.7, speed: 2, color: "#44dd66" },
				],
				steps: [
					emptyStep({
						targetIds: ["t1", "t2"],
						targetInterval: 100,
						balloonIds: ["b1", "b2", "b3"],
						balloonInterval: 200,
					}),
					emptyStep({
						targetIds: [],
						balloonIds: [],
						trainStart: true,
					}),
				],
				train: {
					direction: 1,
					speed: 2,
					slotsOscillate: false,
					slots: [],
				},
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

	describe("複数グループ", () => {
		it("各グループに正しい group index が付与される", () => {
			const g0 = makeGroup({
				id: "g0",
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [emptyStep({ targetIds: ["t1"] })],
			});
			const g1 = makeGroup({
				id: "g1",
				targets: [
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [emptyStep({ targetIds: ["t2"] })],
			});

			const spawns = convertStageToSpawns(makeStage([g0, g1]));

			expect(spawns).toHaveLength(2);
			expect(spawns[0].group).toBe(0);
			expect(spawns[1].group).toBe(1);
		});
	});

	describe("エッジケース", () => {
		it("存在しないIDが含まれていてもクラッシュしない", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				steps: [
					emptyStep({ targetIds: ["t1", "nonexistent"] }),
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(1);
		});

		it("全フィールドが空のステップでもクラッシュしない", () => {
			const group = makeGroup({
				steps: [emptyStep()],
			});
			expect(convertStageToSpawns(makeStage([group]))).toEqual([]);
		});
	});
});
