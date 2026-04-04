import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import type { CreatorGroup, CreatorStage } from "../../types";
import { convertStageToSpawns } from "../../utils/convert-to-spawns";

type PreviewState = "stopped" | "playing";

export const usePreviewPlayer = (
	source: CreatorGroup | CreatorStage,
) => {
	const [state, setState] = useState<PreviewState>("stopped");
	/** 再生経過時間(ms)。ref で高頻度更新、React 再レンダリングを避ける */
	const elapsedMsRef = useRef(0);
	const rafRef = useRef(0);
	const startTimeRef = useRef(0);

	const spawns = useMemo((): SpawnEntry[] => {
		if ("groups" in source) {
			return convertStageToSpawns(source);
		}
		return convertStageToSpawns({
			id: "preview",
			name: "preview",
			groups: [source],
			createdAt: 0,
			updatedAt: 0,
		});
	}, [source]);

	const play = useCallback(() => {
		elapsedMsRef.current = 0;
		startTimeRef.current = performance.now();
		setState("playing");
	}, []);

	const stop = useCallback(() => {
		setState("stopped");
		elapsedMsRef.current = 0;
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = 0;
		}
	}, []);

	const onComplete = useCallback(() => {
		setState("stopped");
		elapsedMsRef.current = 0;
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = 0;
		}
	}, []);

	// 再生中は rAF で elapsedMsRef を更新（再生ヘッド用）
	useEffect(() => {
		if (state !== "playing") return;
		startTimeRef.current = performance.now();

		const tick = () => {
			elapsedMsRef.current = performance.now() - startTimeRef.current;
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);

		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [state]);

	return {
		state,
		spawns,
		elapsedMsRef,
		play,
		stop,
		onComplete,
	};
};
