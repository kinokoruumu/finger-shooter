import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CreatorGroup, CreatorTrain, TrainSlotType } from "../../types";

type Props = {
	group: CreatorGroup;
	onUpdateGroup: (group: CreatorGroup) => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const DEFAULT_TRAIN: CreatorTrain = {
	direction: 1,
	speed: 2.0,
	slotsOscillate: false,
	slots: Array.from({ length: 9 }, (_, i) => ({
		index: i,
		type: "normal" as TrainSlotType,
	})),
};

const SLOT_STYLES: Record<TrainSlotType, { bg: string; text: string; label: string }> = {
	normal: { bg: "bg-stone-600", text: "text-white", label: "+1" },
	gold: { bg: "bg-yellow-500", text: "text-amber-900", label: "+3" },
	penalty: { bg: "bg-stone-800", text: "text-red-400", label: "-3" },
};

const SLOT_CYCLE: TrainSlotType[] = ["normal", "gold", "penalty"];

export const TrainEditor = ({ group, onUpdateGroup }: Props) => {
	const train = group.train;

	const handleEnable = useCallback(() => {
		onUpdateGroup({ ...group, train: DEFAULT_TRAIN });
	}, [group, onUpdateGroup]);

	const handleDisable = useCallback(() => {
		onUpdateGroup({ ...group, train: null });
	}, [group, onUpdateGroup]);

	const handleUpdate = useCallback(
		(update: Partial<CreatorTrain>) => {
			if (!train) return;
			onUpdateGroup({ ...group, train: { ...train, ...update } });
		},
		[group, train, onUpdateGroup],
	);

	const handleSlotClick = useCallback(
		(index: number) => {
			if (!train) return;
			const slot = train.slots.find((s) => s.index === index);
			if (!slot) return;
			const currentIdx = SLOT_CYCLE.indexOf(slot.type);
			const nextType = SLOT_CYCLE[(currentIdx + 1) % SLOT_CYCLE.length];
			handleUpdate({
				slots: train.slots.map((s) =>
					s.index === index ? { ...s, type: nextType } : s,
				),
			});
		},
		[train, handleUpdate],
	);

	return (
		<div className="space-y-3" style={rf}>
			<div className="flex items-center justify-between">
				<span className="font-bold text-amber-900 text-sm">列車</span>
				{!train ? (
					<Button
						size="sm"
						className="bg-violet-500 text-white hover:bg-violet-600"
						onClick={handleEnable}
					>
						+ 列車追加
					</Button>
				) : (
					<button
						type="button"
						className="text-xs text-amber-900/30 transition-colors hover:text-red-500"
						onClick={handleDisable}
					>
						列車を削除
					</button>
				)}
			</div>

			{train && (
				<div className="space-y-4 rounded-lg border border-amber-900/10 bg-white p-4">
					{/* 方向 */}
					<div className="flex items-center gap-4">
						<span className="shrink-0 text-amber-900/60 text-xs">
							方向
						</span>
						<div className="flex gap-1">
							<button
								type="button"
								className={cn(
									"rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
									train.direction === 1
										? "bg-amber-900 text-white"
										: "bg-amber-50 text-amber-900/50 hover:bg-amber-100",
								)}
								onClick={() => handleUpdate({ direction: 1 })}
							>
								右 → 左
							</button>
							<button
								type="button"
								className={cn(
									"rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
									train.direction === -1
										? "bg-amber-900 text-white"
										: "bg-amber-50 text-amber-900/50 hover:bg-amber-100",
								)}
								onClick={() => handleUpdate({ direction: -1 })}
							>
								左 → 右
							</button>
						</div>
					</div>

					{/* 速度 */}
					<div className="flex items-center gap-4">
						<span className="shrink-0 text-amber-900/60 text-xs">
							速度
						</span>
						<Input
							type="number"
							value={train.speed}
							onChange={(e) =>
								handleUpdate({
									speed: Math.max(0.5, Math.min(5, Number(e.target.value))),
								})
							}
							className="h-8 w-20 border-amber-900/15 text-center text-xs"
							min={0.5}
							max={5}
							step={0.5}
						/>
						<span className="text-amber-900/30 text-[10px]">
							（1=ゆっくり / 2=普通 / 3=速い / 5=最速）
						</span>
					</div>

					{/* 上下揺れ */}
					<div className="flex items-center gap-4">
						<span className="shrink-0 text-amber-900/60 text-xs">
							上下揺れ
						</span>
						<button
							type="button"
							className={cn(
								"rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
								train.slotsOscillate
									? "bg-amber-900 text-white"
									: "bg-amber-50 text-amber-900/50 hover:bg-amber-100",
							)}
							onClick={() =>
								handleUpdate({
									slotsOscillate: !train.slotsOscillate,
								})
							}
						>
							{train.slotsOscillate ? "ON" : "OFF"}
						</button>
					</div>

					{/* スロット（3車両×3窓） */}
					<div className="space-y-2">
						<span className="text-amber-900/60 text-xs">
							スロット（クリックで種類変更）
						</span>
						<div className="flex gap-4">
							{[0, 1, 2].map((car) => (
								<div key={`car-${car}`} className="space-y-1">
									<span className="text-amber-900/30 text-[10px]">
										車両{car + 1}
									</span>
									<div className="flex gap-1">
										{[0, 1, 2].map((slot) => {
											const index = car * 3 + slot;
											const s = train.slots.find(
												(sl) => sl.index === index,
											);
											const type = s?.type ?? "normal";
											const style = SLOT_STYLES[type];
											return (
												<button
													key={`slot-${index}`}
													type="button"
													className={cn(
														"flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all hover:scale-110",
														style.bg,
														style.text,
													)}
													onClick={() =>
														handleSlotClick(index)
													}
												>
													{style.label}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
