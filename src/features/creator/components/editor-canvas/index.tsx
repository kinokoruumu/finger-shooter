import { Text } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import type * as THREE from "three";
import type { CreatorBalloon, CreatorTarget } from "../../types";
import { createScreenToWorld } from "@/features/game/utils/screen-to-world";
import { GridGuide } from "./internal/grid-guide";
import { StaticTarget } from "./internal/static-target";

type SceneProps = {
	targets: CreatorTarget[];
	balloons: CreatorBalloon[];
	onCellClick: (gx: number, gy: number) => void;
	onCellRightClick: (gx: number, gy: number) => void;
	onBalloonAreaClick?: (nx: number) => void;
	onBalloonClick?: (id: string) => void;
	ghostTargetIds?: Set<string>;
	disabledTargetIds?: Set<string>;
	targetLabels?: Map<string, string>;
	onTargetClick?: (targetId: string) => void;
	showGrid?: boolean;
	showBalloonArea?: boolean;
	children?: React.ReactNode;
};

/** 風船の位置マーカー */
const BalloonMarker = ({
	balloon,
	ghost,
	disabled,
	label,
	onClick,
}: {
	balloon: CreatorBalloon;
	ghost?: boolean;
	disabled?: boolean;
	label?: string;
	onClick?: () => void;
}) => {
	const { camera } = useThree();

	const screenToWorld = useMemo(
		() => createScreenToWorld(camera as THREE.PerspectiveCamera),
		[camera],
	);

	const position = useMemo((): [number, number, number] => {
		const [worldX] = screenToWorld(balloon.nx, 0.5, -18);
		const [, worldY] = screenToWorld(0.5, 0.85, -18);
		return [worldX, worldY, -18];
	}, [balloon.nx, screenToWorld]);

	const scale = disabled ? 0.6 : 1;
	const opacity = ghost ? 0.4 : disabled ? 0.5 : 1;

	return (
		<group
			position={position}
			onClick={(e) => {
				if (onClick) {
					e.stopPropagation();
					onClick();
				}
			}}
		>
			{/* 風船の簡易表示（楕円 + 紐） */}
			<group scale={scale}>
				<mesh>
					<sphereGeometry args={[1.2, 16, 16]} />
					<meshStandardMaterial
						color="#44aaff"
						transparent
						opacity={opacity}
					/>
				</mesh>
				<mesh position={[0, -1.5, 0]}>
					<cylinderGeometry args={[0.03, 0.03, 1, 4]} />
					<meshBasicMaterial
						color="#888888"
						transparent
						opacity={opacity * 0.5}
					/>
				</mesh>
			</group>
			{label && (
				<Text
					position={[0, 2, 0.1]}
					fontSize={1}
					color="#ffffff"
					fontWeight={900}
					anchorX="center"
					anchorY="middle"
					outlineWidth={0.06}
					outlineColor="#000000"
				>
					{label}
				</Text>
			)}
		</group>
	);
};

/** Canvas下部の風船配置クリック領域 */
const BalloonClickArea = ({
	onClick,
}: {
	onClick: (nx: number) => void;
}) => {
	const { camera } = useThree();

	const screenToWorld = useMemo(
		() => createScreenToWorld(camera as THREE.PerspectiveCamera),
		[camera],
	);

	const area = useMemo(() => {
		const [leftX] = screenToWorld(0.1, 0.5, -18);
		const [rightX] = screenToWorld(0.9, 0.5, -18);
		const [, y] = screenToWorld(0.5, 0.85, -18);
		const width = rightX - leftX;
		const centerX = (leftX + rightX) / 2;
		return { centerX, y, width };
	}, [screenToWorld]);

	return (
		<mesh
			position={[area.centerX, area.y, -18.1]}
			onClick={(e) => {
				e.stopPropagation();
				// クリック位置からnxを逆算
				const [leftX] = screenToWorld(0.1, 0.5, -18);
				const [rightX] = screenToWorld(0.9, 0.5, -18);
				const nx = 0.1 + ((e.point.x - leftX) / (rightX - leftX)) * 0.8;
				const clamped = Math.max(0.1, Math.min(0.9, nx));
				onClick(clamped);
			}}
		>
			<planeGeometry args={[area.width, 3]} />
			<meshBasicMaterial color="#44aaff" transparent opacity={0.06} />
		</mesh>
	);
};

export const EditorScene = ({
	targets,
	balloons,
	onCellClick,
	onCellRightClick,
	onBalloonAreaClick,
	onBalloonClick,
	ghostTargetIds,
	disabledTargetIds,
	targetLabels,
	onTargetClick,
	showGrid = true,
	showBalloonArea = false,
	children,
}: SceneProps) => {
	return (
		<group>
			<ambientLight intensity={0.6} />
			<directionalLight position={[5, 10, 5]} intensity={0.8} />
			{showGrid && (
				<GridGuide
					onCellClick={onCellClick}
					onCellRightClick={onCellRightClick}
				/>
			)}
			{showBalloonArea && onBalloonAreaClick && (
				<BalloonClickArea onClick={onBalloonAreaClick} />
			)}
			{targets.map((t) => {
				const isGhost = ghostTargetIds?.has(t.id) ?? false;
				const isDisabled = disabledTargetIds?.has(t.id) ?? false;
				const label = targetLabels?.get(t.id);
				return (
					<group
						key={t.id}
						onClick={(e) => {
							if (onTargetClick) {
								e.stopPropagation();
								onTargetClick(t.id);
							}
						}}
					>
						<StaticTarget
							target={t}
							ghost={isGhost}
							disabled={isDisabled}
							label={label}
						/>
					</group>
				);
			})}
			{balloons.map((b) => {
				const isGhost = ghostTargetIds?.has(b.id) ?? false;
				const isDisabled = disabledTargetIds?.has(b.id) ?? false;
				const label = targetLabels?.get(b.id);
				return (
					<BalloonMarker
						key={b.id}
						balloon={b}
						ghost={isGhost}
						disabled={isDisabled}
						label={label}
						onClick={() => {
							if (onBalloonClick) onBalloonClick(b.id);
							else if (onTargetClick) onTargetClick(b.id);
						}}
					/>
				);
			})}
			{children}
		</group>
	);
};

type CanvasWrapperProps = {
	children: React.ReactNode;
};

export const EditorCanvasWrapper = ({ children }: CanvasWrapperProps) => {
	return (
		<div
			className="relative aspect-video w-full overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat"
			style={{ backgroundImage: "url('/images/bg.png')" }}
		>
			<Canvas
				camera={{ position: [0, 0, 5], fov: 60 }}
				gl={{ alpha: true }}
				style={{ background: "transparent" }}
				onContextMenu={(e) => e.preventDefault()}
			>
				{children}
			</Canvas>
		</div>
	);
};
