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
	scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
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
	scrollContainerRef,
	style: extraStyle,
}: Props) => {
	const [dragging, setDragging] = useState<DragMode | null>(null);
	const dragStartXRef = useRef(0);
	const didDragRef = useRef(false);
	const autoScrollRef = useRef<number>(0);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent, mode: DragMode) => {
			e.stopPropagation();
			e.preventDefault();
			setDragging(mode);
			didDragRef.current = false;
			onDragStart?.();

			const container = scrollContainerRef?.current;
			const initialScroll = container?.scrollLeft ?? 0;
			const initialClientX = e.clientX;
			// スクロール補正付きの開始位置
			dragStartXRef.current = initialClientX + initialScroll;
			let lastClientX = initialClientX;

			const EDGE_ZONE = 40;
			const SCROLL_SPEED = 8;

			// スクロール補正付きの delta を計算
			const calcDelta = (clientX: number) => {
				const currentScroll = container?.scrollLeft ?? 0;
				return (clientX + currentScroll) - dragStartXRef.current;
			};

			const startAutoScroll = (clientX: number) => {
				if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
				if (!container) return;

				const rect = container.getBoundingClientRect();
				const leftDist = clientX - rect.left;
				const rightDist = rect.right - clientX;

				if (rightDist < EDGE_ZONE && rightDist > 0) {
					const speed = SCROLL_SPEED * (1 - rightDist / EDGE_ZONE);
					const tick = () => {
						container.scrollLeft += speed;
						// スクロール中もバー位置を更新
						const delta = calcDelta(lastClientX);
						onDrag?.(delta, mode);
						autoScrollRef.current = requestAnimationFrame(tick);
					};
					autoScrollRef.current = requestAnimationFrame(tick);
				} else if (leftDist < EDGE_ZONE && leftDist > 0) {
					const speed = SCROLL_SPEED * (1 - leftDist / EDGE_ZONE);
					const tick = () => {
						container.scrollLeft -= speed;
						const delta = calcDelta(lastClientX);
						onDrag?.(delta, mode);
						autoScrollRef.current = requestAnimationFrame(tick);
					};
					autoScrollRef.current = requestAnimationFrame(tick);
				} else {
					autoScrollRef.current = 0;
				}
			};

			const onPointerMove = (ev: PointerEvent) => {
				lastClientX = ev.clientX;
				const delta = calcDelta(ev.clientX);
				if (Math.abs(delta) > 2) didDragRef.current = true;
				onDrag?.(delta, mode);
				startAutoScroll(ev.clientX);
			};

			const onPointerUp = () => {
				setDragging(null);
				onDragEnd?.();
				if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
				autoScrollRef.current = 0;
				window.removeEventListener("pointermove", onPointerMove);
				window.removeEventListener("pointerup", onPointerUp);
			};

			window.addEventListener("pointermove", onPointerMove);
			window.addEventListener("pointerup", onPointerUp);
		},
		[onDragStart, onDrag, onDragEnd, scrollContainerRef],
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
