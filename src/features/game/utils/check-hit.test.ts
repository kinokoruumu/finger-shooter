import { describe, expect, test } from "vitest";
import { checkHit3D } from "./check-hit";

describe("checkHit3D", () => {
	test("同じ座標はヒットする", () => {
		const aim: [number, number, number] = [1, 2, 0];
		const target: [number, number, number] = [1, 2, 0];
		expect(checkHit3D(aim, target, 1)).toBe(true);
	});

	test("半径内の座標はヒットする", () => {
		const aim: [number, number, number] = [1, 2, 0];
		const target: [number, number, number] = [1.5, 2, 0];
		expect(checkHit3D(aim, target, 1)).toBe(true);
	});

	test("半径外の座標はヒットしない", () => {
		const aim: [number, number, number] = [0, 0, 0];
		const target: [number, number, number] = [10, 10, 0];
		expect(checkHit3D(aim, target, 1)).toBe(false);
	});

	test("Z座標は判定に影響しない（2D距離）", () => {
		const aim: [number, number, number] = [1, 2, 0];
		const target: [number, number, number] = [1, 2, 100];
		expect(checkHit3D(aim, target, 1)).toBe(true);
	});

	test("境界値: ちょうど半径上は含まない（< 判定）", () => {
		const aim: [number, number, number] = [0, 0, 0];
		const target: [number, number, number] = [1, 0, 0];
		// 距離=1, hitRadius=1 → 1*1 < 1*1 は false
		expect(checkHit3D(aim, target, 1)).toBe(false);
	});
});
