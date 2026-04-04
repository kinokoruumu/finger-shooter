import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import type { CreatorGroup, CreatorStage } from "../types";

const convertGroup = (
	group: CreatorGroup,
	groupIndex: number,
): SpawnEntry[] => {
	const spawns: SpawnEntry[] = [];
	let time = 0;

	for (const step of group.steps) {
		// 的
		for (let i = 0; i < step.targetIds.length; i++) {
			const target = group.targets.find(
				(t) => t.id === step.targetIds[i],
			);
			if (!target) continue;
			spawns.push({
				time: time + i * step.targetInterval,
				group: groupIndex,
				type: target.type,
				nx: 0,
				gx: target.gx,
				gy: target.gy,
				visibleDuration: target.visibleDuration,
			});
		}

		// 風船
		for (let i = 0; i < step.balloonIds.length; i++) {
			const balloon = group.balloons.find(
				(b) => b.id === step.balloonIds[i],
			);
			if (!balloon) continue;
			spawns.push({
				time: time + i * step.balloonInterval,
				group: groupIndex,
				type: "balloon",
				nx: balloon.nx,
			});
		}

		// 列車
		if (step.trainStart && group.train) {
			spawns.push({
				time,
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

		// 次ステップの開始時刻
		const targetEnd =
			step.targetIds.length > 0
				? (step.targetIds.length - 1) * step.targetInterval
				: 0;
		const balloonEnd =
			step.balloonIds.length > 0
				? (step.balloonIds.length - 1) * step.balloonInterval
				: 0;
		const stepDuration = Math.max(targetEnd, balloonEnd);
		if (
			step.targetIds.length > 0 ||
			step.balloonIds.length > 0 ||
			step.trainStart
		) {
			time += stepDuration + group.stepDelay;
		}
	}

	return spawns;
};

export const convertStageToSpawns = (stage: CreatorStage): SpawnEntry[] => {
	return stage.groups.flatMap((group, i) => convertGroup(group, i));
};
