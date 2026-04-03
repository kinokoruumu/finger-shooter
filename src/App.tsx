import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraView } from "@/features/camera";
import { useCamera } from "@/features/camera/hooks";
import { Game3D } from "@/features/game";
import { useGameState } from "@/features/game/hooks";
import { StageTransition } from "@/features/game/internal/stage-transition";
import { HandTracking } from "@/features/hand-tracking";
import { resetGestureState } from "@/features/hand-tracking/gesture-detector";
import { DebugOverlay } from "@/features/hand-tracking/internal/debug-overlay";
import { HUD } from "@/features/hud";
import { AimCursor } from "@/features/hud/internal/aim-cursor";
import { LoadingScreen } from "@/features/hud/internal/loading-screen";
import { ResultScreen } from "@/features/hud/internal/result-screen";
import { TitleScreen } from "@/features/hud/internal/title-screen";
import { TrackingStatus } from "@/features/hud/internal/tracking-status";
import { cn } from "@/lib/utils";
import {
	consumeFireEvents,
	resetGameUI,
	resetSharedState,
	setCurrentStage,
	setPhase,
} from "@/stores/game-store";

export const App = () => {
	const {
		videoRef,
		isReady: isVideoReady,
		error: cameraError,
		startCamera,
	} = useCamera();
	const [isLoading, setIsLoading] = useState(true);
	const [showCamera, setShowCamera] = useState(false);
	const debugMode = new URLSearchParams(window.location.search).has("debug");
	const hasNotifiedRef = useRef(false);
	const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
	const gameState = useGameState();

	useEffect(() => {
		startCamera();
	}, [startCamera]);

	const handleTrackingReady = useCallback(() => {
		if (hasNotifiedRef.current) return;
		hasNotifiedRef.current = true;
		setTimeout(() => setIsLoading(false), 300);
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
		consumeFireEvents(); // 遷移中のイベントを捨てる
		setPhase("playing");
	}, []);

	// キャリブレーション完了検知 → ステージ遷移へ
	useEffect(() => {
		if (gameState.phase !== "calibrating") return;
		if (gameState.gestureDebug?.calibration === "done") {
			setPhase("stage-transition");
		}
	}, [gameState.phase, gameState.gestureDebug?.calibration]);

	// タイトル・リザルト画面でピンチを検知してゲーム開始/リスタート
	useEffect(() => {
		if (
			gameState.phase === "playing" ||
			gameState.phase === "stage-transition" ||
			gameState.phase === "calibrating" ||
			isLoading
		)
			return;

		const delay = gameState.phase === "result" ? 1500 : 0;
		let ready = delay === 0;

		const timer = setTimeout(() => {
			consumeFireEvents();
			ready = true;
		}, delay);

		const checkPinch = () => {
			const events = consumeFireEvents();
			if (ready && events.length > 0) {
				startGame();
				return;
			}
			rafId = requestAnimationFrame(checkPinch);
		};

		let rafId = requestAnimationFrame(checkPinch);
		return () => {
			cancelAnimationFrame(rafId);
			clearTimeout(timer);
		};
	}, [gameState.phase, isLoading, startGame]);

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
		<div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
			{/* Layer 0: カメラ映像（トグル可能） */}
			<CameraView videoRef={videoRef} isVisible={showCamera} />

			{/* ランドマーク描画（カメラ表示時のみ） */}
			{showCamera && <DebugOverlay landmarksRef={landmarksRef} />}

			{/* Layer 1: Three.js 3Dシーン */}
			<Game3D
				isPlaying={isPlayingOrTransition}
				currentStage={gameState.currentStage}
				phase={gameState.phase}
			/>

			{/* Layer 2: HUD */}
			<HUD score={gameState.score} isVisible={gameState.phase === "playing"} />

			{/* キャリブレーション画面 */}
			{gameState.phase === "calibrating" && (
				<div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
					<div className="flex w-80 flex-col items-center gap-4 rounded-2xl bg-black/70 px-8 py-8 backdrop-blur-sm">
						<p
							className="text-center font-bold text-lg text-white"
							style={{ fontFamily: '"Rounded Mplus 1c", sans-serif' }}
						>
							センタリング
						</p>
						<p className="text-center text-sm text-blue-200">
							✋ パーを1.5秒キープしてください
						</p>
						<div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
							<div
								className={cn(
									"h-full rounded-full transition-all duration-100",
									gameState.gestureDebug?.calibration === "progress"
										? "bg-blue-400"
										: "bg-white/5",
								)}
								style={{
									width: `${(gameState.gestureDebug?.calibrationProgress ?? 0) * 100}%`,
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{/* ステージ遷移テキスト */}
			{gameState.phase === "stage-transition" && (
				<StageTransition
					stageIndex={gameState.currentStage}
					stageScores={gameState.stageScores}
					onComplete={handleStageTransitionComplete}
				/>
			)}

			{/* 左下: トラッキングステータス + カメラボタン */}
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
							"pointer-events-auto rounded-lg px-3 py-1.5 font-mono text-xs transition-colors",
							showCamera
								? "bg-white/20 text-white hover:bg-white/30"
								: "bg-white/10 text-white/50 hover:bg-white/20",
						)}
						onClick={() => setShowCamera((v) => !v)}
					>
						{showCamera ? "CAM ON" : "CAM OFF"}
					</button>
				</div>
			)}

			{/* タイトル画面 */}
			{gameState.phase === "title" && !isLoading && (
				<TitleScreen onStart={startGame} debugMode={debugMode} />
			)}

			{/* リザルト画面 */}
			{gameState.phase === "result" && (
				<ResultScreen
					stageScores={gameState.stageScores}
					onRetry={() => startGame()}
				/>
			)}

			{/* プレイ中以外のエイムカーソル */}
			{gameState.phase !== "playing" && <AimCursor />}

			{/* ハンドトラッキング */}
			<HandTracking
				videoRef={videoRef}
				isVideoReady={isVideoReady}
				onReady={handleTrackingReady}
				landmarksRef={landmarksRef}
			/>

			{/* ローディング */}
			<LoadingScreen isVisible={isLoading} />
		</div>
	);
};
