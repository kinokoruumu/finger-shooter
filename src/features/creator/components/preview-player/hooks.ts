import { useCallback, useMemo, useState } from "react";
import type { SpawnEntry } from "@/features/game/constants/stage-definitions";
import type { CreatorGroup, CreatorStage } from "../../types";
import { convertStageToSpawns } from "../../utils/convert-to-spawns";

type PreviewState = "stopped" | "playing";

export const usePreviewPlayer = (
	source: CreatorGroup | CreatorStage,
) => {
	const [state, setState] = useState<PreviewState>("stopped");

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
		setState("playing");
	}, []);

	const stop = useCallback(() => {
		setState("stopped");
	}, []);

	/** PreviewScene から全グループ完了時に呼ばれる */
	const onComplete = useCallback(() => {
		setState("stopped");
	}, []);

	return {
		state,
		spawns,
		play,
		stop,
		onComplete,
	};
};
