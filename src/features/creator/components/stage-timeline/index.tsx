import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type {
	CreatorBalloonEntry,
	CreatorGroup,
} from "../../types";
import {
	calcGroupDuration,
	calcTargetStepTimes,
} from "../../utils/timeline-calc";

type Props = {
	group: CreatorGroup;
	onUpdateGroup: (group: CreatorGroup) => void;
	onEditTargets: () => void;
	onEditBalloon: (entryId: string) => void;
	onEditTrain: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const TRACK_HEIGHT = 44;
const LABEL_WIDTH = 56;
const PADDING = 12;
const SNAP_MS = 50;

const timeToX = (time: number, duration: number, width: number): number =>
	PADDING + (time / duration) * (width - PADDING * 2);

const xToTime = (x: number, duration: number, width: number): number => {
	const t = ((x - PADDING) / (width - PADDING * 2)) * duration;
	return Math.max(0, Math.round(t / SNAP_MS) * SNAP_MS);
};

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

/** ドラッグ可能なバー */
const DraggableBar = ({
	x,
	width: barWidth,
	color,
	activeColor,
	label,
	trackHeight,
	onMove,
	onResize,
	onClick,
	onDelete,
}: {
	x: number;
	width: number;
	color: string;
	activeColor: string;
	label: string;
	trackHeight: number;
	onMove?: (deltaX: number) => void;
	onResize?: (deltaX: number) => void;
	onClick?: () => void;
	onDelete?: () => void;
}) => {
	const [dragging, setDragging] = useState<"move" | "resize" | null>(null);
	const startXRef = useRef(0);
	const didDragRef = useRef(false);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent, mode: "move" | "resize") => {
			e.stopPropagation();
			e.preventDefault();
			setDragging(mode);
			startXRef.current = e.clientX;
			didDragRef.current = false;

			const handler = mode === "move" ? onMove : onResize;
			if (!handler) return;

			const onPointerMove = (ev: PointerEvent) => {
				const delta = ev.clientX - startXRef.current;
				if (Math.abs(delta) > 2) didDragRef.current = true;
				handler(delta);
				startXRef.current = ev.clientX;
			};

			const onPointerUp = () => {
				setDragging(null);
				window.removeEventListener("pointermove", onPointerMove);
				window.removeEventListener("pointerup", onPointerUp);
			};

			window.addEventListener("pointermove", onPointerMove);
			window.addEventListener("pointerup", onPointerUp);
		},
		[onMove, onResize],
	);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (didDragRef.current) return;
			onClick?.();
		},
		[onClick],
	);

	return (
		<div
			className={cn(
				"group absolute top-1 flex items-center rounded-md text-[10px] font-bold text-white transition-colors",
				dragging ? activeColor : color,
			)}
			style={{
				left: x,
				width: Math.max(barWidth, 8),
				height: trackHeight - 8,
				cursor: dragging === "move" ? "grabbing" : "grab",
			}}
			onPointerDown={(e) => handlePointerDown(e, "move")}
			onClick={handleClick}
		>
			<span className="truncate px-1.5">{label}</span>

			{/* 右端リサイズハンドル */}
			{onResize && (
				<div
					className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize rounded-r-md hover:bg-white/20"
					onPointerDown={(e) => handlePointerDown(e, "resize")}
				/>
			)}

			{/* 削除ボタン */}
			{onDelete && (
				<button
					type="button"
					className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100"
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
				>
					×
				</button>
			)}
		</div>
	);
};

/** 的トラック */
const TargetTrack = ({
	group,
	duration,
	width,
	onClick,
}: {
	group: CreatorGroup;
	duration: number;
	width: number;
	onClick: () => void;
}) => {
	const stepTimes = calcTargetStepTimes(group);
	const targets = group.targets ?? [];

	return (
		<div
			className="relative cursor-pointer hover:bg-amber-900/[0.03]"
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
				const count =
					(group.targetSteps?.[i]?.targetIds ?? []).length;
				return (
					<div
						key={`step-${i}`}
						className="absolute top-1 flex items-center rounded-md bg-amber-500 text-[10px] font-bold text-white"
						style={{
							left: x,
							width: w,
							height: TRACK_HEIGHT - 8,
						}}
					>
						<span className="truncate px-1.5">
							{count}個
						</span>
					</div>
				);
			})}
			{targets.length === 0 && stepTimes.length === 0 && (
				<span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-900/20">
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

	return (
		<div
			ref={trackRef}
			className="relative cursor-crosshair"
			style={{ height: TRACK_HEIGHT, width }}
			onClick={handleTrackClick}
		>
			{entries.map((entry) => {
				const x = timeToX(entry.time, duration, width);
				const endTime =
					entry.time +
					Math.max(0, entry.count - 1) * entry.interval;
				const x2 = timeToX(endTime, duration, width);
				const barW = Math.max(x2 - x, 8);

				return (
					<DraggableBar
						key={entry.id}
						x={x}
						width={barW}
						color="bg-sky-400"
						activeColor="bg-sky-600"
						label={`×${entry.count}`}
						trackHeight={TRACK_HEIGHT}
						onMove={(dx) => {
							const newTime = xToTime(
								timeToX(entry.time, duration, width) + dx,
								duration,
								width,
							);
							onUpdateGroup({
								...group,
								balloonEntries: entries.map((e) =>
									e.id === entry.id
										? { ...e, time: newTime }
										: e,
								),
							});
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
					onMove={(dx) => {
						const newTime = xToTime(
							timeToX(
								group.trainStartTime ?? 0,
								duration,
								width,
							) + dx,
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
}: Props) => {
	const [containerWidth, setContainerWidth] = useState(600);

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

	return (
		<div
			ref={measureRef}
			className="overflow-hidden rounded-xl border-2 border-amber-900/10 bg-white"
			style={rf}
		>
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
		</div>
	);
};
