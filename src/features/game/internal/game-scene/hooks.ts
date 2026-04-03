import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import type { SpawnEntry } from "@/config/stage-definitions";
import { STAGES } from "@/config/stage-definitions";
import {
	addScoreWithPopup,
	consumeFireEvents,
	nextStage,
} from "@/stores/game-store";
import { checkHit3D, createScreenToWorld } from "../../utils";
import type { BalloonTargetData } from "../balloon-target";
import { randomBalloonColor } from "../balloon-target";
import type { BulletData } from "../bullet-effect";
import type { GroundTargetData } from "../ground-target";
import type { TrainTargetData } from "../train-target";

let nextId = 0;
const genId = () => ++nextId;

export const useGameScene = (
	_isPlaying: boolean,
	currentStage: number,
	phase: string,
) => {
	const { camera } = useThree();
	const screenToWorldRef = useRef<ReturnType<typeof createScreenToWorld>>(null);

	const [groundTargets, setGroundTargets] = useState<GroundTargetData[]>([]);
	const [trainTargets, setTrainTargets] = useState<TrainTargetData[]>([]);
	const [balloonTargets, setBalloonTargets] = useState<BalloonTargetData[]>([]);
	const [bullets, setBullets] = useState<BulletData[]>([]);

	const stageStartTime = useRef(0);
	const spawnIndex = useRef(0);
	const sceneRef = useRef<THREE.Group>(null);
	const stageInitialized = useRef(false);

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

	// ゲーム開始時のリセット
	useEffect(() => {
		if (phase === "playing" && currentStage === 0) {
			setGroundTargets([]);
			setTrainTargets([]);
			setBalloonTargets([]);
			setBullets([]);
			nextId = 0;
			stageStartTime.current = 0;
			spawnIndex.current = 0;
			stageInitialized.current = false;
		}
	}, [phase, currentStage]);

	// ステージ遷移後のリセット
	// biome-ignore lint/correctness/useExhaustiveDependencies: currentStageの変化でもリセット必要
	useEffect(() => {
		if (phase === "playing") {
			stageStartTime.current = 0;
			spawnIndex.current = 0;
			stageInitialized.current = false;
		}
	}, [phase, currentStage]);

	// グリッド座標(gx: 0-9, gy: 0-4)→正規化座標に変換
	const gridToNormalized = useCallback(
		(gx: number, gy: number): [number, number] => {
			const nx = 0.1 + (gx / 9) * 0.8;
			const ny = 0.15 + (gy / 4) * 0.7;
			return [nx, ny];
		},
		[],
	);

	const spawnFromEntry = useCallback(
		(entry: SpawnEntry) => {
			switch (entry.type) {
				case "balloon": {
					const [worldX] = screenToWorld(entry.nx, 0.5, -18);
					const [, bottomY] = screenToWorld(0.5, 1.1, -18);
					const speed = 1.5 + Math.random() * 2.0;
					setBalloonTargets((prev) => [
						...prev,
						{
							id: genId(),
							x: worldX,
							startY: bottomY,
							z: -18,
							speed,
							color: randomBalloonColor(),
						},
					]);
					break;
				}
				case "ground":
				case "ground-gold":
				case "ground-penalty": {
					const hasGrid = entry.gx !== undefined && entry.gy !== undefined;
					let nx: number;
					let ny: number;
					if (hasGrid) {
						[nx, ny] = gridToNormalized(entry.gx as number, entry.gy as number);
					} else {
						nx = entry.nx;
						ny = entry.ny ?? 0.5;
					}
					const [worldX] = screenToWorld(nx, 0.5, -15);
					const [, worldY] = screenToWorld(0.5, ny, -15);
					const isGold = entry.type === "ground-gold";
					const isPenalty = entry.type === "ground-penalty";
					setGroundTargets((prev) => {
						// グリッド座標指定時、同位置に的がいたらスキップ
						if (
							hasGrid &&
							prev.some((t) => t.gx === entry.gx && t.gy === entry.gy)
						) {
							return prev;
						}
						return [
							...prev,
							{
								id: genId(),
								x: worldX,
								y: worldY,
								z: -15,
								isGold,
								isPenalty,
								visibleDuration: entry.visibleDuration ?? 2.5,
								gx: entry.gx,
								gy: entry.gy,
							},
						];
					});
					break;
				}
				case "train": {
					const dir = entry.direction ?? 1;
					const lane = entry.trainLane ?? 1;
					// 3ライン: 上=0.25, 中=0.45, 下=0.65
					const laneNy = [0.25, 0.45, 0.65][lane];
					const startNx = dir > 0 ? 1.3 : -0.3;
					const [startX] = screenToWorld(startNx, 0.5, -22);
					const [, trainY] = screenToWorld(0.5, laneNy, -22);
					setTrainTargets((prev) => {
						// 同じレーンに列車がいたらスキップ
						if (prev.some((t) => t.lane === lane)) return prev;
						return [
							...prev,
							{
								id: genId(),
								startX,
								y: trainY,
								z: -22,
								slotsOscillate: entry.slotsOscillate ?? false,
								direction: dir,
								lane,
							},
						];
					});
					break;
				}
			}
		},
		[screenToWorld, gridToNormalized],
	);

	useFrame((state) => {
		// playing以外はスポーンしない（ただし既存ターゲットの更新はコンポーネント側で続行）
		if (phase !== "playing") return;

		const stage = STAGES[currentStage];
		if (!stage) return;

		// ステージ開始タイムスタンプの初期化
		if (!stageInitialized.current) {
			stageStartTime.current = state.clock.elapsedTime * 1000;
			stageInitialized.current = true;
		}

		const stageElapsed =
			state.clock.elapsedTime * 1000 - stageStartTime.current;

		// ステージ終了チェック:
		// 全スポーン完了 AND 画面上に的が残っていない場合に遷移
		const allSpawned = spawnIndex.current >= stage.spawns.length;
		if (allSpawned) {
			const hasRemaining =
				groundTargets.length > 0 ||
				balloonTargets.length > 0 ||
				trainTargets.length > 0;
			if (!hasRemaining) {
				nextStage();
				return;
			}
		}

		// タイムラインに沿ったスポーン
		while (
			spawnIndex.current < stage.spawns.length &&
			stage.spawns[spawnIndex.current].time <= stageElapsed
		) {
			spawnFromEntry(stage.spawns[spawnIndex.current]);
			spawnIndex.current++;
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
				// 風船ヒット判定（z=-18）
				const hitWorldBalloon = screenToWorld(event.x, event.y, -18);
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
									const isPenalty = child.userData.isPenalty;
									if (isPenalty) {
										addScoreWithPopup(-3, "-3", event.x, event.y);
									} else {
										addScoreWithPopup(
											isGold ? 3 : 1,
											isGold ? "+3" : "+1",
											event.x,
											event.y,
										);
									}
									hit = true;
									break;
								}
							}
						}
					}
				}

				// 電車ターゲット判定（z=-22）
				if (!hit) {
					const hitWorldTrain = screenToWorld(event.x, event.y, -22);
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
									child.position.z + 2.0,
								];

								if (checkHit3D(hitWorldTrain, slotWorld, 1.2)) {
									handleSlotHit(i);
									addScoreWithPopup(1, "+1", event.x, event.y);
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
