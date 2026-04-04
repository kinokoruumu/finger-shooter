import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import type { GroundTargetData } from "@/features/game/components/ground-target";
import { GroundTarget } from "@/features/game/components/ground-target";
import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import { gridToNormalized } from "@/features/game/utils/grid-to-normalized";
import { createScreenToWorld } from "@/features/game/utils/screen-to-world";

let nextId = 0;
const genId = () => ++nextId;

type Props = {
	spawns: SpawnEntry[];
	elapsedMs: number;
	isPlaying: boolean;
};

export const PreviewScene = ({ spawns, elapsedMs, isPlaying }: Props) => {
	const { camera } = useThree();
	const [groundTargets, setGroundTargets] = useState<GroundTargetData[]>([]);
	const spawnIndexRef = useRef(0);
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

	// ソート済みspawns
	const sortedSpawns = useMemo(
		() => [...spawns].sort((a, b) => a.time - b.time),
		[spawns],
	);

	// リセット
	useEffect(() => {
		if (!isPlaying && prevPlayingRef.current) {
			setGroundTargets([]);
			spawnIndexRef.current = 0;
			nextId = 0;
		}
		if (isPlaying && !prevPlayingRef.current) {
			setGroundTargets([]);
			spawnIndexRef.current = 0;
			nextId = 0;
		}
		prevPlayingRef.current = isPlaying;
	}, [isPlaying]);

	// スポーン処理
	useEffect(() => {
		if (!isPlaying) return;

		while (
			spawnIndexRef.current < sortedSpawns.length &&
			sortedSpawns[spawnIndexRef.current].time <= elapsedMs
		) {
			const entry = sortedSpawns[spawnIndexRef.current];
			spawnIndexRef.current++;

			if (
				entry.type === "ground" ||
				entry.type === "ground-gold" ||
				entry.type === "ground-penalty"
			) {
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
			}
		}
	}, [elapsedMs, isPlaying, sortedSpawns, screenToWorld, targetScale]);

	const handleDead = useCallback((id: number) => {
		setGroundTargets((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<group>
			{groundTargets.map((t) => (
				<GroundTarget key={t.id} data={t} onDead={handleDead} />
			))}
		</group>
	);
};
