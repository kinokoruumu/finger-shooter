import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { StageDefinition } from "@/features/game/constants/stage-definitions";
import { cn } from "@/lib/utils";

type Props = {
	stageIndex: number;
	stageScores: (number | null)[];
	stages: StageDefinition[];
	onComplete: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

type Phase = "score-table" | "round-title" | "done";

export const StageTransition = ({
	stageIndex,
	stageScores,
	stages,
	onComplete,
}: Props) => {
	const hasAnyScore = stageScores.some((s) => s !== null);
	const [phase, setPhase] = useState<Phase>(
		hasAnyScore ? "score-table" : "round-title",
	);
	const [visible, setVisible] = useState(true);
	const stage = stages[stageIndex];

	const prevStageIndex = stageIndex - 1;
	const prevStage = prevStageIndex >= 0 ? stages[prevStageIndex] : null;

	useEffect(() => {
		if (phase === "score-table") {
			const timer = setTimeout(() => setVisible(false), 3000);
			return () => clearTimeout(timer);
		}
		if (phase === "round-title") {
			setVisible(true);
			const timer = setTimeout(() => setVisible(false), 2000);
			return () => clearTimeout(timer);
		}
	}, [phase]);

	if (!stage) return null;

	const total = stageScores.reduce<number>((sum, s) => sum + (s ?? 0), 0);

	return (
		<div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
			{/* Phase 1: スコア表 */}
			{phase === "score-table" && (
				<AnimatePresence onExitComplete={() => setPhase("round-title")}>
					{visible && (
						<motion.div
							key="score-table"
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.4, ease: "easeOut" }}
							className="flex w-[90vw] max-w-2xl flex-col items-center gap-5 rounded-2xl border border-stone-700/60 bg-stone-900/80 px-8 py-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
						>
							{prevStage && (
								<h2 className="font-black text-2xl text-white" style={rf}>
									{prevStage.name}
								</h2>
							)}

							<div className="flex w-full overflow-hidden rounded-xl border border-stone-600 bg-stone-800/60 shadow-inner">
								{stages.map((s, i) => {
									const score = stageScores[i];
									const hasScore = score !== null;
									return (
										<div
											key={s.name}
											className="flex flex-1 flex-col items-center border-r border-stone-600 py-3 last:border-r-0"
										>
											<span className="mb-1 text-stone-400 text-xs" style={rf}>
												{s.name}
											</span>
											<span
												className={cn(
													"font-black text-3xl tabular-nums",
													hasScore ? "text-white" : "text-stone-600",
												)}
												style={rf}
											>
												{hasScore ? score : "-"}
											</span>
										</div>
									);
								})}
								<div className="flex flex-1 flex-col items-center border-l border-stone-600 bg-stone-700/50 py-3">
									<span className="mb-1 text-stone-400 text-xs" style={rf}>
										合計
									</span>
									<span
										className="font-black text-3xl text-orange-400 tabular-nums"
										style={rf}
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
							className="rounded-2xl border border-stone-700/60 bg-stone-900/80 px-12 py-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
						>
							<motion.h2
								className="font-black text-white"
								style={{
									...rf,
									fontSize: stageIndex === 2 ? "3rem" : "3.5rem",
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
