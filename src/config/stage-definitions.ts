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
	/** 列車: 速度倍率（デフォルト1.0） */
	trainSpeed?: number;
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

	// 25s: 列車1台（終盤、右から、ゆっくり）
	spawns.push({
		time: 25000,
		type: "train",
		nx: 0,
		direction: 1,
		trainLane: 1,
		trainSpeed: 1.5,
	});

	return spawns.sort((a, b) => a.time - b.time);
})();

// --- パターンヘルパー ---
type TargetEntry = {
	time: number;
	type: SpawnEntry["type"];
	gx: number;
	gy: number;
	dur: number;
};

const t = (
	time: number,
	type: SpawnEntry["type"],
	gx: number,
	gy: number,
	dur = 3.5,
): TargetEntry => ({ time, type, gx, gy, dur });

/** 横一列に同時出現 */
const horizontalLine = (
	time: number,
	gy: number,
	type: SpawnEntry["type"] = "ground",
	dur = 3.0,
): TargetEntry[] =>
	Array.from({ length: 8 }, (_, i) => t(time, type, i, gy, dur));

/** 縦一列に同時出現 */
const verticalLine = (
	time: number,
	gx: number,
	type: SpawnEntry["type"] = "ground",
	dur = 3.0,
): TargetEntry[] =>
	Array.from({ length: 4 }, (_, i) => t(time, type, gx, i, dur));

/** 外周を時計回りに順番出現 */
const borderClockwise = (
	startTime: number,
	interval: number,
	type: SpawnEntry["type"] = "ground",
	dur = 2.5,
): TargetEntry[] => {
	const coords: [number, number][] = [];
	// 上辺: 左→右
	for (let x = 0; x <= 7; x++) coords.push([x, 0]);
	// 右辺: 上→下
	for (let y = 1; y <= 3; y++) coords.push([7, y]);
	// 下辺: 右→左
	for (let x = 6; x >= 0; x--) coords.push([x, 3]);
	// 左辺: 下→上
	for (let y = 2; y >= 1; y--) coords.push([0, y]);

	return coords.map(([gx, gy], i) =>
		t(startTime + i * interval, type, gx, gy, dur),
	);
};

/** 対角線（左上→右下） */
const diagonal = (
	startTime: number,
	interval: number,
	type: SpawnEntry["type"] = "ground",
	dur = 3.0,
): TargetEntry[] => {
	const entries: TargetEntry[] = [];
	for (let i = 0; i < 4; i++) {
		entries.push(t(startTime + i * interval, type, i * 2, i, dur));
		if (i * 2 + 1 <= 7) {
			entries.push(
				t(startTime + i * interval + interval / 2, type, i * 2 + 1, i, dur),
			);
		}
	}
	return entries;
};

/** V字パターン */
const vShape = (
	time: number,
	type: SpawnEntry["type"] = "ground",
	dur = 3.0,
): TargetEntry[] => [
	t(time, type, 0, 0, dur),
	t(time, type, 7, 0, dur),
	t(time + 200, type, 1, 1, dur),
	t(time + 200, type, 6, 1, dur),
	t(time + 400, type, 2, 2, dur),
	t(time + 400, type, 5, 2, dur),
	t(time + 600, type, 3, 3, dur),
	t(time + 600, type, 4, 3, dur),
];

/** クロス（十字）パターン */
const crossPattern = (
	time: number,
	type: SpawnEntry["type"] = "ground",
	dur = 3.0,
): TargetEntry[] => [
	// 横線 (gy=2)
	...Array.from({ length: 8 }, (_, i) => t(time, type, i, 2, dur)),
	// 縦線 (gx=4) — 横線と重複するgy=2は除外
	t(time, type, 4, 0, dur),
	t(time, type, 4, 1, dur),
	t(time, type, 4, 3, dur),
];

const entriesToSpawns = (entries: TargetEntry[]): SpawnEntry[] =>
	entries.map((e) => ({
		time: e.time,
		type: e.type,
		nx: 0,
		gx: e.gx,
		gy: e.gy,
		visibleDuration: e.dur,
	}));

/**
 * ラウンド2: パターン重視。風船なし。
 */
const stage2Spawns: SpawnEntry[] = (() => {
	const entries: TargetEntry[] = [
		// 0~3s: 導入 — 散発的に4つ
		t(500, "ground", 2, 1),
		t(1500, "ground", 5, 2),
		t(2500, "ground", 1, 0),
		t(3500, "ground", 6, 3),

		// 4s: 横一列（gy=1）— 8個同時！
		...horizontalLine(4500, 1, "ground", 2.5),

		// 7s: V字パターン — 8個
		...vShape(7000, "ground", 3.0),

		// 10s: 対角線 — 7個
		...diagonal(10000, 300, "ground", 3.0),

		// 13s: 金の横一列（gy=2）
		...horizontalLine(13000, 2, "ground-gold", 3.0),

		// 15s: ペナルティ注意！十字 — 通常10 + ペナ中央
		t(15500, "ground", 0, 2, 3.0),
		t(15500, "ground", 1, 2, 3.0),
		t(15500, "ground", 2, 2, 3.0),
		t(15500, "ground", 3, 2, 3.0),
		t(15500, "ground-penalty", 4, 2, 3.0),
		t(15500, "ground", 5, 2, 3.0),
		t(15500, "ground", 6, 2, 3.0),
		t(15500, "ground", 7, 2, 3.0),
		t(15500, "ground", 4, 0, 3.0),
		t(15500, "ground", 4, 1, 3.0),
		t(15500, "ground", 4, 3, 3.0),

		// 19s: 外周ぐるっと — 20個
		...borderClockwise(19000, 120, "ground", 2.0),

		// 22s: 縦2列同時 + 金
		...verticalLine(22500, 2, "ground", 3.0),
		...verticalLine(22500, 5, "ground", 3.0),
		t(22500, "ground-gold", 3, 1, 3.0),
		t(22500, "ground-gold", 4, 2, 3.0),

		// 25s: ペナルティ混在ラッシュ
		t(25500, "ground", 1, 0, 2.5),
		t(25500, "ground", 3, 1, 2.5),
		t(25500, "ground-penalty", 5, 2, 2.5),
		t(25500, "ground", 7, 3, 2.5),
		t(26000, "ground", 0, 3, 2.5),
		t(26000, "ground-gold", 4, 0, 2.5),
		t(26000, "ground", 6, 1, 2.5),
		t(26500, "ground", 2, 2, 2.5),
		t(26500, "ground", 5, 0, 2.5),
	];

	const spawns = entriesToSpawns(entries);

	// 28s: 列車（左から）
	spawns.push({
		time: 28000,
		type: "train",
		nx: 0,
		slotsOscillate: true,
		direction: -1,
		trainLane: 1,
		trainSpeed: 2.0,
	});

	return spawns.sort((a, b) => a.time - b.time);
})();

/**
 * ファイナルラウンド: 風船+的+列車の混合、パターン重視。
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

	const train = (time: number, dir = 1, speed = 2.5) => {
		spawns.push({
			time,
			type: "train",
			nx: 0,
			slotsOscillate: true,
			direction: dir,
			trainLane: 0,
			trainSpeed: speed,
		});
	};

	const entries: TargetEntry[] = [];

	// 0~4s: 風船5 + V字パターンで開幕
	for (let i = 0; i < 5; i++) balloon(300 + i * 800);
	entries.push(...vShape(1000, "ground", 3.5));

	// 5s: 列車（右から）
	train(5000, 1, 2.0);

	// 6~9s: 風船3 + 対角線パターン
	for (let i = 0; i < 3; i++) balloon(6000 + i * 1000);
	entries.push(...diagonal(6500, 400, "ground", 3.0));

	// 10s: 金の横一列！(gy=1)
	entries.push(...horizontalLine(10000, 1, "ground-gold", 3.0));

	// 13s: 風船5 + ペナルティ注意の縦列
	for (let i = 0; i < 5; i++) balloon(13000 + i * 700);
	entries.push(...verticalLine(13500, 3, "ground", 3.0));
	entries.push(t(13500, "ground-penalty", 4, 1, 3.0));
	entries.push(t(13500, "ground-penalty", 4, 2, 3.0));

	// 16s: 列車（左から、速い）
	train(16500, -1, 3.0);

	// 17~20s: 外周パターン + 風船
	for (let i = 0; i < 4; i++) balloon(17000 + i * 800);
	entries.push(...borderClockwise(17500, 100, "ground", 2.0));

	// 21s: クロスパターン（中央に金）
	const cross = crossPattern(21000, "ground", 3.0);
	// 中央を金に差し替え
	entries.push(
		...cross.map((e) =>
			e.gx === 4 && e.gy === 2
				? t(e.time, "ground-gold", e.gx, e.gy, e.dur)
				: e,
		),
	);

	// 23s: 風船ラッシュ
	for (let i = 0; i < 5; i++) balloon(23000 + i * 500);

	// 24s: 4つ同時出現（四隅）+ 金中央
	entries.push(
		t(24500, "ground", 0, 0, 2.5),
		t(24500, "ground", 7, 0, 2.5),
		t(24500, "ground", 0, 3, 2.5),
		t(24500, "ground", 7, 3, 2.5),
		t(24500, "ground-gold", 3, 1, 2.5),
		t(24500, "ground-gold", 4, 2, 2.5),
	);

	// 26s: フィナーレ — 横一列ラッシュ
	entries.push(...horizontalLine(26500, 0, "ground", 2.5));
	entries.push(...horizontalLine(27000, 3, "ground", 2.5));

	spawns.push(...entriesToSpawns(entries));

	return spawns.sort((a, b) => a.time - b.time);
})();

export const STAGES: StageDefinition[] = [
	{ name: "ラウンド1", duration: 30000, maxScore: 36, spawns: stage1Spawns },
	{ name: "ラウンド2", duration: 30000, maxScore: 100, spawns: stage2Spawns },
	{
		name: "ファイナルラウンド",
		duration: 30000,
		maxScore: 120,
		spawns: stage3Spawns,
	},
];
