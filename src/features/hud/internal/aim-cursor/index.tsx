import { useEffect, useRef } from "react";
import { sharedState } from "@/stores/game-store";

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
			className="pointer-events-none absolute z-40 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-500/60 opacity-0 transition-opacity duration-150"
		/>
	);
};
