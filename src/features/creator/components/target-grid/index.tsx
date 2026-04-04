import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { CreatorTarget, TargetSlotType } from "../../types";

type Props = {
	targets: CreatorTarget[];
	onChange: (targets: CreatorTarget[]) => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const GRID_W = 8;
const GRID_H = 4;

const TYPE_CYCLE: TargetSlotType[] = [
	"ground",
	"ground-gold",
	"ground-penalty",
];

const TYPE_COLORS: Record<TargetSlotType, string> = {
	ground: "bg-stone-700",
	"ground-gold": "bg-yellow-500",
	"ground-penalty": "bg-stone-900",
};

const TYPE_LABELS: Record<TargetSlotType, string> = {
	ground: "+1",
	"ground-gold": "+3",
	"ground-penalty": "-3",
};

const TYPE_TEXT_COLORS: Record<TargetSlotType, string> = {
	ground: "text-white",
	"ground-gold": "text-amber-900",
	"ground-penalty": "text-red-400",
};

export const TargetGrid = ({ targets, onChange }: Props) => {
	const findTarget = useCallback(
		(gx: number, gy: number) => targets.find((t) => t.gx === gx && t.gy === gy),
		[targets],
	);

	const handleClick = useCallback(
		(gx: number, gy: number) => {
			const existing = findTarget(gx, gy);
			if (!existing) {
				// 追加
				onChange([
					...targets,
					{ gx, gy, type: "ground", delay: 0, visibleDuration: 4.0 },
				]);
			} else {
				// 種類をサイクル、最後なら削除
				const currentIdx = TYPE_CYCLE.indexOf(existing.type);
				const nextIdx = currentIdx + 1;
				if (nextIdx >= TYPE_CYCLE.length) {
					// 削除
					onChange(targets.filter((t) => !(t.gx === gx && t.gy === gy)));
				} else {
					// 種類変更
					onChange(
						targets.map((t) =>
							t.gx === gx && t.gy === gy
								? { ...t, type: TYPE_CYCLE[nextIdx] }
								: t,
						),
					);
				}
			}
		},
		[targets, findTarget, onChange],
	);

	const handleDelayChange = useCallback(
		(gx: number, gy: number, delay: number) => {
			onChange(
				targets.map((t) => (t.gx === gx && t.gy === gy ? { ...t, delay } : t)),
			);
		},
		[targets, onChange],
	);

	return (
		<div className="space-y-4 pt-4">
			<p className="text-amber-900/50 text-xs" style={rf}>
				クリックで配置 → 再クリックで +3 → -3 → 削除
			</p>

			{/* グリッド */}
			<div className="inline-grid grid-cols-8 gap-1.5">
				{Array.from({ length: GRID_H * GRID_W }, (_, i) => {
					const gx = i % GRID_W;
					const gy = Math.floor(i / GRID_W);
					const target = findTarget(gx, gy);
					return (
						<button
							key={`cell-${gx}-${gy}`}
							type="button"
							className={cn(
								"flex h-14 w-14 items-center justify-center rounded-lg border-2 text-xs font-bold transition-all",
								target
									? cn(
											TYPE_COLORS[target.type],
											TYPE_TEXT_COLORS[target.type],
											"border-transparent",
										)
									: "border-amber-900/10 bg-amber-50 text-amber-900/20 hover:border-amber-900/30 hover:bg-amber-100",
							)}
							style={rf}
							onClick={() => handleClick(gx, gy)}
						>
							{target ? TYPE_LABELS[target.type] : ""}
						</button>
					);
				})}
			</div>

			{/* 配置済みの的の遅延設定 */}
			{targets.length > 0 && (
				<div className="space-y-2">
					<p className="font-bold text-amber-900/50 text-xs" style={rf}>
						出現遅延（ms）
					</p>
					<div className="grid grid-cols-4 gap-2">
						{targets.map((t) => (
							<div
								key={`delay-${t.gx}-${t.gy}`}
								className="flex items-center gap-2 rounded-lg bg-amber-50 px-2 py-1.5"
							>
								<span
									className={cn(
										"flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold",
										TYPE_COLORS[t.type],
										TYPE_TEXT_COLORS[t.type],
									)}
								>
									{t.gx},{t.gy}
								</span>
								<Slider
									value={[t.delay]}
									min={0}
									max={2000}
									step={50}
									onValueChange={(val) => {
										const v = Array.isArray(val) ? val[0] : val;
										handleDelayChange(t.gx, t.gy, v);
									}}
									className="flex-1"
								/>
								<span className="w-12 text-right font-mono text-amber-900/50 text-[10px]">
									{t.delay}ms
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
