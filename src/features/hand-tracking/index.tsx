import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useEffect, useRef } from "react";
import { useHandTracking } from "./hooks";

type Props = {
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isVideoReady: boolean;
	onReady: () => void;
	landmarksRef: React.RefObject<NormalizedLandmark[] | null>;
};

export const HandTracking = ({
	videoRef,
	isVideoReady,
	onReady,
	landmarksRef,
}: Props) => {
	const {
		isModelReady,
		error,
		landmarksRef: internalLandmarksRef,
	} = useHandTracking(videoRef, isVideoReady);
	const hasNotifiedRef = useRef(false);

	// 内部のランドマーク ref を親に同期
	useEffect(() => {
		const sync = () => {
			(
				landmarksRef as React.MutableRefObject<NormalizedLandmark[] | null>
			).current = internalLandmarksRef.current;
			requestAnimationFrame(sync);
		};
		const id = requestAnimationFrame(sync);
		return () => cancelAnimationFrame(id);
	}, [landmarksRef, internalLandmarksRef]);

	useEffect(() => {
		if (isModelReady && isVideoReady && !hasNotifiedRef.current) {
			hasNotifiedRef.current = true;
			onReady();
		}
	}, [isModelReady, isVideoReady, onReady]);

	if (error) {
		return (
			<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
				<p className="text-lg text-red-400">{error}</p>
			</div>
		);
	}

	return null;
};
