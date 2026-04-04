import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DragMode = "move" | "resize-left" | "resize-right";

type Props = {
	x: number;
	width: number;
	color: string;
	activeColor: string;
	label: string;
	trackHeight: number;
	spawnRatio?: number;
	/** 薄い部分（消えるまで）のラベル */
	fadeLabel?: string;
	onDragStart?: () => void;
	onDrag?: (totalDeltaX: number, mode: DragMode) => void;
	onDragEnd?: () => void;
	onClick?: () => void;
	style?: React.CSSProperties;
};

export const DraggableBar = ({
	x,
	width: barWidth,
	color,
	activeColor,
	label,
	trackHeight,
	onDragStart,
	onDrag,
	spawnRatio,
	fadeLabel,
	onDragEnd,
	onClick,
	style: extraStyle,
}: Props) => {
	const [dragging, setDragging] = useState<DragMode | null>(null);
	const dragStartXRef = useRef(0);
	const didDragRef = useRef(false);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent, mode: DragMode) => {
			e.stopPropagation();
			e.preventDefault();
			setDragging(mode);
			dragStartXRef.current = e.clientX;
			didDragRef.current = false;
			onDragStart?.();

			const onPointerMove = (ev: PointerEvent) => {
				const totalDelta = ev.clientX - dragStartXRef.current;
				if (Math.abs(totalDelta) > 2) didDragRef.current = true;
				onDrag?.(totalDelta, mode);
			};

			const onPointerUp = () => {
				setDragging(null);
				onDragEnd?.();
				window.removeEventListener("pointermove", onPointerMove);
				window.removeEventListener("pointerup", onPointerUp);
			};

			window.addEventListener("pointermove", onPointerMove);
			window.addEventListener("pointerup", onPointerUp);
		},
		[onDragStart, onDrag, onDragEnd],
	);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (didDragRef.current) return;
			onClick?.();
		},
		[onClick],
	);

	const cursorForDrag =
		dragging === "move"
			? "grabbing"
			: dragging
				? "ew-resize"
				: "grab";

	const actualWidth = Math.max(barWidth, 48);
	const hasResize = !!onDrag;

	return (
		<div
			data-testid="draggable-bar"
			className={cn(
				"group absolute flex items-center rounded-md text-[10px] font-bold text-white transition-colors",
				spawnRatio == null && (dragging ? activeColor : color),
			)}
			style={{
				left: x,
				width: actualWidth,
				height: trackHeight - 8,
				cursor: cursorForDrag,
				...extraStyle,
			}}
			onPointerDown={(e) => handlePointerDown(e, "move")}
			onClick={handleClick}
		>
			{/* 2色表示 */}
			{spawnRatio != null && (
				<>
					<div
						className={cn(
							"absolute top-0 bottom-0 left-0 rounded-l-md",
							dragging ? activeColor : color,
						)}
						style={{ width: `${Math.min(100, spawnRatio * 100)}%` }}
					/>
					<div
						className={cn(
							"absolute top-0 right-0 bottom-0 flex items-center justify-end opacity-40",
							spawnRatio === 0 ? "rounded-md" : "rounded-r-md",
							dragging ? activeColor : color,
						)}
						style={{
							left: `${Math.min(100, spawnRatio * 100)}%`,
						}}
					>
						{fadeLabel && (
							<span
								className="truncate px-1 text-[8px] text-white/90"
								style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
							>
								{fadeLabel}
							</span>
						)}
					</div>
				</>
			)}

			{/* 左端リサイズハンドル（常時表示） */}
			{hasResize && (
				<div
					data-testid="resize-left-handle"
					className={cn(
						"absolute top-0 bottom-0 left-0 z-20 w-3 cursor-ew-resize rounded-l-md",
						dragging === "resize-left"
							? "bg-white/30"
							: "bg-white/10",
					)}
					onPointerDown={(e) => handlePointerDown(e, "resize-left")}
				/>
			)}

			<span
				className="relative z-10 truncate px-3"
				style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
			>
				{label}
			</span>

			{/* 右端リサイズハンドル（常時表示） */}
			{hasResize && (
				<div
					data-testid="resize-right-handle"
					className={cn(
						"absolute top-0 right-0 bottom-0 z-20 w-3 cursor-ew-resize rounded-r-md",
						dragging === "resize-right"
							? "bg-white/30"
							: "bg-white/10",
					)}
					onPointerDown={(e) =>
						handlePointerDown(e, "resize-right")
					}
				/>
			)}
		</div>
	);
};
