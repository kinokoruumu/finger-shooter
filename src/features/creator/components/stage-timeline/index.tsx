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
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const TRACK_HEIGHT = 40;
const LABEL_WIDTH = 56;
const PADDING = 8;
const timeToX = (time: number, duration: number, width: number): number => {
	return PADDING + (time / duration) * (width - PADDING * 2);
};

const xToTime = (
	x: number,
	duration: number,
	width: number,
): number => {
	const t = ((x - PADDING) / (width - PADDING * 2)) * duration;
	return Math.max(0, Math.round(t / 50) * 50);
};

/** 時間ルーラー */
const TimeRuler = ({
	duration,
	width,
}: { duration: number; width: number }) => {
	const ticks: { x: number; label: string; major: boolean }[] = [];
	const step =
		duration > 5000 ? 1000 : duration > 2000 ? 500 : 250;

	for (let t = 0; t <= duration; t += step) {
		ticks.push({
			x: timeToX(t, duration, width),
			label: `${(t / 1000).toFixed(1)}s`,
			major: t % 1000 === 0,
		});
	}

	return (
		<div className="relative h-5" style={{ width }}>
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
								? "h-3 bg-amber-900/30"
								: "h-2 bg-amber-900/15",
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
			className="relative cursor-pointer hover:bg-amber-900/5"
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
				const w = Math.max(x2 - x, 4);
				return (
					<div
						key={`step-${i}`}
						className="absolute top-1 flex items-center rounded bg-amber-600 text-[9px] font-bold text-white"
						style={{
							left: x,
							width: w,
							height: TRACK_HEIGHT - 8,
						}}
					>
						<span className="truncate px-1">
							S{i + 1}({(group.targetSteps?.[i]?.targetIds ?? []).length})
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
}: {
	group: CreatorGroup;
	duration: number;
	width: number;
	onUpdateGroup: (group: CreatorGroup) => void;
}) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState<string | null>(null);

	const entries = group.balloonEntries ?? [];

	const handleTrackClick = useCallback(
		(e: React.MouseEvent) => {
			if (dragging) return;
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
		[group, entries, duration, width, dragging, onUpdateGroup],
	);

	const handleDragStart = useCallback(
		(entryId: string, e: React.PointerEvent) => {
			e.stopPropagation();
			e.preventDefault();
			setDragging(entryId);

			const onMove = (ev: PointerEvent) => {
				if (!trackRef.current) return;
				const rect = trackRef.current.getBoundingClientRect();
				const x = ev.clientX - rect.left;
				const time = xToTime(x, duration, width);
				onUpdateGroup({
					...group,
					balloonEntries: entries.map((ent) =>
						ent.id === entryId ? { ...ent, time } : ent,
					),
				});
			};

			const onUp = () => {
				setDragging(null);
				window.removeEventListener("pointermove", onMove);
				window.removeEventListener("pointerup", onUp);
			};

			window.addEventListener("pointermove", onMove);
			window.addEventListener("pointerup", onUp);
		},
		[group, entries, duration, width, onUpdateGroup],
	);

	const handleDelete = useCallback(
		(id: string) => {
			onUpdateGroup({
				...group,
				balloonEntries: entries.filter((e) => e.id !== id),
			});
		},
		[group, entries, onUpdateGroup],
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
				const w = Math.max(x2 - x, 6);
				return (
					<div
						key={entry.id}
						className={cn(
							"group absolute top-1 flex cursor-grab items-center rounded text-[9px] font-bold text-white",
							dragging === entry.id
								? "bg-sky-600 shadow-md"
								: "bg-sky-400 hover:bg-sky-500",
						)}
						style={{
							left: x,
							width: w,
							height: TRACK_HEIGHT - 8,
						}}
						onPointerDown={(e) => handleDragStart(entry.id, e)}
					>
						<span className="truncate px-1">
							×{entry.count}
						</span>
						<button
							type="button"
							className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white opacity-0 group-hover:opacity-100"
							onClick={(e) => {
								e.stopPropagation();
								handleDelete(entry.id);
							}}
						>
							×
						</button>
					</div>
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
}: {
	group: CreatorGroup;
	duration: number;
	width: number;
	onUpdateGroup: (group: CreatorGroup) => void;
}) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const handleTrackClick = useCallback(
		(e: React.MouseEvent) => {
			if (isDragging) return;
			if (!trackRef.current) return;
			if (!group.train) return;
			if (group.trainStartTime != null) return;

			const rect = trackRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const time = xToTime(x, duration, width);

			onUpdateGroup({ ...group, trainStartTime: time });
		},
		[group, duration, width, isDragging, onUpdateGroup],
	);

	const handleDragStart = useCallback(
		(e: React.PointerEvent) => {
			e.stopPropagation();
			e.preventDefault();
			setIsDragging(true);

			const onMove = (ev: PointerEvent) => {
				if (!trackRef.current) return;
				const rect = trackRef.current.getBoundingClientRect();
				const x = ev.clientX - rect.left;
				const time = xToTime(x, duration, width);
				onUpdateGroup({ ...group, trainStartTime: time });
			};

			const onUp = () => {
				setIsDragging(false);
				window.removeEventListener("pointermove", onMove);
				window.removeEventListener("pointerup", onUp);
			};

			window.addEventListener("pointermove", onMove);
			window.addEventListener("pointerup", onUp);
		},
		[group, duration, width, onUpdateGroup],
	);

	const handleDelete = useCallback(() => {
		onUpdateGroup({ ...group, trainStartTime: null });
	}, [group, onUpdateGroup]);

	const hasTrainBlock = group.train && group.trainStartTime != null;

	return (
		<div
			ref={trackRef}
			className={cn(
				"relative",
				group.train
					? hasTrainBlock
						? "cursor-default"
						: "cursor-crosshair"
					: "cursor-default",
			)}
			style={{ height: TRACK_HEIGHT, width }}
			onClick={handleTrackClick}
		>
			{hasTrainBlock && (
				<div
					className={cn(
						"group absolute top-1 flex cursor-grab items-center rounded text-[9px] font-bold text-white",
						isDragging
							? "bg-violet-600 shadow-md"
							: "bg-violet-500 hover:bg-violet-600",
					)}
					style={{
						left: timeToX(group.trainStartTime ?? 0, duration, width),
						width: 60,
						height: TRACK_HEIGHT - 8,
					}}
					onPointerDown={handleDragStart}
				>
					<span className="truncate px-1">
						{group.train?.direction === 1 ? "→←" : "←→"}
					</span>
					<button
						type="button"
						className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white opacity-0 group-hover:opacity-100"
						onClick={(e) => {
							e.stopPropagation();
							handleDelete();
						}}
					>
						×
					</button>
				</div>
			)}
			{!group.train && (
				<span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-900/20">
					配置タブで列車を追加
				</span>
			)}
			{group.train && !hasTrainBlock && (
				<span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-900/20">
					クリックで出現位置を設定
				</span>
			)}
		</div>
	);
};

export const StageTimeline = ({ group, onUpdateGroup, onEditTargets }: Props) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(600);

	const duration = calcGroupDuration(group);
	const timelineWidth = containerWidth - LABEL_WIDTH;

	// コンテナ幅の監視
	const measureRef = useCallback((node: HTMLDivElement | null) => {
		if (!node) return;
		containerRef.current = node;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setContainerWidth(entry.contentRect.width);
			}
		});
		observer.observe(node);
		setContainerWidth(node.clientWidth);
		return () => observer.disconnect();
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
			{/* ルーラー行 */}
			<div className="flex border-b border-amber-900/5">
				<div
					className="shrink-0 border-r border-amber-900/5"
					style={{ width: LABEL_WIDTH }}
				/>
				<TimeRuler duration={duration} width={timelineWidth} />
			</div>

			{/* トラック行 */}
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
