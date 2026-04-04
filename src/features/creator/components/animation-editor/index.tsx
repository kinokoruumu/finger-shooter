import { Button } from "@/components/ui/button";
import type { CreatorGroup } from "../../types";
import { useAnimationEditor } from "./hooks";
import { StepPanel } from "./internal/step-panel";

type Props = {
	group: CreatorGroup;
	onUpdateGroup: (group: CreatorGroup) => void;
	isPreviewPlaying: boolean;
	onPlay: () => void;
	onStop: () => void;
	spawnCount: number;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const AnimationEditor = ({
	group,
	onUpdateGroup,
	isPreviewPlaying,
	onPlay,
	onStop,
	spawnCount,
}: Props) => {
	const {
		activeStepIndex,
		setActiveStepIndex,
		handleAddStep,
		handleDeleteStep,
		handleIntervalChange,
		handleStepDelayChange,
		handleRemoveTarget,
	} = useAnimationEditor(group, onUpdateGroup);

	return (
		<div className="space-y-4">
			{/* プレビューコントロール */}
			<div className="flex items-center gap-3" style={rf}>
				{!isPreviewPlaying ? (
					<Button
						onClick={onPlay}
						size="sm"
						className="bg-amber-900 font-bold text-white hover:bg-amber-800"
						disabled={spawnCount === 0}
					>
						▶ プレビュー再生
					</Button>
				) : (
					<Button onClick={onStop} size="sm" variant="outline">
						■ 停止
					</Button>
				)}
				<span className="text-amber-900/40 text-xs">
					{spawnCount}個のスポーン
				</span>
			</div>

			{/* ステップ管理（プレビュー中は非表示） */}
			{!isPreviewPlaying && (
				<StepPanel
					steps={group.steps}
					stepDelay={group.stepDelay}
					targets={group.targets}
					balloons={group.balloons ?? []}
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
