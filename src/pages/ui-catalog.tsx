import { useState } from "react";
import { STAGES } from "@/config/stage-definitions";
import { StageTransition } from "@/features/game/internal/stage-transition";
import { ResultScreen } from "@/features/hud/internal/result-screen";
import { TitleScreen } from "@/features/hud/internal/title-screen";
import { cn } from "@/lib/utils";

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const UICatalog = () => {
	const [transitionKey, setTransitionKey] = useState(0);
	const [transitionStage, setTransitionStage] = useState(1);
	const [showTransition, setShowTransition] = useState(true);

	const triggerTransition = (stage: number) => {
		setTransitionStage(stage);
		setShowTransition(false);
		setTimeout(() => {
			setTransitionKey((k) => k + 1);
			setShowTransition(true);
		}, 100);
	};

	return (
		<div
			className="relative min-h-screen bg-cover bg-center bg-no-repeat"
			style={{ backgroundImage: "url('/images/bg.png')" }}
		>
			<div className="relative z-10 space-y-12 p-8">
				<h1
					className="text-center font-black text-3xl text-white drop-shadow-lg"
					style={rf}
				>
					UI カタログ
				</h1>

				{/* タイトル画面 */}
				<Section title="タイトル画面">
					<div className="relative h-[700px] overflow-hidden rounded-2xl border border-stone-600">
						<BgImage />
						<TitleScreen onStart={() => {}} debugMode />
					</div>
				</Section>

				{/* キャリブレーション */}
				<Section title="キャリブレーション">
					<div className="relative h-[500px] overflow-hidden rounded-2xl border border-stone-600">
						<BgImage />
						<div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
							<div className="flex w-[90vw] max-w-md flex-col items-center gap-5 rounded-2xl border border-stone-700/60 bg-stone-900/80 px-8 py-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
								<p
									className="text-center font-black text-[clamp(1.2rem,3vw,1.5rem)] text-white"
									style={rf}
								>
									照準を調整します
								</p>
								<p
									className="text-center text-[clamp(0.9rem,2.5vw,1.1rem)] text-stone-300 leading-relaxed"
									style={rf}
								>
									手のひらをカメラに向けて
									<br />
									キープしてください
								</p>
								<div className="h-4 w-full overflow-hidden rounded-full bg-stone-700">
									<div className="h-full w-[65%] rounded-full bg-orange-500" />
								</div>
								<p
									className="text-center text-stone-500 text-[clamp(0.7rem,2vw,0.85rem)]"
									style={rf}
								>
									プレイ中もいつでも同じ操作で調整できます
								</p>
							</div>
						</div>
					</div>
				</Section>

				{/* ラウンド遷移（実コンポーネント） */}
				<Section title="ラウンド遷移（スコアテーブル）">
					<div className="mb-4 flex gap-2">
						{STAGES.map((s, i) => (
							<button
								key={s.name}
								type="button"
								className={cn(
									"rounded-lg px-4 py-2 font-bold text-sm text-white transition-colors",
									transitionStage === i + 1
										? "bg-orange-500"
										: "bg-stone-700 hover:bg-stone-600",
								)}
								style={rf}
								onClick={() => triggerTransition(i + 1)}
							>
								{s.name}の後
							</button>
						))}
					</div>
					<div className="relative h-[500px] overflow-hidden rounded-2xl border border-stone-600">
						<BgImage />
						{showTransition && (
							<StageTransition
								key={transitionKey}
								stageIndex={transitionStage}
								stageScores={
									transitionStage === 1
										? [32, null, null]
										: transitionStage === 2
											? [32, 45, null]
											: [32, 45, 58]
								}
								onComplete={() => setShowTransition(false)}
							/>
						)}
					</div>
				</Section>

				{/* リザルト画面 */}
				<Section title="リザルト画面">
					<div className="relative h-[700px] overflow-hidden rounded-2xl border border-stone-600">
						<BgImage />
						<ResultScreen stageScores={[32, 45, 58]} onRetry={() => {}} />
					</div>
				</Section>
			</div>
		</div>
	);
};

const BgImage = () => (
	<div
		className="absolute inset-0 bg-cover bg-center"
		style={{ backgroundImage: "url('/images/bg.png')" }}
	/>
);

const Section = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<div>
		<h2
			className="mb-4 font-black text-xl text-white drop-shadow-md"
			style={rf}
		>
			{title}
		</h2>
		{children}
	</div>
);
