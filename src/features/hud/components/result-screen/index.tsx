import { motion } from "framer-motion";
import type { StageDefinition } from "@/features/game/constants/stage-definitions";

type Props = {
	stageScores: (number | null)[];
	stages: StageDefinition[];
	onRetry: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const ResultScreen = ({ stageScores, stages, onRetry }: Props) => {
	const total = stageScores.reduce<number>((sum, s) => sum + (s ?? 0), 0);

	return (
		<div className="absolute inset-0 z-30 flex items-center justify-center">
			<motion.div
				className="flex w-[90vw] max-w-lg flex-col items-center rounded-3xl border border-stone-700/60 bg-stone-900/80 px-10 py-10 shadow-2xl shadow-black/40 backdrop-blur-xl"
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				<motion.h2
					className="mb-6 font-black text-[clamp(1.5rem,4vw,2rem)] text-white"
					style={rf}
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.4 }}
				>
					リザルト
				</motion.h2>

				<motion.div
					className="mb-6 flex w-full overflow-hidden rounded-xl border border-stone-600 bg-stone-800/60 shadow-inner"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.4 }}
				>
					{stages.map((s, i) => (
						<motion.div
							key={s.name}
							className="flex flex-1 flex-col items-center border-r border-stone-600 py-4 last:border-r-0"
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
						>
							<span
								className="mb-1 text-stone-400 text-[clamp(0.6rem,1.5vw,0.75rem)]"
								style={rf}
							>
								{s.name}
							</span>
							<span
								className="font-black text-[clamp(1.2rem,3vw,1.5rem)] text-white tabular-nums"
								style={rf}
							>
								{stageScores[i] ?? 0}
							</span>
						</motion.div>
					))}
				</motion.div>

				<motion.div
					className="mb-8 text-center"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.7, duration: 0.4, ease: "backOut" }}
				>
					<p
						className="mb-1 text-stone-400 text-[clamp(0.7rem,2vw,0.85rem)] tracking-widest"
						style={rf}
					>
						合計スコア
					</p>
					<p
						className="font-black text-[clamp(2.5rem,7vw,4rem)] text-white tabular-nums"
						style={rf}
					>
						{total}
					</p>
				</motion.div>

				<motion.div
					className="flex flex-col items-center gap-2"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.9, duration: 0.3 }}
				>
					<button
						id="main-action-btn"
						type="button"
						className="pointer-events-auto rounded-2xl bg-orange-500 px-10 py-3.5 font-black text-[clamp(1rem,2.5vw,1.2rem)] text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-105 hover:bg-orange-400 active:scale-95 active:bg-orange-600"
						style={rf}
						onClick={onRetry}
					>
						リトライ
					</button>
					<p
						className="text-stone-400 text-[clamp(0.7rem,2vw,0.85rem)]"
						style={rf}
					>
						ピンチでもリトライ
					</p>
				</motion.div>
			</motion.div>
		</div>
	);
};
