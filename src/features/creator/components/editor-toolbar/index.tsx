import { cn } from "@/lib/utils";
import type { TargetSlotType } from "../../types";

type EditorMode = TargetSlotType | "balloon" | "delete";

type Props = {
	currentMode: EditorMode;
	onModeChange: (mode: EditorMode) => void;
	targetCount: number;
	balloonCount: number;
	hasTrain: boolean;
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
		mode: "balloon",
		label: "風船",
		activeBg: "bg-sky-500",
		activeText: "text-white",
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
	balloon: "Canvas下部をクリックで風船を配置",
	delete: "的や風船をクリックで削除",
};

export const EditorToolbar = ({
	currentMode,
	onModeChange,
	targetCount,
	balloonCount,
	hasTrain,
}: Props) => {
	const summary = [
		targetCount > 0 ? `的${targetCount}` : null,
		balloonCount > 0 ? `風船${balloonCount}` : null,
		hasTrain ? "列車" : null,
	]
		.filter(Boolean)
		.join(" / ");

	return (
		<div className="space-y-2" style={rf}>
			<div className="flex items-center gap-2">
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
				{summary && (
					<span className="ml-auto text-amber-900/40 text-xs">
						{summary}
					</span>
				)}
			</div>
			<p className="text-amber-900/40 text-xs">{HINT[currentMode]}</p>
		</div>
	);
};
