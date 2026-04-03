import { useSyncExternalStore } from "react";
import {
	type GameUIState,
	getGameUISnapshot,
	subscribe,
} from "@/features/game/stores/game-store";

export const useGameState = (): GameUIState => {
	return useSyncExternalStore(subscribe, getGameUISnapshot);
};
