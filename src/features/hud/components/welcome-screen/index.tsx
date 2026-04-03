import { motion } from "framer-motion";

type Props = {
	onStart: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const WelcomeScreen = ({ onStart }: Props) => {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center bg-[#f5f0e8]">
			<motion.div
				className="flex flex-col items-center gap-8"
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				{/* タイトル */}
				<div className="text-center">
					<h1
						className="font-black text-[clamp(3.5rem,10vw,5rem)] tracking-tight text-amber-900"
						style={rf}
					>
						的あて
					</h1>
					<p
						className="mt-1 font-medium text-[clamp(0.9rem,2.5vw,1.1rem)] text-amber-900/50"
						style={rf}
					>
						手のジェスチャーで遊ぶシューティングゲーム
					</p>
				</div>

				{/* ボタン */}
				<motion.div
					className="flex flex-col items-center gap-3"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.3, duration: 0.35, ease: "backOut" }}
				>
					<button
						type="button"
						className="cursor-pointer rounded-2xl bg-amber-800 px-14 py-4 font-bold text-[clamp(1.1rem,3vw,1.3rem)] text-amber-50 shadow-lg shadow-amber-900/20 transition-all hover:bg-amber-700 active:scale-[0.98]"
						style={rf}
						onClick={onStart}
					>
						はじめる
					</button>
					<p
						className="font-medium text-[clamp(0.7rem,2vw,0.85rem)] text-amber-900/40"
						style={rf}
					>
						カメラの使用許可が必要です
					</p>
				</motion.div>
			</motion.div>
		</div>
	);
};
