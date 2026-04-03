import { cn } from "@/lib/utils";
import type { GestureDebug } from "@/stores/game-store";
import { ScorePopupDisplay } from "./internal/score-popup";

type Props = {
	score: number;
	timeRemaining: number;
	isVisible: boolean;
	gestureDebug: GestureDebug | null;
};

export const HUD = ({ score, isVisible, gestureDebug }: Props) => {
	const isCalibrated = gestureDebug?.calibration === "done";
	const isCalibrating = gestureDebug?.calibration === "progress";
	const progress = gestureDebug?.calibrationProgress ?? 0;

	return (
		<div
			className={cn(
				"pointer-events-none absolute inset-0 z-20 transition-opacity duration-300",
				isVisible ? "opacity-100" : "opacity-0",
			)}
		>
			{/* スコア（中央下部） */}
			<div className="absolute inset-x-0 bottom-8 flex justify-center">
				<div
					className="text-center"
					style={{ fontFamily: '"Rounded Mplus 1c", sans-serif' }}
				>
					<span className="font-black text-5xl text-white tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
						{score}
					</span>
				</div>
			</div>

			{/* スコアポップアップ */}
			<ScorePopupDisplay />

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
