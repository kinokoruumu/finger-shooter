import { afterEach, describe, expect, test, vi } from "vitest";
import { randomBalloonColor } from "./utils";

describe("randomBalloonColor", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("定義済みカラーの一つを返す", () => {
		const validColors = [
			"#ff4466",
			"#44aaff",
			"#44dd66",
			"#ffaa22",
			"#dd44ff",
			"#ff6644",
		];
		const color = randomBalloonColor();
		expect(validColors).toContain(color);
	});

	test("Math.randomの値に応じた色を返す", () => {
		// Math.random()が0を返す場合、配列の先頭
		vi.spyOn(Math, "random").mockReturnValue(0);
		expect(randomBalloonColor()).toBe("#ff4466");

		// Math.random()が0.99を返す場合、配列の末尾
		vi.spyOn(Math, "random").mockReturnValue(0.99);
		expect(randomBalloonColor()).toBe("#ff6644");
	});
});
