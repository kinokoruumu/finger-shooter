import { useCallback } from "react";
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
				onChange([
					...targets,
					{
						id: crypto.randomUUID(),
						gx,
						gy,
						type: "ground",
						visibleDuration: 4.0,
					},
				]);
			} else {
				const currentIdx = TYPE_CYCLE.indexOf(existing.type);
				const nextIdx = currentIdx + 1;
				if (nextIdx >= TYPE_CYCLE.length) {
					onChange(targets.filter((t) => !(t.gx === gx && t.gy === gy)));
				} else {
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

	return (
		<div className="space-y-4 pt-4">
			<p className="text-amber-900/50 text-xs" style={rf}>
				クリックで配置 → 再クリックで +3 → -3 → 削除
			</p>

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
		</div>
	);
};
