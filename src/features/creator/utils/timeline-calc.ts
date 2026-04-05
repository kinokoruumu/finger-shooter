import type { CreatorGroup } from "../types";

const PADDING = 12;
const SNAP_MS = 50;
const BALLOON_VISIBLE_MS = 5000;
/** 的のスポーンから実際に見えるまでの遅延(ms) */
export const TARGET_APPEAR_DELAY_MS = 350;

/** zoom=1 でコンテナ幅に 5秒 表示する固定スケール。コンテンツ長に依存しない */
const BASE_VISIBLE_MS = 5000;

export const calcPxPerMs = (containerWidth: number, zoom: number): number =>
	(containerWidth / BASE_VISIBLE_MS) * zoom;

/** 固定スケール: pxPerMs → ピクセル位置 */
export const timeToX = (time: number, pxPerMs: number): number =>
	PADDING + time * pxPerMs;

/** ピクセル位置 → 時間(ms)、SNAP_MS 単位にスナップ */
export const xToTime = (x: number, pxPerMs: number): number => {
	const t = (x - PADDING) / pxPerMs;
	return Math.max(0, Math.round(t / SNAP_MS) * SNAP_MS);
};

/** ドラッグ移動後の新しい時間を計算 */
export const calcDraggedTime = (
	initialTime: number,
	totalDeltaX: number,
	pxPerMs: number,
): number => {
	const initialX = timeToX(initialTime, pxPerMs);
	return xToTime(initialX + totalDeltaX, pxPerMs);
};

/**
 * 右端固定リサイズ: endTime 固定で新しい startTime を計算。
 * startTime は endTime - minDuration 以下にクランプ。
 */
export const calcResizeLeftTime = (
	initialStartTime: number,
	endTime: number,
	minDuration: number,
	totalDeltaX: number,
	pxPerMs: number,
): number => {
	const newStart = calcDraggedTime(initialStartTime, totalDeltaX, pxPerMs);
	return Math.min(newStart, endTime - minDuration);
};

/**
 * 列車の走行時間(ms) → speed 変換。
 * ゲーム本編: 実効速度 = 4 * data.speed units/sec
 * 走行距離 ≈ 画面幅(50) + 列車全長(73.5) ≈ 123 units
 * speed=1 → 123 / 4 ≈ 30秒
 */
const TRAIN_BASE_DURATION = 30000;

export const trainDurationToSpeed = (durationMs: number): number => {
	if (durationMs <= 0) return 5;
	return Math.round((TRAIN_BASE_DURATION / durationMs) * 10) / 10;
};

export const trainSpeedToDuration = (speed: number): number => {
	if (speed <= 0) return TRAIN_BASE_DURATION;
	return Math.round(TRAIN_BASE_DURATION / speed);
};

/** 風船の表示時間(ms)。速度依存の固定値 */
export const getBalloonVisibleDuration = (): number => BALLOON_VISIBLE_MS;

// --- グループ時間計算 ---

type StepBar = {
	startTime: number;
	delayEndTime: number;
	spawnEndTime: number;
	endTime: number;
};

/** 的セット内のステップバー情報を計算 */
export const calcTargetStepBarsForSet = (set: {
	targets: CreatorGroup["targetSets"][number]["targets"];
	steps: CreatorGroup["targetSets"][number]["steps"];
}): StepBar[] => {
	const steps = set.steps ?? [];
	const targets = set.targets ?? [];

	return steps.map((step) => {
		const interval = step.interval ?? 100;
		const start = step.startTime ?? 0;
		const count = step.targetIds.length;

		const spawnDuration = count > 0 ? (count - 1) * interval : 0;
		const spawnEndTime = start + spawnDuration;

		const maxVisible = step.targetIds.reduce((mv, tid) => {
			const t = targets.find((tgt) => tgt.id === tid);
			return Math.max(mv, (t?.visibleDuration ?? 2.5) * 1000);
		}, 0);

		const appearDelay = count > 0 ? TARGET_APPEAR_DELAY_MS : 0;

		return {
			startTime: start,
			delayEndTime: start + appearDelay,
			spawnEndTime: spawnEndTime + appearDelay,
			endTime: spawnEndTime + (count > 0 ? appearDelay + maxVisible : 0),
		};
	});
};

/** 全的セットの最大終了時刻(ms) */
export const calcTargetsDuration = (group: CreatorGroup): number => {
	const sets = group.targetSets ?? [];
	let max = 0;
	for (const set of sets) {
		const bars = calcTargetStepBarsForSet(set);
		for (const b of bars) {
			if (b.endTime > max) max = b.endTime;
		}
	}
	return max;
};

/** 風船エントリの最大終了時刻(ms) */
export const calcBalloonsDuration = (group: CreatorGroup): number => {
	const entries = group.balloonEntries ?? [];
	let max = 0;
	for (const entry of entries) {
		const lastSpawnTime =
			entry.time + Math.max(0, entry.count - 1) * (entry.interval ?? 0);
		const end = lastSpawnTime + BALLOON_VISIBLE_MS;
		if (end > max) max = end;
	}
	return max;
};

/** グループの総所要時間(ms) */
export const calcGroupDuration = (group: CreatorGroup): number => {
	const targetDur = calcTargetsDuration(group);
	const balloonDur = calcBalloonsDuration(group);
	const trainDur =
		group.trainStartTime != null && group.train
			? group.trainStartTime + trainSpeedToDuration(group.train.speed)
			: 0;

	return Math.max(targetDur, balloonDur, trainDur, 1000);
};
