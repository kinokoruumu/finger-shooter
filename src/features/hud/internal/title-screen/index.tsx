import { motion } from "framer-motion";
import { STAGES } from "@/config/stage-definitions";
import { cn } from "@/lib/utils";

type Props = {
	onStart: (startRound?: number) => void;
	debugMode: boolean;
};

const roundedFont = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const HowToStep = ({
	step,
	icon,
	label,
	desc,
	delay,
}: {
	step: number;
	icon: string;
	label: string;
	desc: string;
	delay: number;
}) => (
	<motion.div
		className="flex items-center gap-4"
		initial={{ opacity: 0, x: -20 }}
		animate={{ opacity: 1, x: 0 }}
		transition={{ delay, duration: 0.4, ease: "easeOut" }}
	>
		<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
			{icon}
		</div>
		<div>
			<p className="font-bold text-sm text-white" style={roundedFont}>
				<span className="mr-1.5 text-red-400">0{step}</span>
				{label}
			</p>
			<p className="text-white/40 text-xs">{desc}</p>
		</div>
	</motion.div>
);

export const TitleScreen = ({ onStart, debugMode }: Props) => {
	return (
		<div className="absolute inset-0 z-30 flex items-center justify-center">
			<div className="flex flex-col items-center gap-8">
				{/* タイトル */}
				<motion.div
					className="text-center"
					initial={{ opacity: 0, y: -30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
				>
					<h1
						className="font-black text-6xl tracking-tight text-white"
						style={{
							...roundedFont,
							textShadow:
								"0 0 40px rgba(239,68,68,0.3), 0 4px 20px rgba(0,0,0,0.5)",
						}}
					>
						Finger
						<br />
						<span className="text-red-400">Shooter</span>
					</h1>
				</motion.div>

				{/* 操作説明カード */}
				<motion.div
					className="w-80 rounded-2xl bg-black/60 p-6 backdrop-blur-md"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.5 }}
				>
					<p
						className="mb-4 text-center font-bold text-white/50 text-xs uppercase tracking-widest"
						style={roundedFont}
					>
						あそびかた
					</p>
					<div className="flex flex-col gap-3">
						<HowToStep
							step={1}
							icon="✋"
							label="手をかざす"
							desc="カメラに手を映してください"
							delay={0.4}
						/>
						<HowToStep
							step={2}
							icon="🖐️"
							label="パーでセンタリング"
							desc="1.5秒キープで照準をリセット"
							delay={0.5}
						/>
						<HowToStep
							step={3}
							icon="👉"
							label="手を動かして照準"
							desc="手の位置で狙いを定める"
							delay={0.6}
						/>
						<HowToStep
							step={4}
							icon="👌"
							label="ピンチで発射！"
							desc="親指と人差し指をつまんで撃つ"
							delay={0.7}
						/>
					</div>
				</motion.div>

				{/* スタートボタン */}
				<motion.div
					className="flex flex-col items-center gap-2"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.8, duration: 0.4, ease: "backOut" }}
				>
					<button
						type="button"
						className={cn(
							"pointer-events-auto rounded-2xl bg-red-500 px-12 py-4 font-black text-xl text-white shadow-lg shadow-red-500/30 transition-all",
							"hover:scale-105 hover:bg-red-400 hover:shadow-red-400/40 active:scale-95 active:bg-red-600",
						)}
						style={roundedFont}
						onClick={() => onStart()}
					>
						START
					</button>
					<p className="text-white/30 text-xs" style={roundedFont}>
						👌 ピンチでもスタート
					</p>
				</motion.div>

				{/* デバッグ: ラウンド選択 */}
				{debugMode && (
					<motion.div
						className="flex gap-2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 1 }}
					>
						{STAGES.map((s, i) => (
							<button
								key={s.name}
								type="button"
								className="pointer-events-auto rounded-lg bg-white/5 px-3 py-1 font-mono text-white/40 text-xs transition-colors hover:bg-white/15"
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
