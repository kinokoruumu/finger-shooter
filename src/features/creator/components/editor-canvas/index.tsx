import { Canvas } from "@react-three/fiber";
import { Rails } from "@/features/game/components/rails";
import { cn } from "@/lib/utils";
import type { CreatorTarget } from "../../types";
import { GridGuide } from "./internal/grid-guide";
import { StaticTarget } from "./internal/static-target";

const TRAIN_Y = -5;
const RAILS_Y = TRAIN_Y - (1.1 + 0.35) * 4.5;
const RAILS_Z = -22;

type SceneProps = {
	targets: CreatorTarget[];
	onCellClick: (gx: number, gy: number) => void;
	onCellRightClick: (gx: number, gy: number) => void;
	ghostTargetIds?: Set<string>;
	disabledTargetIds?: Set<string>;
	targetLabels?: Map<string, string>;
	onTargetClick?: (targetId: string) => void;
	showGrid?: boolean;
	children?: React.ReactNode;
};

export const EditorScene = ({
	targets,
	onCellClick,
	onCellRightClick,
	ghostTargetIds,
	disabledTargetIds,
	targetLabels,
	onTargetClick,
	showGrid = true,
	children,
}: SceneProps) => {
	return (
		<group>
			<ambientLight intensity={0.6} />
			<directionalLight position={[5, 10, 5]} intensity={0.8} />
			<Rails y={RAILS_Y} z={RAILS_Z} />
			{showGrid && (
				<GridGuide
					onCellClick={onCellClick}
					onCellRightClick={onCellRightClick}
				/>
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
			{children}
		</group>
	);
};

type CanvasWrapperProps = {
	children: React.ReactNode;
	className?: string;
};

export const EditorCanvasWrapper = ({ children, className }: CanvasWrapperProps) => {
	return (
		<div
			className={cn(
				"relative w-full overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat",
				className ?? "aspect-video",
			)}
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
