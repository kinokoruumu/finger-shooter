import { cn } from "@/lib/utils";
import { ScorePopupDisplay } from "./internal/score-popup";

type Props = {
	score: number;
	isVisible: boolean;
};

export const HUD = ({ score, isVisible }: Props) => {
	return (
		<div
			className={cn(
				"pointer-events-none absolute inset-0 z-20 transition-opacity duration-500",
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
		</div>
	);
};
