import { cn } from "@/lib/utils";
import type { GestureDebug } from "@/stores/game-store";
import { ScoreDisplay } from "./internal/score-display";

type Props = {
	score: number;
	timeRemaining: number;
	isVisible: boolean;
	gestureDebug: GestureDebug | null;
};

export const HUD = ({
	score,
	timeRemaining,
	isVisible,
	gestureDebug,
}: Props) => {
	const isUrgent = timeRemaining <= 10;
	const isCalibrated = gestureDebug?.calibration === "done";
	const isCalibrating = gestureDebug?.calibration === "progress";
	const progress = gestureDebug?.calibrationProgress ?? 0;

	return (
		<div
			className={cn(
				"pointer-events-none absolute inset-0 z-20 p-6 transition-opacity duration-300",
				isVisible ? "opacity-100" : "opacity-0",
			)}
		>
			{/* 上部バー */}
			<div className="flex items-start justify-between">
				<ScoreDisplay score={score} />

				{/* タイマー */}
				<div className="flex flex-col items-end">
					<span className="font-bold text-white/60 text-xs uppercase tracking-wider">
						TIME
					</span>
					<span
						className={cn(
							"font-bold text-3xl tabular-nums",
							isUrgent ? "text-red-400" : "text-white",
						)}
					>
						{timeRemaining}
					</span>
				</div>
			</div>

			{/* センタリング UI */}
			{!isCalibrated && (
				<div className="absolute inset-x-0 top-20 flex justify-center">
					<div className="flex w-72 flex-col items-center gap-3 rounded-xl bg-black/60 px-6 py-4 backdrop-blur-sm">
						<p className="text-center text-sm text-blue-200">
							✋ パーを1.5秒キープでセンタリング
						</p>
						{/* プログレスバー */}
						<div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
							<div
								className={cn(
									"h-full rounded-full transition-all duration-100",
									isCalibrating ? "bg-blue-400" : "bg-white/5",
								)}
								style={{ width: `${progress * 100}%` }}
							/>
						</div>
						{isCalibrating && (
							<p className="font-mono text-blue-300/80 text-xs">
								{Math.round(progress * 100)}%
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
