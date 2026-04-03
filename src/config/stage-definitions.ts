export type SpawnEntry = {
	/** ステージ開始からの経過時間(ms) */
	time: number;
	type: "balloon" | "ground" | "ground-gold" | "ground-penalty" | "train";
	/** 横位置(正規化 0-1) */
	nx: number;
	/** 縦位置(正規化 0-1) */
	ny?: number;
	/** グリッド座標(0-7=横, 0-3=縦) — 的用 */
	gx?: number;
	gy?: number;
	/** 的の表示時間(秒) */
	visibleDuration?: number;
	/** 列車: 的が上下に動く */
	slotsOscillate?: boolean;
	/** 列車: 移動方向 1=右→左, -1=左→右 */
	direction?: number;
	/** 列車: レーン 0=上, 1=中, 2=下 */
	trainLane?: number;
};

export type StageDefinition = {
	name: string;
	/** ステージ時間(ms) */
	duration: number;
	maxScore: number;
	spawns: SpawnEntry[];
};

// ステージ間インターバル(ms)
export const STAGE_TRANSITION_DURATION = 3000;

/**
 * ラウンド1: 風船30個(30pt) + 列車1台(3+3=6pt) = MAX 36
 */
const stage1Spawns: SpawnEntry[] = (() => {
	const spawns: SpawnEntry[] = [];
	const balloonXs = [
		0.3, 0.7, 0.5, 0.2, 0.8, 0.4, 0.6, 0.35, 0.65, 0.25, 0.75, 0.45,
	];

	// 0~14s: 前半15個 (1s間隔、ゆったり)
	for (let i = 0; i < 15; i++) {
		spawns.push({
			time: 500 + i * 1000,
			type: "balloon",
			nx: balloonXs[i % balloonXs.length],
		});
	}

	// 15~24s: 後半15個 (0.65s間隔、ペースアップ)
	for (let i = 0; i < 15; i++) {
		spawns.push({
			time: 15500 + i * 650,
			type: "balloon",
			nx: balloonXs[(i + 5) % balloonXs.length],
		});
	}

	// 25s: 列車1台（終盤、右から）
	spawns.push({
		time: 25000,
		type: "train",
		nx: 0,
		direction: 1,
		trainLane: 1,
	});

	return spawns.sort((a, b) => a.time - b.time);
})();

/**
 * ラウンド2: 通常25(25pt) + 金5(15pt) + 列車1台(6pt) = MAX 46
 * ペナルティ2個(-3)は回避前提。風船なし。全てグリッド座標指定。
 */
const stage2Spawns: SpawnEntry[] = (() => {
	const spawns: SpawnEntry[] = [];
	type G = {
		time: number;
		type: SpawnEntry["type"];
		gx: number;
		gy: number;
		dur?: number;
	};
	const g = (
		time: number,
		type: SpawnEntry["type"],
		gx: number,
		gy: number,
		dur = 3.5,
	): G => ({ time, type, gx, gy, dur });

	const entries: G[] = [
		// 0~7s: ゆったり導入 — 通常4個
		g(500, "ground", 3, 2),
		g(2000, "ground", 7, 1),
		g(3500, "ground", 1, 3),
		g(5000, "ground", 7, 0),

		// 7~14s: 通常5 + 金1 + ペナ1
		g(7000, "ground", 5, 3),
		g(8200, "ground", 2, 1),
		g(9000, "ground-gold", 6, 2),
		g(9800, "ground", 0, 3),
		g(10800, "ground", 7, 0),
		g(11800, "ground-penalty", 4, 2),
		g(12500, "ground", 7, 3),

		// 14~20s: 通常6 + 金2 — 少しペースアップ
		g(14000, "ground", 1, 0),
		g(15000, "ground", 7, 3),
		g(15800, "ground-gold", 5, 1),
		g(16600, "ground", 3, 3),
		g(17400, "ground", 6, 0),
		g(18200, "ground", 0, 2),
		g(19000, "ground-gold", 7, 3),
		g(19800, "ground", 2, 1),

		// 20~25s: 通常6 + 金1 + ペナ1
		g(20500, "ground", 4, 0),
		g(21200, "ground", 7, 2),
		g(21900, "ground", 1, 3),
		g(22600, "ground-gold", 5, 3),
		g(23300, "ground", 7, 1),
		g(24000, "ground-penalty", 3, 0),
		g(24500, "ground", 6, 3),
		g(25000, "ground", 0, 1),

		// 25~27s: ラッシュ — dur短め
		g(25500, "ground", 2, 3, 2.5),
		g(25900, "ground", 7, 0, 2.5),
		g(26300, "ground", 4, 3, 2.5),
		g(26700, "ground-gold", 7, 2, 2.5),
		g(27100, "ground", 1, 1, 2.5),
	];

	for (const e of entries) {
		spawns.push({
			time: e.time,
			type: e.type,
			nx: 0,
			gx: e.gx,
			gy: e.gy,
			visibleDuration: e.dur,
		});
	}

	// 28s: 列車（左から、中レーン）
	spawns.push({
		time: 28000,
		type: "train",
		nx: 0,
		slotsOscillate: true,
		direction: -1,
		trainLane: 1,
	});

	return spawns.sort((a, b) => a.time - b.time);
})();

/**
 * ファイナルラウンド: 風船20(20pt) + 通常15(15pt) + 金5(15pt) + 列車2台(12pt) = MAX 62
 * ペナルティ2個(-3)は回避前提。
 */
const stage3Spawns: SpawnEntry[] = (() => {
	const spawns: SpawnEntry[] = [];
	const balloonXs = [0.25, 0.45, 0.65, 0.75, 0.35, 0.55, 0.3, 0.6, 0.4, 0.7];

	let bIdx = 0;
	const balloon = (time: number) => {
		spawns.push({
			time,
			type: "balloon",
			nx: balloonXs[bIdx++ % balloonXs.length],
		});
	};

	const target = (
		time: number,
		type: SpawnEntry["type"],
		gx: number,
		gy: number,
		dur = 3.0,
	) => {
		spawns.push({ time, type, nx: 0, gx, gy, visibleDuration: dur });
	};

	const train = (time: number, lane: number, dir = 1) => {
		spawns.push({
			time,
			type: "train",
			nx: 0,
			slotsOscillate: true,
			direction: dir,
			trainLane: lane,
		});
	};

	// 0~7s: 風船5 + 通常3 + 列車1(右から)
	for (let i = 0; i < 5; i++) balloon(500 + i * 1200);
	target(1000, "ground", 3, 1);
	target(2500, "ground", 6, 2);
	target(4000, "ground", 1, 0);
	train(3500, 0, 1);

	// 7~14s: 風船5 + 通常4 + 金2 + ペナ1
	for (let i = 0; i < 5; i++) balloon(7200 + i * 1100);
	target(7500, "ground", 5, 2);
	target(8800, "ground", 2, 0);
	target(9500, "ground-gold", 4, 1);
	target(10500, "ground", 7, 3);
	target(11500, "ground", 1, 2);
	target(12000, "ground-gold", 6, 0);
	target(13000, "ground-penalty", 3, 3);

	// 14~21s: 風船5 + 通常4 + 金2 + 列車1(左から) + ペナ1
	for (let i = 0; i < 5; i++) balloon(14200 + i * 1000);
	target(14500, "ground", 5, 0);
	target(15500, "ground", 2, 2);
	target(16500, "ground-gold", 7, 1);
	target(17500, "ground", 4, 3);
	target(18500, "ground", 1, 1);
	target(19500, "ground-gold", 6, 2);
	target(20000, "ground-penalty", 3, 0);
	train(16000, 2, -1);

	// 21~28s: 風船5 + 通常4 + 金1
	for (let i = 0; i < 5; i++) balloon(21200 + i * 900);
	target(21500, "ground", 2, 1);
	target(22500, "ground", 5, 3);
	target(23500, "ground", 7, 0);
	target(24500, "ground", 3, 2);
	target(25500, "ground-gold", 6, 1, 2.5);

	// 26~28s: フィナーレ — 的3つ
	target(26000, "ground", 1, 0, 2.5);
	target(26800, "ground", 4, 2, 2.5);
	target(27500, "ground", 7, 3, 2.5);

	return spawns.sort((a, b) => a.time - b.time);
})();

export const STAGES: StageDefinition[] = [
	{ name: "ラウンド1", duration: 30000, maxScore: 36, spawns: stage1Spawns },
	{ name: "ラウンド2", duration: 30000, maxScore: 46, spawns: stage2Spawns },
	{
		name: "ファイナルラウンド",
		duration: 30000,
		maxScore: 62,
		spawns: stage3Spawns,
	},
];
