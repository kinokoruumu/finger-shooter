import { Canvas } from "@react-three/fiber";
import type { CreatorTarget } from "../../types";
import { GridGuide } from "./internal/grid-guide";
import { StaticTarget } from "./internal/static-target";

type SceneProps = {
	targets: CreatorTarget[];
	onCellClick: (gx: number, gy: number) => void;
	onCellRightClick: (gx: number, gy: number) => void;
	ghostTargetIds?: Set<string>;
	targetLabels?: Map<string, string>;
	onTargetClick?: (targetId: string) => void;
	showGrid?: boolean;
	children?: React.ReactNode;
};

/** Canvas 内部のシーン（Canvas の外で使う） */
export const EditorScene = ({
	targets,
	onCellClick,
	onCellRightClick,
	ghostTargetIds,
	targetLabels,
	onTargetClick,
	showGrid = true,
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
			{targets.map((t) => {
				const isGhost = ghostTargetIds?.has(t.id) ?? false;
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
						<StaticTarget target={t} ghost={isGhost} label={label} />
					</group>
				);
			})}
			{children}
		</group>
	);
};

type CanvasWrapperProps = {
	children: React.ReactNode;
};

/** Canvas コンテナ。StageEditor で1つだけ保持する。 */
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
