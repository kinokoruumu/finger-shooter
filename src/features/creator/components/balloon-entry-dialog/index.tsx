import { useState } from "react";
import { NumberInput } from "@/components/forms/number-input";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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

const isDefaultEntry = (entry: CreatorBalloonEntry): boolean =>
	entry.count === 3 && entry.interval === 500 && entry.spread === "random";

export const BalloonEntryDialog = ({
	open,
	onClose,
	entry,
	onUpdate,
	onDelete,
}: Props) => {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleDelete = () => {
		if (isDefaultEntry(entry)) {
			onDelete();
			onClose();
		} else {
			setShowDeleteConfirm(true);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle style={rf}>風船の設定</DialogTitle>
					</DialogHeader>

					<div className="space-y-4" style={rf}>
						{/* 個数 */}
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<span className="w-16 shrink-0 text-amber-900/60 text-xs sm:w-20 sm:text-sm">
								個数
							</span>
							<NumberInput
								value={entry.count}
								onChange={(v) => onUpdate({ ...entry, count: v })}
								className="h-9 w-20 border-amber-900/15 text-center"
								min={1}
								max={20}
								defaultValue={1}
							/>
						</div>

						{/* 出現間隔 */}
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<span className="w-16 shrink-0 text-amber-900/60 text-xs sm:w-20 sm:text-sm">
								間隔
							</span>
							<NumberInput
								value={entry.interval ?? 0}
								onChange={(v) => onUpdate({ ...entry, interval: v })}
								className="h-9 w-20 border-amber-900/15 text-center"
								min={0}
								step={50}
							/>
							<span className="text-amber-900/40 text-xs sm:text-sm">
								ms（0=同時出現）
							</span>
						</div>

						{/* 出現位置 */}
						<div className="space-y-2">
							<span className="text-amber-900/60 text-xs sm:text-sm">
								出現位置
							</span>
							<div className="flex flex-wrap gap-1.5">
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
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<span className="w-16 shrink-0 text-amber-900/60 text-xs sm:w-20 sm:text-sm">
								タイミング
							</span>
							<NumberInput
								value={entry.time}
								onChange={(v) => onUpdate({ ...entry, time: v })}
								className="h-9 w-24 border-amber-900/15 text-center"
								min={0}
								step={50}
							/>
							<span className="text-amber-900/40 text-xs sm:text-sm">ms</span>
						</div>

						{/* 削除 */}
						<div className="flex justify-end">
							<button
								type="button"
								className="text-xs text-red-400 transition-colors hover:text-red-600"
								style={rf}
								onClick={handleDelete}
							>
								この風船を削除
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<ConfirmDeleteDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				title="風船の削除"
				description="この風船エントリを削除しますか？"
				onConfirm={() => {
					onDelete();
					onClose();
				}}
			/>
		</>
	);
};
