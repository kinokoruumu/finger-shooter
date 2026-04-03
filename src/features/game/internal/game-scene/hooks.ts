import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { GAME_CONFIG } from "@/config/game-config";
import {
	addScoreWithPopup,
	consumeFireEvents,
	setPhase,
	setTimeRemaining,
} from "@/stores/game-store";
import { checkHit3D, createScreenToWorld } from "../../utils";
import type { BalloonTargetData } from "../balloon-target";
import { randomBalloonColor } from "../balloon-target";
import type { BulletData } from "../bullet-effect";
import type { GroundTargetData } from "../ground-target";
import type { TrainTargetData } from "../train-target";

let nextId = 0;
const genId = () => ++nextId;

export const useGameScene = (isPlaying: boolean) => {
	const { camera } = useThree();
	const screenToWorldRef = useRef<ReturnType<typeof createScreenToWorld>>(null);

	const [groundTargets, setGroundTargets] = useState<GroundTargetData[]>([]);
	const [trainTargets, setTrainTargets] = useState<TrainTargetData[]>([]);
	const [balloonTargets, setBalloonTargets] = useState<BalloonTargetData[]>([]);
	const [bullets, setBullets] = useState<BulletData[]>([]);

	const lastGroundSpawn = useRef(0);
	const lastTrainSpawn = useRef(0);
	const lastBalloonSpawn = useRef(0);
	const gameTimer = useRef<number>(GAME_CONFIG.game.timeLimit);
	const sceneRef = useRef<THREE.Group>(null);

	useEffect(() => {
		screenToWorldRef.current = createScreenToWorld(
			camera as THREE.PerspectiveCamera,
		);
	}, [camera]);

	const screenToWorld = useCallback(
		(nx: number, ny: number, z: number): [number, number, number] => {
			if (!screenToWorldRef.current) return [0, 0, z];
			return screenToWorldRef.current(nx, ny, z);
		},
		[],
	);

	useEffect(() => {
		if (isPlaying) {
			gameTimer.current = GAME_CONFIG.game.timeLimit;
			lastGroundSpawn.current = 0;
			lastTrainSpawn.current = 0;
			lastBalloonSpawn.current = 0;
			setGroundTargets([]);
			setTrainTargets([]);
			setBalloonTargets([]);
			setBullets([]);
			nextId = 0;
		}
	}, [isPlaying]);

	useFrame((state, delta) => {
		if (!isPlaying) return;

		const now = state.clock.elapsedTime * 1000;

		// タイマー
		gameTimer.current -= delta;
		if (gameTimer.current <= 0) {
			gameTimer.current = 0;
			setTimeRemaining(0);
			setPhase("result");
			return;
		}
		setTimeRemaining(Math.ceil(gameTimer.current));

		// 地上ターゲット生成
		if (
			now - lastGroundSpawn.current >
			GAME_CONFIG.target.groundSpawnInterval
		) {
			const [leftX] = screenToWorld(0.1, 0.5, -15);
			const [rightX] = screenToWorld(0.9, 0.5, -15);
			const x = leftX + Math.random() * (rightX - leftX);

			// 既存の地上ターゲットと重ならないかチェック
			const tooClose = groundTargets.some((t) => Math.abs(t.x - x) < 3);
			lastGroundSpawn.current = now;
			if (!tooClose) {
				const [, bottomY] = screenToWorld(0.5, 0.95, -15);
				const [, topY] = screenToWorld(0.5, 0.3, -15);
				const peakY = topY - Math.random() * 2;

				const isGold = Math.random() < 0.2;
				setGroundTargets((prev) => [
					...prev,
					{ id: genId(), x, groundY: bottomY - 2, peakY, isGold },
				]);
			}
		}

		// 電車生成
		if (now - lastTrainSpawn.current > GAME_CONFIG.target.trainSpawnInterval) {
			lastTrainSpawn.current = now;
			const [rightX] = screenToWorld(1.2, 0.5, -18);
			const [, topY] = screenToWorld(0.5, 0.2, -18);
			const [, bottomY] = screenToWorld(0.5, 0.6, -18);
			const y = topY + Math.random() * (bottomY - topY);

			setTrainTargets((prev) => [
				...prev,
				{ id: genId(), startX: rightX, y, z: -18 },
			]);
		}

		// 風船生成
		if (
			now - lastBalloonSpawn.current >
			GAME_CONFIG.target.balloonSpawnInterval
		) {
			const [leftX] = screenToWorld(0.15, 0.5, -12);
			const [rightX] = screenToWorld(0.85, 0.5, -12);
			const x = leftX + Math.random() * (rightX - leftX);

			// 既存の風船と重ならないかチェック
			const tooClose = balloonTargets.some((t) => Math.abs(t.x - x) < 2);
			lastBalloonSpawn.current = now;
			if (!tooClose) {
				const [, bottomY] = screenToWorld(0.5, 1.1, -12);
				const speed =
					GAME_CONFIG.target.balloonSpeedMin +
					Math.random() *
						(GAME_CONFIG.target.balloonSpeedMax -
							GAME_CONFIG.target.balloonSpeedMin);

				setBalloonTargets((prev) => [
					...prev,
					{
						id: genId(),
						x,
						startY: bottomY,
						z: -12,
						speed,
						color: randomBalloonColor(),
					},
				]);
			}
		}

		// 発射イベント処理
		const events = consumeFireEvents();
		for (const event of events) {
			const aimWorld = screenToWorld(event.x, event.y, -5);
			const endWorld = screenToWorld(event.x, event.y, -15);

			setBullets((prev) => [
				...prev,
				{
					id: genId(),
					startPos: aimWorld,
					endPos: endWorld,
					progress: 0,
				},
			]);

			let hit = false;

			if (sceneRef.current) {
				// 風船ヒット判定（z=-12、手前なので先に判定）
				const hitWorldBalloon = screenToWorld(event.x, event.y, -12);
				for (const child of sceneRef.current.children) {
					if (child.userData.type === "balloon-target" && child.visible) {
						const posRef = child.userData.positionRef;
						if (posRef?.current) {
							if (checkHit3D(hitWorldBalloon, posRef.current, 1.5)) {
								child.userData.handleHit?.();
								setBalloonTargets((prev) =>
									prev.filter((t) => t.id !== child.userData.id),
								);
								addScoreWithPopup(1, "+1", event.x, event.y);
								hit = true;
								break;
							}
						}
					}
				}

				// 地上ターゲット判定（z=-15）
				if (!hit) {
					const hitWorldGround = screenToWorld(event.x, event.y, -15);
					for (const child of sceneRef.current.children) {
						if (child.userData.type === "ground-target" && child.visible) {
							const posRef = child.userData.positionRef;
							if (posRef?.current) {
								if (checkHit3D(hitWorldGround, posRef.current, 2.0)) {
									child.userData.handleHit?.();
									setGroundTargets((prev) =>
										prev.filter((t) => t.id !== child.userData.id),
									);
									const isGold = child.userData.isGold;
									addScoreWithPopup(
										isGold ? 3 : 1,
										isGold ? "+3" : "+1",
										event.x,
										event.y,
									);
									hit = true;
									break;
								}
							}
						}
					}
				}

				// 電車ターゲット判定（z=-18）
				if (!hit) {
					const hitWorldTrain = screenToWorld(event.x, event.y, -18);
					for (const child of sceneRef.current.children) {
						if (child.userData.type === "train-target") {
							const { slots, handleSlotHit } = child.userData;
							if (!slots || !handleSlotHit) continue;

							for (let i = 0; i < slots.length; i++) {
								const slot = slots[i];
								if (!slot.alive) continue;

								const slotWorld: [number, number, number] = [
									child.position.x + slot.offsetX,
									child.position.y + slot.offsetY,
									child.position.z + 1.05,
								];

								if (checkHit3D(hitWorldTrain, slotWorld, 1.2)) {
									handleSlotHit(i);
									addScoreWithPopup(1, "+1", event.x, event.y);
									// 全滅チェック（この1つで最後か）
									const remaining = slots.filter(
										(s: { alive: boolean }, idx: number) =>
											idx === i ? false : s.alive,
									);
									if (remaining.length === 0) {
										addScoreWithPopup(3, "+3 BONUS!", event.x, event.y - 0.05);
									}
									hit = true;
									break;
								}
							}
							if (hit) break;
						}
					}
				}
			}
		}
	});

	const handleGroundDead = useCallback((id: number) => {
		setGroundTargets((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const handleTrainDead = useCallback((id: number) => {
		setTrainTargets((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const handleBalloonDead = useCallback((id: number) => {
		setBalloonTargets((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const handleBulletComplete = useCallback((id: number) => {
		setBullets((prev) => prev.filter((b) => b.id !== id));
	}, []);

	const handleSlotHit = useCallback(() => {}, []);

	return {
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
	};
};
