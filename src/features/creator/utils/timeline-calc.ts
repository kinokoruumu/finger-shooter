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

/**
 * 左端リサイズ: endTime 固定で startTime と interval を計算。
 * count が 1 の場合は startTime のみ変更。
 */
export const calcResizeLeft = (
	initialStartTime: number,
	endTime: number,
	count: number,
	totalDeltaX: number,
	duration: number,
	width: number,
): { startTime: number; interval: number } => {
	const newStartTime = calcDraggedTime(
		initialStartTime,
		totalDeltaX,
		duration,
		width,
	);
	const clamped = Math.min(newStartTime, endTime);
	if (count <= 1) {
		return { startTime: clamped, interval: 0 };
	}
	const newInterval = Math.max(
		0,
		Math.round((endTime - clamped) / (count - 1)),
	);
	return { startTime: clamped, interval: newInterval };
};

/** 列車の走行時間(ms) → speed 変換。speed = BASE / duration */
const TRAIN_BASE_DURATION = 3000;

export const trainDurationToSpeed = (durationMs: number): number => {
	if (durationMs <= 0) return 5;
	return Math.round((TRAIN_BASE_DURATION / durationMs) * 10) / 10;
};

export const trainSpeedToDuration = (speed: number): number => {
	if (speed <= 0) return TRAIN_BASE_DURATION;
	return Math.round(TRAIN_BASE_DURATION / speed);
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

/** 的ステップの最大終了時刻(ms)を計算。visibleDuration を含む */
export const calcTargetsDuration = (group: CreatorGroup): number => {
	const steps = group.targetSteps ?? [];
	const targets = group.targets ?? [];
	let max = 0;

	for (const step of steps) {
		const interval = step.interval ?? 100;
		const start = step.startTime ?? 0;
		if (step.targetIds.length === 0) continue;

		// 最後の的が出現する時刻
		const lastSpawnTime = start + (step.targetIds.length - 1) * interval;

		// 最大の visibleDuration を取得
		const maxVisible = step.targetIds.reduce((mv, tid) => {
			const t = targets.find((tgt) => tgt.id === tid);
			return Math.max(mv, (t?.visibleDuration ?? 2.5) * 1000);
		}, 0);

		const end = lastSpawnTime + maxVisible;
		if (end > max) max = end;
	}

	return max;
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

/** 的の各ステップの開始/終了時刻(ms)を計算 */
export const calcTargetStepTimes = (
	group: CreatorGroup,
): { startTime: number; endTime: number }[] => {
	const steps = group.targetSteps ?? [];

	return steps.map((step) => {
		const interval = step.interval ?? 100;
		const start = step.startTime ?? 0;
		const duration =
			step.targetIds.length > 0
				? (step.targetIds.length - 1) * interval
				: 0;
		return { startTime: start, endTime: start + duration };
	});
};
