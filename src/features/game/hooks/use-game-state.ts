import { useSyncExternalStore } from "react";
import {
	type GameUIState,
	getGameUISnapshot,
	subscribe,
} from "@/stores/game-store";

export const useGameState = (): GameUIState => {
	return useSyncExternalStore(subscribe, getGameUISnapshot);
};
