import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { preloadSounds, warmupSounds } from "@/features/audio";
import { CameraView } from "@/features/camera";
import { useCamera } from "@/features/camera/hooks";
import { Game3D } from "@/features/game/components/game-3d";
import { StageTransition } from "@/features/game/components/stage-transition";
import { useGameState } from "@/features/game/hooks/use-game-state";
import {
	consumeFireEvents,
	resetGameUI,
	resetSharedState,
	setActiveStages,
	setCurrentStage,
	setPhase,
} from "@/features/game/stores/game-store";
import { HandTracking } from "@/features/hand-tracking";
import { DebugOverlay } from "@/features/hand-tracking/components/debug-overlay";
import { resetGestureState } from "@/features/hand-tracking/gesture-detector";
import { HUD } from "@/features/hud";
import { AimCursor } from "@/features/hud/components/aim-cursor";
import { LoadingScreen } from "@/features/hud/components/loading-screen";
import { ResultScreen } from "@/features/hud/components/result-screen";
import { TrackingStatus } from "@/features/hud/components/tracking-status";
import { WelcomeScreen } from "@/features/hud/components/welcome-screen";
import {
	STAGES,
	type StageDefinition,
} from "@/features/game/constants/stage-definitions";
import type { RoundConfig } from "@/features/creator/types";
import {
	getStage,
	getStages,
	getRoundConfig,
	saveRoundConfig,
} from "@/features/creator/stores/creator-store";
import { convertStageToSpawns } from "@/features/creator/utils/convert-to-spawns";
import { cn } from "@/lib/utils";

const buildStagesFromConfig = (config: RoundConfig): StageDefinition[] =>
	config.map((stageId, i) => {
		if (!stageId) return STAGES[i];
		const custom = getStage(stageId);
		if (!custom) return STAGES[i];
		const spawns = convertStageToSpawns(custom);
		return {
			name: custom.name,
			duration: 30000,
			maxScore: spawns.length,
			spawns,
		};
	});

export const GamePage = () => {
	const {
		videoRef,
		isReady: isVideoReady,
		error: cameraError,
		startCamera,
	} = useCamera();
	const [started, setStarted] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [showCamera, setShowCamera] = useState(false);
	const debugMode = new URLSearchParams(window.location.search).has("debug");
	const hasNotifiedRef = useRef(false);
	const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
	const gameState = useGameState();

	const [roundConfig, setRoundConfig] = useState<RoundConfig>(getRoundConfig);

	const handleWelcome = useCallback(
		async (startRound?: number) => {
			setActiveStages(buildStagesFromConfig(roundConfig));
			setStarted(true);
			startCamera();
			await preloadSounds();
			warmupSounds();
			if (startRound !== undefined && startRound > 0) {
				setCurrentStage(startRound);
			}
		},
		[startCamera, roundConfig],
	);

	const handleSaveRoundConfig = useCallback((config: RoundConfig) => {
		setRoundConfig(config);
		saveRoundConfig(config);
	}, []);

	const handlePlayCustom = useCallback(
		async (stageId: string) => {
			const stage = getStage(stageId);
			if (!stage) return;
			const spawns = convertStageToSpawns(stage);
			setActiveStages([
				{
					name: stage.name,
					duration: 30000,
					maxScore: spawns.length,
					spawns,
				},
			]);
			setStarted(true);
			startCamera();
			await preloadSounds();
			warmupSounds();
		},
		[startCamera],
	);

	const handleTrackingReady = useCallback(() => {
		if (hasNotifiedRef.current) return;
		hasNotifiedRef.current = true;
		// ローディング完了 → 自動的にキャリブレーションへ
		setTimeout(() => {
			setIsLoading(false);
			setPhase("calibrating");
		}, 300);
	}, []);

	const startGame = useCallback((startRound?: number) => {
		resetGameUI();
		resetSharedState();
		resetGestureState();
		if (startRound !== undefined && startRound > 0) {
			setCurrentStage(startRound);
		}
		setPhase("calibrating");
	}, []);

	const handleStageTransitionComplete = useCallback(() => {
		consumeFireEvents();
		setPhase("playing");
	}, []);

	// キャリブレーション完了検知 → ステージ遷移へ
	useEffect(() => {
		if (gameState.phase !== "calibrating") return;
		if (gameState.gestureDebug?.calibration === "done") {
			setPhase("stage-transition");
		}
	}, [gameState.phase, gameState.gestureDebug?.calibration]);

	// リザルト画面でピンチ検知（ボタン上のみ）
	useEffect(() => {
		if (gameState.phase !== "result") return;

		const delay = 1500;
		let ready = false;
		const timer = setTimeout(() => {
			consumeFireEvents();
			ready = true;
		}, delay);

		const isAimOverButton = (aimX: number, aimY: number): boolean => {
			const btn = document.getElementById("main-action-btn");
			if (!btn) return false;
			const rect = btn.getBoundingClientRect();
			const screenX = aimX * window.innerWidth;
			const screenY = aimY * window.innerHeight;
			const pad = 30;
			return (
				screenX >= rect.left - pad &&
				screenX <= rect.right + pad &&
				screenY >= rect.top - pad &&
				screenY <= rect.bottom + pad
			);
		};

		const checkPinch = () => {
			const events = consumeFireEvents();
			if (ready && events.length > 0) {
				const hit = events.some((e) => isAimOverButton(e.x, e.y));
				if (hit) {
					startGame();
					return;
				}
			}
			rafId = requestAnimationFrame(checkPinch);
		};

		let rafId = requestAnimationFrame(checkPinch);
		return () => {
			cancelAnimationFrame(rafId);
			clearTimeout(timer);
		};
	}, [gameState.phase, startGame]);

	// まだ「はじめる」を押していない
	if (!started) {
		return (
			<WelcomeScreen
				onStart={() => handleWelcome()}
				onPlayCustom={handlePlayCustom}
				debugMode={debugMode}
				onDebugStart={(round) => handleWelcome(round)}
				customStages={getStages().map((s) => ({
					id: s.id,
					name: s.name,
				}))}
				roundConfig={roundConfig}
				onSaveRoundConfig={handleSaveRoundConfig}
			/>
		);
	}

	if (cameraError) {
		return (
			<div className="flex h-screen items-center justify-center bg-black">
				<div className="text-center">
					<p className="mb-2 text-lg text-red-400">カメラエラー</p>
					<p className="text-sm text-white/60">{cameraError}</p>
				</div>
			</div>
		);
	}

	const isPlayingOrTransition =
		gameState.phase === "playing" || gameState.phase === "stage-transition";

	return (
		<div
			className="relative h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat"
			style={{ backgroundImage: "url('/images/bg.png')" }}
		>
			<CameraView videoRef={videoRef} isVisible={showCamera} />
			{showCamera && <DebugOverlay landmarksRef={landmarksRef} />}

			<Game3D
				isPlaying={isPlayingOrTransition}
				currentStage={gameState.currentStage}
				phase={gameState.phase}
			/>

			<HUD score={gameState.score} isVisible={gameState.phase === "playing"} />

			{gameState.phase === "calibrating" && (
				<div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
					<div className="flex w-[90vw] max-w-md flex-col items-center gap-5 rounded-2xl border border-stone-700/60 bg-stone-900/80 px-8 py-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
						<p
							className="text-center font-black text-[clamp(1.2rem,3vw,1.5rem)] text-white"
							style={{ fontFamily: '"Rounded Mplus 1c", sans-serif' }}
						>
							照準を調整します
						</p>
						<p
							className="text-center text-[clamp(0.9rem,2.5vw,1.1rem)] text-stone-300 leading-relaxed"
							style={{ fontFamily: '"Rounded Mplus 1c", sans-serif' }}
						>
							手のひらをカメラに向けて
							<br />
							キープしてください
						</p>
						<div className="h-4 w-full overflow-hidden rounded-full bg-stone-700">
							<div
								className={cn(
									"h-full rounded-full transition-all duration-100",
									gameState.gestureDebug?.calibration === "progress"
										? "bg-orange-500"
										: "bg-stone-600",
								)}
								style={{
									width: `${(gameState.gestureDebug?.calibrationProgress ?? 0) * 100}%`,
								}}
							/>
						</div>
						<p
							className="text-center text-stone-500 text-[clamp(0.7rem,2vw,0.85rem)]"
							style={{ fontFamily: '"Rounded Mplus 1c", sans-serif' }}
						>
							プレイ中もいつでも同じ操作で調整できます
						</p>
					</div>
				</div>
			)}

			{gameState.phase === "stage-transition" && (
				<StageTransition
					stageIndex={gameState.currentStage}
					stageScores={gameState.stageScores}
					stages={gameState.activeStages}
					onComplete={handleStageTransitionComplete}
				/>
			)}

			{!isLoading && (
				<div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
					<TrackingStatus
						isHandDetected={gameState.isHandDetected}
						isPinching={gameState.isGunPose}
						gestureDebug={gameState.gestureDebug}
					/>
					<button
						type="button"
						className={cn(
							"pointer-events-auto rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors",
							showCamera
								? "border-green-500/50 bg-green-900/60 text-green-300 hover:bg-green-800/60"
								: "border-stone-500/50 bg-stone-900/60 text-stone-300 hover:bg-stone-800/60",
						)}
						onClick={() => setShowCamera((v) => !v)}
					>
						{showCamera ? "CAM ON" : "CAM OFF"}
					</button>
				</div>
			)}

			{gameState.phase === "result" && (
				<ResultScreen
					stageScores={gameState.stageScores}
					stages={gameState.activeStages}
					onRetry={() => startGame()}
				/>
			)}

			{gameState.phase !== "playing" && <AimCursor />}

			<HandTracking
				videoRef={videoRef}
				isVideoReady={isVideoReady}
				onReady={handleTrackingReady}
				landmarksRef={landmarksRef}
			/>

			<LoadingScreen isVisible={isLoading} />
		</div>
	);
};
