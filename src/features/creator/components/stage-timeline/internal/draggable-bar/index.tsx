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
	/** バー内の出現期間の割合 (0-1)。指定するとバーが2色に分かれる */
	spawnRatio?: number;
	onDragStart?: () => void;
	onDrag?: (totalDeltaX: number, mode: DragMode) => void;
	onDragEnd?: () => void;
	onClick?: () => void;
	onDelete?: () => void;
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
	onDragEnd,
	onClick,
	onDelete,
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

	const actualWidth = Math.max(barWidth, 8);

	return (
		<div
			data-testid="draggable-bar"
			className={cn(
				"group absolute flex items-center overflow-hidden rounded-md text-[10px] font-bold text-white transition-colors",
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
			{/* 2色表示: 出現期間(濃) + 表示残り(薄) */}
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
							"absolute top-0 right-0 bottom-0 rounded-r-md opacity-40",
							dragging ? activeColor : color,
						)}
						style={{
							left: `${Math.min(100, spawnRatio * 100)}%`,
						}}
					/>
				</>
			)}

			{/* 左端リサイズハンドル */}
			{onDrag && (
				<div
					data-testid="resize-left-handle"
					className="absolute top-0 bottom-0 left-0 z-10 w-2 cursor-ew-resize rounded-l-md hover:bg-white/20"
					onPointerDown={(e) => handlePointerDown(e, "resize-left")}
				/>
			)}

			<span className="relative z-10 truncate px-2">{label}</span>

			{/* 右端リサイズハンドル */}
			{onDrag && (
				<div
					data-testid="resize-right-handle"
					className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize rounded-r-md hover:bg-white/20"
					onPointerDown={(e) =>
						handlePointerDown(e, "resize-right")
					}
				/>
			)}

			{/* 削除ボタン */}
			{onDelete && (
				<button
					type="button"
					data-testid="delete-button"
					className="relative z-10 ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] text-white/0 transition-colors group-hover:bg-red-500/80 group-hover:text-white"
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
