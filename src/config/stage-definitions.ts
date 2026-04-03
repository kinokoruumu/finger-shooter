export type SpawnEntry = {
	/** ステージ開始からの経過時間(ms) */
	time: number;
	type: "balloon" | "ground" | "ground-gold" | "ground-penalty" | "train";
	/** 横位置(正規化 0-1) */
	nx: number;
	/** 縦位置(正規化 0-1) */
	ny?: number;
	/** グリッド座標(0-9=横, 0-4=縦) — 的用 */
	gx?: number;
	gy?: number;
	/** 的の表示時間(秒) */
	visibleDuration?: number;
	/** 列車: 的が上下に動く */
	slotsOscillate?: boolean;
	/** 列車: 移動方向 1=右→左, -1=左→右 */
	direction?: number;
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
	spawns.push({ time: 25000, type: "train", nx: 1.2, ny: 0.4, direction: 1 });

	return spawns.sort((a, b) => a.time - b.time);
})();

/**
 * ラウンド2: 地上的60個(60pt) + 金8個(24pt) + 列車1台(6pt) = MAX 90
 * ペナルティ4個(-3)は回避前提。風船なし。全てグリッド座標指定。
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
		dur = 2.5,
	): G => ({ time, type, gx, gy, dur });

	const entries: G[] = [
		// 0~5s: 通常6個 — 左右に散らす
		g(500, "ground", 2, 2),
		g(1300, "ground", 7, 1),
		g(2100, "ground", 4, 3),
		g(2900, "ground", 1, 0),
		g(3700, "ground", 8, 4),
		g(4500, "ground", 5, 1),

		// 5~10s: 通常6 + 金1 + ペナ1
		g(5500, "ground", 3, 0),
		g(6200, "ground", 6, 3),
		g(6900, "ground", 1, 2),
		g(7000, "ground-gold", 5, 2),
		g(7600, "ground", 8, 1),
		g(8300, "ground", 2, 4),
		g(9000, "ground-penalty", 4, 1),
		g(9500, "ground", 7, 3),

		// 10~15s: 通常8 + 金1 + ペナ1
		g(10200, "ground", 0, 1),
		g(10800, "ground", 9, 3),
		g(11400, "ground", 3, 0),
		g(12000, "ground-gold", 6, 2),
		g(12600, "ground", 1, 4),
		g(13200, "ground", 8, 0),
		g(13800, "ground", 5, 3),
		g(14000, "ground-penalty", 2, 2),
		g(14400, "ground", 7, 1),
		g(14800, "ground", 4, 4),

		// 15~20s: 通常10 + 金2 + ペナ1 — 密度アップ
		g(15200, "ground", 1, 1),
		g(15600, "ground", 6, 0),
		g(16000, "ground", 3, 3),
		g(16400, "ground", 8, 2),
		g(16500, "ground-gold", 5, 1),
		g(16800, "ground", 0, 4),
		g(17200, "ground", 9, 0),
		g(17600, "ground", 2, 2),
		g(18000, "ground-penalty", 7, 3),
		g(18400, "ground", 4, 1),
		g(18800, "ground", 6, 4),
		g(19000, "ground-gold", 1, 0),
		g(19400, "ground", 8, 3),

		// 20~25s: 通常14 + 金2 — ラッシュ前
		g(20200, "ground", 2, 0),
		g(20500, "ground", 5, 2),
		g(20800, "ground", 8, 4),
		g(21100, "ground", 0, 1),
		g(21400, "ground", 7, 0),
		g(21700, "ground", 3, 3),
		g(22000, "ground-gold", 6, 1),
		g(22300, "ground", 1, 4),
		g(22600, "ground", 9, 2),
		g(22900, "ground", 4, 0),
		g(23200, "ground", 7, 3),
		g(23500, "ground", 2, 1),
		g(23800, "ground", 5, 4),
		g(24000, "ground-gold", 8, 0),
		g(24300, "ground", 0, 2),
		g(24600, "ground", 6, 3),

		// 25~27s: ラッシュ — 短いdurで次々出現
		g(25000, "ground", 1, 0, 1.5),
		g(25130, "ground", 4, 2, 1.5),
		g(25260, "ground", 7, 4, 1.5),
		g(25390, "ground", 2, 1, 1.5),
		g(25520, "ground", 9, 3, 1.5),
		g(25650, "ground", 0, 2, 1.5),
		g(25780, "ground", 5, 0, 1.5),
		g(25910, "ground", 8, 1, 1.5),
		g(26040, "ground", 3, 4, 1.5),
		g(26170, "ground", 6, 0, 1.5),
		g(26300, "ground", 1, 3, 1.5),
		g(26430, "ground", 4, 1, 1.5),
		g(26500, "ground-gold", 7, 2, 1.5),
		g(26560, "ground", 9, 4, 1.5),
		g(26690, "ground", 2, 0, 1.5),
		g(26820, "ground-gold", 5, 3, 1.5),
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

	// 27.5s: 列車（左から）
	spawns.push({
		time: 27500,
		type: "train",
		nx: 0,
		ny: 0.4,
		slotsOscillate: true,
		direction: -1,
	});

	return spawns.sort((a, b) => a.time - b.time);
})();

/**
 * ラウンド3: 風船40(40pt) + 通常地上32(32pt) + 金10(30pt) + 列車3台(18pt) = MAX 120
 * ペナルティ6個(-3)は回避前提。高密度・高難度。
 */
const stage3Spawns: SpawnEntry[] = (() => {
	const spawns: SpawnEntry[] = [];
	const balloonXs = [
		0.2, 0.4, 0.6, 0.8, 0.3, 0.5, 0.7, 0.25, 0.55, 0.75, 0.35, 0.65,
	];

	// 風船ヘルパー
	let bIdx = 0;
	const balloon = (time: number) => {
		spawns.push({
			time,
			type: "balloon",
			nx: balloonXs[bIdx++ % balloonXs.length],
		});
	};

	// 的ヘルパー
	const target = (
		time: number,
		type: SpawnEntry["type"],
		gx: number,
		gy: number,
		dur = 2.0,
	) => {
		spawns.push({ time, type, nx: 0, gx, gy, visibleDuration: dur });
	};

	// 列車ヘルパー
	const train = (time: number, ny: number, dir = 1) => {
		spawns.push({
			time,
			type: "train",
			nx: 0,
			ny,
			slotsOscillate: true,
			direction: dir,
		});
	};

	// 0~5s: 風船8 + 通常4 + 列車1(右から)
	for (let i = 0; i < 8; i++) balloon(300 + i * 600);
	target(500, "ground", 2, 1);
	target(1700, "ground", 7, 3);
	target(2900, "ground", 4, 0);
	target(4100, "ground", 1, 4);
	train(3000, 0.3, 1);

	// 5~10s: 風船8 + 通常4 + 金2 + ペナ1
	for (let i = 0; i < 8; i++) balloon(5200 + i * 550);
	target(5500, "ground", 3, 2);
	target(6600, "ground", 8, 0);
	target(6500, "ground-gold", 5, 1);
	target(7700, "ground", 0, 3);
	target(8500, "ground-gold", 6, 4);
	target(7500, "ground-penalty", 9, 2);
	target(8800, "ground", 2, 0);

	// 10~15s: 風船8 + 通常6 + 金2 + 列車1(左から) + ペナ2
	for (let i = 0; i < 8; i++) balloon(10200 + i * 500);
	target(10500, "ground", 1, 1);
	target(11300, "ground", 6, 3);
	target(11500, "ground-gold", 4, 0);
	target(12100, "ground", 8, 2);
	target(12900, "ground", 3, 4);
	target(13700, "ground", 9, 1);
	target(14000, "ground-gold", 5, 3);
	target(12500, "ground-penalty", 0, 0);
	target(14500, "ground-penalty", 7, 4);
	train(12000, 0.5, -1);

	// 15~20s: 風船8 + 通常8 + 金3 + ペナ2
	for (let i = 0; i < 8; i++) balloon(15200 + i * 450);
	target(15500, "ground", 2, 0);
	target(15900, "ground", 7, 2);
	target(16000, "ground-gold", 4, 4);
	target(16300, "ground", 0, 1);
	target(16700, "ground", 9, 3);
	target(17100, "ground", 5, 0);
	target(17000, "ground-penalty", 1, 3);
	target(17500, "ground", 8, 1);
	target(18000, "ground-gold", 3, 2);
	target(18400, "ground", 6, 4);
	target(19000, "ground-penalty", 2, 1);
	target(19200, "ground", 7, 0);
	target(19500, "ground-gold", 4, 3);

	// 20~25s: 風船8 + 通常10 + 金3 + 列車1(右から) + ペナ1
	for (let i = 0; i < 8; i++) balloon(20200 + i * 400);
	target(20500, "ground", 1, 0);
	target(20800, "ground", 6, 2);
	target(21000, "ground-gold", 3, 4);
	target(21200, "ground", 8, 1);
	target(21500, "ground", 0, 3);
	target(21800, "ground", 5, 0);
	target(22100, "ground", 9, 2);
	target(22400, "ground", 2, 4);
	target(23000, "ground-gold", 7, 1);
	target(23300, "ground", 4, 3);
	target(23600, "ground", 1, 2);
	target(24000, "ground", 6, 0);
	target(24500, "ground-gold", 8, 4);
	target(23500, "ground-penalty", 5, 2);
	train(22000, 0.4, 1);

	// 25~30s: フィナーレラッシュ — 的のみ
	target(25500, "ground", 0, 0, 1.5);
	target(25800, "ground", 5, 2, 1.5);
	target(26100, "ground", 9, 4, 1.5);
	target(26400, "ground", 3, 1, 1.5);
	target(26700, "ground", 7, 3, 1.5);
	target(27000, "ground", 1, 2, 1.5);

	return spawns.sort((a, b) => a.time - b.time);
})();

export const STAGES: StageDefinition[] = [
	{ name: "ラウンド1", duration: 30000, maxScore: 36, spawns: stage1Spawns },
	{ name: "ラウンド2", duration: 30000, maxScore: 90, spawns: stage2Spawns },
	{
		name: "ファイナルラウンド",
		duration: 30000,
		maxScore: 120,
		spawns: stage3Spawns,
	},
];
