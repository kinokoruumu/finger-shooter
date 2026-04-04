export type TargetSlotType = "ground" | "ground-gold" | "ground-penalty";

export type CreatorTarget = {
	id: string;
	gx: number;
	gy: number;
	type: TargetSlotType;
	visibleDuration: number;
};

export type CreatorAnimationStep = {
	/** 的ID（出現順） */
	targetIds: string[];
	/** 的の出現間隔(ms) */
	targetInterval: number;
	/** 風船ID（出現順） */
	balloonIds: string[];
	/** 風船の出現間隔(ms) */
	balloonInterval: number;
	/** このステップで列車を出現させるか */
	trainStart: boolean;
};

export type CreatorBalloon = {
	id: string;
	nx: number;
	speed: number;
	color: string;
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

/** 1グループ = 順次実行される1つのまとまり。的・風船・列車を自由に混在可能 */
export type CreatorGroup = {
	id: string;
	targets: CreatorTarget[];
	balloons: CreatorBalloon[];
	train: CreatorTrain | null;
	steps: CreatorAnimationStep[];
	stepDelay: number;
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
