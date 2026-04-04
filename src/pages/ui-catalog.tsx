import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { playSound, preloadSounds } from "@/features/audio";
import type { GroundTargetData } from "@/features/game/components/ground-target";
import { GroundTarget } from "@/features/game/components/ground-target";
import { StageTransition } from "@/features/game/components/stage-transition";
import { STAGES } from "@/features/game/constants/stage-definitions";
import { TARGET_PATTERNS } from "@/features/game/constants/target-patterns";
import { ResultScreen } from "@/features/hud/components/result-screen";
import { WelcomeScreen } from "@/features/hud/components/welcome-screen";
import { cn } from "@/lib/utils";

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

// プリロード
preloadSounds();

let nextDemoId = 100;

// グリッド→ワールド座標の簡易変換
const gridToWorld = (gx: number, gy: number): [number, number] => {
	const nx = 0.2 + (gx / 7) * 0.6;
	const ny = 0.2 + (gy / 3) * 0.55;
	const depth = 20; // camera z=5, target z=-15
	const halfW = Math.tan((60 / 2) * (Math.PI / 180)) * depth;
	const aspect = window.innerWidth / window.innerHeight;
	const halfH = halfW / aspect;
	const x = (nx - 0.5) * 2 * halfW;
	const y = -(ny - 0.5) * 2 * halfH;
	return [x, y];
};

export const UICatalog = () => {
	const [transitionKey, setTransitionKey] = useState(0);
	const [transitionStage, setTransitionStage] = useState(1);
	const [showTransition, setShowTransition] = useState(true);

	const [demoTargets, setDemoTargets] = useState<GroundTargetData[]>([]);
	const [patternIdx, setPatternIdx] = useState(0);

	useEffect(() => {
		preloadSounds();
	}, []);

	const triggerTransition = (stage: number) => {
		setTransitionStage(stage);
		setShowTransition(false);
		setTimeout(() => {
			setTransitionKey((k) => k + 1);
			setShowTransition(true);
		}, 100);
	};

	const spawnPattern = useCallback(() => {
		const pattern = TARGET_PATTERNS[patternIdx];
		for (const p of pattern.positions) {
			const spawn = () => {
				playSound("target-appear", 0.85);
				const [x, y] = gridToWorld(p.gx, p.gy);
				const target: GroundTargetData = {
					id: ++nextDemoId,
					x,
					y,
					z: -15,
					isGold: false,
					isPenalty: false,
					visibleDuration: 5.0,
					scale: 1.8,
				};
				setDemoTargets((prev) => [...prev, target]);
			};
			if (p.delay > 0) {
				setTimeout(spawn, p.delay);
			} else {
				spawn();
			}
		}
	}, [patternIdx]);

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
					<div className="mb-4 flex flex-wrap items-center gap-3">
						<select
							value={patternIdx}
							onChange={(e) => setPatternIdx(Number(e.target.value))}
							className="rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white"
						>
							{TARGET_PATTERNS.map((p, i) => {
								const hasDelay = p.positions.some((pos) => pos.delay > 0);
								return (
									<option key={p.name} value={i}>
										{p.name}（{p.positions.length}個
										{hasDelay ? "・順次" : "・同時"}）
									</option>
								);
							})}
						</select>
						<button
							type="button"
							className="rounded-lg bg-amber-800 px-6 py-2 font-bold text-amber-50 text-sm transition-colors hover:bg-amber-700"
							style={rf}
							onClick={spawnPattern}
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
