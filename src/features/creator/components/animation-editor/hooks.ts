import { useCallback, useMemo, useState } from "react";
import type { CreatorAnimationStep, CreatorGroup } from "../../types";

export const useAnimationEditor = (
	group: CreatorGroup,
	onUpdateGroup: (group: CreatorGroup) => void,
) => {
	const [activeStepIndex, setActiveStepIndex] = useState(0);

	// 全ステップに登録済みの的ID
	const registeredIds = useMemo(() => {
		const ids = new Set<string>();
		for (const step of group.steps) {
			for (const tid of step.targetIds) ids.add(tid);
		}
		return ids;
	}, [group.steps]);

	// 未登録の的 → 半透明表示
	const ghostTargetIds = useMemo(() => {
		const ids = new Set<string>();
		for (const t of group.targets) {
			if (!registeredIds.has(t.id)) ids.add(t.id);
		}
		return ids;
	}, [group.targets, registeredIds]);

	// 他ステップに属する的 → disabled 表示
	const disabledTargetIds = useMemo(() => {
		const ids = new Set<string>();
		for (let i = 0; i < group.steps.length; i++) {
			if (i === activeStepIndex) continue;
			for (const tid of group.steps[i].targetIds) ids.add(tid);
		}
		return ids;
	}, [group.steps, activeStepIndex]);

	// アクティブステップ内の的に番号ラベル
	const targetLabels = useMemo(() => {
		const labels = new Map<string, string>();
		const activeStep = group.steps[activeStepIndex];
		if (!activeStep) return labels;
		for (let i = 0; i < activeStep.targetIds.length; i++) {
			labels.set(activeStep.targetIds[i], String(i + 1));
		}
		return labels;
	}, [group.steps, activeStepIndex]);

	// 的クリック: アクティブステップの targetIds に追加/除外
	const handleTargetClick = useCallback(
		(targetId: string) => {
			const steps = [...group.steps];
			if (activeStepIndex >= steps.length) return;

			const step = steps[activeStepIndex];

			if (step.targetIds.includes(targetId)) {
				// このステップから除外
				steps[activeStepIndex] = {
					...step,
					targetIds: step.targetIds.filter(
						(id) => id !== targetId,
					),
				};
			} else {
				// 他のステップから除外してからこのステップに追加
				const newSteps = steps.map((s, i) => {
					if (i === activeStepIndex) return s;
					return {
						...s,
						targetIds: s.targetIds.filter(
							(id) => id !== targetId,
						),
					};
				});
				newSteps[activeStepIndex] = {
					...newSteps[activeStepIndex],
					targetIds: [
						...newSteps[activeStepIndex].targetIds,
						targetId,
					],
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
			targetInterval: 100,
			balloonCount: 0,
			balloonInterval: 500,
			trainStart: false,
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

	const handleStepUpdate = useCallback(
		(stepIndex: number, update: Partial<CreatorAnimationStep>) => {
			// trainStart を true にする場合、他のステップは false に
			if (update.trainStart) {
				const steps = group.steps.map((s, i) => ({
					...s,
					trainStart: false,
					...(i === stepIndex ? update : {}),
				}));
				onUpdateGroup({ ...group, steps });
				return;
			}
			const steps = group.steps.map((s, i) =>
				i === stepIndex ? { ...s, ...update } : s,
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
					? {
							...s,
							targetIds: s.targetIds.filter(
								(id) => id !== targetId,
							),
						}
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
		handleStepUpdate,
		handleStepDelayChange,
		handleRemoveTarget,
	};
};
