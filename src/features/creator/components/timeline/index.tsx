import { cn } from "@/lib/utils";
import type { CreatorGroup, CreatorGroupType } from "../../types";

type Props = {
	groups: CreatorGroup[];
	selectedIdx: number | null;
	onSelect: (idx: number) => void;
	onDelete: (idx: number) => void;
	onAdd: (type: CreatorGroupType) => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const GROUP_COLORS: Record<CreatorGroupType, string> = {
	targets: "bg-amber-500",
	balloons: "bg-sky-400",
	train: "bg-violet-500",
};

const GROUP_LABELS: Record<CreatorGroupType, string> = {
	targets: "的",
	balloons: "風船",
	train: "列車",
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
					タイムライン
				</p>
				<div className="flex gap-1">
					<AddButton label="+ 的" onClick={() => onAdd("targets")} />
					<AddButton label="+ 風船" onClick={() => onAdd("balloons")} />
					<AddButton label="+ 列車" onClick={() => onAdd("train")} />
				</div>
			</div>

			{groups.length === 0 ? (
				<p className="py-4 text-center text-amber-900/30 text-sm" style={rf}>
					グループを追加してください
				</p>
			) : (
				<div className="flex gap-1.5 overflow-x-auto pb-1">
					{groups.map((group, i) => (
						<button
							key={group.id}
							type="button"
							className={cn(
								"flex shrink-0 flex-col items-center gap-1 rounded-lg px-4 py-2 transition-all",
								selectedIdx === i
									? "ring-2 ring-amber-800 ring-offset-1"
									: "hover:bg-amber-50",
							)}
							onClick={() => onSelect(i)}
						>
							<div
								className={cn(
									"h-2 w-10 rounded-full",
									GROUP_COLORS[group.type],
								)}
							/>
							<span className="text-amber-900/70 text-xs" style={rf}>
								G{i + 1} {GROUP_LABELS[group.type]}
							</span>
							<span className="text-amber-900/30 text-[10px]">
								{group.type === "targets"
									? `${group.targets?.length ?? 0}個`
									: group.type === "balloons"
										? `${group.balloons?.length ?? 0}個`
										: "列車"}
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
						</button>
					))}
				</div>
			)}
		</div>
	);
};

const AddButton = ({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) => (
	<button
		type="button"
		className="rounded-md bg-amber-100 px-2 py-1 text-amber-800 text-xs transition-colors hover:bg-amber-200"
		style={rf}
		onClick={onClick}
	>
		{label}
	</button>
);
