import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type {
	CreatorAnimationStep,
	CreatorTarget,
} from "@/features/creator/types";
import { cn } from "@/lib/utils";

type Props = {
	steps: CreatorAnimationStep[];
	stepDelay: number;
	targets: CreatorTarget[];
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

export const StepPanel = ({
	steps,
	stepDelay,
	targets,
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
								<span className="shrink-0 text-amber-900/40 text-xs">間隔</span>
								<Input
									type="number"
									value={stepDelay}
									onChange={(e) =>
										onStepDelayChange(Math.max(0, Number(e.target.value)))
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
								"rounded-xl border-2 p-3 transition-all",
								isActive
									? "border-amber-800 bg-amber-50"
									: "border-amber-900/10 bg-white hover:border-amber-900/20",
							)}
						>
							<div className="mb-2 flex items-center justify-between">
								<button
									type="button"
									className={cn(
										"font-bold text-sm",
										isActive ? "text-amber-900" : "text-amber-900/60",
									)}
									onClick={() => onActiveStepChange(i)}
								>
									ステップ {i + 1}
								</button>
								<div className="flex items-center gap-2">
									<span className="text-amber-900/40 text-[10px]">間隔</span>
									<Slider
										value={[step.interval]}
										min={0}
										max={500}
										step={10}
										onValueChange={(val) => {
											const v = Array.isArray(val) ? val[0] : val;
											onIntervalChange(i, v);
										}}
										className="w-24"
									/>
									<span className="w-12 text-right font-mono text-amber-900/50 text-[10px]">
										{step.interval}ms
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

							{/* ステップ内の的リスト */}
							{step.targetIds.length === 0 ? (
								<p className="py-2 text-center text-amber-900/30 text-xs">
									{isActive
										? "Canvas上の的をクリックして追加"
										: "クリックしてアクティブにする"}
								</p>
							) : (
								<div className="flex flex-wrap gap-1">
									{step.targetIds.map((tid, ti) => {
										const t = targets.find((tgt) => tgt.id === tid);
										if (!t) return null;
										return (
											<div
												key={`${tid}-${ti}`}
												className={cn(
													"flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold",
													TYPE_COLORS[t.type] ?? "bg-stone-700 text-white",
												)}
											>
												<span className="font-mono opacity-70">{ti + 1}</span>
												<span>
													({t.gx},{t.gy})
												</span>
												<button
													type="button"
													className="ml-0.5 opacity-50 hover:opacity-100"
													onClick={() => onRemoveTarget(i, tid)}
												>
													x
												</button>
											</div>
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
