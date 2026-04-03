import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraView } from "@/features/camera";
import { useCamera } from "@/features/camera/hooks";
import { Game3D } from "@/features/game";
import { useGameState } from "@/features/game/hooks";
import { HandTracking } from "@/features/hand-tracking";
import { resetGestureState } from "@/features/hand-tracking/gesture-detector";
import { DebugOverlay } from "@/features/hand-tracking/internal/debug-overlay";
import { HUD } from "@/features/hud";
import { LoadingScreen } from "@/features/hud/internal/loading-screen";
import { TrackingStatus } from "@/features/hud/internal/tracking-status";
import { cn } from "@/lib/utils";
import {
	consumeFireEvents,
	resetGameUI,
	resetSharedState,
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

	const startGame = useCallback(() => {
		resetGameUI();
		resetSharedState();
		resetGestureState();
		setPhase("playing");
	}, []);

	// タイトル・リザルト画面でピンチ（発射イベント）を検知してゲーム開始/リスタート
	useEffect(() => {
		if (gameState.phase === "playing" || isLoading) return;

		// リザルト画面では1.5秒のクールダウンを設けて誤爆防止
		const delay = gameState.phase === "result" ? 1500 : 0;
		let ready = delay === 0;

		const timer = setTimeout(() => {
			// クールダウン中に溜まったイベントを消費して捨てる
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

	return (
		<div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
			{/* Layer 0: カメラ映像（トグル可能） */}
			<CameraView videoRef={videoRef} isVisible={showCamera} />

			{/* ランドマーク描画（カメラ表示時のみ） */}
			{showCamera && <DebugOverlay landmarksRef={landmarksRef} />}

			{/* Layer 1: Three.js 3Dシーン */}
			<Game3D isPlaying={gameState.phase === "playing"} />

			{/* Layer 2: HUD */}
			<HUD
				score={gameState.score}
				timeRemaining={gameState.timeRemaining}
				isVisible={gameState.phase === "playing"}
				gestureDebug={gameState.gestureDebug}
			/>

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
				<div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
					<div className="rounded-2xl bg-black/60 px-12 py-10 text-center backdrop-blur-sm">
						<h1 className="mb-2 font-bold text-5xl text-white">
							Finger Shooter
						</h1>
						<p className="mb-2 text-white/60">
							手を動かして狙い、指をつまんで撃て！
						</p>
						<p className="mb-8 font-mono text-white/40 text-xs">
							✋ パーを1.5秒キープでセンタリング
						</p>
						<button
							type="button"
							className={cn(
								"rounded-xl bg-red-500 px-8 py-3 font-bold text-lg text-white transition-colors",
								"pointer-events-auto hover:bg-red-600 active:bg-red-700",
							)}
							onClick={startGame}
						>
							START
						</button>
						<p className="mt-3 font-mono text-white/30 text-xs">
							👌 ピンチでもOK
						</p>
					</div>
				</div>
			)}

			{/* リザルト画面 */}
			{gameState.phase === "result" && (
				<div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
					<div className="rounded-2xl bg-black/70 px-12 py-10 text-center backdrop-blur-sm">
						<h2 className="mb-2 font-bold text-3xl text-white">TIME UP!</h2>
						<p className="mb-1 text-white/60">SCORE</p>
						<p className="mb-8 font-bold text-6xl text-white">
							{gameState.score.toLocaleString()}
						</p>
						<button
							type="button"
							className={cn(
								"rounded-xl bg-red-500 px-8 py-3 font-bold text-lg text-white transition-colors",
								"pointer-events-auto hover:bg-red-600 active:bg-red-700",
							)}
							onClick={startGame}
						>
							RETRY
						</button>
						<p className="mt-3 font-mono text-white/30 text-xs">
							👌 ピンチでもOK
						</p>
					</div>
				</div>
			)}

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
