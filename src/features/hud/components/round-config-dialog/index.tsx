import { useCallback, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { RoundConfig } from "@/features/creator/types";
import { STAGES } from "@/features/game/constants/stage-definitions";
import { cn } from "@/lib/utils";

type Props = {
	open: boolean;
	onClose: () => void;
	config: RoundConfig;
	onSave: (config: RoundConfig) => void;
	customStages: { id: string; name: string }[];
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const RoundConfigDialog = ({
	open,
	onClose,
	config,
	onSave,
	customStages,
}: Props) => {
	const [draft, setDraft] = useState<RoundConfig>(config);
	const [editingSlot, setEditingSlot] = useState<number | null>(null);

	const handleSelect = useCallback(
		(slot: number, stageId: string | null) => {
			const next = [...draft] as RoundConfig;
			next[slot] = stageId;
			setDraft(next);
			onSave(next);
			setEditingSlot(null);
		},
		[draft, onSave],
	);

	const getSlotLabel = (slot: number): string => {
		const stageId = draft[slot];
		if (!stageId) return STAGES[slot].name;
		const custom = customStages.find((s) => s.id === stageId);
		return custom?.name ?? STAGES[slot].name;
	};

	const isCustom = (slot: number): boolean => draft[slot] !== null;

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle style={rf}>ラウンド構成</DialogTitle>
				</DialogHeader>

				<div className="space-y-3" style={rf}>
					<p className="text-amber-900/40 text-xs">
						各ラウンドをタップしてオリジナルステージに入れ替えられます
					</p>

					{[0, 1, 2].map((slot) => (
						<div key={slot}>
							<button
								type="button"
								className={cn(
									"flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
									editingSlot === slot
										? "border-amber-800 bg-amber-50"
										: "border-amber-900/10 bg-white hover:border-amber-900/20",
								)}
								onClick={() =>
									setEditingSlot(editingSlot === slot ? null : slot)
								}
							>
								<span
									className={cn(
										"flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-sm",
										isCustom(slot)
											? "bg-orange-500 text-white"
											: "bg-amber-900/10 text-amber-900/50",
									)}
								>
									{slot + 1}
								</span>
								<div className="min-w-0 flex-1">
									<p
										className={cn(
											"truncate font-bold text-sm",
											isCustom(slot) ? "text-orange-700" : "text-amber-900/70",
										)}
									>
										{getSlotLabel(slot)}
									</p>
									{isCustom(slot) && (
										<p className="text-[10px] text-orange-500/60">オリジナル</p>
									)}
								</div>
							</button>

							{/* 選択パネル */}
							{editingSlot === slot && (
								<div className="mt-1 space-y-1 rounded-lg border border-amber-900/10 bg-amber-50/50 p-2">
									<button
										type="button"
										className={cn(
											"w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors",
											!isCustom(slot)
												? "bg-amber-800 text-white"
												: "text-amber-900/50 hover:bg-amber-100",
										)}
										onClick={() => handleSelect(slot, null)}
									>
										{STAGES[slot].name}（デフォルト）
									</button>
									{customStages.map((s) => (
										<button
											key={s.id}
											type="button"
											className={cn(
												"w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors",
												draft[slot] === s.id
													? "bg-orange-500 text-white"
													: "text-amber-900/50 hover:bg-amber-100",
											)}
											onClick={() => handleSelect(slot, s.id)}
										>
											{s.name}
										</button>
									))}
									{customStages.length === 0 && (
										<p className="px-3 py-2 text-amber-900/30 text-xs">
											オリジナルステージがありません
										</p>
									)}
								</div>
							)}
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};
