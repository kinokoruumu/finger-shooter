import { useState } from "react";
import { STAGES } from "@/config/stage-definitions";
import { ResultScreen } from "@/features/hud/internal/result-screen";
import { TitleScreen } from "@/features/hud/internal/title-screen";
import { cn } from "@/lib/utils";

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const UICatalog = () => {
	const [transitionStage, setTransitionStage] = useState(1);

	const mockScores: (number | null)[] = [32, 45, null];

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

				{/* セクション: タイトル画面 */}
				<Section title="タイトル画面">
					<div className="relative h-[600px] overflow-hidden rounded-2xl border border-stone-600">
						<div
							className="absolute inset-0 bg-cover bg-center"
							style={{ backgroundImage: "url('/images/bg.png')" }}
						/>
						<TitleScreen onStart={() => {}} debugMode />
					</div>
				</Section>

				{/* セクション: キャリブレーション */}
				<Section title="キャリブレーション">
					<div className="relative h-[400px] overflow-hidden rounded-2xl border border-stone-600">
						<div
							className="absolute inset-0 bg-cover bg-center"
							style={{ backgroundImage: "url('/images/bg.png')" }}
						/>
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
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
									<div className="h-full w-[65%] rounded-full bg-orange-500 transition-all" />
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

				{/* セクション: ラウンド遷移（スコアテーブル） */}
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
								onClick={() => setTransitionStage(i + 1)}
							>
								{s.name}の後
							</button>
						))}
					</div>
					{[1, 2, 3].map((stage) => {
						if (stage !== transitionStage) return null;
						const scores: (number | null)[] =
							stage === 1
								? [32, null, null]
								: stage === 2
									? [32, 45, null]
									: [32, 45, 58];
						const prevStage = STAGES[stage - 1];
						const total = scores.reduce<number>((s, v) => s + (v ?? 0), 0);
						return (
							<div
								key={stage}
								className="relative flex h-[400px] items-center justify-center overflow-hidden rounded-2xl border border-stone-600"
							>
								<div
									className="absolute inset-0 bg-cover bg-center"
									style={{ backgroundImage: "url('/images/bg.png')" }}
								/>
								<div className="relative flex w-1/2 min-w-80 max-w-lg flex-col items-center gap-5 rounded-2xl border border-stone-700/60 bg-stone-900/80 px-8 py-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
									{prevStage && (
										<h2 className="font-black text-2xl text-white" style={rf}>
											{prevStage.name}
										</h2>
									)}
									<div className="flex w-full overflow-hidden rounded-xl border border-stone-600 bg-stone-800/60 shadow-inner">
										{STAGES.map((s, i) => {
											const score = scores[i];
											const hasScore = score !== null;
											return (
												<div
													key={s.name}
													className="flex flex-1 flex-col items-center border-r border-stone-600 py-3 last:border-r-0"
												>
													<span
														className="mb-1 text-stone-400 text-xs"
														style={rf}
													>
														{s.name}
													</span>
													<span
														className={cn(
															"font-black text-3xl tabular-nums",
															hasScore ? "text-white" : "text-stone-600",
														)}
														style={rf}
													>
														{hasScore ? score : "-"}
													</span>
												</div>
											);
										})}
										<div className="flex flex-1 flex-col items-center border-l-2 border-stone-500 bg-stone-700/50 py-3">
											<span className="mb-1 text-stone-400 text-xs" style={rf}>
												合計
											</span>
											<span
												className="font-black text-3xl text-orange-400 tabular-nums"
												style={rf}
											>
												{total}
											</span>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</Section>

				{/* セクション: リザルト画面 */}
				<Section title="リザルト画面">
					<div className="relative h-[600px] overflow-hidden rounded-2xl border border-stone-600">
						<div
							className="absolute inset-0 bg-cover bg-center"
							style={{ backgroundImage: "url('/images/bg.png')" }}
						/>
						<ResultScreen stageScores={mockScores} onRetry={() => {}} />
					</div>
				</Section>
			</div>
		</div>
	);
};

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
			style={{ fontFamily: '"Rounded Mplus 1c", sans-serif' }}
		>
			{title}
		</h2>
		{children}
	</div>
);
