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
	"ground-penalty": { label: "-3", bg: "bg-stone-800", text: "text-red-400" },
};

const GroupContent = ({ group }: { group: CreatorGroup }) => {
	const targets = group.targets ?? [];
	const balloons = group.balloons ?? [];
	const hasAny = targets.length > 0 || balloons.length > 0 || group.train;

	if (!hasAny) {
		return (
			<span className="text-xs text-amber-900/25" style={rf}>
				空のグループ
			</span>
		);
	}

	return (
		<div className="flex flex-wrap gap-1">
			{/* 的: 1個ずつバッジ表示 */}
			{targets.map((t) => {
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
			{balloons.map((b) => (
				<span
					key={b.id}
					className="inline-flex h-5 items-center rounded bg-sky-400 px-1 text-[10px] font-bold text-white"
				>
					風
				</span>
			))}
			{group.train && (
				<span className="inline-flex h-5 items-center rounded bg-violet-500 px-1 text-[10px] font-bold text-white">
					列車
				</span>
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
		<div className="rounded-2xl border-2 border-amber-900/10 bg-white p-4">
			<div className="mb-4 flex items-center justify-between">
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
				<p
					className="py-6 text-center text-amber-900/30 text-sm"
					style={rf}
				>
					グループを追加してください
				</p>
			) : (
				<div className="flex items-stretch gap-1 overflow-x-auto pb-1">
					{groups.map((group, i) => {
						const isSelected = selectedIdx === i;

						return (
							<div
								key={group.id}
								className="flex shrink-0 items-center"
							>
								{i > 0 && (
									<div className="flex w-8 items-center justify-center">
										<svg
											width="18"
											height="12"
											viewBox="0 0 18 12"
											className="text-amber-300"
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
								<div
									className={cn(
										"flex min-w-[160px] cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-all",
										isSelected
											? "border-amber-500 bg-amber-50"
											: "border-transparent bg-stone-50 hover:bg-stone-100",
									)}
									role="button"
									tabIndex={0}
									onClick={() => onSelect(i)}
									onKeyDown={(e) => {
										if (
											e.key === "Enter" ||
											e.key === " "
										) {
											e.preventDefault();
											onSelect(i);
										}
									}}
								>
									<span
										className={cn(
											"font-bold text-sm",
											isSelected
												? "text-amber-900"
												: "text-amber-900/70",
										)}
										style={rf}
									>
										グループ {i + 1}
									</span>

									<GroupContent group={group} />

									<button
										type="button"
										className="self-start text-xs text-amber-900/20 transition-colors hover:text-red-500"
										style={rf}
										onClick={(e) => {
											e.stopPropagation();
											onDelete(i);
										}}
									>
										削除
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
