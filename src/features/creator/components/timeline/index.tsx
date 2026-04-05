import { cn } from "@/lib/utils";
import type { CreatorGroup, TargetSlotType } from "../../types";

type Props = {
	groups: CreatorGroup[];
	selectedIdx: number | null;
	onSelect: (idx: number) => void;
	onDelete: (idx: number) => void;
	onAdd: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const TARGET_BADGE: Record<
	TargetSlotType,
	{ label: string; bg: string; text: string }
> = {
	ground: { label: "+1", bg: "bg-stone-600", text: "text-white" },
	"ground-gold": { label: "+3", bg: "bg-yellow-500", text: "text-amber-900" },
	"ground-penalty": {
		label: "-3",
		bg: "bg-stone-800",
		text: "text-red-400",
	},
};

const GroupContent = ({
	group,
	isSelected,
}: {
	group: CreatorGroup;
	isSelected: boolean;
}) => {
	const allTargets = (group.targetSets ?? []).flatMap((s) => s.targets);
	const balloonEntries = group.balloonEntries ?? [];
	const hasBalloons = balloonEntries.length > 0;
	const hasTrain = group.train && group.trainStartTime != null;
	const hasAny = allTargets.length > 0 || hasBalloons || hasTrain;

	if (!hasAny) {
		return (
			<span
				className={cn(
					"text-xs",
					isSelected ? "text-amber-900/40" : "text-amber-900/25",
				)}
				style={rf}
			>
				空のグループ
			</span>
		);
	}

	return (
		<div className="space-y-1.5">
			{/* 的 */}
			{allTargets.length > 0 && (
				<div className="flex items-center gap-1.5">
					<span className="w-6 shrink-0 text-[10px] font-bold text-amber-900/40">
						的
					</span>
					<div className="flex flex-wrap gap-0.5">
						{allTargets.map((t) => {
							const badge = TARGET_BADGE[t.type];
							return (
								<span
									key={t.id}
									className={cn(
										"inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
										badge.bg,
										badge.text,
									)}
								>
									{badge.label}
								</span>
							);
						})}
					</div>
				</div>
			)}
			{/* 風船 */}
			{hasBalloons && (
				<div className="flex items-center gap-1.5">
					<span className="w-6 shrink-0 text-[10px] font-bold text-sky-500/60">
						風
					</span>
					<span className="text-[10px] text-amber-900/40">
						{balloonEntries.reduce((sum, e) => sum + e.count, 0)}個
					</span>
				</div>
			)}
			{/* 列車 */}
			{hasTrain && (
				<div className="flex items-center gap-1.5">
					<span className="w-6 shrink-0 text-[10px] font-bold text-violet-500/60">
						列
					</span>
					<span className="text-[10px] text-amber-900/40">
						{group.train?.direction === 1 ? "右→左" : "左→右"}
					</span>
				</div>
			)}
		</div>
	);
};

export const Timeline = ({
	groups,
	selectedIdx,
	onSelect,
	onDelete,
	onAdd,
}: Props) => {
	return (
		<div className="rounded-2xl border-2 border-amber-900/10 bg-white p-3 sm:p-4">
			<div className="mb-3 flex items-center justify-between sm:mb-4">
				<p className="font-bold text-amber-900 text-sm" style={rf}>
					グループ（順次実行）
				</p>
				<button
					type="button"
					className="rounded-lg bg-amber-900 px-4 py-1.5 font-bold text-white text-xs transition-colors hover:bg-amber-800"
					style={rf}
					onClick={onAdd}
				>
					+ 追加
				</button>
			</div>

			{groups.length === 0 ? (
				<p className="py-6 text-center text-amber-900/30 text-sm" style={rf}>
					グループを追加してください
				</p>
			) : (
				<div className="flex items-stretch gap-1 overflow-x-auto pb-1">
					{groups.map((group, i) => {
						const isSelected = selectedIdx === i;

						return (
							<div key={group.id} className="flex shrink-0 items-center">
								{i > 0 && (
									<div className="flex w-8 items-center justify-center">
										<svg
											width="18"
											height="12"
											viewBox="0 0 18 12"
											className="text-amber-300"
											aria-hidden="true"
										>
											<path
												d="M0 6h14M11 2l4 4-4 4"
												stroke="currentColor"
												strokeWidth="2"
												fill="none"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</div>
								)}
								{/* biome-ignore lint/a11y/useSemanticElements: 内部にbuttonがあるためbutton要素にできない */}
								<div
									className={cn(
										"flex min-w-[120px] cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition-all sm:min-w-[160px] sm:gap-2.5 sm:p-4",
										isSelected
											? "border-amber-500 bg-amber-50"
											: "border-transparent bg-stone-50 hover:bg-stone-100",
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
									<div className="flex items-center justify-between">
										<span
											className={cn(
												"font-bold text-sm",
												isSelected ? "text-amber-900" : "text-amber-900/70",
											)}
											style={rf}
										>
											グループ {i + 1}
										</span>
										<button
											type="button"
											className="text-[11px] text-amber-900/20 transition-colors hover:text-red-500"
											onClick={(e) => {
												e.stopPropagation();
												onDelete(i);
											}}
										>
											削除
										</button>
									</div>

									<GroupContent group={group} isSelected={isSelected} />
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
