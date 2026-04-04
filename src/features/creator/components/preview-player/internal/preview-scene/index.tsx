import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import type { BalloonTargetData } from "@/features/game/components/balloon-target";
import { BalloonTarget } from "@/features/game/components/balloon-target";
import { randomBalloonColor } from "@/features/game/components/balloon-target/utils";
import type { GroundTargetData } from "@/features/game/components/ground-target";
import { GroundTarget } from "@/features/game/components/ground-target";
import type { TrainTargetData } from "@/features/game/components/train-target";
import { TrainTarget } from "@/features/game/components/train-target";
import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import { gridToNormalized } from "@/features/game/utils/grid-to-normalized";
import { createScreenToWorld } from "@/features/game/utils/screen-to-world";

let nextId = 0;
const genId = () => ++nextId;

type Props = {
	spawns: SpawnEntry[];
	isPlaying: boolean;
	onComplete?: () => void;
};

export const PreviewScene = ({ spawns, isPlaying, onComplete }: Props) => {
	const { camera } = useThree();
	const [groundTargets, setGroundTargets] = useState<GroundTargetData[]>([]);
	const [balloonTargets, setBalloonTargets] = useState<BalloonTargetData[]>(
		[],
	);
	const [trainTargets, setTrainTargets] = useState<TrainTargetData[]>([]);

	const currentGroup = useRef(0);
	const groupStartTime = useRef(0);
	const groupSpawnIndex = useRef(0);
	const groupInitialized = useRef(false);
	const waitFrames = useRef(0);
	const prevPlayingRef = useRef(false);

	const screenToWorld = useMemo(
		() => createScreenToWorld(camera as THREE.PerspectiveCamera),
		[camera],
	);

	const targetScale = useMemo(() => {
		const [leftX] = screenToWorld(0.2, 0.5, -15);
		const [rightX] = screenToWorld(0.8, 0.5, -15);
		const gridWidth = rightX - leftX;
		const cellWidth = gridWidth / 7;
		const maxDiameter = cellWidth * 0.8;
		const scale = Math.min(1.8, maxDiameter / 2.0);
		return Math.max(0.8, scale);
	}, [screenToWorld]);

	const groupedSpawns = useMemo(() => {
		const map = new Map<number, SpawnEntry[]>();
		for (const s of spawns) {
			const arr = map.get(s.group) ?? [];
			arr.push(s);
			map.set(s.group, arr);
		}
		for (const arr of map.values()) {
			arr.sort((a, b) => a.time - b.time);
		}
		return map;
	}, [spawns]);

	const maxGroup = useMemo(() => {
		if (spawns.length === 0) return -1;
		return Math.max(...spawns.map((s) => s.group));
	}, [spawns]);

	// リセット
	useEffect(() => {
		if (isPlaying !== prevPlayingRef.current) {
			setGroundTargets([]);
			setBalloonTargets([]);
			setTrainTargets([]);
			nextId = 0;
			currentGroup.current = 0;
			groupStartTime.current = 0;
			groupSpawnIndex.current = 0;
			groupInitialized.current = false;
			waitFrames.current = 0;
		}
		prevPlayingRef.current = isPlaying;
	}, [isPlaying]);

	const spawnEntry = useCallback(
		(entry: SpawnEntry) => {
			switch (entry.type) {
				case "ground":
				case "ground-gold":
				case "ground-penalty": {
					const hasGrid =
						entry.gx !== undefined && entry.gy !== undefined;
					let nx: number;
					let ny: number;
					if (hasGrid) {
						[nx, ny] = gridToNormalized(
							entry.gx as number,
							entry.gy as number,
						);
					} else {
						nx = entry.nx;
						ny = entry.ny ?? 0.5;
					}
					const [worldX] = screenToWorld(nx, 0.5, -15);
					const [, worldY] = screenToWorld(0.5, ny, -15);

					setGroundTargets((prev) => [
						...prev,
						{
							id: genId(),
							x: worldX,
							y: worldY,
							z: -15,
							isGold: entry.type === "ground-gold",
							isPenalty: entry.type === "ground-penalty",
							visibleDuration: entry.visibleDuration ?? 2.5,
							gx: entry.gx,
							gy: entry.gy,
							scale: targetScale,
						},
					]);
					break;
				}
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
				case "train": {
					const dir = entry.direction ?? 1;
					const startNx = dir > 0 ? 1.5 : -0.5;
					const [startX] = screenToWorld(startNx, 0.5, -22);
					const trainY = -5;
					setTrainTargets((prev) => {
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
		[screenToWorld, targetScale],
	);

	useFrame((state) => {
		if (!isPlaying || maxGroup < 0) return;

		const now = state.clock.elapsedTime * 1000;

		// 全グループ完了
		if (currentGroup.current > maxGroup) {
			const hasRemaining =
				groundTargets.length > 0 ||
				balloonTargets.length > 0 ||
				trainTargets.length > 0;
			if (!hasRemaining) {
				onComplete?.();
			}
			return;
		}

		const groupSpawns =
			groupedSpawns.get(currentGroup.current) ?? [];

		if (!groupInitialized.current) {
			groupStartTime.current = now;
			groupInitialized.current = true;
		}

		const groupElapsed = now - groupStartTime.current;

		let spawnedThisFrame = false;
		while (
			groupSpawnIndex.current < groupSpawns.length &&
			groupSpawns[groupSpawnIndex.current].time <= groupElapsed
		) {
			spawnEntry(groupSpawns[groupSpawnIndex.current]);
			groupSpawnIndex.current++;
			spawnedThisFrame = true;
		}

		if (spawnedThisFrame) {
			waitFrames.current = 2;
		} else if (waitFrames.current > 0) {
			waitFrames.current--;
		} else if (groupSpawnIndex.current >= groupSpawns.length) {
			// グループ内の的種類に応じた完了判定
			const hasGroundOrTrain = groupSpawns.some(
				(s) => s.type !== "balloon",
			);
			const hasRemaining = hasGroundOrTrain
				? groundTargets.length > 0 || trainTargets.length > 0
				: balloonTargets.length > 0;
			if (!hasRemaining) {
				currentGroup.current++;
				groupSpawnIndex.current = 0;
				groupInitialized.current = false;
			}
		}
	});

	const handleGroundDead = useCallback((id: number) => {
		setGroundTargets((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const handleBalloonDead = useCallback((id: number) => {
		setBalloonTargets((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const handleTrainDead = useCallback((id: number) => {
		setTrainTargets((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<group>
			{groundTargets.map((t) => (
				<GroundTarget key={t.id} data={t} onDead={handleGroundDead} />
			))}
			{balloonTargets.map((t) => (
				<BalloonTarget key={t.id} data={t} onDead={handleBalloonDead} />
			))}
			{trainTargets.map((t) => (
				<TrainTarget
					key={t.id}
					data={t}
					onDead={handleTrainDead}
					onSlotHit={() => {}}
				/>
			))}
		</group>
	);
};
