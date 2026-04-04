import { useCallback, useMemo, useState } from "react";
import type { CreatorAnimationStep, CreatorTargetGroup } from "../../types";

export const useAnimationEditor = (
	group: CreatorTargetGroup,
	onUpdateGroup: (group: CreatorTargetGroup) => void,
) => {
	const [activeStepIndex, setActiveStepIndex] = useState(0);

	// アニメーション未登録の的のID
	const registeredTargetIds = useMemo(() => {
		const ids = new Set<string>();
		for (const step of group.steps) {
			for (const tid of step.targetIds) {
				ids.add(tid);
			}
		}
		return ids;
	}, [group.steps]);

	const ghostTargetIds = useMemo(() => {
		const ids = new Set<string>();
		for (const t of group.targets) {
			if (!registeredTargetIds.has(t.id)) {
				ids.add(t.id);
			}
		}
		return ids;
	}, [group.targets, registeredTargetIds]);

	// 番号ラベルのマップ
	const targetLabels = useMemo(() => {
		const labels = new Map<string, string>();
		let counter = 1;
		for (const step of group.steps) {
			for (const tid of step.targetIds) {
				labels.set(tid, String(counter));
				counter++;
			}
		}
		return labels;
	}, [group.steps]);

	const handleTargetClick = useCallback(
		(targetId: string) => {
			const steps = [...group.steps];
			if (activeStepIndex >= steps.length) return;

			const step = steps[activeStepIndex];
			// 既にこのステップに登録済みなら除外
			if (step.targetIds.includes(targetId)) {
				steps[activeStepIndex] = {
					...step,
					targetIds: step.targetIds.filter((id) => id !== targetId),
				};
			} else {
				// 他のステップからも除外してからこのステップに追加
				const newSteps = steps.map((s, i) => {
					if (i === activeStepIndex) return s;
					return {
						...s,
						targetIds: s.targetIds.filter((id) => id !== targetId),
					};
				});
				newSteps[activeStepIndex] = {
					...newSteps[activeStepIndex],
					targetIds: [...newSteps[activeStepIndex].targetIds, targetId],
				};
				onUpdateGroup({ ...group, steps: newSteps });
				return;
			}
			onUpdateGroup({ ...group, steps });
		},
		[group, activeStepIndex, onUpdateGroup],
	);

	const handleAddStep = useCallback(() => {
		const newStep: CreatorAnimationStep = {
			targetIds: [],
			interval: 100,
		};
		const steps = [...group.steps, newStep];
		onUpdateGroup({ ...group, steps });
		setActiveStepIndex(steps.length - 1);
	}, [group, onUpdateGroup]);

	const handleDeleteStep = useCallback(
		(index: number) => {
			const steps = group.steps.filter((_, i) => i !== index);
			onUpdateGroup({ ...group, steps });
			if (activeStepIndex >= steps.length) {
				setActiveStepIndex(Math.max(0, steps.length - 1));
			}
		},
		[group, activeStepIndex, onUpdateGroup],
	);

	const handleIntervalChange = useCallback(
		(stepIndex: number, interval: number) => {
			const steps = group.steps.map((s, i) =>
				i === stepIndex ? { ...s, interval } : s,
			);
			onUpdateGroup({ ...group, steps });
		},
		[group, onUpdateGroup],
	);

	const handleStepDelayChange = useCallback(
		(delay: number) => {
			onUpdateGroup({ ...group, stepDelay: delay });
		},
		[group, onUpdateGroup],
	);

	const handleRemoveTarget = useCallback(
		(stepIndex: number, targetId: string) => {
			const steps = group.steps.map((s, i) =>
				i === stepIndex
					? { ...s, targetIds: s.targetIds.filter((id) => id !== targetId) }
					: s,
			);
			onUpdateGroup({ ...group, steps });
		},
		[group, onUpdateGroup],
	);

	return {
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
	};
};
