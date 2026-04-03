import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { playSound } from "@/features/audio";
import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import { STAGES } from "@/features/game/constants/stage-definitions";
import {
	addScoreWithPopup,
	consumeFireEvents,
	nextStage,
} from "@/features/game/stores/game-store";
import type { BalloonTargetData } from "../components/balloon-target";
import { randomBalloonColor } from "../components/balloon-target/utils";
import type { BulletData } from "../components/bullet-effect";
import type { GroundTargetData } from "../components/ground-target";
import type { TrainTargetData } from "../components/train-target";
import { checkHit3D } from "../utils/check-hit";
import { createScreenToWorld } from "../utils/screen-to-world";

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

	const currentGroup = useRef(0);
	const groupStartTime = useRef(0);
	const groupSpawnIndex = useRef(0);
	const groupInitialized = useRef(false);
	/** スポーン完了後、state反映を待つためのフレームカウンタ */
	const waitFrames = useRef(0);
	/** リセット済みフラグ（同じphase+stageで二重リセット防止） */
	const resetKey = useRef("");
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

	// ステージ遷移後のリセット（同じphase+stageの組み合わせでは1回のみ）
	useEffect(() => {
		const key = `${phase}-${currentStage}`;
		if (phase === "playing" && resetKey.current !== key) {
			resetKey.current = key;
			setGroundTargets([]);
			setTrainTargets([]);
			setBalloonTargets([]);
			setBullets([]);
			nextId = 0;
			currentGroup.current = 0;
			groupStartTime.current = 0;
			groupSpawnIndex.current = 0;
			groupInitialized.current = false;
			waitFrames.current = 0;
		}
	}, [phase, currentStage]);

	// グリッド座標(gx: 0-7, gy: 0-3)→正規化座標に変換
	const gridToNormalized = useCallback(
		(gx: number, gy: number): [number, number] => {
			const nx = 0.2 + (gx / 7) * 0.6;
			const ny = 0.2 + (gy / 3) * 0.55;
			return [nx, ny];
		},
		[],
	);

	// 画面幅に応じた的のスケールを計算
	const targetScale = useRef(1.8);
	useEffect(() => {
		const [leftX] = screenToWorld(0.2, 0.5, -15);
		const [rightX] = screenToWorld(0.8, 0.5, -15);
		const gridWidth = rightX - leftX;
		// 8列の間隔 = gridWidth / 7。的の直径がこの間隔の80%以下になるようscale調整
		const cellWidth = gridWidth / 7;
		const maxDiameter = cellWidth * 0.8;
		// 的の基本直径 = radius 1.0 * 2 = 2.0 (scale=1で直径2)
		const scale = Math.min(1.8, maxDiameter / 2.0);
		targetScale.current = Math.max(0.8, scale);
	}, [screenToWorld]);

	const spawnFromEntry = useCallback(
		(entry: SpawnEntry) => {
			switch (entry.type) {
				case "balloon": {
					const [worldX] = screenToWorld(entry.nx, 0.5, -18);
					const [, bottomY] = screenToWorld(0.5, 1.1, -18);
					const speed = 4.0 + Math.random() * 2.0;
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
								scale: targetScale.current,
							},
						];
					});
					break;
				}
				case "train": {
					const dir = entry.direction ?? 1;
					const startNx = dir > 0 ? 1.5 : -0.5;
					const [startX] = screenToWorld(startNx, 0.5, -22);
					// 固定Y位置
					const trainY = -5;
					setTrainTargets((prev) => {
						// 既に列車がいたらスキップ
						if (prev.length > 0) return prev;
						return [
							...prev,
							{
								id: genId(),
								startX,
								y: trainY,
								z: -22,
								slotsOscillate: entry.slotsOscillate ?? false,
								direction: dir,
								lane: 0,
								speed: entry.trainSpeed ?? 1.0,
								goldSlots: entry.goldSlots ?? 0,
								penaltySlots: entry.penaltySlots ?? 0,
							},
						];
					});
					break;
				}
			}
		},
		[screenToWorld, gridToNormalized],
	);

	// グループごとのスポーンを事前計算（ソート済み）
	const groupedSpawns = useRef<Map<number, SpawnEntry[]>>(new Map());
	const maxGroupRef = useRef(-1);

	useEffect(() => {
		const stage = STAGES[currentStage];
		if (!stage) return;
		const map = new Map<number, SpawnEntry[]>();
		for (const s of stage.spawns) {
			const arr = map.get(s.group) ?? [];
			arr.push(s);
			map.set(s.group, arr);
		}
		// 各グループ内をtime順にソート
		for (const arr of map.values()) {
			arr.sort((a, b) => a.time - b.time);
		}
		groupedSpawns.current = map;
		maxGroupRef.current = Math.max(...stage.spawns.map((s) => s.group));
	}, [currentStage]);

	useFrame((state) => {
		if (phase !== "playing") return;
		if (maxGroupRef.current < 0) return;

		const now = state.clock.elapsedTime * 1000;

		// 全グループ完了チェック
		if (currentGroup.current > maxGroupRef.current) {
			const hasRemaining =
				groundTargets.length > 0 ||
				trainTargets.length > 0 ||
				balloonTargets.length > 0;
			if (!hasRemaining) {
				nextStage();
			}
			return;
		}

		const groupSpawns = groupedSpawns.current.get(currentGroup.current) ?? [];

		// グループ開始タイムスタンプの初期化
		if (!groupInitialized.current) {
			groupStartTime.current = now;
			groupInitialized.current = true;
		}

		const groupElapsed = now - groupStartTime.current;

		// グループ内のスポーンを時間順に実行
		let spawnedThisFrame = false;
		while (
			groupSpawnIndex.current < groupSpawns.length &&
			groupSpawns[groupSpawnIndex.current].time <= groupElapsed
		) {
			spawnFromEntry(groupSpawns[groupSpawnIndex.current]);
			groupSpawnIndex.current++;
			spawnedThisFrame = true;
		}

		// スポーンしたフレームではstate反映を待つ（2フレーム）
		if (spawnedThisFrame) {
			waitFrames.current = 2;
		} else if (waitFrames.current > 0) {
			waitFrames.current--;
		} else if (groupSpawnIndex.current >= groupSpawns.length) {
			// グループのスポーン全完了 → 次グループへの条件判定
			// グループに的・列車が含まれていれば、それらの消滅を待つ
			// 風船のみのグループなら風船の消滅を待つ
			const hasGroundOrTrain = groupSpawns.some((s) => s.type !== "balloon");
			const hasRemaining = hasGroundOrTrain
				? groundTargets.length > 0 || trainTargets.length > 0
				: balloonTargets.length > 0;
			if (!hasRemaining) {
				currentGroup.current++;
				groupSpawnIndex.current = 0;
				groupInitialized.current = false;
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
				// 風船ヒット判定（z=-18）
				const hitWorldBalloon = screenToWorld(event.x, event.y, -18);
				for (const child of sceneRef.current.children) {
					if (child.userData.type === "balloon-target" && child.visible) {
						const posRef = child.userData.positionRef;
						if (posRef?.current) {
							if (checkHit3D(hitWorldBalloon, posRef.current, 2.5)) {
								child.userData.handleHit?.();
								playSound("balloon-pop", 0.85);
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
								if (checkHit3D(hitWorldGround, posRef.current, 3.0)) {
									child.userData.handleHit?.();
									setGroundTargets((prev) =>
										prev.filter((t) => t.id !== child.userData.id),
									);
									const isGold = child.userData.isGold;
									const isPenalty = child.userData.isPenalty;
									if (isGold) {
										playSound("gold-hit", 0.7);
									} else if (!isPenalty) {
										playSound("target-hit", 1.0);
									}
									if (isPenalty) {
										playSound("penalty-hit", 0.7);
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

				// 電車ターゲット判定
				if (!hit) {
					for (const child of sceneRef.current.children) {
						if (child.userData.type === "train-target") {
							const { slots, handleSlotHit } = child.userData;
							if (!slots || !handleSlotHit) continue;

							for (let i = 0; i < slots.length; i++) {
								const slot = slots[i];
								if (!slot.alive) continue;

								// 的の実際のz位置でscreenToWorldを計算
								const slotZ = child.position.z + 3.5;
								const hitWorldTrain = screenToWorld(event.x, event.y, slotZ);
								const slotWorld: [number, number, number] = [
									child.position.x + slot.offsetX,
									child.position.y + slot.offsetY,
									slotZ,
								];

								if (checkHit3D(hitWorldTrain, slotWorld, 2.5)) {
									handleSlotHit(i);
									const st = slot.slotType ?? "normal";
									if (st === "gold") {
										playSound("gold-hit", 0.7);
										addScoreWithPopup(3, "+3", event.x, event.y);
									} else if (st === "penalty") {
										playSound("penalty-hit", 0.7);
										addScoreWithPopup(-3, "-3", event.x, event.y);
									} else {
										playSound("target-hit", 1.0);
										addScoreWithPopup(1, "+1", event.x, event.y);
									}
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
