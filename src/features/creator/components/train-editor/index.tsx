import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CreatorGroup, CreatorTrain, TrainSlotType } from "../../types";

type Props = {
	open: boolean;
	onClose: () => void;
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

const SLOT_STYLES: Record<
	TrainSlotType,
	{ bg: string; text: string; label: string }
> = {
	normal: { bg: "bg-stone-600", text: "text-white", label: "+1" },
	gold: { bg: "bg-yellow-500", text: "text-amber-900", label: "+3" },
	penalty: { bg: "bg-stone-800", text: "text-red-400", label: "-3" },
};

const SLOT_CYCLE: TrainSlotType[] = ["normal", "gold", "penalty"];

export const TrainEditor = ({
	open,
	onClose,
	group,
	onUpdateGroup,
}: Props) => {
	const train = group.train;

	const handleEnable = useCallback(() => {
		onUpdateGroup({ ...group, train: DEFAULT_TRAIN });
	}, [group, onUpdateGroup]);

	const handleDisable = useCallback(() => {
		onUpdateGroup({ ...group, train: null, trainStartTime: null });
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
			const nextType =
				SLOT_CYCLE[(currentIdx + 1) % SLOT_CYCLE.length];
			handleUpdate({
				slots: train.slots.map((s) =>
					s.index === index ? { ...s, type: nextType } : s,
				),
			});
		},
		[train, handleUpdate],
	);

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
				<DialogHeader>
					<DialogTitle style={rf}>列車の設定</DialogTitle>
				</DialogHeader>

				<div className="space-y-5" style={rf}>
					{!train ? (
						<div className="space-y-3 py-4 text-center">
							<p className="text-amber-900/40 text-sm">
								列車が追加されていません
							</p>
							<Button
								className="bg-violet-500 text-white hover:bg-violet-600"
								onClick={handleEnable}
							>
								列車を追加
							</Button>
						</div>
					) : (
						<>
							{/* 方向 */}
							<div className="flex flex-wrap items-center gap-2 sm:gap-4">
								<span className="w-16 shrink-0 text-amber-900/60 text-xs sm:w-20 sm:text-sm">
									方向
								</span>
								<div className="flex gap-1.5">
									{(
										[
											{ value: 1, label: "右 → 左" },
											{ value: -1, label: "左 → 右" },
										] as const
									).map((opt) => (
										<button
											key={opt.value}
											type="button"
											className={cn(
												"rounded-lg border-2 px-4 py-2 text-xs font-bold transition-all",
												train.direction === opt.value
													? "border-violet-500 bg-violet-50 text-violet-700"
													: "border-amber-900/15 bg-white text-amber-900/50 hover:border-amber-900/30",
											)}
											onClick={() =>
												handleUpdate({
													direction: opt.value,
												})
											}
										>
											{opt.label}
										</button>
									))}
								</div>
							</div>

							{/* 速度 */}
							<div className="flex flex-wrap items-center gap-2 sm:gap-4">
								<span className="w-16 shrink-0 text-amber-900/60 text-xs sm:w-20 sm:text-sm">
									速度
								</span>
								<Input
									type="number"
									value={train.speed}
									onChange={(e) =>
										handleUpdate({
											speed: Math.max(
												0.5,
												Math.min(
													5,
													Number(e.target.value),
												),
											),
										})
									}
									className="h-9 w-20 border-amber-900/15 text-center"
									min={0.5}
									max={5}
									step={0.5}
								/>
								<span className="text-amber-900/30 text-xs">
									1=ゆっくり / 2=普通 / 5=最速
								</span>
							</div>

							{/* 的の上下移動 */}
							<div className="flex flex-wrap items-center gap-2 sm:gap-4">
								<span className="w-16 shrink-0 text-amber-900/60 text-xs sm:w-20 sm:text-sm">
									的の上下移動
								</span>
								<button
									type="button"
									className={cn(
										"rounded-lg border-2 px-4 py-2 text-xs font-bold transition-all",
										train.slotsOscillate
											? "border-violet-500 bg-violet-50 text-violet-700"
											: "border-amber-900/15 bg-white text-amber-900/50 hover:border-amber-900/30",
									)}
									onClick={() =>
										handleUpdate({
											slotsOscillate:
												!train.slotsOscillate,
										})
									}
								>
									{train.slotsOscillate ? "ON" : "OFF"}
								</button>
								<span className="text-amber-900/30 text-xs">
									窓の的が上下に動く
								</span>
							</div>

							{/* スロット */}
							<div className="space-y-2">
								<span className="text-amber-900/60 text-sm">
									スロット（クリックで種類変更）
								</span>
								<div className="flex flex-wrap gap-3 sm:gap-6">
									{[0, 1, 2].map((car) => (
										<div
											key={`car-${car}`}
											className="space-y-1.5"
										>
											<span className="text-amber-900/30 text-[10px]">
												車両{car + 1}
											</span>
											<div className="flex gap-1">
												{[0, 1, 2].map((slot) => {
													const index =
														car * 3 + slot;
													const s =
														train.slots.find(
															(sl) =>
																sl.index ===
																index,
														);
													const type =
														s?.type ?? "normal";
													const style =
														SLOT_STYLES[type];
													return (
														<button
															key={`slot-${index}`}
															type="button"
															className={cn(
																"flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold transition-all hover:scale-110 sm:h-10 sm:w-10 sm:text-xs",
																style.bg,
																style.text,
															)}
															onClick={() =>
																handleSlotClick(
																	index,
																)
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

							{/* 削除 */}
							<div className="flex justify-end pt-2">
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										handleDisable();
										onClose();
									}}
								>
									列車を削除
								</Button>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
