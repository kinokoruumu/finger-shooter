import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
	CreatorBalloonEntry,
	CreatorGroup,
} from "../../types";
import {
	TARGET_APPEAR_DELAY_MS,
	calcDraggedTime,
	calcGroupDuration,
	calcResizeLeftTime,
	calcTargetStepBarsForSet,
	getBalloonVisibleDuration,
	timeToX,
	trainDurationToSpeed,
	trainSpeedToDuration,
	xToTime,
} from "../../utils/timeline-calc";
import { DraggableBar } from "./internal/draggable-bar";

type Props = {
	group: CreatorGroup;
	onUpdateGroup: (group: CreatorGroup) => void;
	onEditTargetSet: (setId: string, stepIndex?: number) => void;
	onEditBalloon: (entryId: string) => void;
	onEditTrain: () => void;
	isPlaying: boolean;
	onPlay: () => void;
	onStop: () => void;
	elapsedMsRef: React.RefObject<number>;
	spawnCount: number;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const TRACK_HEIGHT = 44;
const LABEL_WIDTH = 56;

/** 時間ルーラー */
const TimeRuler = ({
	duration,
	width,
}: { duration: number; width: number }) => {
	const ticks: { x: number; label: string; major: boolean }[] = [];
	const step = duration > 5000 ? 1000 : duration > 2000 ? 500 : 250;

	for (let t = 0; t <= duration; t += step) {
		ticks.push({
			x: timeToX(t, duration, width),
			label: `${(t / 1000).toFixed(1)}s`,
			major: t % 1000 === 0,
		});
	}

	return (
		<div className="relative h-8" style={{ width }}>
			{ticks.map((tick) => (
				<div
					key={tick.x}
					className="absolute top-0"
					style={{ left: tick.x }}
				>
					<div
						className={cn(
							"w-px",
							tick.major
								? "h-3 bg-amber-900/25"
								: "h-2 bg-amber-900/10",
						)}
					/>
					{tick.major && (
						<span className="absolute top-3 -translate-x-1/2 text-[9px] text-amber-900/30">
							{tick.label}
						</span>
					)}
				</div>
			))}
		</div>
	);
};

/** 的セットの色 */
const SET_COLORS = [
	{ bg: "bg-amber-100/40", border: "border-amber-400/30", bar: "bg-amber-500", barActive: "bg-amber-700" },
	{ bg: "bg-orange-100/40", border: "border-orange-400/30", bar: "bg-orange-500", barActive: "bg-orange-700" },
	{ bg: "bg-rose-100/40", border: "border-rose-400/30", bar: "bg-rose-500", barActive: "bg-rose-700" },
	{ bg: "bg-lime-100/40", border: "border-lime-400/30", bar: "bg-lime-500", barActive: "bg-lime-700" },
];

/** 的トラック */
const TargetTrack = ({
	group,
	duration,
	width,
	onEditSet,
	onUpdateGroup,
}: {
	group: CreatorGroup;
	duration: number;
	width: number;
	onEditSet: (setId: string, stepIndex?: number) => void;
	onUpdateGroup: (group: CreatorGroup) => void;
}) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const sets = group.targetSets ?? [];
	const dragInitialRef = useRef({ startTime: 0, endTime: 0 });

	// 各セットの行数と累積オフセットを計算
	const setLayouts = sets.map((set) => {
		const stepCount = Math.max(1, (set.steps ?? []).length);
		return { stepCount };
	});
	const totalRows = setLayouts.reduce((sum, l) => sum + l.stepCount, 0);
	const rowCount = Math.max(1, totalRows + sets.length * 0.5); // セット間余白分

	const handleTrackClick = useCallback(
		(e: React.MouseEvent) => {
			if (!trackRef.current) return;
			const rect = trackRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const time = xToTime(x, duration, width);

			const newSet = {
				id: crypto.randomUUID(),
				targets: [],
				steps: [{ targetIds: [], interval: 100, startTime: time }],
			};
			onUpdateGroup({
				...group,
				targetSets: [...sets, newSet],
			});
			onEditSet(newSet.id);
		},
		[group, sets, duration, width, onUpdateGroup, onEditSet],
	);

	return (
		<div
			ref={trackRef}
			className="relative cursor-crosshair"
			style={{ height: TRACK_HEIGHT * rowCount, width }}
			onClick={handleTrackClick}
		>
			{(() => {
				let yOffset = 0;
				return sets.map((set, setIdx) => {
					const stepBars = calcTargetStepBarsForSet(set);
					const colors = SET_COLORS[setIdx % SET_COLORS.length];
					const setStartY = yOffset;
					const stepCount = Math.max(1, stepBars.length);
					const setHeight = stepCount * TRACK_HEIGHT;
					yOffset += setHeight + 8; // セット間余白

					return (
						<div key={set.id}>
							{/* セット括り（左ボーダー + 背景） */}
							<div
								className={cn(
									"absolute rounded-r-lg border-l-4",
									colors.bg,
									colors.border,
								)}
								style={{
									left: 0,
									top: setStartY,
									width: "100%",
									height: setHeight,
								}}
								onClick={(e) => {
									e.stopPropagation();
									onEditSet(set.id);
								}}
							/>

							{/* ステップバー */}
							{stepBars.map((bar, i) => {
							const x = timeToX(bar.startTime, duration, width);
							const x2 = timeToX(bar.endTime, duration, width);
							const w = Math.max(x2 - x, 6);
							const step = set.steps[i];
							const count = (step?.targetIds ?? []).length;
							const totalDur = bar.endTime - bar.startTime;
							const delayRatio = totalDur > 0
								? (bar.delayEndTime - bar.startTime) / totalDur
								: 0;
							const spawnRatio = totalDur > 0
								? (bar.spawnEndTime - bar.startTime) / totalDur
								: 1;

							return (
								<DraggableBar
									key={`${set.id}-step-${i}`}
									x={x}
									width={w}
									color={colors.bar}
									activeColor={colors.barActive}
									label={`${count}個 出現間隔${step?.interval ?? 100}ms`}
									fadeLabel={`表示${set.targets.find((t) => step?.targetIds.includes(t.id))?.visibleDuration ?? 2.5}秒`}
									trackHeight={TRACK_HEIGHT}
									delayRatio={delayRatio}
									spawnRatio={spawnRatio}
									onDragStart={() => {
										dragInitialRef.current = {
											startTime: bar.startTime,
											endTime: bar.endTime,
										};
									}}
									onDrag={(totalDx, mode) => {
										const updateSet = (
											updater: (s: typeof set) => typeof set,
										) =>
											onUpdateGroup({
												...group,
												targetSets: sets.map((s) =>
													s.id === set.id
														? updater(s)
														: s,
												),
											});

										if (mode === "move") {
											const newTime = calcDraggedTime(
												dragInitialRef.current.startTime,
												totalDx,
												duration,
												width,
											);
											updateSet((s) => ({
												...s,
												steps: s.steps.map((st, si) =>
													si === i
														? { ...st, startTime: newTime }
														: st,
												),
											}));
										} else if (mode === "resize-left") {
											const newStart = calcResizeLeftTime(
												dragInitialRef.current.startTime,
												dragInitialRef.current.endTime,
												100,
												totalDx,
												duration,
												width,
											);
											const newVisible =
												(dragInitialRef.current.endTime -
													newStart -
													TARGET_APPEAR_DELAY_MS -
													(count > 1
														? (count - 1) * (step?.interval ?? 100)
														: 0)) /
												1000;
											updateSet((s) => ({
												...s,
												targets: s.targets.map((t) =>
													step?.targetIds.includes(t.id)
														? {
																...t,
																visibleDuration: Math.max(
																	0.5,
																	Math.round(newVisible * 10) / 10,
																),
															}
														: t,
												),
												steps: s.steps.map((st, si) =>
													si === i
														? { ...st, startTime: newStart }
														: st,
												),
											}));
										} else if (mode === "resize-right") {
											const newEndTime = calcDraggedTime(
												dragInitialRef.current.endTime,
												totalDx,
												duration,
												width,
											);
											const spawnEnd =
												(step?.startTime ?? 0) +
												TARGET_APPEAR_DELAY_MS +
												(count > 1
													? (count - 1) * (step?.interval ?? 100)
													: 0);
											const newVisible = (newEndTime - spawnEnd) / 1000;
											updateSet((s) => ({
												...s,
												targets: s.targets.map((t) =>
													step?.targetIds.includes(t.id)
														? {
																...t,
																visibleDuration: Math.max(
																	0.5,
																	Math.round(newVisible * 10) / 10,
																),
															}
														: t,
												),
											}));
										} else if (
											mode === "resize-spawn" &&
											count > 1
										) {
											const initialSpawnEnd =
												dragInitialRef.current.startTime +
												TARGET_APPEAR_DELAY_MS +
												(count - 1) * (step?.interval ?? 100);
											const newSpawnEnd = calcDraggedTime(
												initialSpawnEnd,
												totalDx,
												duration,
												width,
											);
											const newInterval = Math.max(
												0,
												Math.round(
													(newSpawnEnd -
														(step?.startTime ?? 0) -
														TARGET_APPEAR_DELAY_MS) /
														(count - 1),
												),
											);
											updateSet((s) => ({
												...s,
												steps: s.steps.map((st, si) =>
													si === i
														? { ...st, interval: newInterval }
														: st,
												),
											}));
										}
									}}
									onClick={() => onEditSet(set.id, i)}
									style={{ top: setStartY + i * TRACK_HEIGHT + 4 }}
								/>
							);
						})}
						</div>
					);
				});
			})()}
			{sets.length === 0 && (
				<span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-900/20 cursor-pointer">
					クリックで的セットを追加
				</span>
			)}
		</div>
	);
};

/** 風船トラック */
const BalloonTrack = ({
	group,
	duration,
	width,
	onUpdateGroup,
	onEditEntry,
}: {
	group: CreatorGroup;
	duration: number;
	width: number;
	onUpdateGroup: (group: CreatorGroup) => void;
	onEditEntry: (id: string) => void;
}) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const dragInitialRef = useRef({ time: 0, interval: 0 });
	const entries = group.balloonEntries ?? [];

	const handleTrackClick = useCallback(
		(e: React.MouseEvent) => {
			if (!trackRef.current) return;
			const rect = trackRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const time = xToTime(x, duration, width);

			const newEntry: CreatorBalloonEntry = {
				id: crypto.randomUUID(),
				time,
				count: 3,
				interval: 500,
				spread: "random",
			};
			onUpdateGroup({
				...group,
				balloonEntries: [...entries, newEntry],
			});
		},
		[group, entries, duration, width, onUpdateGroup],
	);

	const rowCount = Math.max(1, entries.length);

	return (
		<div
			ref={trackRef}
			className="relative cursor-crosshair"
			style={{ height: TRACK_HEIGHT * rowCount, width }}
			onClick={handleTrackClick}
		>
			{entries.map((entry, idx) => {
				const balloonVisible = getBalloonVisibleDuration();
				const spawnDur = Math.max(0, entry.count - 1) * (entry.interval ?? 0);
				const totalDur = spawnDur + balloonVisible;
				const x = timeToX(entry.time, duration, width);
				const x2 = timeToX(entry.time + totalDur, duration, width);
				const barW = Math.max(x2 - x, 8);
				const rowOffset = idx * TRACK_HEIGHT;
				const spawnRatio = totalDur > 0 ? spawnDur / totalDur : 0;
				const spreadLabel = { left: "左寄り", center: "中央", right: "右寄り", random: "ランダム" }[entry.spread];

				return (
					<DraggableBar
						key={entry.id}
						x={x}
						width={barW}
						color="bg-sky-400"
						activeColor="bg-sky-600"
						label={`${entry.count}個 ${spreadLabel}${(entry.interval ?? 0) > 0 ? ` 出現間隔${entry.interval}ms` : ""}`}
						fadeLabel={`${(getBalloonVisibleDuration() / 1000).toFixed(0)}秒で消滅`}
						spawnRatio={spawnRatio}
						trackHeight={TRACK_HEIGHT}
						onDragStart={() => {
							dragInitialRef.current = {
								time: entry.time,
								interval: entry.interval ?? 0,
							};
						}}
						onDrag={(totalDx, mode) => {
							const update = (
								upd: Partial<CreatorBalloonEntry>,
							) =>
								onUpdateGroup({
									...group,
									balloonEntries: entries.map((e) =>
										e.id === entry.id
											? { ...e, ...upd }
											: e,
									),
								});

							if (mode === "move") {
								update({
									time: calcDraggedTime(
										dragInitialRef.current.time,
										totalDx,
										duration,
										width,
									),
								});
							} else if (mode === "resize-right" && entry.count > 1) {
								// 左端固定、interval 変更
								const oldEndTime =
									dragInitialRef.current.time +
									(entry.count - 1) * dragInitialRef.current.interval;
								const newEndTime = calcDraggedTime(
									oldEndTime,
									totalDx,
									duration,
									width,
								);
								const newInterval = Math.max(
									0,
									Math.round(
										(newEndTime - entry.time) /
											(entry.count - 1),
									),
								);
								update({ interval: newInterval });
							} else if (mode === "resize-left" && entry.count > 1) {
								// 右端固定、time + interval 変更
								const oldEndTime =
									dragInitialRef.current.time +
									(entry.count - 1) * dragInitialRef.current.interval;
								const newStart = calcResizeLeftTime(
									dragInitialRef.current.time,
									oldEndTime,
									50,
									totalDx,
									duration,
									width,
								);
								const newInterval = Math.max(
									0,
									Math.round(
										(oldEndTime - newStart) /
											(entry.count - 1),
									),
								);
								update({ time: newStart, interval: newInterval });
							} else {
								// count=1 の場合は移動のみ
								update({
									time: calcDraggedTime(
										dragInitialRef.current.time,
										totalDx,
										duration,
										width,
									),
								});
							}
						}}
						onClick={() => onEditEntry(entry.id)}
						style={{ top: rowOffset + 4 }}
					/>
				);
			})}
			{entries.length === 0 && (
				<span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-900/20">
					クリックで風船を追加
				</span>
			)}
		</div>
	);
};

/** 列車トラック */
const TrainTrack = ({
	group,
	duration,
	width,
	onUpdateGroup,
	onEdit,
}: {
	group: CreatorGroup;
	duration: number;
	width: number;
	onUpdateGroup: (group: CreatorGroup) => void;
	onEdit: () => void;
}) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const dragInitialRef = useRef({ startTime: 0, trainDur: 0 });

	const handleTrackClick = useCallback(
		(e: React.MouseEvent) => {
			if (!group.train) return;
			if (group.trainStartTime != null) return;
			if (!trackRef.current) return;

			const rect = trackRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const time = xToTime(x, duration, width);
			onUpdateGroup({ ...group, trainStartTime: time });
		},
		[group, duration, width, onUpdateGroup],
	);

	const hasBlock = group.train && group.trainStartTime != null;

	const trainDur = group.train
		? trainSpeedToDuration(group.train.speed)
		: 1500;
	const startTime = group.trainStartTime ?? 0;

	return (
		<div
			ref={trackRef}
			className={cn(
				"relative",
				group.train && !hasBlock
					? "cursor-crosshair"
					: "cursor-default",
			)}
			style={{ height: TRACK_HEIGHT, width }}
			onClick={handleTrackClick}
		>
			{hasBlock && (
				<DraggableBar
					x={timeToX(startTime, duration, width)}
					width={
						timeToX(startTime + trainDur, duration, width) -
						timeToX(startTime, duration, width)
					}
					color="bg-violet-500"
					activeColor="bg-violet-700"
					label={
						group.train?.direction === 1 ? "右から" : "左から"
					}
					trackHeight={TRACK_HEIGHT}
					onDragStart={() => {
						dragInitialRef.current = {
							startTime,
							trainDur,
						};
					}}
					onDrag={(totalDx, mode) => {
						if (mode === "move") {
							const newTime = calcDraggedTime(
								dragInitialRef.current.startTime,
								totalDx,
								duration,
								width,
							);
							onUpdateGroup({
								...group,
								trainStartTime: newTime,
							});
						} else if (mode === "resize-right") {
							// 右端ドラッグ → endTime を変更 → speed を逆算
							const oldEndTime =
								dragInitialRef.current.startTime +
								dragInitialRef.current.trainDur;
							const newEndTime = calcDraggedTime(
								oldEndTime,
								totalDx,
								duration,
								width,
							);
							const newDur = Math.max(
								200,
								newEndTime - startTime,
							);
							const newSpeed = trainDurationToSpeed(newDur);
							onUpdateGroup({
								...group,
								train: group.train
									? { ...group.train, speed: newSpeed }
									: null,
							});
						} else if (mode === "resize-left") {
							// 左端ドラッグ → endTime 固定で startTime + speed を変更
							const endTime =
								dragInitialRef.current.startTime +
								dragInitialRef.current.trainDur;
							const newStart = calcDraggedTime(
								dragInitialRef.current.startTime,
								totalDx,
								duration,
								width,
							);
							const clampedStart = Math.min(
								newStart,
								endTime - 200,
							);
							const newDur = endTime - clampedStart;
							const newSpeed = trainDurationToSpeed(newDur);
							onUpdateGroup({
								...group,
								trainStartTime: clampedStart,
								train: group.train
									? { ...group.train, speed: newSpeed }
									: null,
							});
						}
					}}
					onClick={onEdit}
				/>
			)}
			{!group.train && (
				<span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-900/20">
					列車設定で列車を追加
				</span>
			)}
			{group.train && !hasBlock && (
				<span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-900/20">
					クリックで出現位置を設定
				</span>
			)}
		</div>
	);
};

export const StageTimeline = ({
	group,
	onUpdateGroup,
	onEditTargetSet,
	onEditBalloon,
	onEditTrain,
	isPlaying,
	onPlay,
	onStop,
	elapsedMsRef,
	spawnCount,
}: Props) => {
	const [containerWidth, setContainerWidth] = useState(600);
	const playheadRef = useRef<HTMLDivElement>(null);

	const duration = calcGroupDuration(group);
	const timelineWidth = containerWidth - LABEL_WIDTH;

	const measureRef = useCallback((node: HTMLDivElement | null) => {
		if (!node) return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setContainerWidth(entry.contentRect.width);
			}
		});
		observer.observe(node);
		setContainerWidth(node.clientWidth);
	}, []);

	const tracks = [
		{
			label: "的",
			color: "border-l-amber-500",
			content: (
				<TargetTrack
					group={group}
					duration={duration}
					width={timelineWidth}
					onEditSet={onEditTargetSet}
					onUpdateGroup={onUpdateGroup}
				/>
			),
		},
		{
			label: "風船",
			color: "border-l-sky-400",
			content: (
				<BalloonTrack
					group={group}
					duration={duration}
					width={timelineWidth}
					onUpdateGroup={onUpdateGroup}
					onEditEntry={onEditBalloon}
				/>
			),
		},
		{
			label: "列車",
			color: "border-l-violet-500",
			content: (
				<TrainTrack
					group={group}
					duration={duration}
					width={timelineWidth}
					onUpdateGroup={onUpdateGroup}
					onEdit={onEditTrain}
				/>
			),
		},
	];

	// 再生ヘッドの位置更新（ref で直接 DOM 操作、React 再レンダリング不要）
	useEffect(() => {
		if (!isPlaying || !playheadRef.current) return;

		const tick = () => {
			if (!playheadRef.current) return;
			const ms = elapsedMsRef.current;
			const x = timeToX(ms, duration, timelineWidth) + LABEL_WIDTH;
			playheadRef.current.style.transform = `translateX(${x}px)`;
			requestAnimationFrame(tick);
		};
		const id = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(id);
	}, [isPlaying, duration, timelineWidth, elapsedMsRef]);

	return (
		<div
			ref={measureRef}
			className="relative overflow-hidden rounded-xl border-2 border-amber-900/10 bg-white"
			style={rf}
		>
			{/* コントロールバー */}
			<div className="flex items-center gap-2 border-b border-amber-900/5 bg-amber-50/50 px-3 py-1.5">
				{!isPlaying ? (
					<Button
						onClick={onPlay}
						size="xs"
						className="bg-amber-900 font-bold text-white hover:bg-amber-800"
						disabled={spawnCount === 0}
					>
						▶
					</Button>
				) : (
					<Button onClick={onStop} size="xs" variant="outline">
						■
					</Button>
				)}
				<span className="text-amber-900/40 text-[10px]">
					{spawnCount}個のスポーン
				</span>
			</div>

			{/* ルーラー */}
			<div className="flex border-b border-amber-900/5 bg-amber-50/30">
				<div
					className="shrink-0 border-r border-amber-900/5"
					style={{ width: LABEL_WIDTH }}
				/>
				<TimeRuler duration={duration} width={timelineWidth} />
			</div>

			{/* トラック */}
			{tracks.map((track) => (
				<div
					key={track.label}
					className="flex border-b border-amber-900/5 last:border-b-0"
				>
					<div
						className={cn(
							"flex shrink-0 items-center justify-center border-r border-amber-900/5 border-l-3 text-xs font-bold text-amber-900/50",
							track.color,
						)}
						style={{ width: LABEL_WIDTH }}
					>
						{track.label}
					</div>
					{track.content}
				</div>
			))}

			{/* 再生ヘッド */}
			<div
				ref={playheadRef}
				className={cn(
					"pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 transition-opacity",
					isPlaying ? "opacity-100" : "opacity-0",
				)}
				style={{ transform: `translateX(${LABEL_WIDTH}px)` }}
			/>
		</div>
	);
};
