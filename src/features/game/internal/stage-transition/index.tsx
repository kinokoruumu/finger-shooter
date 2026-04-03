import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { STAGES } from "@/config/stage-definitions";
import { cn } from "@/lib/utils";

type Props = {
	stageIndex: number;
	stageScores: (number | null)[];
	onComplete: () => void;
};

const roundedFont = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

type Phase = "score-table" | "round-title" | "done";

export const StageTransition = ({
	stageIndex,
	stageScores,
	onComplete,
}: Props) => {
	// ゲーム開始時（スコアが全部nullの場合）はスコア表をスキップ
	const hasAnyScore = stageScores.some((s) => s !== null);
	const [phase, setPhase] = useState<Phase>(
		hasAnyScore ? "score-table" : "round-title",
	);
	const [visible, setVisible] = useState(true);
	const stage = STAGES[stageIndex];

	// スコア表の前のラウンド名（終了したラウンド）
	const prevStageIndex = stageIndex - 1;
	const prevStage = prevStageIndex >= 0 ? STAGES[prevStageIndex] : null;

	useEffect(() => {
		if (phase === "score-table") {
			const timer = setTimeout(() => {
				setVisible(false);
			}, 3000);
			return () => clearTimeout(timer);
		}
		if (phase === "round-title") {
			setVisible(true);
			const timer = setTimeout(() => {
				setVisible(false);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [phase]);

	if (!stage) return null;

	const total = stageScores.reduce<number>((sum, s) => sum + (s ?? 0), 0);

	return (
		<div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
			{/* Phase 1: スコア表 */}
			{phase === "score-table" && (
				<AnimatePresence
					onExitComplete={() => {
						setPhase("round-title");
					}}
				>
					{visible && (
						<motion.div
							key="score-table"
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.4, ease: "easeOut" }}
							className="flex w-1/2 min-w-80 max-w-lg flex-col items-center gap-5 rounded-2xl bg-black/75 px-8 py-8 backdrop-blur-sm"
						>
							{/* 終了したラウンド名 */}
							{prevStage && (
								<h2
									className="font-black text-2xl text-white"
									style={roundedFont}
								>
									{prevStage.name}
								</h2>
							)}

							{/* スコアテーブル */}
							<div className="flex w-full">
								{STAGES.map((s, i) => {
									const score = stageScores[i];
									const hasScore = score !== null;
									return (
										<div
											key={s.name}
											className={cn(
												"flex flex-1 flex-col items-center border-r border-white/10 py-3 last:border-r-0",
											)}
										>
											<span
												className="mb-1 text-white/40 text-xs"
												style={roundedFont}
											>
												{s.name}
											</span>
											<span
												className={cn(
													"font-black text-3xl tabular-nums",
													hasScore ? "text-white" : "text-white/15",
												)}
												style={roundedFont}
											>
												{hasScore ? score : "-"}
											</span>
										</div>
									);
								})}
								{/* 合計 */}
								<div className="flex flex-1 flex-col items-center border-l border-white/20 py-3">
									<span
										className="mb-1 text-white/40 text-xs"
										style={roundedFont}
									>
										合計
									</span>
									<span
										className="font-black text-3xl text-yellow-300 tabular-nums"
										style={roundedFont}
									>
										{total}
									</span>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			)}

			{/* Phase 2: 次のラウンド名 */}
			{phase === "round-title" && (
				<AnimatePresence
					onExitComplete={() => {
						setPhase("done");
						onComplete();
					}}
				>
					{visible && (
						<motion.div
							key={`round-title-${stageIndex}`}
							initial={{ opacity: 0, scale: 0.6, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 1.1, y: -30 }}
							transition={{ duration: 0.5, ease: "easeOut" }}
							className="text-center"
						>
							<motion.h2
								className="font-black text-white"
								style={{
									...roundedFont,
									fontSize: stageIndex === 2 ? "3rem" : "3.5rem",
									textShadow:
										"0 0 20px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.5)",
								}}
								initial={{ letterSpacing: "0.3em" }}
								animate={{ letterSpacing: "0.1em" }}
								transition={{ duration: 0.6, ease: "easeOut" }}
							>
								{stage.name}
							</motion.h2>
						</motion.div>
					)}
				</AnimatePresence>
			)}
		</div>
	);
};
