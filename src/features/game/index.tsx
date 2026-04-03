import { Canvas } from "@react-three/fiber";
import type { GamePhase } from "@/stores/game-store";
import { GameScene } from "./internal/game-scene";

type Props = {
	isPlaying: boolean;
	currentStage: number;
	phase: GamePhase;
};

export const Game3D = ({ isPlaying, currentStage, phase }: Props) => {
	return (
		<div className="pointer-events-none absolute inset-0 z-10">
			<Canvas
				camera={{ position: [0, 0, 5], fov: 60 }}
				gl={{ alpha: true }}
				style={{ background: "transparent" }}
			>
				<ambientLight intensity={0.6} />
				<directionalLight position={[5, 10, 5]} intensity={0.8} />
				<GameScene
					isPlaying={isPlaying}
					currentStage={currentStage}
					phase={phase}
				/>
			</Canvas>
		</div>
	);
};
