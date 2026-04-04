import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CreatorBalloonEntry } from "../../types";

type Props = {
	open: boolean;
	onClose: () => void;
	entry: CreatorBalloonEntry;
	onUpdate: (entry: CreatorBalloonEntry) => void;
	onDelete: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const SPREAD_OPTIONS: {
	value: CreatorBalloonEntry["spread"];
	label: string;
}[] = [
	{ value: "random", label: "ランダム" },
	{ value: "left", label: "左寄り" },
	{ value: "center", label: "中央" },
	{ value: "right", label: "右寄り" },
];

export const BalloonEntryDialog = ({
	open,
	onClose,
	entry,
	onUpdate,
	onDelete,
}: Props) => {
	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle style={rf}>風船の設定</DialogTitle>
				</DialogHeader>

				<div className="space-y-4" style={rf}>
					{/* 個数 */}
					<div className="flex items-center gap-3">
						<span className="w-16 shrink-0 text-amber-900/60 text-xs sm:w-20 sm:text-sm">
							個数
						</span>
						<Input
							type="number"
							value={entry.count}
							onChange={(e) =>
								onUpdate({
									...entry,
									count: Math.max(1, Number(e.target.value)),
								})
							}
							className="h-9 w-20 border-amber-900/15 text-center"
							min={1}
							max={20}
						/>
					</div>

					{/* 出現間隔 */}
					<div className="flex items-center gap-3">
						<span className="w-16 shrink-0 text-amber-900/60 text-xs sm:w-20 sm:text-sm">
							間隔
						</span>
						<Input
							type="number"
							value={entry.interval ?? 0}
							onChange={(e) =>
								onUpdate({
									...entry,
									interval: Math.max(
										0,
										Number(e.target.value),
									),
								})
							}
							className="h-9 w-20 border-amber-900/15 text-center"
							min={0}
							step={50}
						/>
						<span className="text-amber-900/40 text-sm">ms（0=同時出現）</span>
					</div>

					{/* 出現位置 */}
					<div className="space-y-2">
						<span className="text-amber-900/60 text-sm">
							出現位置
						</span>
						<div className="flex gap-1.5">
							{SPREAD_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									className={cn(
										"flex-1 rounded-lg border-2 py-2 text-xs font-bold transition-all",
										entry.spread === opt.value
											? "border-sky-500 bg-sky-50 text-sky-700"
											: "border-amber-900/15 bg-white text-amber-900/50 hover:border-amber-900/30",
									)}
									onClick={() =>
										onUpdate({
											...entry,
											spread: opt.value,
										})
									}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>

					{/* 出現タイミング */}
					<div className="flex items-center gap-3">
						<span className="w-16 shrink-0 text-amber-900/60 text-xs sm:w-20 sm:text-sm">
							タイミング
						</span>
						<Input
							type="number"
							value={entry.time}
							onChange={(e) =>
								onUpdate({
									...entry,
									time: Math.max(
										0,
										Number(e.target.value),
									),
								})
							}
							className="h-9 w-24 border-amber-900/15 text-center"
							min={0}
							step={50}
						/>
						<span className="text-amber-900/40 text-sm">ms</span>
					</div>

					{/* 削除 */}
					<div className="flex justify-end pt-2">
						<Button
							variant="destructive"
							size="sm"
							onClick={() => {
								onDelete();
								onClose();
							}}
						>
							この風船を削除
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
