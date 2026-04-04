export type TargetSlotType = "ground" | "ground-gold" | "ground-penalty";

export type CreatorTarget = {
	id: string;
	gx: number;
	gy: number;
	type: TargetSlotType;
	visibleDuration: number;
};

export type CreatorAnimationStep = {
	targetIds: string[];
	interval: number;
};

export type CreatorBalloon = {
	id: string;
	nx: number;
	speed: number;
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

export type CreatorTargetGroup = {
	id: string;
	type: "targets";
	targets: CreatorTarget[];
	steps: CreatorAnimationStep[];
	stepDelay: number;
};

export type CreatorBalloonGroup = {
	id: string;
	type: "balloons";
	balloons: CreatorBalloon[];
	steps: CreatorAnimationStep[];
	stepDelay: number;
};

export type CreatorTrainGroup = {
	id: string;
	type: "train";
	train: CreatorTrain;
};

export type CreatorGroup =
	| CreatorTargetGroup
	| CreatorBalloonGroup
	| CreatorTrainGroup;

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
