import { cn } from "@/lib/utils";
import type { TargetSlotType } from "../../types";

type Props = {
	currentType: TargetSlotType;
	onTypeChange: (type: TargetSlotType) => void;
	targetCount: number;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const TYPE_OPTIONS: { type: TargetSlotType; label: string; color: string }[] = [
	{ type: "ground", label: "+1", color: "bg-stone-700 text-white" },
	{ type: "ground-gold", label: "+3", color: "bg-yellow-500 text-amber-900" },
	{
		type: "ground-penalty",
		label: "-3",
		color: "bg-stone-900 text-red-400",
	},
];

export const EditorToolbar = ({
	currentType,
	onTypeChange,
	targetCount,
}: Props) => {
	return (
		<div className="flex items-center gap-3" style={rf}>
			<div className="flex gap-1.5">
				{TYPE_OPTIONS.map((opt) => (
					<button
						key={opt.type}
						type="button"
						className={cn(
							"rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
							opt.color,
							currentType === opt.type
								? "ring-2 ring-amber-800 ring-offset-2"
								: "opacity-60 hover:opacity-80",
						)}
						onClick={() => onTypeChange(opt.type)}
					>
						{opt.label}
					</button>
				))}
			</div>
			<span className="text-amber-900/40 text-xs">{targetCount}個配置済み</span>
			<p className="ml-auto text-amber-900/40 text-xs">
				クリックで配置 / 右クリックで変更・削除
			</p>
		</div>
	);
};
