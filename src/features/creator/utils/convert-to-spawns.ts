import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import type { CreatorGroup, CreatorStage } from "../types";

const convertGroup = (
	group: CreatorGroup,
	groupIndex: number,
): SpawnEntry[] => {
	const spawns: SpawnEntry[] = [];
	let time = 0;

	for (const step of group.steps) {
		const balloonIds = step.balloonIds ?? [];
		const balloonInterval = step.balloonInterval ?? 100;
		const trainStart = step.trainStart ?? false;
		const targetInterval = step.targetInterval ?? (step as unknown as { interval?: number }).interval ?? 100;

		// 的
		for (let i = 0; i < step.targetIds.length; i++) {
			const target = group.targets.find(
				(t) => t.id === step.targetIds[i],
			);
			if (!target) continue;
			spawns.push({
				time: time + i * targetInterval,
				group: groupIndex,
				type: target.type,
				nx: 0,
				gx: target.gx,
				gy: target.gy,
				visibleDuration: target.visibleDuration,
			});
		}

		// 風船
		for (let i = 0; i < balloonIds.length; i++) {
			const balloon = group.balloons.find(
				(b) => b.id === balloonIds[i],
			);
			if (!balloon) continue;
			spawns.push({
				time: time + i * balloonInterval,
				group: groupIndex,
				type: "balloon",
				nx: balloon.nx,
			});
		}

		// 列車
		if (trainStart && group.train) {
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
				? (step.targetIds.length - 1) * targetInterval
				: 0;
		const balloonEnd =
			balloonIds.length > 0
				? (balloonIds.length - 1) * balloonInterval
				: 0;
		const stepDuration = Math.max(targetEnd, balloonEnd);
		if (
			step.targetIds.length > 0 ||
			balloonIds.length > 0 ||
			trainStart
		) {
			time += stepDuration + group.stepDelay;
		}
	}

	return spawns;
};

export const convertStageToSpawns = (stage: CreatorStage): SpawnEntry[] => {
	return stage.groups.flatMap((group, i) => convertGroup(group, i));
};
