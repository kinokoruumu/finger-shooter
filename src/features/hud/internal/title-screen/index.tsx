import { motion } from "framer-motion";
import { STAGES } from "@/config/stage-definitions";

type Props = {
	onStart: (startRound?: number) => void;
	debugMode: boolean;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const HowToStep = ({
	num,
	label,
	desc,
	delay,
}: {
	num: string;
	label: string;
	desc: string;
	delay: number;
}) => (
	<motion.div
		className="flex items-start gap-3"
		initial={{ opacity: 0, x: -15 }}
		animate={{ opacity: 1, x: 0 }}
		transition={{ delay, duration: 0.35, ease: "easeOut" }}
	>
		<span
			className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-400/90 font-bold text-sm text-white"
			style={rf}
		>
			{num}
		</span>
		<div>
			<p className="font-bold text-[15px] text-stone-800" style={rf}>
				{label}
			</p>
			<p className="text-stone-500 text-xs leading-relaxed">{desc}</p>
		</div>
	</motion.div>
);

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
						className="font-black text-5xl tracking-tight text-stone-800"
						style={rf}
					>
						Finger
						<br />
						<span className="text-orange-500">Shooter</span>
					</h1>
				</motion.div>

				{/* 操作説明カード */}
				<motion.div
					className="w-[340px] rounded-2xl bg-amber-50/95 px-7 py-6 shadow-xl shadow-black/10 backdrop-blur-md"
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.45 }}
				>
					<p
						className="mb-4 text-center font-bold text-stone-400 text-xs uppercase tracking-[0.2em]"
						style={rf}
					>
						あそびかた
					</p>
					<div className="flex flex-col gap-3.5">
						<HowToStep
							num="1"
							label="グーをつくる"
							desc="親指と人差し指だけ開いた状態で構える"
							delay={0.3}
						/>
						<HowToStep
							num="2"
							label="手を動かしてねらう"
							desc="照準が手の動きに追従します"
							delay={0.4}
						/>
						<HowToStep
							num="3"
							label="ピンチで発射"
							desc="親指と人差し指をつまむと弾が出ます"
							delay={0.5}
						/>
					</div>
					<motion.div
						className="mt-4 rounded-lg bg-stone-100 px-4 py-2.5"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.6, duration: 0.3 }}
					>
						<p className="text-center text-stone-500 text-xs leading-relaxed">
							プレイ中いつでも手のひらをカメラに向けて
							<br />
							1.5秒キープすると照準位置を調整できます
						</p>
					</motion.div>
				</motion.div>

				{/* スタートボタン */}
				<motion.div
					className="flex flex-col items-center gap-2"
					initial={{ opacity: 0, scale: 0.85 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.7, duration: 0.35, ease: "backOut" }}
				>
					<button
						type="button"
						className="pointer-events-auto rounded-2xl bg-orange-500 px-12 py-4 font-black text-xl text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:bg-orange-400 active:scale-95 active:bg-orange-600"
						style={rf}
						onClick={() => onStart()}
					>
						START
					</button>
					<p className="text-stone-400 text-xs" style={rf}>
						ピンチでもスタートできます
					</p>
				</motion.div>

				{/* デバッグ */}
				{debugMode && (
					<motion.div
						className="flex gap-2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.9 }}
					>
						{STAGES.map((s, i) => (
							<button
								key={s.name}
								type="button"
								className="pointer-events-auto rounded-lg bg-stone-200/60 px-3 py-1 font-mono text-stone-400 text-xs transition-colors hover:bg-stone-200"
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
