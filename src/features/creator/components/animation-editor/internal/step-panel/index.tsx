import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
	CreatorAnimationStep,
	CreatorTarget,
	CreatorTrain,
} from "@/features/creator/types";
import { cn } from "@/lib/utils";

type Props = {
	steps: CreatorAnimationStep[];
	stepDelay: number;
	targets: CreatorTarget[];
	train: CreatorTrain | null;
	activeStepIndex: number;
	onActiveStepChange: (index: number) => void;
	onAddStep: () => void;
	onDeleteStep: (index: number) => void;
	onStepUpdate: (
		stepIndex: number,
		update: Partial<CreatorAnimationStep>,
	) => void;
	onStepDelayChange: (delay: number) => void;
	onRemoveTarget: (stepIndex: number, targetId: string) => void;
};

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

export const StepPanel = ({
	steps,
	stepDelay,
	targets,
	train,
	activeStepIndex,
	onActiveStepChange,
	onAddStep,
	onDeleteStep,
	onStepUpdate,
	onStepDelayChange,
	onRemoveTarget,
}: Props) => {
	return (
		<div className="space-y-2" style={rf}>
			{steps.map((step, i) => {
				const isActive = i === activeStepIndex;
				const balloonCount = step.balloonCount ?? 0;

				return (
					<div key={`step-${i}`}>
						{/* ステップ間delay（2つ目以降） */}
						{i > 0 && (
							<div className="my-2 flex items-center gap-2 rounded-lg border border-dashed border-amber-900/15 bg-amber-50/50 px-3 py-2">
								<span className="shrink-0 text-amber-900/40 text-xs">
									間隔
								</span>
								<Input
									type="number"
									value={stepDelay}
									onChange={(e) =>
										onStepDelayChange(
											Math.max(0, Number(e.target.value)),
										)
									}
									className="h-7 w-24 border-amber-900/15 text-center text-xs"
									min={0}
									step={50}
								/>
								<span className="text-amber-900/40 text-xs">
									ms
								</span>
							</div>
						)}

						{/* ステップカード */}
						<div
							className={cn(
								"rounded-xl border-2 transition-all",
								isActive
									? "border-amber-800 bg-amber-50"
									: "border-amber-900/10 bg-white hover:border-amber-900/20",
							)}
						>
							{/* ヘッダー: クリック可能 */}
							<button
								type="button"
								className="flex w-full items-center justify-between p-4 pb-0 text-left"
								onClick={() => onActiveStepChange(i)}
							>
								<span
									className={cn(
										"font-bold text-sm",
										isActive
											? "text-amber-900"
											: "text-amber-900/60",
									)}
								>
									ステップ {i + 1}
								</span>
								{steps.length > 1 && (
									<span
										className="text-[11px] text-amber-900/20 transition-colors hover:text-red-500"
										onClick={(e) => {
											e.stopPropagation();
											onDeleteStep(i);
										}}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.stopPropagation();
												onDeleteStep(i);
											}
										}}
									>
										削除
									</span>
								)}
							</button>

							{/* コンテンツ */}
							<div className="space-y-3 p-4">
								{/* 的 */}
								<div className="space-y-1.5">
									<div className="flex items-center gap-2">
										<span className="w-8 shrink-0 text-xs font-bold text-amber-900/50">
											的
										</span>
										<div className="flex items-center gap-1">
											<span className="text-amber-900/30 text-[10px]">
												間隔
											</span>
											<Input
												type="number"
												value={
													step.targetInterval ?? 100
												}
												onChange={(e) =>
													onStepUpdate(i, {
														targetInterval:
															Math.max(
																0,
																Number(
																	e.target
																		.value,
																),
															),
													})
												}
												className="h-6 w-16 border-amber-900/15 text-center text-[10px]"
												min={0}
												step={10}
											/>
											<span className="text-amber-900/30 text-[10px]">
												ms
											</span>
										</div>
									</div>
									{step.targetIds.length === 0 ? (
										<p className="pl-8 text-amber-900/25 text-xs">
											{isActive
												? "Canvas上の的をクリック"
												: "—"}
										</p>
									) : (
										<div className="flex flex-wrap gap-1 pl-8">
											{step.targetIds.map((tid, ti) => {
												const t = targets.find(
													(tgt) => tgt.id === tid,
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
														onClick={() =>
															onRemoveTarget(
																i,
																tid,
															)
														}
													>
														<span>
															{ti + 1} ({t.gx},
															{t.gy})
														</span>
														<span className="opacity-0 transition-opacity group-hover/badge:opacity-70">
															x
														</span>
													</button>
												);
											})}
										</div>
									)}
								</div>

								{/* 風船 */}
								<div className="flex items-center gap-2">
									<span className="w-8 shrink-0 text-xs font-bold text-sky-500/70">
										風船
									</span>
									<Input
										type="number"
										value={balloonCount}
										onChange={(e) =>
											onStepUpdate(i, {
												balloonCount: Math.max(
													0,
													Number(e.target.value),
												),
											})
										}
										className="h-6 w-14 border-amber-900/15 text-center text-[10px]"
										min={0}
									/>
									<span className="text-amber-900/30 text-[10px]">
										個
									</span>
									{balloonCount > 0 && (
										<>
											<span className="text-amber-900/30 text-[10px]">
												間隔
											</span>
											<Input
												type="number"
												value={
													step.balloonInterval ?? 500
												}
												onChange={(e) =>
													onStepUpdate(i, {
														balloonInterval:
															Math.max(
																0,
																Number(
																	e.target
																		.value,
																),
															),
													})
												}
												className="h-6 w-16 border-amber-900/15 text-center text-[10px]"
												min={0}
												step={50}
											/>
											<span className="text-amber-900/30 text-[10px]">
												ms
											</span>
										</>
									)}
								</div>

								{/* 列車 */}
								{train && (
									<div className="flex items-center gap-2">
										<span className="w-8 shrink-0 text-xs font-bold text-violet-500/70">
											列車
										</span>
										<button
											type="button"
											className={cn(
												"rounded-md px-2 py-0.5 text-[11px] font-bold transition-all",
												step.trainStart
													? "bg-violet-500 text-white"
													: "bg-violet-100 text-violet-400 hover:bg-violet-200",
											)}
											onClick={() =>
												onStepUpdate(i, {
													trainStart:
														!step.trainStart,
												})
											}
										>
											{step.trainStart
												? "出現"
												: "出現しない"}
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				);
			})}

			<Button
				variant="outline"
				size="sm"
				className="w-full border-dashed border-amber-900/20 text-amber-900/50"
				onClick={onAddStep}
			>
				+ ステップ追加
			</Button>
		</div>
	);
};
