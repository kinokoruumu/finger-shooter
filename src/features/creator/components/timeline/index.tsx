import { cn } from "@/lib/utils";
import type { CreatorGroup } from "../../types";

type Props = {
	groups: CreatorGroup[];
	selectedIdx: number | null;
	onSelect: (idx: number) => void;
	onDelete: (idx: number) => void;
	onAdd: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const getGroupSummary = (group: CreatorGroup): string => {
	const parts: string[] = [];
	if ((group.targets ?? []).length > 0) parts.push(`的${group.targets.length}`);
	if ((group.balloons ?? []).length > 0)
		parts.push(`風船${group.balloons.length}`);
	if (group.train) parts.push("列車");
	return parts.length > 0 ? parts.join(" + ") : "空";
};

export const Timeline = ({
	groups,
	selectedIdx,
	onSelect,
	onDelete,
	onAdd,
}: Props) => {
	return (
		<div className="rounded-xl border-2 border-amber-900/10 bg-white p-3">
			<div className="mb-2 flex items-center justify-between">
				<p
					className="font-bold text-amber-900/60 text-xs uppercase tracking-widest"
					style={rf}
				>
					グループ（順次実行）
				</p>
				<button
					type="button"
					className="rounded-md bg-amber-100 px-2 py-1 text-amber-800 text-xs transition-colors hover:bg-amber-200"
					style={rf}
					onClick={onAdd}
				>
					+ グループ追加
				</button>
			</div>

			{groups.length === 0 ? (
				<p
					className="py-4 text-center text-amber-900/30 text-sm"
					style={rf}
				>
					グループを追加してください
				</p>
			) : (
				<div className="flex items-center gap-1 overflow-x-auto p-1">
					{groups.map((group, i) => (
						<div key={group.id} className="flex items-center">
							{i > 0 && (
								<span className="mx-1 text-amber-900/20">→</span>
							)}
							<div
								className={cn(
									"flex shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg border-2 px-4 py-2 transition-all",
									selectedIdx === i
										? "border-amber-800 bg-amber-50"
										: "border-transparent hover:bg-amber-50",
								)}
								role="button"
								tabIndex={0}
								onClick={() => onSelect(i)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										onSelect(i);
									}
								}}
							>
								<span
									className="text-amber-900/70 text-xs"
									style={rf}
								>
									G{i + 1}
								</span>
								<span className="text-amber-900/40 text-[10px]">
									{getGroupSummary(group)}
								</span>
								<button
									type="button"
									className="text-red-400 text-[10px] hover:text-red-600"
									onClick={(e) => {
										e.stopPropagation();
										onDelete(i);
									}}
								>
									削除
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
