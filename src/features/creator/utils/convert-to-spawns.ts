import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import type {
	CreatorBalloonGroup,
	CreatorGroup,
	CreatorStage,
	CreatorTargetGroup,
	CreatorTrainGroup,
} from "../types";

const convertTargetGroup = (
	group: CreatorTargetGroup,
	groupIndex: number,
): SpawnEntry[] => {
	const spawns: SpawnEntry[] = [];
	let time = 0;

	for (const step of group.steps) {
		for (let i = 0; i < step.targetIds.length; i++) {
			const target = group.targets.find((t) => t.id === step.targetIds[i]);
			if (!target) continue;
			spawns.push({
				time: time + i * step.interval,
				group: groupIndex,
				type: target.type,
				nx: 0,
				gx: target.gx,
				gy: target.gy,
				visibleDuration: target.visibleDuration,
			});
		}
		if (step.targetIds.length > 0) {
			time += (step.targetIds.length - 1) * step.interval + group.stepDelay;
		}
	}
	return spawns;
};

const convertBalloonGroup = (
	group: CreatorBalloonGroup,
	groupIndex: number,
): SpawnEntry[] => {
	const spawns: SpawnEntry[] = [];
	let time = 0;

	for (const step of group.steps) {
		for (let i = 0; i < step.targetIds.length; i++) {
			const balloon = group.balloons.find((b) => b.id === step.targetIds[i]);
			if (!balloon) continue;
			spawns.push({
				time: time + i * step.interval,
				group: groupIndex,
				type: "balloon",
				nx: balloon.nx,
			});
		}
		if (step.targetIds.length > 0) {
			time += (step.targetIds.length - 1) * step.interval + group.stepDelay;
		}
	}
	return spawns;
};

const convertTrainGroup = (
	group: CreatorTrainGroup,
	groupIndex: number,
): SpawnEntry[] => {
	return [
		{
			time: 0,
			group: groupIndex,
			type: "train",
			nx: 0,
			direction: group.train.direction,
			trainSpeed: group.train.speed,
			slotsOscillate: group.train.slotsOscillate,
			goldSlots: group.train.slots.filter((s) => s.type === "gold").length,
			penaltySlots: group.train.slots.filter((s) => s.type === "penalty")
				.length,
		},
	];
};

const convertGroup = (
	group: CreatorGroup,
	groupIndex: number,
): SpawnEntry[] => {
	switch (group.type) {
		case "targets":
			return convertTargetGroup(group, groupIndex);
		case "balloons":
			return convertBalloonGroup(group, groupIndex);
		case "train":
			return convertTrainGroup(group, groupIndex);
	}
};

export const convertStageToSpawns = (stage: CreatorStage): SpawnEntry[] => {
	return stage.groups.flatMap((group, i) => convertGroup(group, i));
};
