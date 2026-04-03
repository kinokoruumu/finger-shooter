export type SpawnEntry = {
	/** グループ内の相対時間(ms)。同グループ内で時間順にスポーン */
	time: number;
	/** パターングループ番号。前のグループの的が全消滅してから次へ進む */
	group: number;
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
	/** 列車: 金の的の数 */
	goldSlots?: number;
	/** 列車: ペナルティの的の数 */
	penaltySlots?: number;
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
 * ラウンド1: 風船のみ + 列車。パターンで変化をつける。
 */
const stage1Spawns: SpawnEntry[] = (() => {
	const spawns: SpawnEntry[] = [];

	const b = (time: number, group: number, nx: number) => {
		spawns.push({ time, group, type: "balloon", nx });
	};

	// G0: ゆったり導入（3個、左→中→右）
	b(0, 0, 0.3);
	b(800, 0, 0.5);
	b(1600, 0, 0.7);

	// G1: 左右交互ラッシュ（6個、速い間隔）
	b(0, 1, 0.25);
	b(400, 1, 0.75);
	b(800, 1, 0.3);
	b(1200, 1, 0.7);
	b(1600, 1, 0.35);
	b(2000, 1, 0.65);

	// G2: 中央に集中（4個、同時に近い）
	b(0, 2, 0.4);
	b(200, 2, 0.5);
	b(400, 2, 0.6);
	b(600, 2, 0.45);

	// G3: 散発（3個、間隔広め）
	b(0, 3, 0.2);
	b(1200, 3, 0.8);
	b(2400, 3, 0.5);

	// G4: 端から端へスイープ（5個）
	b(0, 4, 0.2);
	b(500, 4, 0.35);
	b(1000, 4, 0.5);
	b(1500, 4, 0.65);
	b(2000, 4, 0.8);

	// G5: 同時3個（横に並ぶ）
	b(0, 5, 0.3);
	b(0, 5, 0.5);
	b(0, 5, 0.7);

	// G6: ジグザグ（4個）
	b(0, 6, 0.25);
	b(500, 6, 0.65);
	b(1000, 6, 0.35);
	b(1500, 6, 0.75);

	// G7: 両端同時 → 中央（3個）
	b(0, 7, 0.2);
	b(0, 7, 0.8);
	b(800, 7, 0.5);

	// G8: 列車
	spawns.push({
		time: 0,
		group: 8,
		type: "train",
		nx: 0,
		direction: 1,
		trainLane: 1,
		trainSpeed: 1.5,
		goldSlots: 1,
		penaltySlots: 0,
	});

	return spawns;
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

/**
 * パターン内のground的をランダムに金/ペナルティに差し替える。
 * 元々gold/penaltyの的はそのまま。groundの的だけが対象。
 */
const sprinkle = (
	entries: TargetEntry[],
	goldCount: number,
	penaltyCount: number,
): TargetEntry[] => {
	const result = [...entries];
	// groundの的のインデックスを集める
	const groundIndices = result
		.map((e, i) => (e.type === "ground" ? i : -1))
		.filter((i) => i >= 0);

	// シャッフル
	for (let i = groundIndices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[groundIndices[i], groundIndices[j]] = [groundIndices[j], groundIndices[i]];
	}

	// 先頭から金、次にペナルティを割り当て
	let idx = 0;
	for (let g = 0; g < goldCount && idx < groundIndices.length; g++, idx++) {
		result[groundIndices[idx]] = {
			...result[groundIndices[idx]],
			type: "ground-gold",
		};
	}
	for (let p = 0; p < penaltyCount && idx < groundIndices.length; p++, idx++) {
		result[groundIndices[idx]] = {
			...result[groundIndices[idx]],
			type: "ground-penalty",
		};
	}
	return result;
};

/** TargetEntryをSpawnEntryに変換（group付き） */
const toSpawns = (entries: TargetEntry[], group: number): SpawnEntry[] =>
	entries.map((e) => ({
		time: e.time,
		group,
		type: e.type,
		nx: 0,
		gx: e.gx,
		gy: e.gy,
		visibleDuration: e.dur,
	}));

/** 横一列に同時出現（8個→6s） */
const horizontalLine = (
	time: number,
	gy: number,
	type: SpawnEntry["type"] = "ground",
	dur = 6.0,
): TargetEntry[] =>
	Array.from({ length: 8 }, (_, i) => t(time, type, i, gy, dur));

/** 縦一列に同時出現（4個→4s） */
const verticalLine = (
	time: number,
	gx: number,
	type: SpawnEntry["type"] = "ground",
	dur = 4.0,
): TargetEntry[] =>
	Array.from({ length: 4 }, (_, i) => t(time, type, gx, i, dur));

/** 外周を時計回りに順番出現（20個→各5s） */
const borderClockwise = (
	startTime: number,
	interval: number,
	type: SpawnEntry["type"] = "ground",
	dur = 5.0,
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

/** 対角線（左上→右下、7個→5s） */
const diagonal = (
	startTime: number,
	interval: number,
	type: SpawnEntry["type"] = "ground",
	dur = 5.0,
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

/** V字パターン（8個→5.5s） */
const vShape = (
	time: number,
	type: SpawnEntry["type"] = "ground",
	dur = 5.5,
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

/** クロス（十字）パターン（11個→6s） */
const crossPattern = (
	time: number,
	type: SpawnEntry["type"] = "ground",
	dur = 6.0,
): TargetEntry[] => [
	// 横線 (gy=2)
	...Array.from({ length: 8 }, (_, i) => t(time, type, i, 2, dur)),
	// 縦線 (gx=4) — 横線と重複するgy=2は除外
	t(time, type, 4, 0, dur),
	t(time, type, 4, 1, dur),
	t(time, type, 4, 3, dur),
];

/**
 * ラウンド2: パターン重視。風船なし。グループ制で前のパターン完了後に次が出る。
 */
const stage2Spawns: SpawnEntry[] = (() => {
	const spawns: SpawnEntry[] = [];

	// G0: 横一列（金1）
	spawns.push(...toSpawns(sprinkle(horizontalLine(0, 1), 1, 0), 0));

	// G1: V字（金1）
	spawns.push(...toSpawns(sprinkle(vShape(0), 1, 0), 1));

	// G2: 縦2列（金1）
	spawns.push(
		...toSpawns(
			sprinkle([...verticalLine(0, 2), ...verticalLine(0, 5)], 1, 0),
			2,
		),
	);

	// G3: 対角線（金1, ペナ1）
	spawns.push(...toSpawns(sprinkle(diagonal(0, 300), 1, 1), 3));

	// G4: 横一列（金2）
	spawns.push(...toSpawns(sprinkle(horizontalLine(0, 2), 2, 0), 4));

	// G5: 十字（金1, ペナ1）
	spawns.push(...toSpawns(sprinkle(crossPattern(0), 1, 1), 5));

	// G6: 外周ぐるっと（金2, ペナ1）
	spawns.push(...toSpawns(sprinkle(borderClockwise(0, 200), 2, 1), 6));

	// G7: ラッシュ（金1, ペナ1）
	spawns.push(
		...toSpawns(
			sprinkle(
				[
					t(0, "ground", 1, 0, 4.0),
					t(0, "ground", 3, 1, 4.0),
					t(0, "ground", 5, 2, 4.0),
					t(0, "ground", 7, 3, 4.0),
					t(500, "ground", 0, 3, 4.0),
					t(500, "ground", 6, 1, 4.0),
					t(1000, "ground", 2, 2, 4.0),
					t(1000, "ground", 5, 0, 4.0),
				],
				1,
				1,
			),
			7,
		),
	);

	// G8: 列車（左から）
	spawns.push({
		time: 0,
		group: 8,
		type: "train",
		nx: 0,
		slotsOscillate: true,
		direction: -1,
		trainLane: 1,
		trainSpeed: 2.0,
		goldSlots: 2,
		penaltySlots: 1,
	});

	return spawns;
})();

/**
 * ファイナルラウンド: 風船+的+列車の混合、パターン重視。グループ制。
 */
const stage3Spawns: SpawnEntry[] = (() => {
	const spawns: SpawnEntry[] = [];
	const bxs = [0.25, 0.45, 0.65, 0.75, 0.35, 0.55, 0.3, 0.6, 0.4, 0.7];
	let bi = 0;

	const balloons = (group: number, count: number, interval: number) => {
		for (let i = 0; i < count; i++) {
			spawns.push({
				time: i * interval,
				group,
				type: "balloon",
				nx: bxs[bi++ % bxs.length],
			});
		}
	};

	// G0: 風船5 + V字（金2）
	balloons(0, 5, 800);
	spawns.push(...toSpawns(sprinkle(vShape(0), 2, 0), 0));

	// G1: 列車（右から）
	spawns.push({
		time: 0,
		group: 1,
		type: "train",
		nx: 0,
		slotsOscillate: true,
		direction: 1,
		trainLane: 0,
		trainSpeed: 2.5,
		goldSlots: 2,
		penaltySlots: 1,
	});

	// G2: 風船3 + 対角線（金2, ペナ1）
	balloons(2, 3, 1000);
	spawns.push(...toSpawns(sprinkle(diagonal(0, 300), 2, 1), 2));

	// G3: 横一列（金1, ペナ2）
	spawns.push(...toSpawns(sprinkle(horizontalLine(0, 1), 1, 2), 3));

	// G4: 風船5 + 縦列+散らし（金2, ペナ2）
	balloons(4, 5, 700);
	spawns.push(
		...toSpawns(
			sprinkle(
				[
					...verticalLine(0, 3),
					t(0, "ground", 5, 0, 4.0),
					t(0, "ground", 5, 3, 4.0),
				],
				2,
				2,
			),
			4,
		),
	);

	// G5: 列車（左から、速い）
	spawns.push({
		time: 0,
		group: 5,
		type: "train",
		nx: 0,
		slotsOscillate: true,
		direction: -1,
		trainLane: 0,
		trainSpeed: 3.0,
		goldSlots: 2,
		penaltySlots: 1,
	});

	// G6: 外周 + 風船4（金3, ペナ2）
	balloons(6, 4, 800);
	spawns.push(...toSpawns(sprinkle(borderClockwise(0, 200), 3, 2), 6));

	// G7: クロス（金2, ペナ2）
	spawns.push(...toSpawns(sprinkle(crossPattern(0), 2, 2), 7));

	// G8: 風船3 + 散らし8個（金3, ペナ2）
	balloons(8, 3, 600);
	spawns.push(
		...toSpawns(
			sprinkle(
				[
					t(0, "ground", 1, 0, 5.0),
					t(0, "ground", 6, 0, 5.0),
					t(0, "ground", 3, 0, 5.0),
					t(0, "ground", 1, 3, 5.0),
					t(0, "ground", 6, 3, 5.0),
					t(0, "ground", 4, 3, 5.0),
					t(0, "ground", 3, 1, 5.0),
					t(0, "ground", 4, 2, 5.0),
				],
				3,
				2,
			),
			8,
		),
	);

	// G9: フィナーレ — 横一列2段（金3, ペナ2）
	spawns.push(
		...toSpawns(
			sprinkle(
				[
					...horizontalLine(0, 0, "ground", 5.0),
					...horizontalLine(500, 3, "ground", 5.0),
				],
				3,
				2,
			),
			9,
		),
	);

	return spawns;
})();

export const STAGES: StageDefinition[] = [
	{ name: "ラウンド1", duration: 30000, maxScore: 43, spawns: stage1Spawns },
	{ name: "ラウンド2", duration: 30000, maxScore: 100, spawns: stage2Spawns },
	{
		name: "ファイナルラウンド",
		duration: 30000,
		maxScore: 120,
		spawns: stage3Spawns,
	},
];
