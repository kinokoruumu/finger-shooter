import { Button } from "@/components/ui/button";
import type { CreatorGroup } from "../../types";
import type { useAnimationEditor } from "./hooks";
import { StepPanel } from "./internal/step-panel";

type Props = {
	group: CreatorGroup;
	animEditor: ReturnType<typeof useAnimationEditor>;
	isPreviewPlaying: boolean;
	onPlay: () => void;
	onStop: () => void;
	spawnCount: number;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const AnimationEditor = ({
	group,
	animEditor,
	isPreviewPlaying,
	onPlay,
	onStop,
	spawnCount,
}: Props) => {
	return (
		<div className="space-y-4">
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

			{!isPreviewPlaying && (
				<StepPanel
					steps={group.steps}
					stepDelay={group.stepDelay}
					targets={group.targets}
					balloons={group.balloons ?? []}
					train={group.train}
					activeStepIndex={animEditor.activeStepIndex}
					onActiveStepChange={animEditor.setActiveStepIndex}
					onAddStep={animEditor.handleAddStep}
					onDeleteStep={animEditor.handleDeleteStep}
					onStepUpdate={animEditor.handleStepUpdate}
					onStepDelayChange={animEditor.handleStepDelayChange}
					onRemoveItem={animEditor.handleRemoveItem}
				/>
			)}
		</div>
	);
};
