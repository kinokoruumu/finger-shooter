import { cn } from "@/lib/utils";
import type { CreatorGroup } from "../../types";

type Props = {
	groups: CreatorGroup[];
	selectedIdx: number | null;
	onSelect: (idx: number) => void;
	onDelete: (idx: number) => void;
	onAdd: (type: CreatorGroup["type"]) => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const GROUP_COLORS: Record<CreatorGroup["type"], string> = {
	targets: "bg-amber-500",
	balloons: "bg-sky-400",
	train: "bg-violet-500",
};

const GROUP_LABELS: Record<CreatorGroup["type"], string> = {
	targets: "的",
	balloons: "風船",
	train: "列車",
};

const getGroupCount = (group: CreatorGroup): string => {
	switch (group.type) {
		case "targets":
			return `${group.targets.length}個`;
		case "balloons":
			return `${group.balloons.length}個`;
		case "train":
			return "列車";
	}
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
					グループ
				</p>
				<div className="flex gap-1">
					<AddButton label="+ 的グループ" onClick={() => onAdd("targets")} />
					<AddButton label="+ 風船グループ" onClick={() => onAdd("balloons")} />
					<AddButton label="+ 列車グループ" onClick={() => onAdd("train")} />
				</div>
			</div>

			{groups.length === 0 ? (
				<p className="py-4 text-center text-amber-900/30 text-sm" style={rf}>
					上のボタンからグループを追加してください
				</p>
			) : (
				<div className="flex gap-1.5 overflow-x-auto p-1">
					{groups.map((group, i) => (
						<div
							key={group.id}
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
								{getGroupCount(group)}
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
