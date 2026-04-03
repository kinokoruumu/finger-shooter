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
 * ペナルティ4個(-3)は回避前提
 * 風船なし
 * 的は回転しながら出現(コンポーネント側で処理)
 */
const stage2Spawns: SpawnEntry[] = (() => {
	const spawns: SpawnEntry[] = [];
	const xs = [0.2, 0.35, 0.5, 0.65, 0.8, 0.25, 0.4, 0.55, 0.7, 0.85, 0.3, 0.6];

	let idx = 0;
	const add = (time: number, type: SpawnEntry["type"]) => {
		spawns.push({ time, type, nx: xs[idx % xs.length] });
		idx++;
	};

	// 0~5s: 通常6個 (0.8s間隔)
	for (let i = 0; i < 6; i++) add(500 + i * 800, "ground");

	// 5~10s: 通常6 + 金1 + ペナ1 = 8個
	for (let i = 0; i < 6; i++) add(5500 + i * 700, "ground");
	add(7000, "ground-gold");
	add(9000, "ground-penalty");

	// 10~15s: 通常8 + 金1 + ペナ1 = 10個
	for (let i = 0; i < 8; i++) add(10200 + i * 600, "ground");
	add(12000, "ground-gold");
	add(14000, "ground-penalty");

	// 15~20s: 通常10 + 金2 + ペナ1 = 13個
	for (let i = 0; i < 10; i++) add(15200 + i * 500, "ground");
	add(16500, "ground-gold");
	add(19000, "ground-gold");
	add(18000, "ground-penalty");

	// 20~25s: 通常14 + 金2 = 16個
	for (let i = 0; i < 14; i++) add(20200 + i * 350, "ground");
	add(22000, "ground-gold");
	add(24000, "ground-gold");

	// 25~27s: 通常16 + 金2 + ペナ1 = ラッシュ
	for (let i = 0; i < 16; i++) add(25000 + i * 130, "ground");
	add(25500, "ground-gold");
	add(26500, "ground-gold");
	add(26000, "ground-penalty");

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
 * ペナルティ6個(-3)は回避前提
 * 高密度・高難度
 */
const stage3Spawns: SpawnEntry[] = (() => {
	const spawns: SpawnEntry[] = [];
	const xs = [0.2, 0.4, 0.6, 0.8, 0.3, 0.5, 0.7, 0.25, 0.55, 0.75, 0.35, 0.65];

	let idx = 0;
	const nx = () => xs[idx++ % xs.length];

	// 0~5s: 風船8 + 通常的4 + 列車1
	for (let i = 0; i < 8; i++)
		spawns.push({ time: 300 + i * 600, type: "balloon", nx: nx() });
	for (let i = 0; i < 4; i++)
		spawns.push({ time: 500 + i * 1200, type: "ground", nx: nx() });
	spawns.push({
		time: 3000,
		type: "train",
		nx: 1.2,
		ny: 0.3,
		slotsOscillate: true,
	});

	// 5~10s: 風船8 + 通常4 + 金2 + ペナ1
	for (let i = 0; i < 8; i++)
		spawns.push({ time: 5200 + i * 550, type: "balloon", nx: nx() });
	for (let i = 0; i < 4; i++)
		spawns.push({ time: 5500 + i * 1100, type: "ground", nx: nx() });
	spawns.push({ time: 6500, type: "ground-gold", nx: nx() });
	spawns.push({ time: 8500, type: "ground-gold", nx: nx() });
	spawns.push({ time: 7500, type: "ground-penalty", nx: nx() });

	// 10~15s: 風船8 + 通常6 + 金2 + 列車1 + ペナ2
	for (let i = 0; i < 8; i++)
		spawns.push({ time: 10200 + i * 500, type: "balloon", nx: nx() });
	for (let i = 0; i < 6; i++)
		spawns.push({ time: 10500 + i * 800, type: "ground", nx: nx() });
	spawns.push({ time: 11500, type: "ground-gold", nx: nx() });
	spawns.push({ time: 14000, type: "ground-gold", nx: nx() });
	spawns.push({
		time: 12000,
		type: "train",
		nx: 1.2,
		ny: 0.5,
		slotsOscillate: true,
	});
	spawns.push({ time: 12500, type: "ground-penalty", nx: nx() });
	spawns.push({ time: 14500, type: "ground-penalty", nx: nx() });

	// 15~20s: 風船8 + 通常8 + 金3 + ペナ2
	for (let i = 0; i < 8; i++)
		spawns.push({ time: 15200 + i * 450, type: "balloon", nx: nx() });
	for (let i = 0; i < 8; i++)
		spawns.push({ time: 15500 + i * 600, type: "ground", nx: nx() });
	spawns.push({ time: 16000, type: "ground-gold", nx: nx() });
	spawns.push({ time: 18000, type: "ground-gold", nx: nx() });
	spawns.push({ time: 19500, type: "ground-gold", nx: nx() });
	spawns.push({ time: 17000, type: "ground-penalty", nx: nx() });
	spawns.push({ time: 19000, type: "ground-penalty", nx: nx() });

	// 20~25s: 風船8 + 通常10 + 金3 + 列車1 + ペナ1
	for (let i = 0; i < 8; i++)
		spawns.push({ time: 20200 + i * 400, type: "balloon", nx: nx() });
	for (let i = 0; i < 10; i++)
		spawns.push({ time: 20500 + i * 500, type: "ground", nx: nx() });
	spawns.push({ time: 21000, type: "ground-gold", nx: nx() });
	spawns.push({ time: 23000, type: "ground-gold", nx: nx() });
	spawns.push({ time: 24500, type: "ground-gold", nx: nx() });
	spawns.push({
		time: 22000,
		type: "train",
		nx: 1.2,
		ny: 0.4,
		slotsOscillate: true,
	});
	spawns.push({ time: 23500, type: "ground-penalty", nx: nx() });

	// 25~30s: フィナーレラッシュ
	for (let i = 0; i < 6; i++)
		spawns.push({ time: 25500 + i * 400, type: "ground", nx: nx() });

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
