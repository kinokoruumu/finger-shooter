import { useCallback, useMemo, useState } from "react";
import type { CreatorAnimationStep, CreatorGroup } from "../../types";

export type SceneContentProps = {
	ghostTargetIds: Set<string>;
	targetLabels: Map<string, string>;
	onTargetClick: (targetId: string) => void;
};

export const useAnimationEditor = (
	group: CreatorGroup,
	onUpdateGroup: (group: CreatorGroup) => void,
) => {
	const [activeStepIndex, setActiveStepIndex] = useState(0);

	// 全ステップに登録済みの的/風船ID
	const registeredIds = useMemo(() => {
		const ids = new Set<string>();
		for (const step of group.steps) {
			for (const tid of step.targetIds) {
				ids.add(tid);
			}
		}
		return ids;
	}, [group.steps]);

	// 未登録の的/風船 → 半透明表示（クリックで追加可能）
	const ghostTargetIds = useMemo(() => {
		const ids = new Set<string>();
		for (const t of group.targets) {
			if (!registeredIds.has(t.id)) ids.add(t.id);
		}
		for (const b of group.balloons) {
			if (!registeredIds.has(b.id)) ids.add(b.id);
		}
		return ids;
	}, [group.targets, group.balloons, registeredIds]);

	// 他ステップに属する的/風船 → disabled 表示
	const disabledTargetIds = useMemo(() => {
		const ids = new Set<string>();
		for (let i = 0; i < group.steps.length; i++) {
			if (i === activeStepIndex) continue;
			for (const tid of group.steps[i].targetIds) {
				ids.add(tid);
			}
		}
		return ids;
	}, [group.steps, activeStepIndex]);

	// アクティブステップ内の的/風船に番号ラベル
	const targetLabels = useMemo(() => {
		const labels = new Map<string, string>();
		const activeStep = group.steps[activeStepIndex];
		if (!activeStep) return labels;
		for (let i = 0; i < activeStep.targetIds.length; i++) {
			labels.set(activeStep.targetIds[i], String(i + 1));
		}
		return labels;
	}, [group.steps, activeStepIndex]);

	const handleTargetClick = useCallback(
		(targetId: string) => {
			const steps = [...group.steps];
			if (activeStepIndex >= steps.length) return;

			const step = steps[activeStepIndex];
			if (step.targetIds.includes(targetId)) {
				steps[activeStepIndex] = {
					...step,
					targetIds: step.targetIds.filter((id) => id !== targetId),
				};
			} else {
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
		disabledTargetIds,
		targetLabels,
		handleTargetClick,
		handleAddStep,
		handleDeleteStep,
		handleIntervalChange,
		handleStepDelayChange,
		handleRemoveTarget,
	};
};
