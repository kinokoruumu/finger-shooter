import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "@/features/game/constants/game-config";

export const useCamera = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const startCamera = useCallback(async () => {
		// 既にストリームがある場合は停止してから再取得
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: GAME_CONFIG.camera.width,
					height: GAME_CONFIG.camera.height,
					facingMode: "user",
				},
				audio: false,
			});

			streamRef.current = stream;
			const video = videoRef.current;

			// video要素がDOMから外れていたらストリームだけ停止
			if (!video?.isConnected) {
				for (const track of stream.getTracks()) {
					track.stop();
				}
				streamRef.current = null;
				return;
			}

			video.srcObject = stream;
			await video.play();
			setIsReady(true);
		} catch (e) {
			// play()の中断エラーは無視
			if (e instanceof DOMException && e.name === "AbortError") {
				return;
			}
			setError(e instanceof Error ? e.message : "カメラの起動に失敗しました");
		}
	}, []);

	// クリーンアップ: ストリームを停止
	useEffect(() => {
		return () => {
			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) {
					track.stop();
				}
				streamRef.current = null;
			}
		};
	}, []);

	return { videoRef, isReady, error, startCamera };
};
