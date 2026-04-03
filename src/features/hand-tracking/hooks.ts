import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	clearAim,
	pushFireEvent,
	setGunPose,
	setHandDetected,
	updateAim,
	updateTrackingStatus,
} from "@/features/game/stores/game-store";
import { detectGesture } from "./gesture-detector";
import { getHandLandmarker, initHandLandmarker } from "./hand-landmarker";

export const useHandTracking = (
	videoRef: React.RefObject<HTMLVideoElement | null>,
	isVideoReady: boolean,
) => {
	const [isModelReady, setIsModelReady] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const rafIdRef = useRef<number>(0);
	const lastTimestampRef = useRef<number>(-1);
	const landmarksRef = useRef<NormalizedLandmark[] | null>(null);

	useEffect(() => {
		let cancelled = false;

		initHandLandmarker()
			.then(() => {
				if (!cancelled) setIsModelReady(true);
			})
			.catch((e) => {
				if (!cancelled)
					setError(
						e instanceof Error
							? e.message
							: "HandLandmarkerの初期化に失敗しました",
					);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const runDetection = useCallback(() => {
		const video = videoRef.current;
		const landmarker = getHandLandmarker();

		if (!video || !landmarker || video.readyState < 2) {
			rafIdRef.current = requestAnimationFrame(runDetection);
			return;
		}

		const timestamp = performance.now();
		if (timestamp === lastTimestampRef.current) {
			rafIdRef.current = requestAnimationFrame(runDetection);
			return;
		}
		lastTimestampRef.current = timestamp;

		const result = landmarker.detectForVideo(video, timestamp);

		if (result.landmarks && result.landmarks.length > 0) {
			const landmarks = result.landmarks[0];
			landmarksRef.current = landmarks;
			const gesture = detectGesture(landmarks);

			setHandDetected(true);
			// isGunPose は照準表示フラグとして流用（手検出 = 常にON）
			setGunPose(true);
			updateTrackingStatus(true, gesture.debug.isPinching, gesture.debug);

			if (gesture.aim) {
				updateAim(gesture.aim.x, gesture.aim.y);

				if (gesture.shouldFire) {
					pushFireEvent(gesture.aim.x, gesture.aim.y);
				}
			}
		} else {
			landmarksRef.current = null;
			setHandDetected(false);
			setGunPose(false);
			clearAim();
			updateTrackingStatus(false, false, null);
		}

		rafIdRef.current = requestAnimationFrame(runDetection);
	}, [videoRef]);

	useEffect(() => {
		if (!isModelReady || !isVideoReady) return;

		rafIdRef.current = requestAnimationFrame(runDetection);

		return () => {
			if (rafIdRef.current) {
				cancelAnimationFrame(rafIdRef.current);
			}
		};
	}, [isModelReady, isVideoReady, runDetection]);

	return { isModelReady, error, landmarksRef };
};
