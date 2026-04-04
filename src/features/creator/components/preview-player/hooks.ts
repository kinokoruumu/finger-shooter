import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import type { CreatorGroup, CreatorStage } from "../../types";
import { convertStageToSpawns } from "../../utils/convert-to-spawns";

type PreviewState = "stopped" | "playing";

/** 単一グループまたはステージ全体のプレビュー */
export const usePreviewPlayer = (
	source: CreatorGroup | CreatorStage,
) => {
	const [state, setState] = useState<PreviewState>("stopped");
	const [elapsedMs, setElapsedMs] = useState(0);
	const rafRef = useRef<number>(0);
	const startTimeRef = useRef(0);

	const spawns = useMemo((): SpawnEntry[] => {
		if ("groups" in source) {
			// CreatorStage
			return convertStageToSpawns(source);
		}
		// 単一グループ
		return convertStageToSpawns({
			id: "preview",
			name: "preview",
			groups: [source],
			createdAt: 0,
			updatedAt: 0,
		});
	}, [source]);

	const totalDuration = useMemo(() => {
		if (spawns.length === 0) return 0;
		const maxTime = Math.max(...spawns.map((s) => s.time));
		const lastSpawn = spawns.find((s) => s.time === maxTime);
		const dur = (lastSpawn?.visibleDuration ?? 3) * 1000;
		return maxTime + dur + 500;
	}, [spawns]);

	const play = useCallback(() => {
		setState("playing");
		startTimeRef.current = performance.now();
		setElapsedMs(0);
	}, []);

	const stop = useCallback(() => {
		setState("stopped");
		setElapsedMs(0);
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = 0;
		}
	}, []);

	useEffect(() => {
		if (state !== "playing") return;

		const tick = () => {
			const elapsed = performance.now() - startTimeRef.current;
			setElapsedMs(elapsed);

			if (elapsed >= totalDuration) {
				setState("stopped");
				setElapsedMs(0);
				return;
			}
			rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [state, totalDuration]);

	return {
		state,
		elapsedMs,
		spawns,
		totalDuration,
		play,
		stop,
	};
};
