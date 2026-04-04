import { Canvas } from "@react-three/fiber";
import type { CreatorTarget } from "../../types";
import { GridGuide } from "./internal/grid-guide";
import { StaticTarget } from "./internal/static-target";

type Props = {
	targets: CreatorTarget[];
	onCellClick: (gx: number, gy: number) => void;
	onCellRightClick: (gx: number, gy: number) => void;
	/** アニメーション画面用: 半透明表示する的のID */
	ghostTargetIds?: Set<string>;
	/** アニメーション画面用: 番号ラベルのマップ(id → 表示番号) */
	targetLabels?: Map<string, string>;
	/** アニメーション画面用: 的クリック時 */
	onTargetClick?: (targetId: string) => void;
	/** グリッドガイド表示 */
	showGrid?: boolean;
	/** 追加の3Dコンテンツ（プレビュー用） */
	children?: React.ReactNode;
};

const EditorScene = ({
	targets,
	onCellClick,
	onCellRightClick,
	ghostTargetIds,
	targetLabels,
	onTargetClick,
	showGrid = true,
	children,
}: Props) => {
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

export const EditorCanvas = (props: Props) => {
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
				<EditorScene {...props} />
			</Canvas>
		</div>
	);
};
