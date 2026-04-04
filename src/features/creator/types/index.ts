export type TargetSlotType = "ground" | "ground-gold" | "ground-penalty";

export type CreatorTarget = {
	id: string;
	gx: number;
	gy: number;
	type: TargetSlotType;
	visibleDuration: number;
};

/** 的のステップ（配置+出現順序） */
export type CreatorTargetStep = {
	targetIds: string[];
	interval: number;
	/** ステップの開始タイミング(ms) */
	startTime: number;
};

/** 風船のタイムラインエントリ。N個が同時出現 */
export type CreatorBalloonEntry = {
	id: string;
	/** 出現タイミング(ms) */
	time: number;
	/** 同時出現する個数 */
	count: number;
	/** 横位置パターン */
	spread: "left" | "center" | "right" | "random";
};

export type TrainSlotType = "normal" | "gold" | "penalty";

export type CreatorTrainSlot = {
	index: number;
	type: TrainSlotType;
};

export type CreatorTrain = {
	direction: 1 | -1;
	speed: number;
	slotsOscillate: boolean;
	slots: CreatorTrainSlot[];
};

/** 1グループ = 順次実行される1つのまとまり */
export type CreatorGroup = {
	id: string;
	/** 的 */
	targets: CreatorTarget[];
	targetSteps: CreatorTargetStep[];
	/** 風船 */
	balloonEntries: CreatorBalloonEntry[];
	/** 列車 */
	train: CreatorTrain | null;
	/** 列車の出現タイミング(ms)。null = 出現しない */
	trainStartTime: number | null;
};

export type CreatorStage = {
	id: string;
	name: string;
	groups: CreatorGroup[];
	createdAt: number;
	updatedAt: number;
};

export type RoundConfig = {
	round1: string | null;
	round2: string | null;
	round3: string | null;
};
