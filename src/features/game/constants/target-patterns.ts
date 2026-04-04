/** 的の配置パターン（グリッド座標 gx:0-7, gy:0-3 + 遅延ms） */

export type TargetPosition = {
	gx: number;
	gy: number;
	/** スポーン遅延（ms）。0 = 即座 */
	delay: number;
};

export type TargetPattern = {
	name: string;
	positions: TargetPosition[];
};

const pos = (gx: number, gy: number, delay = 0): TargetPosition => ({
	gx,
	gy,
	delay,
});

export const TARGET_PATTERNS: TargetPattern[] = [
	// --- 単体 ---
	{ name: "単体", positions: [pos(3, 1)] },

	// --- 横一列（同時） ---
	{
		name: "横一列（同時）",
		positions: Array.from({ length: 8 }, (_, i) => pos(i, 1)),
	},

	// --- 横一列（左→右） ---
	{
		name: "横一列（左→右）",
		positions: Array.from({ length: 8 }, (_, i) => pos(i, 1, i * 100)),
	},

	// --- 横一列（右→左） ---
	{
		name: "横一列（右→左）",
		positions: Array.from({ length: 8 }, (_, i) => pos(7 - i, 1, i * 100)),
	},

	// --- 縦一列（上→下） ---
	{
		name: "縦一列（上→下）",
		positions: Array.from({ length: 4 }, (_, i) => pos(3, i, i * 120)),
	},

	// --- V字（上から交互） ---
	{
		name: "V字（交互）",
		positions: [
			pos(0, 0, 0),
			pos(7, 0, 100),
			pos(1, 1, 200),
			pos(6, 1, 300),
			pos(2, 2, 400),
			pos(5, 2, 500),
			pos(3, 3, 600),
			pos(4, 3, 700),
		],
	},

	// --- V字（同時） ---
	{
		name: "V字（同時）",
		positions: [
			pos(0, 0),
			pos(7, 0),
			pos(1, 1),
			pos(6, 1),
			pos(2, 2),
			pos(5, 2),
			pos(3, 3),
			pos(4, 3),
		],
	},

	// --- 対角線 ---
	{
		name: "対角線",
		positions: [
			pos(0, 0, 0),
			pos(1, 0, 100),
			pos(2, 1, 200),
			pos(3, 1, 300),
			pos(4, 2, 400),
			pos(5, 2, 500),
			pos(6, 3, 600),
		],
	},

	// --- クロス（同時） ---
	{
		name: "クロス（同時）",
		positions: [
			...Array.from({ length: 8 }, (_, i) => pos(i, 2)),
			pos(4, 0),
			pos(4, 1),
			pos(4, 3),
		],
	},

	// --- 四隅 ---
	{ name: "四隅", positions: [pos(0, 0), pos(7, 0), pos(0, 3), pos(7, 3)] },

	// --- 外周（時計回り） ---
	{
		name: "外周（時計回り）",
		positions: (() => {
			const coords: TargetPosition[] = [];
			let d = 0;
			for (let x = 0; x <= 7; x++) {
				coords.push(pos(x, 0, d));
				d += 80;
			}
			for (let y = 1; y <= 3; y++) {
				coords.push(pos(7, y, d));
				d += 80;
			}
			for (let x = 6; x >= 0; x--) {
				coords.push(pos(x, 3, d));
				d += 80;
			}
			for (let y = 2; y >= 1; y--) {
				coords.push(pos(0, y, d));
				d += 80;
			}
			return coords;
		})(),
	},
];
