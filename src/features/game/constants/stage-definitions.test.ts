import { describe, expect, test } from "vitest";
import { STAGES, STAGE_TRANSITION_DURATION } from "./stage-definitions";

describe("STAGE_TRANSITION_DURATION", () => {
	test("正の値が設定されている", () => {
		expect(STAGE_TRANSITION_DURATION).toBeGreaterThan(0);
	});
});

describe("STAGES", () => {
	test("3ステージ定義されている", () => {
		expect(STAGES).toHaveLength(3);
	});

	test("各ステージにname, duration, maxScore, spawnsが定義されている", () => {
		for (const stage of STAGES) {
			expect(stage.name).toBeTruthy();
			expect(stage.duration).toBeGreaterThan(0);
			expect(stage.maxScore).toBeGreaterThan(0);
			expect(stage.spawns.length).toBeGreaterThan(0);
		}
	});

	test("各スポーンエントリにtypeとgroupが定義されている", () => {
		const validTypes = [
			"balloon",
			"ground",
			"ground-gold",
			"ground-penalty",
			"train",
		];
		for (const stage of STAGES) {
			for (const spawn of stage.spawns) {
				expect(validTypes).toContain(spawn.type);
				expect(spawn.group).toBeGreaterThanOrEqual(0);
				expect(spawn.time).toBeGreaterThanOrEqual(0);
			}
		}
	});

	test("列車エントリにはdirectionとtrainLaneが設定されている", () => {
		for (const stage of STAGES) {
			const trains = stage.spawns.filter((s) => s.type === "train");
			for (const train of trains) {
				expect(train.direction).toBeDefined();
				expect([1, -1]).toContain(train.direction);
				expect(train.trainLane).toBeDefined();
			}
		}
	});

	test("グループ番号が各ステージ内で連続している", () => {
		for (const stage of STAGES) {
			const groups = [...new Set(stage.spawns.map((s) => s.group))].sort(
				(a, b) => a - b,
			);
			// 0から始まり、歯抜けがない
			for (let i = 0; i < groups.length; i++) {
				expect(groups[i]).toBe(i);
			}
		}
	});
});
