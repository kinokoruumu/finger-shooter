import { cn } from "@/lib/utils";
import { ScorePopupDisplay } from "./components/score-popup";

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
					<span
						className="font-black text-5xl text-white tabular-nums"
						style={{
							textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.9)",
						}}
					>
						{score}
					</span>
				</div>
			</div>

			{/* スコアポップアップ */}
			<ScorePopupDisplay />
		</div>
	);
};
