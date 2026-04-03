import { cn } from "@/lib/utils";
import type { GestureDebug } from "@/stores/game-store";

type Props = {
	isHandDetected: boolean;
	isPinching: boolean;
	gestureDebug: GestureDebug | null;
};

export const TrackingStatus = ({
	isHandDetected,
	isPinching,
	gestureDebug,
}: Props) => {
	const isCalibrating = gestureDebug?.calibration === "progress";
	const isCalibrated = gestureDebug?.calibration === "done";

	const label = isCalibrating
		? "CALIBRATING..."
		: isPinching
			? "PINCH!"
			: isHandDetected
				? "TRACKING"
				: "NO HAND";

	return (
		<div className="flex flex-col gap-1.5 rounded-lg bg-black/70 px-3 py-2 backdrop-blur-sm">
			<div className="flex items-center gap-2">
				<div
					className={cn(
						"h-2.5 w-2.5 rounded-full transition-colors duration-200",
						isCalibrating
							? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]"
							: isPinching
								? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]"
								: isHandDetected
									? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]"
									: "bg-white/30",
					)}
				/>
				<span className="font-mono text-xs text-white/70">{label}</span>
			</div>

			{/* キャリブレーション進捗バー */}
			{isCalibrating && gestureDebug && (
				<div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
					<div
						className="h-full rounded-full bg-blue-400 transition-all duration-100"
						style={{ width: `${gestureDebug.calibrationProgress * 100}%` }}
					/>
				</div>
			)}

			{/* キャリブレーション完了表示 */}
			{isCalibrated && !isCalibrating && (
				<span className="font-mono text-[10px] text-blue-300/60">
					✓ centered
				</span>
			)}

			{isHandDetected && gestureDebug && !isCalibrating && (
				<div className="flex items-center gap-2 font-mono text-[11px]">
					<div
						className={cn(
							"h-2 w-2 rounded-full",
							gestureDebug.isPinching ? "bg-red-400" : "bg-white/20",
						)}
					/>
					<span className="text-white/50">Pinch</span>
					<span
						className={cn(
							"w-8 text-right",
							gestureDebug.isPinching ? "text-red-300" : "text-white/40",
						)}
					>
						{gestureDebug.raw.pinchDist}
					</span>
				</div>
			)}
		</div>
	);
};
