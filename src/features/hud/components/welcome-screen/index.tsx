import { motion } from "framer-motion";

type Props = {
	onStart: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const WelcomeScreen = ({ onStart }: Props) => {
	return (
		<div
			className="absolute inset-0 z-50 flex items-center justify-center bg-cover bg-center bg-no-repeat"
			style={{ backgroundImage: "url('/images/bg.png')" }}
		>
			<motion.div
				className="flex flex-col items-center gap-8"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
			>
				<div className="text-center">
					<h1
						className="font-black text-[clamp(4rem,10vw,6rem)] tracking-tight text-white"
						style={{
							...rf,
							textShadow:
								"0 4px 16px rgba(0,0,0,0.5), 0 0 60px rgba(234,88,12,0.15)",
						}}
					>
						的あて
					</h1>
					<p
						className="mt-2 text-[clamp(0.9rem,2.5vw,1.1rem)] text-white/70"
						style={rf}
					>
						手のジェスチャーで遊ぶシューティングゲーム
					</p>
				</div>

				<motion.div
					className="flex flex-col items-center gap-3"
					initial={{ opacity: 0, scale: 0.85 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.4, duration: 0.35, ease: "backOut" }}
				>
					<button
						type="button"
						className="pointer-events-auto rounded-2xl bg-orange-500 px-14 py-5 font-black text-[clamp(1.1rem,3vw,1.4rem)] text-white shadow-xl shadow-orange-500/30 transition-all hover:scale-105 hover:bg-orange-400 active:scale-95 active:bg-orange-600"
						style={rf}
						onClick={onStart}
					>
						はじめる
					</button>
					<p
						className="text-[clamp(0.7rem,2vw,0.85rem)] text-white/40"
						style={rf}
					>
						カメラの使用許可が必要です
					</p>
				</motion.div>
			</motion.div>
		</div>
	);
};
