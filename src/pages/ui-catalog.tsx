import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import {
	getSoundDuration,
	getSoundOffset,
	playSound,
	preloadSounds,
	setSoundOffset,
} from "@/features/audio";
import type { GroundTargetData } from "@/features/game/components/ground-target";
import { GroundTarget } from "@/features/game/components/ground-target";
import { StageTransition } from "@/features/game/components/stage-transition";
import { STAGES } from "@/features/game/constants/stage-definitions";
import { ResultScreen } from "@/features/hud/components/result-screen";
import { WelcomeScreen } from "@/features/hud/components/welcome-screen";
import { cn } from "@/lib/utils";

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

// 音をプリロード
preloadSounds();

let nextDemoId = 100;

export const UICatalog = () => {
	const [transitionKey, setTransitionKey] = useState(0);
	const [transitionStage, setTransitionStage] = useState(1);
	const [showTransition, setShowTransition] = useState(true);

	// 的アニメーションデモ
	const [demoTargets, setDemoTargets] = useState<GroundTargetData[]>([]);
	const [appearOffset, setAppearOffset] = useState(0);
	const [appearDuration, setAppearDuration] = useState(0);

	// 音のメタデータを取得
	useEffect(() => {
		const init = async () => {
			await preloadSounds();
			setAppearOffset(getSoundOffset("target-appear"));
			setAppearDuration(getSoundDuration("target-appear"));
		};
		init();
	}, []);
	const [demoType, setDemoType] = useState<"normal" | "gold" | "penalty">(
		"normal",
	);

	const triggerTransition = (stage: number) => {
		setTransitionStage(stage);
		setShowTransition(false);
		setTimeout(() => {
			setTransitionKey((k) => k + 1);
			setShowTransition(true);
		}, 100);
	};

	const spawnDemoTarget = useCallback(() => {
		const id = ++nextDemoId;
		const target: GroundTargetData = {
			id,
			x: 0,
			y: 0,
			z: -15,
			isGold: demoType === "gold",
			isPenalty: demoType === "penalty",
			visibleDuration: 4.0,
			scale: 1.8,
		};
		setDemoTargets((prev) => [...prev, target]);
	}, [demoType]);

	const handleDemoDead = useCallback((id: number) => {
		setDemoTargets((prev) => prev.filter((t) => t.id !== id));
	}, []);

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

				{/* 的アニメーション */}
				<Section title="的アニメーション">
					<div className="mb-4 flex flex-wrap gap-2">
						{(
							[
								["normal", "通常"],
								["gold", "+3（金）"],
								["penalty", "-3（ペナ）"],
							] as const
						).map(([type, label]) => (
							<button
								key={type}
								type="button"
								className={cn(
									"rounded-lg px-4 py-2 font-bold text-sm text-white transition-colors",
									demoType === type
										? "bg-orange-500"
										: "bg-stone-700 hover:bg-stone-600",
								)}
								style={rf}
								onClick={() => setDemoType(type)}
							>
								{label}
							</button>
						))}
						<button
							type="button"
							className="rounded-lg bg-amber-800 px-6 py-2 font-bold text-amber-50 text-sm transition-colors hover:bg-amber-700"
							style={rf}
							onClick={spawnDemoTarget}
						>
							出現させる
						</button>
						<button
							type="button"
							className="rounded-lg bg-stone-600 px-4 py-2 font-bold text-sm text-white transition-colors hover:bg-stone-500"
							style={rf}
							onClick={() => setDemoTargets([])}
						>
							クリア
						</button>
					</div>

					{/* 出現音オフセット調整 */}
					<div className="mb-4 rounded-xl border border-stone-600 bg-stone-900/80 p-4 backdrop-blur-sm">
						<p className="mb-2 font-bold text-sm text-white" style={rf}>
							出現音 (target-appear) オフセット調整
						</p>
						<div className="flex items-center gap-3">
							<input
								type="range"
								min="0"
								max={Math.max(appearDuration, 1)}
								step="0.01"
								value={appearOffset}
								onChange={(e) => {
									const v = Number.parseFloat(e.target.value);
									setAppearOffset(v);
									setSoundOffset("target-appear", v);
								}}
								className="flex-1"
							/>
							<input
								type="number"
								min="0"
								max={Math.max(appearDuration, 1)}
								step="0.01"
								value={appearOffset}
								onChange={(e) => {
									const v = Number.parseFloat(e.target.value);
									setAppearOffset(v);
									setSoundOffset("target-appear", v);
								}}
								className="w-20 rounded-md border border-stone-600 bg-stone-800 px-2 py-1 font-mono text-sm text-white"
							/>
							<span className="font-mono text-stone-400 text-xs">
								/ {appearDuration.toFixed(2)}s
							</span>
							<button
								type="button"
								className="rounded-md bg-stone-700 px-3 py-1 text-sm text-white hover:bg-stone-600"
								onClick={() => playSound("target-appear", 0.7)}
							>
								試聴
							</button>
						</div>
					</div>

					<div className="relative h-[500px] overflow-hidden rounded-2xl border border-stone-600">
						<BgImage />
						<div className="absolute inset-0">
							<Canvas
								camera={{ position: [0, 0, 5], fov: 60 }}
								gl={{ alpha: true }}
								style={{ background: "transparent" }}
							>
								<ambientLight intensity={0.6} />
								<directionalLight position={[5, 10, 5]} intensity={0.8} />
								{demoTargets.map((t) => (
									<GroundTarget key={t.id} data={t} onDead={handleDemoDead} />
								))}
							</Canvas>
						</div>
					</div>
				</Section>

				{/* ウェルカム画面 */}
				<Section title="ウェルカム画面">
					<div className="relative h-[600px] overflow-hidden rounded-2xl border border-stone-600">
						<WelcomeScreen
							onStart={() => {}}
							debugMode={false}
							onDebugStart={() => {}}
						/>
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

				{/* ラウンド遷移 */}
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
