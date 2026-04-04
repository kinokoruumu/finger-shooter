import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import type * as THREE from "three";
import { gridToNormalized } from "@/features/game/utils/grid-to-normalized";
import { createScreenToWorld } from "@/features/game/utils/screen-to-world";

const GRID_W = 8;
const GRID_H = 4;
const LINE_THICKNESS = 0.03;

type Props = {
	onCellClick: (gx: number, gy: number) => void;
	onCellRightClick: (gx: number, gy: number) => void;
};

export const GridGuide = ({ onCellClick, onCellRightClick }: Props) => {
	const { camera } = useThree();

	const screenToWorld = useMemo(
		() => createScreenToWorld(camera as THREE.PerspectiveCamera),
		[camera],
	);

	const cells = useMemo(() => {
		const result: { gx: number; gy: number; x: number; y: number }[] = [];
		for (let gy = 0; gy < GRID_H; gy++) {
			for (let gx = 0; gx < GRID_W; gx++) {
				const [nx, ny] = gridToNormalized(gx, gy);
				const [worldX] = screenToWorld(nx, 0.5, -15);
				const [, worldY] = screenToWorld(0.5, ny, -15);
				result.push({ gx, gy, x: worldX, y: worldY });
			}
		}
		return result;
	}, [screenToWorld]);

	const cellSize = useMemo(() => {
		const [x0] = screenToWorld(0.2, 0.5, -15);
		const [x1] = screenToWorld(0.2 + 0.6 / 7, 0.5, -15);
		const [, y0] = screenToWorld(0.5, 0.2, -15);
		const [, y1] = screenToWorld(0.5, 0.2 + 0.55 / 3, -15);
		return { w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) };
	}, [screenToWorld]);

	// グリッドラインの座標を計算（薄い平面メッシュで描画）
	const gridLines = useMemo(() => {
		if (cells.length === 0) return { horizontal: [], vertical: [] };

		const halfW = cellSize.w / 2;
		const halfH = cellSize.h / 2;
		const minX = cells[0].x - halfW;
		const maxX = cells[GRID_W - 1].x + halfW;
		const gridWidth = maxX - minX;
		const minY = cells[(GRID_H - 1) * GRID_W].y - halfH;
		const maxY = cells[0].y + halfH;
		const gridHeight = maxY - minY;

		const horizontal: { x: number; y: number; w: number }[] = [];
		const vertical: { x: number; y: number; h: number }[] = [];

		// 水平線
		for (let gy = 0; gy <= GRID_H; gy++) {
			let y: number;
			if (gy === 0) {
				y = cells[0].y + halfH;
			} else if (gy === GRID_H) {
				y = cells[(GRID_H - 1) * GRID_W].y - halfH;
			} else {
				const above = cells[(gy - 1) * GRID_W].y;
				const below = cells[gy * GRID_W].y;
				y = (above + below) / 2;
			}
			horizontal.push({
				x: (minX + maxX) / 2,
				y,
				w: gridWidth,
			});
		}

		// 垂直線
		for (let gx = 0; gx <= GRID_W; gx++) {
			let x: number;
			if (gx === 0) {
				x = cells[0].x - halfW;
			} else if (gx === GRID_W) {
				x = cells[GRID_W - 1].x + halfW;
			} else {
				const left = cells[gx - 1].x;
				const right = cells[gx].x;
				x = (left + right) / 2;
			}
			vertical.push({
				x,
				y: (minY + maxY) / 2,
				h: gridHeight,
			});
		}

		return { horizontal, vertical };
	}, [cells, cellSize]);

	return (
		<group>
			{/* 水平グリッドライン */}
			{gridLines.horizontal.map((line, i) => (
				<mesh
					key={`h-${i}`}
					position={[line.x, line.y, -15.05]}
				>
					<planeGeometry args={[line.w, LINE_THICKNESS]} />
					<meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
				</mesh>
			))}

			{/* 垂直グリッドライン */}
			{gridLines.vertical.map((line, i) => (
				<mesh
					key={`v-${i}`}
					position={[line.x, line.y, -15.05]}
				>
					<planeGeometry args={[LINE_THICKNESS, line.h]} />
					<meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
				</mesh>
			))}

			{/* クリック用のセル */}
			{cells.map((cell) => (
				<mesh
					key={`grid-${cell.gx}-${cell.gy}`}
					position={[cell.x, cell.y, -15.1]}
					onClick={(e) => {
						e.stopPropagation();
						onCellClick(cell.gx, cell.gy);
					}}
					onContextMenu={(e) => {
						e.nativeEvent.preventDefault();
						e.stopPropagation();
						onCellRightClick(cell.gx, cell.gy);
					}}
				>
					<planeGeometry args={[cellSize.w * 0.95, cellSize.h * 0.95]} />
					<meshBasicMaterial color="#ffffff" transparent opacity={0.03} />
				</mesh>
			))}
		</group>
	);
};
