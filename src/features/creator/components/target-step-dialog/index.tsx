import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
	CreatorGroup,
	CreatorTargetSet,
	CreatorTargetStep,
} from "../../types";
import {
	EditorCanvasWrapper,
	EditorScene,
} from "../editor-canvas";
import { EditorToolbar, type EditorMode } from "../editor-toolbar";

type Props = {
	open: boolean;
	onClose: () => void;
	group: CreatorGroup;
	targetSet: CreatorTargetSet;
	initialStepIndex?: number;
	onUpdateGroup: (group: CreatorGroup) => void;
};

type Tab = "placement" | "animation";

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const TARGET_COLORS: Record<string, string> = {
	ground: "bg-stone-600 text-white",
	"ground-gold": "bg-yellow-500 text-amber-900",
	"ground-penalty": "bg-stone-800 text-red-400",
};

const TARGET_HOVER: Record<string, string> = {
	ground: "hover:bg-stone-500",
	"ground-gold": "hover:bg-yellow-400",
	"ground-penalty": "hover:bg-stone-700",
};

export const TargetStepDialog = ({
	open,
	onClose,
	group,
	targetSet,
	initialStepIndex,
	onUpdateGroup,
}: Props) => {
	const [tab, setTab] = useState<Tab>(
		initialStepIndex != null && (targetSet.targets ?? []).length > 0
			? "animation"
			: "placement",
	);
	const [editorMode, setEditorMode] = useState<EditorMode>("ground");
	const [activeStepIndex, setActiveStepIndex] = useState(
		initialStepIndex ?? 0,
	);

	const targets = targetSet.targets ?? [];
	const steps = targetSet.steps ?? [];

	const updateSet = useCallback(
		(updater: (s: CreatorTargetSet) => CreatorTargetSet) => {
			onUpdateGroup({
				...group,
				targetSets: (group.targetSets ?? []).map((s) =>
					s.id === targetSet.id ? updater(s) : s,
				),
			});
		},
		[group, targetSet.id, onUpdateGroup],
	);

	const deleteSet = useCallback(() => {
		onUpdateGroup({
			...group,
			targetSets: (group.targetSets ?? []).filter(
				(s) => s.id !== targetSet.id,
			),
		});
		onClose();
	}, [group, targetSet.id, onUpdateGroup, onClose]);

	// --- 配置操作 ---
	const handleCellClick = useCallback(
		(gx: number, gy: number) => {
			if (tab !== "placement") return;

			const existing = targets.find(
				(t) => t.gx === gx && t.gy === gy,
			);

			if (editorMode === "delete") {
				if (!existing) return;
				updateSet((s) => ({
					...s,
					targets: s.targets.filter(
						(t) => !(t.gx === gx && t.gy === gy),
					),
					steps: s.steps.map((st) => ({
						...st,
						targetIds: st.targetIds.filter(
							(id) => id !== existing.id,
						),
					})),
				}));
				return;
			}

			if (existing) {
				if (existing.type === editorMode) {
					// 同じ種類 → 削除（トグル）
					updateSet((s) => ({
						...s,
						targets: s.targets.filter((t) => t.id !== existing.id),
						steps: s.steps.map((st) => ({
							...st,
							targetIds: st.targetIds.filter(
								(id) => id !== existing.id,
							),
						})),
					}));
				} else {
					// 別の種類 → 変更
					updateSet((s) => ({
						...s,
						targets: s.targets.map((t) =>
							t.id === existing.id
								? { ...t, type: editorMode }
								: t,
						),
					}));
				}
			} else {
				updateSet((s) => ({
					...s,
					targets: [
						...s.targets,
						{
							id: crypto.randomUUID(),
							gx,
							gy,
							type: editorMode,
							visibleDuration: 4.0,
						},
					],
				}));
			}
		},
		[tab, targets, editorMode, updateSet],
	);

	// --- アニメーション操作 ---
	const registeredIds = new Set(
		steps.flatMap((s) => s.targetIds),
	);

	const ghostTargetIds = new Set(
		targets.filter((t) => !registeredIds.has(t.id)).map((t) => t.id),
	);

	const disabledTargetIds = new Set(
		steps
			.filter((_, i) => i !== activeStepIndex)
			.flatMap((s) => s.targetIds),
	);

	const targetLabels = new Map<string, string>();
	const activeStep = steps[activeStepIndex];
	if (activeStep) {
		activeStep.targetIds.forEach((tid, i) => {
			targetLabels.set(tid, String(i + 1));
		});
	}

	const handleTargetClick = useCallback(
		(targetId: string) => {
			if (tab !== "animation") return;
			if (activeStepIndex >= steps.length) return;

			const step = steps[activeStepIndex];
			if (step.targetIds.includes(targetId)) {
				updateSet((s) => ({
					...s,
					steps: s.steps.map((st, i) =>
						i === activeStepIndex
							? {
									...st,
									targetIds: st.targetIds.filter(
										(id) => id !== targetId,
									),
								}
							: st,
					),
				}));
			} else {
				updateSet((s) => {
					const newSteps = s.steps.map((st, i) => {
						if (i === activeStepIndex) return st;
						return {
							...st,
							targetIds: st.targetIds.filter(
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
					return { ...s, steps: newSteps };
				});
			}
		},
		[tab, steps, activeStepIndex, updateSet],
	);

	const handleAddStep = useCallback(() => {
		const lastStep = steps[steps.length - 1];
		const lastEnd = lastStep
			? (lastStep.startTime ?? 0) +
				Math.max(0, lastStep.targetIds.length - 1) *
					(lastStep.interval ?? 100)
			: 0;
		const newStep: CreatorTargetStep = {
			targetIds: [],
			interval: 100,
			startTime: lastEnd + 300,
		};
		updateSet((s) => ({
			...s,
			steps: [...s.steps, newStep],
		}));
		setActiveStepIndex(steps.length);
	}, [steps, updateSet]);

	const handleDeleteStep = useCallback(
		(index: number) => {
			updateSet((s) => ({
				...s,
				steps: s.steps.filter((_, i) => i !== index),
			}));
			if (activeStepIndex >= steps.length - 1) {
				setActiveStepIndex(Math.max(0, steps.length - 2));
			}
		},
		[steps, activeStepIndex, updateSet],
	);

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="flex max-h-[90vh] max-w-[calc(100%-1rem)] flex-col overflow-hidden sm:max-w-6xl">
				<DialogHeader>
					<DialogTitle style={rf}>的の編集</DialogTitle>
				</DialogHeader>

				{/* タブ */}
				<div className="flex gap-1 rounded-lg bg-amber-100/50 p-1">
					{(
						[
							{ key: "placement", label: "配置" },
							{ key: "animation", label: "アニメーション" },
						] as const
					).map((t) => (
						<button
							key={t.key}
							type="button"
							className={cn(
								"flex-1 rounded-md px-4 py-1.5 text-sm font-bold transition-all",
								tab === t.key
									? "bg-white text-amber-900 shadow-sm"
									: "text-amber-900/40 hover:text-amber-900/60",
							)}
							style={rf}
							onClick={() => setTab(t.key)}
						>
							{t.label}
						</button>
					))}
				</div>

				{/* Canvas */}
				<div className="h-[35vh] shrink-0 sm:h-[40vh]">
				<EditorCanvasWrapper className="h-full">
					<EditorScene
						targets={targets}
						onCellClick={
							tab === "placement" ? handleCellClick : () => {}
						}
						onCellRightClick={() => {}}
						showGrid={tab === "placement"}
						ghostTargetIds={
							tab === "animation" ? ghostTargetIds : undefined
						}
						disabledTargetIds={
							tab === "animation"
								? disabledTargetIds
								: undefined
						}
						targetLabels={
							tab === "animation" ? targetLabels : undefined
						}
						onTargetClick={
							tab === "animation"
								? handleTargetClick
								: undefined
						}
					/>
				</EditorCanvasWrapper>
				</div>

				{/* 配置タブ */}
				{tab === "placement" && (
					<EditorToolbar
						currentMode={editorMode}
						onModeChange={setEditorMode}
						targetCount={targets.length}
					/>
				)}

				{/* アニメーションタブ */}
				{tab === "animation" && (
					<>
					<p className="shrink-0 text-amber-900/40 text-xs" style={rf}>
						各ステップの開始タイミングはタイムラインでドラッグ移動できます
					</p>

					<div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto" style={rf}>
							{steps.map((step, i) => {
								const isActive = i === activeStepIndex;
								return (
									<div
										key={`step-${i}`}
										className={cn(
											"cursor-pointer rounded-lg border-2 p-3 transition-all",
											isActive
												? "border-amber-800 bg-amber-50"
												: "border-amber-900/10 bg-white hover:border-amber-900/20",
										)}
										onClick={() =>
											setActiveStepIndex(i)
										}
									>
										<div
											className="flex w-full flex-wrap items-center justify-between gap-1 text-left"
										>
											<span
												className={cn(
													"font-bold text-xs",
													isActive
														? "text-amber-900"
														: "text-amber-900/50",
												)}
											>
												ステップ {i + 1}
											</span>
											<div className="flex items-center gap-2">
												<span className="text-amber-900/30 text-[10px]">
													出現間隔
												</span>
												<Input
													type="number"
													value={
														step.interval ?? 100
													}
													onChange={(e) => {
														updateSet((s) => ({
															...s,
															steps: s.steps.map(
																(st, si) =>
																	si === i
																		? {
																				...st,
																				interval:
																					Math.max(
																						0,
																						Number(
																							e
																								.target
																								.value,
																						),
																					),
																			}
																		: st,
															),
														}));
													}}
													onClick={(e) =>
														e.stopPropagation()
													}
													className="h-6 w-20 border-amber-900/15 text-center text-[10px]"
													min={0}
													step={10}
												/>
												<span className="text-amber-900/30 text-[10px]">
													ms
												</span>
												{steps.length > 1 && (
													<button
														type="button"
														className="text-[10px] text-amber-900/20 hover:text-red-500"
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteStep(
																i,
															);
														}}
													>
														削除
													</button>
												)}
											</div>
										</div>

										{step.targetIds.length > 0 && (
											<div className="mt-2 flex flex-wrap gap-1">
												{step.targetIds.map(
													(tid, ti) => {
														const t =
															targets.find(
																(tgt) =>
																	tgt.id ===
																	tid,
															);
														if (!t) return null;
														return (
															<button
																key={`${tid}-${ti}`}
																type="button"
																className={cn(
																	"group/badge flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
																	TARGET_COLORS[
																		t.type
																	],
																	TARGET_HOVER[
																		t.type
																	],
																)}
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																	updateSet(
																		(s) => ({
																			...s,
																			steps: s.steps.map(
																				(
																					st,
																					si,
																				) =>
																					si ===
																					i
																						? {
																								...st,
																								targetIds:
																									st.targetIds.filter(
																										(
																											id,
																										) =>
																											id !==
																											tid,
																									),
																							}
																						: st,
																			),
																		}),
																	);
																}}
															>
																<span>
																	{ti + 1} (
																	{t.gx},
																	{t.gy})
																</span>
																<span className="opacity-0 transition-opacity group-hover/badge:opacity-70">
																	x
																</span>
															</button>
														);
													},
												)}
											</div>
										)}
										{step.targetIds.length === 0 &&
											isActive && (
												<p className="mt-2 text-amber-900/25 text-xs">
													Canvas上の的をクリック
												</p>
											)}
									</div>
								);
							})}
						</div>
					<Button
						variant="outline"
						size="sm"
						className="w-full shrink-0 border-dashed border-amber-900/20 text-amber-900/50"
						style={rf}
						onClick={handleAddStep}
					>
						+ ステップ追加
					</Button>
					</>
				)}

				{/* 削除 */}
				<div className="flex justify-end pt-2">
					<Button
						variant="destructive"
						size="sm"
						onClick={deleteSet}
					>
						この的セットを削除
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
