import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DragMode = "move" | "resize-left" | "resize-right" | "resize-spawn";

type Props = {
	x: number;
	width: number;
	color: string;
	activeColor: string;
	label: string;
	trackHeight: number;
	/** バー内の割合: [0, delayEnd] = 待機, [delayEnd, spawnEnd] = 出現, [spawnEnd, 1] = 表示残り */
	delayRatio?: number;
	spawnRatio?: number;
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
	delayRatio,
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

	const actualWidth = Math.max(barWidth, 24);
	const hasResize = !!onDrag;

	return (
		<div
			data-testid="draggable-bar"
			className={cn(
				"group absolute flex touch-none select-none items-center overflow-hidden rounded-md text-[10px] font-bold text-white transition-colors",
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
			{/* 3色表示: 待機 | 出現期間 | 表示残り */}
			{spawnRatio != null && (() => {
				const dR = delayRatio ?? 0;
				const sR = Math.min(spawnRatio, 1);
				return (
					<>
						{/* 待機（最も薄い） */}
						{dR > 0 && (
							<div
								className={cn(
									"absolute top-0 bottom-0 left-0 rounded-l-md opacity-30",
									dragging ? activeColor : color,
								)}
								style={{ width: `${dR * 100}%` }}
							/>
						)}
						{/* 出現期間（濃い） */}
						<div
							className={cn(
								"absolute top-0 bottom-0",
								dR === 0 && "rounded-l-md",
								sR >= 1 && "rounded-r-md",
								dragging ? activeColor : color,
							)}
							style={{
								left: `${dR * 100}%`,
								width: `${Math.max(0, (sR - dR) * 100)}%`,
							}}
						/>
						{/* 境界B: 出現→表示残りの境界ドラッグハンドル */}
						{delayRatio != null && sR > dR && sR < 1 && onDrag && (
							<div
								data-testid="resize-spawn-handle"
								className={cn(
									"absolute top-0 bottom-0 z-20 w-3 cursor-ew-resize",
									dragging === "resize-spawn"
										? "bg-white/30"
										: "bg-white/10",
								)}
								style={{ left: `calc(${sR * 100}% - 6px)` }}
								onPointerDown={(e) =>
									handlePointerDown(e, "resize-spawn")
								}
							/>
						)}
						{/* 表示残り（やや薄い） */}
						{sR < 1 && (
							<div
								className={cn(
									"absolute top-0 right-0 bottom-0 flex items-center justify-end rounded-r-md opacity-60",
									dragging ? activeColor : color,
								)}
								style={{ left: `${sR * 100}%` }}
							>
								{fadeLabel && (
									<span
										className="truncate px-1.5 text-[9px] font-bold text-white"
										style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
									>
										{fadeLabel}
									</span>
								)}
							</div>
						)}
					</>
				);
			})()}

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
