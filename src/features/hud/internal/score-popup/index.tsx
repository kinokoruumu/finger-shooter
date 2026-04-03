import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { consumeScorePopups, type ScorePopup } from "@/stores/game-store";

type PopupItem = ScorePopup & { createdAt: number };

export const ScorePopupDisplay = () => {
	const [popups, setPopups] = useState<PopupItem[]>([]);

	useEffect(() => {
		let rafId: number;

		const update = () => {
			const now = Date.now();
			const newPopups = consumeScorePopups().map((p) => ({
				...p,
				createdAt: now,
			}));

			setPopups((prev) => {
				const alive = prev.filter((p) => now - p.createdAt < 1200);
				return [...alive, ...newPopups];
			});

			rafId = requestAnimationFrame(update);
		};

		rafId = requestAnimationFrame(update);
		return () => cancelAnimationFrame(rafId);
	}, []);

	return (
		<div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
			{popups.map((popup) => (
				<div
					key={popup.id}
					className={cn(
						"absolute animate-score-popup font-bold",
						popup.points >= 3
							? "text-2xl text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
							: popup.points < 0
								? "text-xl text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
								: "text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
					)}
					style={{
						left: `${popup.x * 100}%`,
						top: `${popup.y * 100}%`,
						transform: "translate(-50%, -50%)",
						fontFamily: '"Rounded Mplus 1c", sans-serif',
					}}
				>
					{popup.label}
				</div>
			))}
		</div>
	);
};
