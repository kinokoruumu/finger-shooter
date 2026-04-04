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
	onUpdateGroup,
}: Props) => {
	const [tab, setTab] = useState<Tab>("placement");
	const [editorMode, setEditorMode] = useState<EditorMode>("ground");
	const [activeStepIndex, setActiveStepIndex] = useState(0);

	const targets = group.targets ?? [];
	const steps = group.targetSteps ?? [];

	// --- 配置操作 ---
	const handleCellClick = useCallback(
		(gx: number, gy: number) => {
			if (tab !== "placement") return;

			const existing = targets.find(
				(t) => t.gx === gx && t.gy === gy,
			);

			if (editorMode === "delete") {
				if (!existing) return;
				onUpdateGroup({
					...group,
					targets: targets.filter(
						(t) => !(t.gx === gx && t.gy === gy),
					),
					targetSteps: steps.map((s) => ({
						...s,
						targetIds: s.targetIds.filter(
							(id) => id !== existing.id,
						),
					})),
				});
				return;
			}

			if (existing) {
				if (existing.type === editorMode) return;
				onUpdateGroup({
					...group,
					targets: targets.map((t) =>
						t.id === existing.id
							? { ...t, type: editorMode }
							: t,
					),
				});
			} else {
				onUpdateGroup({
					...group,
					targets: [
						...targets,
						{
							id: crypto.randomUUID(),
							gx,
							gy,
							type: editorMode,
							visibleDuration: 4.0,
						},
					],
				});
			}
		},
		[tab, targets, steps, editorMode, group, onUpdateGroup],
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
				const newSteps = steps.map((s, i) =>
					i === activeStepIndex
						? {
								...s,
								targetIds: s.targetIds.filter(
									(id) => id !== targetId,
								),
							}
						: s,
				);
				onUpdateGroup({ ...group, targetSteps: newSteps });
			} else {
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
				onUpdateGroup({ ...group, targetSteps: newSteps });
			}
		},
		[tab, steps, activeStepIndex, group, onUpdateGroup],
	);

	const handleAddStep = useCallback(() => {
		const newStep: CreatorTargetStep = { targetIds: [], interval: 100 };
		const newSteps = [...steps, newStep];
		onUpdateGroup({ ...group, targetSteps: newSteps });
		setActiveStepIndex(newSteps.length - 1);
	}, [steps, group, onUpdateGroup]);

	const handleDeleteStep = useCallback(
		(index: number) => {
			const newSteps = steps.filter((_, i) => i !== index);
			onUpdateGroup({ ...group, targetSteps: newSteps });
			if (activeStepIndex >= newSteps.length) {
				setActiveStepIndex(Math.max(0, newSteps.length - 1));
			}
		},
		[steps, activeStepIndex, group, onUpdateGroup],
	);

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-4xl">
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

				{/* Canvas（ダイアログ内の別Canvas） */}
				<EditorCanvasWrapper>
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

				{/* 配置タブUI */}
				{tab === "placement" && (
					<EditorToolbar
						currentMode={editorMode}
						onModeChange={setEditorMode}
						targetCount={targets.length}
					/>
				)}

				{/* アニメーションタブUI */}
				{tab === "animation" && (
					<div className="space-y-3" style={rf}>
						{/* ステップ間delay */}
						<div className="flex items-center gap-2">
							<span className="text-amber-900/50 text-xs">
								ステップ間隔
							</span>
							<Input
								type="number"
								value={group.targetStepDelay ?? 300}
								onChange={(e) =>
									onUpdateGroup({
										...group,
										targetStepDelay: Math.max(
											0,
											Number(e.target.value),
										),
									})
								}
								className="h-7 w-20 border-amber-900/15 text-center text-xs"
								min={0}
								step={50}
							/>
							<span className="text-amber-900/40 text-xs">
								ms
							</span>
						</div>

						{/* ステップリスト */}
						<div className="space-y-1.5">
							{steps.map((step, i) => {
								const isActive = i === activeStepIndex;
								return (
									<div
										key={`step-${i}`}
										className={cn(
											"rounded-lg border-2 p-3 transition-all",
											isActive
												? "border-amber-800 bg-amber-50"
												: "border-amber-900/10 bg-white hover:border-amber-900/20",
										)}
									>
										<button
											type="button"
											className="flex w-full items-center justify-between text-left"
											onClick={() =>
												setActiveStepIndex(i)
											}
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
													間隔
												</span>
												<Input
													type="number"
													value={
														step.interval ?? 100
													}
													onChange={(e) => {
														const newSteps =
															steps.map(
																(s, si) =>
																	si === i
																		? {
																				...s,
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
																		: s,
															);
														onUpdateGroup({
															...group,
															targetSteps:
																newSteps,
														});
													}}
													onClick={(e) =>
														e.stopPropagation()
													}
													className="h-6 w-14 border-amber-900/15 text-center text-[10px]"
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
										</button>

										{/* 的リスト */}
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
																	const newSteps =
																		steps.map(
																			(
																				s,
																				si,
																			) =>
																				si ===
																				i
																					? {
																							...s,
																							targetIds:
																								s.targetIds.filter(
																									(
																										id,
																									) =>
																										id !==
																										tid,
																								),
																						}
																					: s,
																		);
																	onUpdateGroup(
																		{
																			...group,
																			targetSteps:
																				newSteps,
																		},
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
							className="w-full border-dashed border-amber-900/20 text-amber-900/50"
							onClick={handleAddStep}
						>
							+ ステップ追加
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
