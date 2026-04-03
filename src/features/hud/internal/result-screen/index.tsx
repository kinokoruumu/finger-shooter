import { motion } from "framer-motion";
import { STAGES } from "@/config/stage-definitions";
import { cn } from "@/lib/utils";

type Props = {
	stageScores: (number | null)[];
	onRetry: () => void;
};

const roundedFont = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const ResultScreen = ({ stageScores, onRetry }: Props) => {
	const total = stageScores.reduce<number>((sum, s) => sum + (s ?? 0), 0);

	return (
		<div className="absolute inset-0 z-30 flex items-center justify-center">
			<motion.div
				className="flex w-96 flex-col items-center rounded-3xl bg-black/70 px-10 py-10 backdrop-blur-md"
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				{/* タイトル */}
				<motion.h2
					className="mb-6 font-black text-3xl text-white"
					style={{
						...roundedFont,
						textShadow: "0 0 20px rgba(255,255,255,0.2)",
					}}
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.4 }}
				>
					RESULT
				</motion.h2>

				{/* ラウンド別スコア */}
				<motion.div
					className="mb-6 flex w-full overflow-hidden rounded-xl bg-white/5"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.4 }}
				>
					{STAGES.map((s, i) => (
						<motion.div
							key={s.name}
							className={cn(
								"flex flex-1 flex-col items-center border-r border-white/5 py-4 last:border-r-0",
							)}
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
						>
							<span className="mb-1 text-white/35 text-xs" style={roundedFont}>
								R{i + 1}
							</span>
							<span
								className="font-black text-2xl text-white tabular-nums"
								style={roundedFont}
							>
								{stageScores[i] ?? 0}
							</span>
							<span className="mt-0.5 text-white/20 text-xs tabular-nums">
								/ {s.maxScore}
							</span>
						</motion.div>
					))}
				</motion.div>

				{/* 合計スコア */}
				<motion.div
					className="mb-8 text-center"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.7, duration: 0.4, ease: "backOut" }}
				>
					<p className="mb-1 text-white/40 text-xs uppercase tracking-widest">
						Total Score
					</p>
					<p
						className="font-black text-6xl text-white tabular-nums"
						style={{
							...roundedFont,
							textShadow: "0 0 30px rgba(255,255,255,0.15)",
						}}
					>
						{total}
					</p>
					<p className="mt-1 text-white/25 text-xs tabular-nums">
						/ {STAGES.reduce((sum, s) => sum + s.maxScore, 0)}
					</p>
				</motion.div>

				{/* リトライボタン */}
				<motion.div
					className="flex flex-col items-center gap-2"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.9, duration: 0.3 }}
				>
					<button
						type="button"
						className={cn(
							"pointer-events-auto rounded-2xl bg-red-500 px-10 py-3.5 font-black text-lg text-white shadow-lg shadow-red-500/25 transition-all",
							"hover:scale-105 hover:bg-red-400 active:scale-95 active:bg-red-600",
						)}
						style={roundedFont}
						onClick={onRetry}
					>
						RETRY
					</button>
					<p className="text-white/25 text-xs" style={roundedFont}>
						👌 ピンチでもリトライ
					</p>
				</motion.div>
			</motion.div>
		</div>
	);
};
