import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
	x: number;
	width: number;
	color: string;
	activeColor: string;
	label: string;
	trackHeight: number;
	onDragStart?: () => void;
	onDrag?: (totalDeltaX: number, mode: "move" | "resize") => void;
	onDragEnd?: () => void;
	onClick?: () => void;
	onDelete?: () => void;
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
	onDragEnd,
	onClick,
	onDelete,
}: Props) => {
	const [dragging, setDragging] = useState<"move" | "resize" | null>(null);
	const dragStartXRef = useRef(0);
	const didDragRef = useRef(false);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent, mode: "move" | "resize") => {
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

	return (
		<div
			data-testid="draggable-bar"
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
			{onDrag && (
				<div
					data-testid="resize-handle"
					className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize rounded-r-md hover:bg-white/20"
					onPointerDown={(e) => handlePointerDown(e, "resize")}
				/>
			)}

			{/* 削除ボタン */}
			{onDelete && (
				<button
					type="button"
					data-testid="delete-button"
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
