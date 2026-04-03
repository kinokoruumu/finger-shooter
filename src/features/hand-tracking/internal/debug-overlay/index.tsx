import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useEffect, useRef } from "react";
import { sharedState } from "@/stores/game-store";

// MediaPipe Hand Landmark の接続関係
const CONNECTIONS: [number, number][] = [
	[0, 1],
	[1, 2],
	[2, 3],
	[3, 4], // 親指
	[0, 5],
	[5, 6],
	[6, 7],
	[7, 8], // 人差し指
	[0, 9],
	[9, 10],
	[10, 11],
	[11, 12], // 中指
	[0, 13],
	[13, 14],
	[14, 15],
	[15, 16], // 薬指
	[0, 17],
	[17, 18],
	[18, 19],
	[19, 20], // 小指
	[5, 9],
	[9, 13],
	[13, 17], // 手のひら横
];

const getColor = (idx: number): string => {
	if (idx <= 4) return "#ff4444";
	if (idx <= 8) return "#44ff44";
	if (idx <= 12) return "#4488ff";
	if (idx <= 16) return "#ffaa00";
	return "#ff44ff";
};

type Props = {
	landmarksRef: React.RefObject<NormalizedLandmark[] | null>;
};

export const DebugOverlay = ({ landmarksRef }: Props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);

	useEffect(() => {
		const draw = () => {
			const canvas = canvasRef.current;
			if (!canvas) {
				rafRef.current = requestAnimationFrame(draw);
				return;
			}

			const ctx = canvas.getContext("2d");
			if (!ctx) {
				rafRef.current = requestAnimationFrame(draw);
				return;
			}

			if (
				canvas.width !== window.innerWidth ||
				canvas.height !== window.innerHeight
			) {
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
			}

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const landmarks = landmarksRef.current;
			if (!landmarks) {
				rafRef.current = requestAnimationFrame(draw);
				return;
			}

			const w = canvas.width;
			const h = canvas.height;

			const toScreen = (lm: NormalizedLandmark) => ({
				x: (1 - lm.x) * w,
				y: lm.y * h,
			});

			// 接続線
			ctx.lineWidth = 2;
			for (const [from, to] of CONNECTIONS) {
				const a = toScreen(landmarks[from]);
				const b = toScreen(landmarks[to]);
				ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
			}

			// ランドマーク点
			for (let i = 0; i < landmarks.length; i++) {
				const { x, y } = toScreen(landmarks[i]);
				const color = getColor(i);

				ctx.beginPath();
				ctx.arc(x, y, 6, 0, Math.PI * 2);
				ctx.fillStyle = color;
				ctx.fill();

				ctx.beginPath();
				ctx.arc(x, y, 2, 0, Math.PI * 2);
				ctx.fillStyle = "#ffffff";
				ctx.fill();

				ctx.fillStyle = "#ffffff";
				ctx.font = "10px monospace";
				ctx.fillText(String(i), x + 8, y - 4);
			}

			// 手首(0)を大きな黄色丸で強調
			const wrist = toScreen(landmarks[0]);
			ctx.beginPath();
			ctx.arc(wrist.x, wrist.y, 10, 0, Math.PI * 2);
			ctx.strokeStyle = "#ffff00";
			ctx.lineWidth = 3;
			ctx.stroke();

			// 手首→中指MCP(9)のベクトルを線で表示
			const middleMcp = toScreen(landmarks[9]);
			ctx.beginPath();
			ctx.moveTo(wrist.x, wrist.y);
			ctx.lineTo(middleMcp.x, middleMcp.y);
			ctx.strokeStyle = "#ffff00";
			ctx.lineWidth = 2;
			ctx.setLineDash([4, 4]);
			ctx.stroke();
			ctx.setLineDash([]);

			// 算出された照準位置（sharedState.aim）を大きな十字で描画
			if (sharedState.aim) {
				const ax = sharedState.aim.x * w;
				const ay = sharedState.aim.y * h;
				const size = 20;

				ctx.strokeStyle = "#00ffff";
				ctx.lineWidth = 3;

				// 十字
				ctx.beginPath();
				ctx.moveTo(ax - size, ay);
				ctx.lineTo(ax + size, ay);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(ax, ay - size);
				ctx.lineTo(ax, ay + size);
				ctx.stroke();

				// 円
				ctx.beginPath();
				ctx.arc(ax, ay, size * 0.7, 0, Math.PI * 2);
				ctx.stroke();

				// ラベル
				ctx.fillStyle = "#00ffff";
				ctx.font = "12px monospace";
				ctx.fillText("AIM", ax + size + 4, ay - 4);
			}

			rafRef.current = requestAnimationFrame(draw);
		};

		rafRef.current = requestAnimationFrame(draw);

		return () => {
			cancelAnimationFrame(rafRef.current);
		};
	}, [landmarksRef]);

	return (
		<canvas
			ref={canvasRef}
			className="pointer-events-none absolute inset-0 z-10"
		/>
	);
};
