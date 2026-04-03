import type { GamePhase } from "@/stores/game-store";
import { BalloonTarget } from "../balloon-target";
import { BulletEffects } from "../bullet-effect";
import { Crosshair } from "../crosshair";
import { GroundTarget } from "../ground-target";
import { Rails } from "../rails";
import { TrainTarget } from "../train-target";
import { useGameScene } from "./hooks";

/** 線路のY位置とZ位置（列車のスポーンと一致させる） */
const RAILS_Y = -8;
const RAILS_Z = -22;

type Props = {
	isPlaying: boolean;
	currentStage: number;
	phase: GamePhase;
};

export const GameScene = ({ isPlaying, currentStage, phase }: Props) => {
	const {
		sceneRef,
		screenToWorld,
		groundTargets,
		trainTargets,
		balloonTargets,
		bullets,
		handleGroundDead,
		handleTrainDead,
		handleBalloonDead,
		handleBulletComplete,
		handleSlotHit,
	} = useGameScene(isPlaying, currentStage, phase);

	return (
		<group ref={sceneRef}>
			{/* 常設の線路（画面下部） */}
			<Rails y={RAILS_Y} z={RAILS_Z} />

			<Crosshair screenToWorld={screenToWorld} phase={phase} />

			{balloonTargets.map((t) => (
				<BalloonTarget key={t.id} data={t} onDead={handleBalloonDead} />
			))}

			{groundTargets.map((t) => (
				<GroundTarget key={t.id} data={t} onDead={handleGroundDead} />
			))}

			{trainTargets.map((t) => (
				<TrainTarget
					key={t.id}
					data={t}
					onDead={handleTrainDead}
					onSlotHit={handleSlotHit}
				/>
			))}

			<BulletEffects bullets={bullets} onComplete={handleBulletComplete} />
		</group>
	);
};
