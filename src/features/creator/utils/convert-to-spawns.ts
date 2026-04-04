import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import type { CreatorGroup, CreatorStage } from "../types";

const convertGroup = (
	group: CreatorGroup,
	groupIndex: number,
): SpawnEntry[] => {
	const spawns: SpawnEntry[] = [];
	let time = 0;

	for (const step of group.steps) {
		for (let i = 0; i < step.targetIds.length; i++) {
			const id = step.targetIds[i];

			// 的から探す
			const target = group.targets.find((t) => t.id === id);
			if (target) {
				spawns.push({
					time: time + i * step.interval,
					group: groupIndex,
					type: target.type,
					nx: 0,
					gx: target.gx,
					gy: target.gy,
					visibleDuration: target.visibleDuration,
				});
				continue;
			}

			// 風船から探す
			const balloon = group.balloons.find((b) => b.id === id);
			if (balloon) {
				spawns.push({
					time: time + i * step.interval,
					group: groupIndex,
					type: "balloon",
					nx: balloon.nx,
				});
			}
		}
		if (step.targetIds.length > 0) {
			time +=
				(step.targetIds.length - 1) * step.interval + group.stepDelay;
		}
	}

	// 列車
	if (group.train) {
		spawns.push({
			time: 0,
			group: groupIndex,
			type: "train",
			nx: 0,
			direction: group.train.direction,
			trainSpeed: group.train.speed,
			slotsOscillate: group.train.slotsOscillate,
			goldSlots: group.train.slots.filter((s) => s.type === "gold")
				.length,
			penaltySlots: group.train.slots.filter(
				(s) => s.type === "penalty",
			).length,
		});
	}

	return spawns;
};

export const convertStageToSpawns = (stage: CreatorStage): SpawnEntry[] => {
	return stage.groups.flatMap((group, i) => convertGroup(group, i));
};
