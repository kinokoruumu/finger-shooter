import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import type { CreatorGroup, CreatorStage } from "../types";

const spreadToNx = (
	spread: string,
	index: number,
	total: number,
): number => {
	switch (spread) {
		case "left":
			return 0.15 + (index / Math.max(total - 1, 1)) * 0.25;
		case "center":
			return 0.35 + (index / Math.max(total - 1, 1)) * 0.3;
		case "right":
			return 0.6 + (index / Math.max(total - 1, 1)) * 0.25;
		default:
			return 0.15 + Math.random() * 0.7;
	}
};

const convertGroup = (
	group: CreatorGroup,
	groupIndex: number,
): SpawnEntry[] => {
	const spawns: SpawnEntry[] = [];

	// --- 的セット ---
	const targetSets = group.targetSets ?? [];
	for (const set of targetSets) {
		const steps = set.steps ?? [];
		for (const step of steps) {
			const interval = step.interval ?? 100;
			const baseTime = step.startTime ?? 0;
			for (let i = 0; i < step.targetIds.length; i++) {
				const target = set.targets.find(
					(t) => t.id === step.targetIds[i],
				);
				if (!target) continue;
				spawns.push({
					time: baseTime + i * interval,
					group: groupIndex,
					type: target.type,
					nx: 0,
					gx: target.gx,
					gy: target.gy,
					visibleDuration: target.visibleDuration,
				});
			}
		}
	}

	// --- 風船 ---
	const balloonEntries = group.balloonEntries ?? [];
	for (const entry of balloonEntries) {
		const interval = entry.interval ?? 0;
		for (let i = 0; i < entry.count; i++) {
			spawns.push({
				time: entry.time + i * interval,
				group: groupIndex,
				type: "balloon",
				nx: spreadToNx(entry.spread, i, entry.count),
			});
		}
	}

	// --- 列車 ---
	if (group.train && group.trainStartTime != null) {
		spawns.push({
			time: group.trainStartTime,
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
