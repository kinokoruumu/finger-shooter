import type { CreatorGroup } from "../types";

const PADDING = 12;
const SNAP_MS = 50;

/** 時間(ms) → ピクセル位置 */
export const timeToX = (
	time: number,
	duration: number,
	width: number,
): number => PADDING + (time / duration) * (width - PADDING * 2);

/** ピクセル位置 → 時間(ms)、SNAP_MS 単位にスナップ */
export const xToTime = (
	x: number,
	duration: number,
	width: number,
): number => {
	const t = ((x - PADDING) / (width - PADDING * 2)) * duration;
	return Math.max(0, Math.round(t / SNAP_MS) * SNAP_MS);
};

/** ドラッグ移動後の新しい時間を計算 */
export const calcDraggedTime = (
	initialTime: number,
	totalDeltaX: number,
	duration: number,
	width: number,
): number => {
	const initialX = timeToX(initialTime, duration, width);
	return xToTime(initialX + totalDeltaX, duration, width);
};

/** 的ステップの総所要時間(ms)を計算 */
export const calcTargetsDuration = (group: CreatorGroup): number => {
	const steps = group.targetSteps ?? [];
	const delay = group.targetStepDelay ?? 300;
	let time = 0;

	for (const step of steps) {
		const interval = step.interval ?? 100;
		if (step.targetIds.length > 0) {
			time += (step.targetIds.length - 1) * interval + delay;
		}
	}
	// 最後のステップの delay は不要なので引く
	if (steps.length > 0 && steps[steps.length - 1].targetIds.length > 0) {
		time -= delay;
	}

	return Math.max(0, time);
};

/** 風船エントリの最大終了時刻(ms)を計算 */
export const calcBalloonsDuration = (group: CreatorGroup): number => {
	const entries = group.balloonEntries ?? [];
	let max = 0;
	for (const entry of entries) {
		const end = entry.time + Math.max(0, entry.count - 1) * entry.interval;
		if (end > max) max = end;
	}
	return max;
};

/** グループの総所要時間(ms)を計算 */
export const calcGroupDuration = (group: CreatorGroup): number => {
	const targetDur = calcTargetsDuration(group);
	const balloonDur = calcBalloonsDuration(group);
	const trainDur = group.trainStartTime ?? 0;

	return Math.max(targetDur, balloonDur, trainDur, 1000);
};

/** 的の各ステップの開始時刻(ms)を計算 */
export const calcTargetStepTimes = (
	group: CreatorGroup,
): { startTime: number; endTime: number }[] => {
	const steps = group.targetSteps ?? [];
	const delay = group.targetStepDelay ?? 300;
	const result: { startTime: number; endTime: number }[] = [];
	let time = 0;

	for (const step of steps) {
		const interval = step.interval ?? 100;
		const duration =
			step.targetIds.length > 0
				? (step.targetIds.length - 1) * interval
				: 0;
		result.push({ startTime: time, endTime: time + duration });
		if (step.targetIds.length > 0) {
			time += duration + delay;
		}
	}

	return result;
};
