import { useEffect, useRef } from "react";
import { sharedState } from "@/features/game/stores/game-store";

export const AimCursor = () => {
	const dotRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let rafId: number;

		const update = () => {
			if (dotRef.current) {
				const aim = sharedState.aim;
				if (aim && sharedState.isHandDetected) {
					dotRef.current.style.opacity = "1";
					dotRef.current.style.left = `${aim.x * 100}%`;
					dotRef.current.style.top = `${aim.y * 100}%`;
				} else {
					dotRef.current.style.opacity = "0";
				}
			}
			rafId = requestAnimationFrame(update);
		};

		rafId = requestAnimationFrame(update);
		return () => cancelAnimationFrame(rafId);
	}, []);

	return (
		<div
			ref={dotRef}
			className="pointer-events-none absolute z-50 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-stone-800 bg-orange-500/70 opacity-0 shadow-lg shadow-black/30 transition-opacity duration-150"
		/>
	);
};
