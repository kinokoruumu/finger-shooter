import { cn } from "@/lib/utils";
import type { TargetSlotType } from "../../types";

type EditorMode = TargetSlotType | "delete";

type Props = {
	currentMode: EditorMode;
	onModeChange: (mode: EditorMode) => void;
	targetCount: number;
};

export type { EditorMode };

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const MODE_OPTIONS: {
	mode: EditorMode;
	label: string;
	activeBg: string;
	activeText: string;
}[] = [
	{
		mode: "ground",
		label: "+1",
		activeBg: "bg-stone-700",
		activeText: "text-white",
	},
	{
		mode: "ground-gold",
		label: "+3",
		activeBg: "bg-yellow-500",
		activeText: "text-amber-900",
	},
	{
		mode: "ground-penalty",
		label: "-3",
		activeBg: "bg-stone-900",
		activeText: "text-red-400",
	},
	{
		mode: "delete",
		label: "削除",
		activeBg: "bg-red-600",
		activeText: "text-white",
	},
];

const HINT: Record<EditorMode, string> = {
	ground: "グリッドをクリックで+1を配置",
	"ground-gold": "グリッドをクリックで+3を配置",
	"ground-penalty": "グリッドをクリックで-3を配置",
	delete: "クリックで的を削除",
};

export const EditorToolbar = ({
	currentMode,
	onModeChange,
	targetCount,
}: Props) => {
	return (
		<div className="space-y-2" style={rf}>
			<div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
				{MODE_OPTIONS.map((opt) => {
					const isActive = currentMode === opt.mode;
					return (
						<button
							key={opt.mode}
							type="button"
							className={cn(
								"rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all",
								isActive
									? cn(
											opt.activeBg,
											opt.activeText,
											"border-transparent shadow-md",
										)
									: "border-amber-900/15 bg-white text-amber-900/50 hover:border-amber-900/30 hover:text-amber-900/70",
							)}
							onClick={() => onModeChange(opt.mode)}
						>
							{opt.label}
						</button>
					);
				})}
				<span className="ml-auto text-amber-900/40 text-xs">
					的 {targetCount}個
				</span>
			</div>
			<p className="text-amber-900/40 text-xs">{HINT[currentMode]}</p>
		</div>
	);
};
