import { motion } from "framer-motion";
import { router } from "@/main";
import { STAGES } from "@/features/game/constants/stage-definitions";

type Props = {
	onStart: () => void;
	onPlayCustom: (stageId: string) => void;
	debugMode: boolean;
	onDebugStart: (round: number) => void;
	customStages: { id: string; name: string }[];
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const WelcomeScreen = ({
	onStart,
	onPlayCustom,
	debugMode,
	onDebugStart,
	customStages,
}: Props) => {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center bg-[#f5f0e8]">
			<motion.div
				className="flex flex-col items-center gap-6"
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
						className="mt-1 font-medium text-[clamp(0.85rem,2.5vw,1rem)] text-amber-900/50"
						style={rf}
					>
						手のジェスチャーで遊ぶシューティングゲーム
					</p>
				</div>

				{/* あそびかた */}
				<motion.div
					className="w-[90vw] max-w-sm rounded-2xl border-2 border-amber-900/10 bg-white px-6 py-5"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.4 }}
				>
					<p
						className="mb-4 text-center font-bold text-[clamp(0.65rem,1.8vw,0.75rem)] text-amber-900/40 uppercase tracking-[0.2em]"
						style={rf}
					>
						あそびかた
					</p>
					<div className="flex items-center gap-4">
						<motion.img
							src="/images/hand-pinch.png"
							alt="ピンチジェスチャー"
							className="h-20 w-20 shrink-0 opacity-60"
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 0.6, scale: 1 }}
							transition={{ delay: 0.2, duration: 0.4 }}
						/>
						<div className="flex flex-col gap-3">
							<Step
								num="1"
								label="手を動かしてねらう"
								desc="手の動きに照準が追従します"
								delay={0.25}
							/>
							<Step
								num="2"
								label="ピンチで発射"
								desc="親指と人差し指をつまむと弾が出ます"
								delay={0.35}
							/>
						</div>
					</div>
				</motion.div>

				{/* ボタン */}
				<motion.div
					className="flex flex-col items-center gap-3"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.45, duration: 0.35, ease: "backOut" }}
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
						className="font-medium text-[clamp(0.65rem,1.8vw,0.75rem)] text-amber-900/40"
						style={rf}
					>
						カメラの使用許可が必要です
					</p>
				</motion.div>

				{/* オリジナルステージ */}
				{customStages.length > 0 && (
					<motion.div
						className="w-[90vw] max-w-sm space-y-2"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5, duration: 0.4 }}
					>
						<p
							className="text-center font-bold text-[clamp(0.65rem,1.8vw,0.75rem)] text-amber-900/40 uppercase tracking-[0.2em]"
							style={rf}
						>
							オリジナルステージ
						</p>
						<div className="flex flex-wrap justify-center gap-2">
							{customStages.map((s) => (
								<button
									key={s.id}
									type="button"
									className="cursor-pointer rounded-lg border-2 border-amber-900/10 bg-white px-3 py-1.5 font-bold text-amber-900/60 text-xs transition-colors hover:bg-amber-50 hover:border-amber-900/20"
									style={rf}
									onClick={() => onPlayCustom(s.id)}
								>
									{s.name}
								</button>
							))}
						</div>
					</motion.div>
				)}

				{/* ステージ作成リンク */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.55, duration: 0.3 }}
				>
					<button
						type="button"
						className="cursor-pointer text-amber-900/30 text-[clamp(0.75rem,2vw,0.85rem)] transition-colors hover:text-amber-900/60"
						style={rf}
						onClick={() => router.navigate({ to: "/creator" })}
					>
						ステージを作る
					</button>
				</motion.div>

				{/* デバッグ */}
				{debugMode && (
					<motion.div
						className="flex gap-2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.6 }}
					>
						{STAGES.map((s, i) => (
							<button
								key={s.name}
								type="button"
								className="cursor-pointer rounded-lg border-2 border-amber-900/10 bg-white px-3 py-1.5 font-mono text-amber-900/50 text-xs transition-colors hover:bg-amber-50"
								onClick={() => onDebugStart(i)}
							>
								{s.name}
							</button>
						))}
					</motion.div>
				)}
			</motion.div>
		</div>
	);
};

const Step = ({
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
		initial={{ opacity: 0, x: -10 }}
		animate={{ opacity: 1, x: 0 }}
		transition={{ delay, duration: 0.3 }}
	>
		<span
			className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-800 font-bold text-xs text-amber-50"
			style={rf}
		>
			{num}
		</span>
		<div>
			<p
				className="font-bold text-[clamp(0.85rem,2.5vw,1rem)] text-amber-900"
				style={rf}
			>
				{label}
			</p>
			<p
				className="text-[clamp(0.7rem,2vw,0.8rem)] text-amber-900/50"
				style={rf}
			>
				{desc}
			</p>
		</div>
	</motion.div>
);
