import { motion } from "framer-motion";
import { STAGES } from "@/features/game/constants/stage-definitions";

type Props = {
	onStart: (startRound?: number) => void;
	debugMode: boolean;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const TitleScreen = ({ onStart, debugMode }: Props) => {
	return (
		<div className="absolute inset-0 z-30 flex items-center justify-center">
			<div className="flex flex-col items-center gap-6">
				{/* タイトル */}
				<motion.div
					className="text-center"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: "easeOut" }}
				>
					<h1
						className="font-black tracking-tight text-white text-[clamp(3rem,8vw,4.5rem)]"
						style={{
							...rf,
							textShadow:
								"0 3px 12px rgba(0,0,0,0.5), 0 0 40px rgba(234,88,12,0.2)",
						}}
					>
						的あて
					</h1>
				</motion.div>

				{/* 操作説明カード */}
				<motion.div
					className="w-[90vw] max-w-md rounded-2xl border border-stone-700/60 bg-stone-900/80 px-7 py-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.45 }}
				>
					<p
						className="mb-5 text-center font-bold text-stone-400 text-xs uppercase tracking-[0.2em]"
						style={rf}
					>
						あそびかた
					</p>
					<div className="flex flex-col gap-4">
						{/* ステップ1 */}
						<motion.div
							className="flex items-start gap-3"
							initial={{ opacity: 0, x: -15 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.3, duration: 0.35 }}
						>
							<span
								className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-sm text-white"
								style={rf}
							>
								1
							</span>
							<div>
								<p
									className="font-bold text-[clamp(0.9rem,2.5vw,1.1rem)] text-white"
									style={rf}
								>
									手を動かしてねらう
								</p>
								<p className="text-stone-400 text-[clamp(0.7rem,2vw,0.85rem)] leading-relaxed">
									手の動きに照準が追従します
								</p>
							</div>
						</motion.div>

						{/* ステップ2 */}
						<motion.div
							className="flex items-start gap-3"
							initial={{ opacity: 0, x: -15 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.4, duration: 0.35 }}
						>
							<span
								className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-sm text-white"
								style={rf}
							>
								2
							</span>
							<div>
								<p
									className="font-bold text-[clamp(0.9rem,2.5vw,1.1rem)] text-white"
									style={rf}
								>
									ピンチで発射
								</p>
								<p className="text-stone-400 text-[clamp(0.7rem,2vw,0.85rem)] leading-relaxed">
									親指と人差し指をつまむと弾が出ます
								</p>
							</div>
						</motion.div>
					</div>
				</motion.div>

				{/* スタートボタン */}
				<motion.div
					className="flex flex-col items-center gap-2"
					initial={{ opacity: 0, scale: 0.85 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.6, duration: 0.35, ease: "backOut" }}
				>
					<button
						id="main-action-btn"
						type="button"
						className="pointer-events-auto rounded-2xl bg-orange-500 px-14 py-4 font-black text-xl text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:bg-orange-400 active:scale-95 active:bg-orange-600"
						style={rf}
						onClick={() => onStart()}
					>
						スタート
					</button>
					<p className="text-stone-400 text-xs" style={rf}>
						ボタンにねらいを合わせてピンチでもOK
					</p>
				</motion.div>

				{/* デバッグ */}
				{debugMode && (
					<motion.div
						className="flex gap-2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.8 }}
					>
						{STAGES.map((s, i) => (
							<button
								key={s.name}
								type="button"
								className="pointer-events-auto rounded-lg border border-stone-600 bg-stone-800/80 px-3 py-1.5 font-mono text-stone-300 text-xs transition-colors hover:bg-stone-700"
								onClick={() => onStart(i)}
							>
								R{i + 1}
							</button>
						))}
					</motion.div>
				)}
			</div>
		</div>
	);
};
