import { useCallback, useMemo, useState } from "react";
import type { CreatorAnimationStep, CreatorGroup } from "../../types";

export const useAnimationEditor = (
	group: CreatorGroup,
	onUpdateGroup: (group: CreatorGroup) => void,
) => {
	const [activeStepIndex, setActiveStepIndex] = useState(0);

	// 全ステップに登録済みの的/風船ID
	const registeredIds = useMemo(() => {
		const ids = new Set<string>();
		for (const step of group.steps) {
			for (const tid of step.targetIds) ids.add(tid);
			for (const bid of step.balloonIds) ids.add(bid);
		}
		return ids;
	}, [group.steps]);

	// 未登録の的/風船 → 半透明表示
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
			for (const tid of group.steps[i].targetIds) ids.add(tid);
			for (const bid of group.steps[i].balloonIds) ids.add(bid);
		}
		return ids;
	}, [group.steps, activeStepIndex]);

	// アクティブステップ内の的/風船に番号ラベル
	const targetLabels = useMemo(() => {
		const labels = new Map<string, string>();
		const activeStep = group.steps[activeStepIndex];
		if (!activeStep) return labels;

		let counter = 1;
		for (const tid of activeStep.targetIds) {
			labels.set(tid, `的${counter}`);
			counter++;
		}
		counter = 1;
		for (const bid of activeStep.balloonIds) {
			labels.set(bid, `風${counter}`);
			counter++;
		}
		return labels;
	}, [group.steps, activeStepIndex]);

	// 的クリック: アクティブステップの targetIds に追加/除外
	const handleTargetClick = useCallback(
		(targetId: string) => {
			const steps = [...group.steps];
			if (activeStepIndex >= steps.length) return;

			const isTarget = group.targets.some((t) => t.id === targetId);
			const isBalloon = group.balloons.some((b) => b.id === targetId);
			const field = isTarget
				? "targetIds"
				: isBalloon
					? "balloonIds"
					: null;
			if (!field) return;

			const step = steps[activeStepIndex];
			const ids = step[field] as string[];

			if (ids.includes(targetId)) {
				// このステップから除外
				steps[activeStepIndex] = {
					...step,
					[field]: ids.filter((id) => id !== targetId),
				};
			} else {
				// 他のステップから除外してからこのステップに追加
				const newSteps = steps.map((s, i) => {
					if (i === activeStepIndex) return s;
					return {
						...s,
						[field]: (s[field] as string[]).filter(
							(id) => id !== targetId,
						),
					};
				});
				newSteps[activeStepIndex] = {
					...newSteps[activeStepIndex],
					[field]: [
						...(newSteps[activeStepIndex][field] as string[]),
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
			balloonIds: [],
			balloonInterval: 100,
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

	const handleRemoveItem = useCallback(
		(
			stepIndex: number,
			itemId: string,
			field: "targetIds" | "balloonIds",
		) => {
			const steps = group.steps.map((s, i) =>
				i === stepIndex
					? {
							...s,
							[field]: (s[field] as string[]).filter(
								(id) => id !== itemId,
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
		handleRemoveItem,
	};
};
