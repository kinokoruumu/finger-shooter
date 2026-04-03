import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { STAGES } from "@/config/stage-definitions";

type Props = {
	stageIndex: number;
	onComplete: () => void;
};

export const StageTransition = ({ stageIndex, onComplete }: Props) => {
	const [visible, setVisible] = useState(true);
	const stage = STAGES[stageIndex];

	useEffect(() => {
		const timer = setTimeout(() => {
			setVisible(false);
		}, 2200);
		return () => clearTimeout(timer);
	}, []);

	if (!stage) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
			<AnimatePresence
				onExitComplete={() => {
					onComplete();
				}}
			>
				{visible && (
					<motion.div
						key={`stage-${stageIndex}`}
						initial={{ opacity: 0, scale: 0.6, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 1.1, y: -30 }}
						transition={{
							duration: 0.5,
							ease: "easeOut",
						}}
						className="text-center"
					>
						<motion.h2
							className="font-black text-white"
							style={{
								fontFamily: '"Rounded Mplus 1c", sans-serif',
								fontSize: stageIndex === 2 ? "3rem" : "3.5rem",
								textShadow:
									"0 0 20px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.5)",
							}}
							initial={{ letterSpacing: "0.3em" }}
							animate={{ letterSpacing: "0.1em" }}
							transition={{ duration: 0.6, ease: "easeOut" }}
						>
							{stage.name}
						</motion.h2>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
