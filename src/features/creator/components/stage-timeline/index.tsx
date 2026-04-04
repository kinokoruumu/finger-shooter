import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
	CreatorBalloonEntry,
	CreatorGroup,
} from "../../types";
import {
	calcDraggedTime,
	calcGroupDuration,
	calcResizeLeft,
	calcTargetStepTimes,
	timeToX,
	xToTime,
} from "../../utils/timeline-calc";
import { DraggableBar } from "./internal/draggable-bar";

type Props = {
	group: CreatorGroup;
	onUpdateGroup: (group: CreatorGroup) => void;
	onEditTargets: () => void;
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
		<div className="relative h-6" style={{ width }}>
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
								? "h-4 bg-amber-900/25"
								: "h-2.5 bg-amber-900/10",
						)}
					/>
					{tick.major && (
						<span className="absolute top-4 -translate-x-1/2 text-[9px] text-amber-900/30">
							{tick.label}
						</span>
					)}
				</div>
			))}
		</div>
	);
};

/** 的トラック */
const TargetTrack = ({
	group,
	duration,
	width,
	onClick,
	onUpdateGroup,
}: {
	group: CreatorGroup;
	duration: number;
	width: number;
	onClick: () => void;
	onUpdateGroup: (group: CreatorGroup) => void;
}) => {
	const stepTimes = calcTargetStepTimes(group);
	const targets = group.targets ?? [];
	const steps = group.targetSteps ?? [];
	const dragInitialRef = useRef({ time: 0, interval: 0 });

	return (
		<div
			className="relative hover:bg-amber-900/[0.03]"
			style={{ height: TRACK_HEIGHT, width }}
			onClick={onClick}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter") onClick();
			}}
		>
			{stepTimes.map((st, i) => {
				const x = timeToX(st.startTime, duration, width);
				const x2 = timeToX(st.endTime, duration, width);
				const w = Math.max(x2 - x, 6);
				const count = (steps[i]?.targetIds ?? []).length;
				const step = steps[i];

				return (
					<DraggableBar
						key={`step-${i}`}
						x={x}
						width={w}
						color="bg-amber-500"
						activeColor="bg-amber-700"
						label={`${count}個`}
						trackHeight={TRACK_HEIGHT}
						onDragStart={() => {
							dragInitialRef.current = {
								time: step?.startTime ?? 0,
								interval: step?.interval ?? 100,
							};
						}}
						onDrag={(totalDx, mode) => {
							if (mode === "move") {
								const newTime = calcDraggedTime(
									dragInitialRef.current.time,
									totalDx,
									duration,
									width,
								);
								onUpdateGroup({
									...group,
									targetSteps: steps.map((s, si) =>
										si === i
											? { ...s, startTime: newTime }
											: s,
									),
								});
							} else if (mode === "resize-left") {
								const endTime =
									dragInitialRef.current.time +
									(count > 1
										? (count - 1) * dragInitialRef.current.interval
										: 0);
								const { startTime: newStart, interval: newInterval } =
									calcResizeLeft(
										dragInitialRef.current.time,
										endTime,
										count,
										totalDx,
										duration,
										width,
									);
								onUpdateGroup({
									...group,
									targetSteps: steps.map((s, si) =>
										si === i
											? {
													...s,
													startTime: newStart,
													interval: newInterval,
												}
											: s,
									),
								});
							} else if (mode === "resize-right" && count > 1) {
								// endTime = startTime + (count-1)*interval
								// newEndTime = oldEndTime + deltaTime
								const oldEndTime =
									dragInitialRef.current.time +
									(count - 1) * dragInitialRef.current.interval;
								const newEndTime = calcDraggedTime(
									oldEndTime,
									totalDx,
									duration,
									width,
								);
								const newInterval = Math.max(
									0,
									Math.round(
										(newEndTime - (step?.startTime ?? 0)) /
											(count - 1),
									),
								);
								onUpdateGroup({
									...group,
									targetSteps: steps.map((s, si) =>
										si === i
											? { ...s, interval: newInterval }
											: s,
									),
								});
							}
						}}
						onClick={onClick}
					/>
				);
			})}
			{targets.length === 0 && stepTimes.length === 0 && (
				<span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-900/20 cursor-pointer">
					クリックして的を編集
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
				interval: 300,
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
				const x = timeToX(entry.time, duration, width);
				const endTime =
					entry.time +
					Math.max(0, entry.count - 1) * entry.interval;
				const x2 = timeToX(endTime, duration, width);
				const barW = Math.max(x2 - x, 8);
				const rowOffset = idx * TRACK_HEIGHT;

				return (
					<DraggableBar
						key={entry.id}
						x={x}
						width={barW}
						color="bg-sky-400"
						activeColor="bg-sky-600"
						label={`×${entry.count}`}
						trackHeight={TRACK_HEIGHT}
						onDragStart={() => {
							dragInitialRef.current = {
								time: entry.time,
								interval: entry.interval,
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
								const newTime = calcDraggedTime(
									dragInitialRef.current.time,
									totalDx,
									duration,
									width,
								);
								update({ time: newTime });
							} else if (mode === "resize-left") {
								const endTime =
									dragInitialRef.current.time +
									(entry.count > 1
										? (entry.count - 1) *
											dragInitialRef.current.interval
										: 0);
								const { startTime: newStart, interval: newInterval } =
									calcResizeLeft(
										dragInitialRef.current.time,
										endTime,
										entry.count,
										totalDx,
										duration,
										width,
									);
								update({ time: newStart, interval: newInterval });
							} else if (
								mode === "resize-right" &&
								entry.count > 1
							) {
								const oldEndTime =
									dragInitialRef.current.time +
									(entry.count - 1) *
										dragInitialRef.current.interval;
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
							}
						}}
						onClick={() => onEditEntry(entry.id)}
						onDelete={() =>
							onUpdateGroup({
								...group,
								balloonEntries: entries.filter(
									(e) => e.id !== entry.id,
								),
							})
						}
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
	const dragInitialTimeRef = useRef(0);

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

	// 列車の走行時間を速度から概算（表示用）
	const trainDuration = group.train
		? Math.round(3000 / (group.train.speed || 2))
		: 1500;

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
					x={timeToX(group.trainStartTime ?? 0, duration, width)}
					width={
						timeToX(
							(group.trainStartTime ?? 0) + trainDuration,
							duration,
							width,
						) -
						timeToX(group.trainStartTime ?? 0, duration, width)
					}
					color="bg-violet-500"
					activeColor="bg-violet-700"
					label={
						group.train?.direction === 1 ? "列車 →←" : "列車 ←→"
					}
					trackHeight={TRACK_HEIGHT}
					onDragStart={() => {
						dragInitialTimeRef.current =
							group.trainStartTime ?? 0;
					}}
					onDrag={(totalDx) => {
						const newTime = calcDraggedTime(
							dragInitialTimeRef.current,
							totalDx,
							duration,
							width,
						);
						onUpdateGroup({
							...group,
							trainStartTime: newTime,
						});
					}}
					onClick={onEdit}
					onDelete={() =>
						onUpdateGroup({
							...group,
							trainStartTime: null,
						})
					}
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
	onEditTargets,
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
					onClick={onEditTargets}
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
