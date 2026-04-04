export type TargetSlotType = "ground" | "ground-gold" | "ground-penalty";

export type CreatorTarget = {
	gx: number;
	gy: number;
	type: TargetSlotType;
	delay: number;
	visibleDuration: number;
};

export type CreatorBalloon = {
	nx: number;
	delay: number;
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

export type CreatorGroupType = "targets" | "balloons" | "train";

export type CreatorGroup = {
	id: string;
	type: CreatorGroupType;
	targets?: CreatorTarget[];
	balloons?: CreatorBalloon[];
	train?: CreatorTrain;
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
