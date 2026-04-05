import { describe, expect, it } from "vitest";
import type { CreatorTarget } from "../types";
import { getPresetInterval, sortTargetsByPreset } from "./target-presets";

const t = (id: string, gx: number, gy: number): CreatorTarget => ({
	id,
	gx,
	gy,
	type: "ground",
	visibleDuration: 4,
});

describe("sortTargetsByPreset", () => {
	const targets = [
		t("a", 0, 0),
		t("b", 2, 0),
		t("c", 0, 1),
		t("d", 2, 1),
		t("e", 1, 2),
	];

	it("all-at-once は元の順序", () => {
		const ids = sortTargetsByPreset(targets, "all-at-once");
		expect(ids).toEqual(["a", "b", "c", "d", "e"]);
	});

	it("top-to-bottom は gy 昇順、同gy なら gx 昇順", () => {
		const ids = sortTargetsByPreset(targets, "top-to-bottom");
		expect(ids).toEqual(["a", "b", "c", "d", "e"]);
	});

	it("bottom-to-top は gy 降順、同gy なら gx 昇順", () => {
		const ids = sortTargetsByPreset(targets, "bottom-to-top");
		expect(ids).toEqual(["e", "c", "d", "a", "b"]);
	});

	it("left-to-right は gx 昇順、同gx なら gy 昇順", () => {
		const ids = sortTargetsByPreset(targets, "left-to-right");
		expect(ids).toEqual(["a", "c", "e", "b", "d"]);
	});

	it("right-to-left は gx 降順、同gx なら gy 昇順", () => {
		const ids = sortTargetsByPreset(targets, "right-to-left");
		expect(ids).toEqual(["b", "d", "e", "a", "c"]);
	});

	it("空配列は空を返す", () => {
		expect(sortTargetsByPreset([], "all-at-once")).toEqual([]);
	});
});

describe("getPresetInterval", () => {
	it("all-at-once は 0ms", () => {
		expect(getPresetInterval("all-at-once")).toBe(0);
	});

	it("それ以外は 100ms", () => {
		expect(getPresetInterval("top-to-bottom")).toBe(100);
		expect(getPresetInterval("left-to-right")).toBe(100);
	});
});
