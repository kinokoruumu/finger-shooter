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

export const StageTransition = ({
	stageIndex,
	stageScores,
	onComplete,
}: Props) => {
	const [visible, setVisible] = useState(true);
	const stage = STAGES[stageIndex];

	useEffect(() => {
		const timer = setTimeout(() => {
			setVisible(false);
		}, 3000);
		return () => clearTimeout(timer);
	}, []);

	if (!stage) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
			<AnimatePresence
				onExitComplete={() => {
					onComplete();
				}}
			>
				{visible && (
					<motion.div
						key={`stage-${stageIndex}`}
						initial={{ opacity: 0, scale: 0.6, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 1.1, y: -30 }}
						transition={{ duration: 0.5, ease: "easeOut" }}
						className="flex flex-col items-center gap-6"
					>
						{/* ステージ名 */}
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

						{/* スコアボード */}
						<motion.div
							className="flex gap-1"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.4 }}
						>
							{STAGES.map((s, i) => {
								const score = stageScores[i];
								const isCurrent = i === stageIndex;
								const hasScore = score !== null;

								return (
									<div
										key={s.name}
										className={cn(
											"flex flex-col items-center rounded-lg px-5 py-3",
											isCurrent
												? "bg-white/20 ring-2 ring-white/50"
												: "bg-white/5",
										)}
									>
										<span className="text-white/40 text-xs" style={roundedFont}>
											S{i + 1}
										</span>
										<span
											className={cn(
												"font-black text-2xl tabular-nums",
												hasScore ? "text-white" : "text-white/15",
											)}
											style={roundedFont}
										>
											{hasScore ? score : "-"}
										</span>
									</div>
								);
							})}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
