import { Button } from "@/components/ui/button";
import type { CreatorTargetGroup } from "../../types";
import { EditorCanvas } from "../editor-canvas";
import { usePreviewPlayer } from "../preview-player/hooks";
import { PreviewScene } from "../preview-player/internal/preview-scene";
import { useAnimationEditor } from "./hooks";
import { StepPanel } from "./internal/step-panel";

type Props = {
	group: CreatorTargetGroup;
	onUpdateGroup: (group: CreatorTargetGroup) => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const AnimationEditor = ({ group, onUpdateGroup }: Props) => {
	const {
		activeStepIndex,
		setActiveStepIndex,
		ghostTargetIds,
		targetLabels,
		handleTargetClick,
		handleAddStep,
		handleDeleteStep,
		handleIntervalChange,
		handleStepDelayChange,
		handleRemoveTarget,
	} = useAnimationEditor(group, onUpdateGroup);

	const {
		state: previewState,
		elapsedMs,
		spawns,
		totalDuration,
		play,
		stop,
	} = usePreviewPlayer(group);

	const isPreviewPlaying = previewState === "playing";

	return (
		<div className="space-y-4">
			<EditorCanvas
				targets={isPreviewPlaying ? [] : group.targets}
				onCellClick={() => {}}
				onCellRightClick={() => {}}
				ghostTargetIds={isPreviewPlaying ? undefined : ghostTargetIds}
				targetLabels={isPreviewPlaying ? undefined : targetLabels}
				onTargetClick={isPreviewPlaying ? undefined : handleTargetClick}
				showGrid={!isPreviewPlaying}
			>
				{isPreviewPlaying && (
					<PreviewScene
						spawns={spawns}
						elapsedMs={elapsedMs}
						isPlaying={isPreviewPlaying}
					/>
				)}
			</EditorCanvas>

			{/* プレビューコントロール */}
			<div className="flex items-center gap-3" style={rf}>
				{!isPreviewPlaying ? (
					<Button
						onClick={play}
						size="sm"
						className="bg-amber-900 font-bold text-white hover:bg-amber-800"
						disabled={spawns.length === 0}
					>
						▶ プレビュー再生
					</Button>
				) : (
					<Button onClick={stop} size="sm" variant="outline">
						■ 停止
					</Button>
				)}
				{isPreviewPlaying && totalDuration > 0 && (
					<div className="flex-1">
						<div className="h-1.5 overflow-hidden rounded-full bg-amber-900/10">
							<div
								className="h-full rounded-full bg-amber-500 transition-all"
								style={{
									width: `${Math.min(100, (elapsedMs / totalDuration) * 100)}%`,
								}}
							/>
						</div>
					</div>
				)}
				{!isPreviewPlaying && (
					<span className="text-amber-900/40 text-xs">
						{spawns.length}個のスポーン
					</span>
				)}
			</div>

			{/* ステップ管理（プレビュー中は非表示） */}
			{!isPreviewPlaying && (
				<StepPanel
					steps={group.steps}
					stepDelay={group.stepDelay}
					targets={group.targets}
					activeStepIndex={activeStepIndex}
					onActiveStepChange={setActiveStepIndex}
					onAddStep={handleAddStep}
					onDeleteStep={handleDeleteStep}
					onIntervalChange={handleIntervalChange}
					onStepDelayChange={handleStepDelayChange}
					onRemoveTarget={handleRemoveTarget}
				/>
			)}
		</div>
	);
};
