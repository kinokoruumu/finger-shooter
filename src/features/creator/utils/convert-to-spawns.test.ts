import { describe, expect, it } from "vitest";
import type { CreatorGroup, CreatorStage } from "../types";
import { convertStageToSpawns } from "./convert-to-spawns";

const makeGroup = (partial: Partial<CreatorGroup> = {}): CreatorGroup => ({
	id: "g1",
	targets: [],
	targetSteps: [],
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
	it("空のステージは空配列を返す", () => {
		expect(convertStageToSpawns(makeStage([]))).toEqual([]);
	});

	it("空のグループは空配列を返す", () => {
		expect(convertStageToSpawns(makeStage([makeGroup()]))).toEqual([]);
	});

	describe("的（ステップモデル）", () => {
		it("1ステップ・複数的は interval 間隔で出現する", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground-gold", visibleDuration: 4 },
					{ id: "t3", gx: 2, gy: 0, type: "ground-penalty", visibleDuration: 4 },
				],
				targetSteps: [{ targetIds: ["t1", "t2", "t3"], interval: 100, startTime: 0 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns.map((s) => s.time)).toEqual([0, 100, 200]);
			expect(spawns.map((s) => s.type)).toEqual([
				"ground",
				"ground-gold",
				"ground-penalty",
			]);
		});

		it("2ステップの場合、targetStepDelay が反映される", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t2", gx: 1, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t3", gx: 2, gy: 0, type: "ground", visibleDuration: 4 },
					{ id: "t4", gx: 3, gy: 0, type: "ground", visibleDuration: 4 },
				],
				targetSteps: [
					{ targetIds: ["t1", "t2"], interval: 100, startTime: 0 },
					{ targetIds: ["t3", "t4"], interval: 100, startTime: 600 },
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			// ステップ1: 0, 100
			// ステップ2: 600, 700
			expect(spawns.map((s) => s.time)).toEqual([0, 100, 600, 700]);
		});

		it("V字パターン: 8的を左右交互に出現", () => {
			const ids = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"];
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
				targetSteps: [{ targetIds: ids, interval: 100, startTime: 0 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(8);
			expect(spawns.map((s) => s.time)).toEqual([
				0, 100, 200, 300, 400, 500, 600, 700,
			]);
		});
	});

	describe("風船（同時出現）", () => {
		it("N個が同じ time で同時に出現する", () => {
			const group = makeGroup({
				balloonEntries: [
					{ id: "b1", time: 0, count: 3, spread: "center" },
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(3);
			expect(spawns.every((s) => s.type === "balloon")).toBe(true);
			expect(spawns.every((s) => s.time === 0)).toBe(true);
		});

		it("複数エントリが異なるタイミングで出現する", () => {
			const group = makeGroup({
				balloonEntries: [
					{ id: "b1", time: 0, count: 2, spread: "left" },
					{ id: "b2", time: 1000, count: 2, spread: "right" },
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(4);
			expect(spawns.map((s) => s.time)).toEqual([0, 0, 1000, 1000]);
		});

		it("count: 1 のエントリは1つの風船を出す", () => {
			const group = makeGroup({
				balloonEntries: [
					{ id: "b1", time: 500, count: 1, spread: "random" },
				],
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(1);
			expect(spawns[0].time).toBe(500);
		});
	});

	describe("列車", () => {
		it("trainStartTime で指定したタイミングに出現する", () => {
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
				trainStartTime: 2000,
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(1);
			expect(spawns[0]).toMatchObject({
				time: 2000,
				type: "train",
				direction: 1,
				trainSpeed: 2.5,
				goldSlots: 1,
				penaltySlots: 1,
			});
		});

		it("trainStartTime が null なら列車は出現しない", () => {
			const group = makeGroup({
				train: { direction: 1, speed: 2, slotsOscillate: false, slots: [] },
				trainStartTime: null,
			});

			expect(convertStageToSpawns(makeStage([group]))).toHaveLength(0);
		});

		it("train が null なら trainStartTime があっても出現しない", () => {
			const group = makeGroup({
				train: null,
				trainStartTime: 1000,
			});

			expect(convertStageToSpawns(makeStage([group]))).toHaveLength(0);
		});
	});

	describe("混合", () => {
		it("的・風船・列車が同一グループで独立したタイミングに出現する", () => {
			const group = makeGroup({
				targets: [
					{ id: "t1", gx: 0, gy: 0, type: "ground", visibleDuration: 4 },
				],
				targetSteps: [{ targetIds: ["t1"], interval: 0, startTime: 0 }],
				balloonEntries: [
					{ id: "b1", time: 500, count: 2, spread: "center" },
				],
				train: { direction: -1, speed: 2, slotsOscillate: false, slots: [] },
				trainStartTime: 1500,
			});

			const spawns = convertStageToSpawns(makeStage([group]));

			expect(spawns).toHaveLength(4);
			// 的: 0ms, 風船: 500ms, 500ms(同時), 列車: 1500ms
			expect(
				spawns.map((s) => ({ type: s.type, time: s.time })),
			).toEqual([
				{ type: "ground", time: 0 },
				{ type: "balloon", time: 500 },
				{ type: "balloon", time: 500 },
				{ type: "train", time: 1500 },
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
				targetSteps: [{ targetIds: ["t1"], interval: 0, startTime: 0 }],
			});
			const g1 = makeGroup({
				id: "g1",
				balloonEntries: [
					{ id: "b1", time: 0, count: 1, spread: "random" },
				],
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
				targetSteps: [{ targetIds: ["t1", "nonexistent"], interval: 100, startTime: 0 }],
			});

			const spawns = convertStageToSpawns(makeStage([group]));
			expect(spawns).toHaveLength(1);
		});

		it("旧型式データ（targetSteps 未定義）でもクラッシュしない", () => {
			const group = makeGroup();
			// targetSteps を undefined にシミュレート
			const broken = { ...group, targetSteps: undefined } as unknown as CreatorGroup;

			expect(convertStageToSpawns(makeStage([broken]))).toEqual([]);
		});

		it("balloonEntries が undefined でもクラッシュしない", () => {
			const group = makeGroup();
			const broken = { ...group, balloonEntries: undefined } as unknown as CreatorGroup;

			expect(convertStageToSpawns(makeStage([broken]))).toEqual([]);
		});
	});
});
