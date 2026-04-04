import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
	CreatorAnimationStep,
	CreatorBalloon,
	CreatorTarget,
} from "@/features/creator/types";
import { cn } from "@/lib/utils";

type Props = {
	steps: CreatorAnimationStep[];
	stepDelay: number;
	targets: CreatorTarget[];
	balloons: CreatorBalloon[];
	activeStepIndex: number;
	onActiveStepChange: (index: number) => void;
	onAddStep: () => void;
	onDeleteStep: (index: number) => void;
	onIntervalChange: (stepIndex: number, interval: number) => void;
	onStepDelayChange: (delay: number) => void;
	onRemoveTarget: (stepIndex: number, targetId: string) => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const TYPE_COLORS: Record<string, string> = {
	ground: "bg-stone-700 text-white",
	"ground-gold": "bg-yellow-500 text-amber-900",
	"ground-penalty": "bg-stone-900 text-red-400",
};

const TYPE_HOVER_COLORS: Record<string, string> = {
	ground: "hover:bg-stone-600",
	"ground-gold": "hover:bg-yellow-400",
	"ground-penalty": "hover:bg-stone-800",
};

export const StepPanel = ({
	steps,
	stepDelay,
	targets,
	balloons,
	activeStepIndex,
	onActiveStepChange,
	onAddStep,
	onDeleteStep,
	onIntervalChange,
	onStepDelayChange,
	onRemoveTarget,
}: Props) => {
	return (
		<div className="space-y-2" style={rf}>
			{steps.map((step, i) => {
				const isActive = i === activeStepIndex;
				return (
					<div key={`step-${i}`}>
						{/* ステップ間delay（2つ目以降のみ） */}
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
								<span className="text-amber-900/40 text-xs">ms</span>
							</div>
						)}

						{/* ステップカード */}
						<div
							className={cn(
								"cursor-pointer rounded-xl border-2 p-3 transition-all",
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
							<div className="mb-2 flex items-center justify-between">
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
								<div
									className="flex items-center gap-2"
									onClick={(e) => e.stopPropagation()}
								>
									<span className="text-amber-900/40 text-[10px]">
										間隔
									</span>
									<Input
										type="number"
										value={step.interval}
										onChange={(e) =>
											onIntervalChange(
												i,
												Math.max(
													0,
													Number(e.target.value),
												),
											)
										}
										className="h-6 w-16 border-amber-900/15 text-center text-[10px]"
										min={0}
										step={10}
									/>
									<span className="text-amber-900/40 text-[10px]">
										ms
									</span>
									{steps.length > 1 && (
										<button
											type="button"
											className="text-red-400 text-[10px] hover:text-red-600"
											onClick={() => onDeleteStep(i)}
										>
											削除
										</button>
									)}
								</div>
							</div>

							{/* ステップ内のアイテムリスト */}
							{step.targetIds.length === 0 ? (
								<p className="py-2 text-center text-amber-900/30 text-xs">
									{isActive
										? "Canvas上の的をクリックして追加"
										: "クリックしてアクティブにする"}
								</p>
							) : (
								<div className="flex flex-wrap gap-1">
									{step.targetIds.map((tid, ti) => {
										const t = targets.find(
											(tgt) => tgt.id === tid,
										);
										const b = !t
											? balloons.find(
													(bl) => bl.id === tid,
												)
											: null;
										if (!t && !b) return null;

										const colorClass = t
											? (TYPE_COLORS[t.type] ??
												"bg-stone-700 text-white")
											: "bg-sky-400 text-white";
										const hoverClass = t
											? (TYPE_HOVER_COLORS[t.type] ??
												"hover:bg-stone-600")
											: "hover:bg-sky-300";
										const label = t
											? `(${t.gx},${t.gy})`
											: `風船`;

										return (
											<button
												key={`${tid}-${ti}`}
												type="button"
												className={cn(
													"group/badge flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
													colorClass,
													hoverClass,
												)}
												onClick={(e) => {
													e.stopPropagation();
													onRemoveTarget(i, tid);
												}}
											>
												<span className="font-mono opacity-70">
													{ti + 1}
												</span>
												<span>{label}</span>
												<span className="opacity-0 transition-opacity group-hover/badge:opacity-70">
													x
												</span>
											</button>
										);
									})}
								</div>
							)}
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
