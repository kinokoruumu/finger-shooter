import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
	CreatorAnimationStep,
	CreatorBalloon,
	CreatorTarget,
	CreatorTrain,
} from "@/features/creator/types";
import { cn } from "@/lib/utils";

type Props = {
	steps: CreatorAnimationStep[];
	stepDelay: number;
	targets: CreatorTarget[];
	balloons: CreatorBalloon[];
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
	onRemoveItem: (
		stepIndex: number,
		itemId: string,
		field: "targetIds" | "balloonIds",
	) => void;
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

const ItemBadge = ({
	label,
	colorClass,
	hoverClass,
	onRemove,
}: {
	label: string;
	colorClass: string;
	hoverClass: string;
	onRemove: () => void;
}) => (
	<button
		type="button"
		className={cn(
			"group/badge flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
			colorClass,
			hoverClass,
		)}
		onClick={(e) => {
			e.stopPropagation();
			onRemove();
		}}
	>
		<span>{label}</span>
		<span className="opacity-0 transition-opacity group-hover/badge:opacity-70">
			x
		</span>
	</button>
);

export const StepPanel = ({
	steps,
	stepDelay,
	targets,
	balloons,
	train,
	activeStepIndex,
	onActiveStepChange,
	onAddStep,
	onDeleteStep,
	onStepUpdate,
	onStepDelayChange,
	onRemoveItem,
}: Props) => {
	return (
		<div className="space-y-2" style={rf}>
			{steps.map((step, i) => {
				const isActive = i === activeStepIndex;
				const stepTargets = step.targetIds
					.map((tid) => targets.find((t) => t.id === tid))
					.filter(Boolean);
				const stepBalloons = step.balloonIds
					.map((bid) => balloons.find((b) => b.id === bid))
					.filter(Boolean);

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
											Math.max(
												0,
												Number(e.target.value),
											),
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
								"cursor-pointer rounded-xl border-2 p-4 transition-all",
								isActive
									? "border-amber-800 bg-amber-50"
									: "border-amber-900/10 bg-white hover:border-amber-900/20",
							)}
							onClick={() => onActiveStepChange(i)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onActiveStepChange(i);
								}
							}}
						>
							{/* ヘッダー */}
							<div className="mb-3 flex items-center justify-between">
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
									<button
										type="button"
										className="text-[11px] text-amber-900/20 transition-colors hover:text-red-500"
										onClick={(e) => {
											e.stopPropagation();
											onDeleteStep(i);
										}}
									>
										削除
									</button>
								)}
							</div>

							{/* 的タイムライン */}
							<div className="space-y-3">
								<div
									className="space-y-1.5"
									onClick={(e) => e.stopPropagation()}
								>
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
												value={step.targetInterval}
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
									{stepTargets.length === 0 ? (
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
													<ItemBadge
														key={`${tid}-${ti}`}
														label={`${ti + 1} (${t.gx},${t.gy})`}
														colorClass={
															TARGET_COLORS[
																t.type
															]
														}
														hoverClass={
															TARGET_HOVER[
																t.type
															]
														}
														onRemove={() =>
															onRemoveItem(
																i,
																tid,
																"targetIds",
															)
														}
													/>
												);
											})}
										</div>
									)}
								</div>

								{/* 風船タイムライン */}
								<div
									className="space-y-1.5"
									onClick={(e) => e.stopPropagation()}
								>
									<div className="flex items-center gap-2">
										<span className="w-8 shrink-0 text-xs font-bold text-sky-500/70">
											風船
										</span>
										<div className="flex items-center gap-1">
											<span className="text-amber-900/30 text-[10px]">
												間隔
											</span>
											<Input
												type="number"
												value={step.balloonInterval}
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
												step={10}
											/>
											<span className="text-amber-900/30 text-[10px]">
												ms
											</span>
										</div>
									</div>
									{stepBalloons.length === 0 ? (
										<p className="pl-8 text-amber-900/25 text-xs">
											{isActive
												? "Canvas上の風船をクリック"
												: "—"}
										</p>
									) : (
										<div className="flex flex-wrap gap-1 pl-8">
											{step.balloonIds.map(
												(bid, bi) => {
													const b = balloons.find(
														(bl) => bl.id === bid,
													);
													if (!b) return null;
													return (
														<ItemBadge
															key={`${bid}-${bi}`}
															label={`${bi + 1}`}
															colorClass="bg-sky-400 text-white"
															hoverClass="hover:bg-sky-300"
															onRemove={() =>
																onRemoveItem(
																	i,
																	bid,
																	"balloonIds",
																)
															}
														/>
													);
												},
											)}
										</div>
									)}
								</div>

								{/* 列車 */}
								{train && (
									<div
										className="flex items-center gap-2"
										onClick={(e) => e.stopPropagation()}
									>
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
