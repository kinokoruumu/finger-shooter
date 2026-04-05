import { useCallback, useRef, useState } from "react";

type Options = {
	maxHistory?: number;
};

export const useHistory = <T>(initialState: T, options: Options = {}) => {
	const { maxHistory = 50 } = options;
	const [state, setStateInternal] = useState(initialState);
	const pastRef = useRef<T[]>([]);
	const futureRef = useRef<T[]>([]);

	const setState = useCallback(
		(next: T | ((prev: T) => T)) => {
			setStateInternal((prev) => {
				const newState =
					typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
				pastRef.current = [...pastRef.current, prev].slice(-maxHistory);
				futureRef.current = [];
				return newState;
			});
		},
		[maxHistory],
	);

	const undo = useCallback(() => {
		setStateInternal((current) => {
			if (pastRef.current.length === 0) return current;
			const prev = pastRef.current[pastRef.current.length - 1];
			pastRef.current = pastRef.current.slice(0, -1);
			futureRef.current = [...futureRef.current, current];
			return prev;
		});
	}, []);

	const redo = useCallback(() => {
		setStateInternal((current) => {
			if (futureRef.current.length === 0) return current;
			const next = futureRef.current[futureRef.current.length - 1];
			futureRef.current = futureRef.current.slice(0, -1);
			pastRef.current = [...pastRef.current, current];
			return next;
		});
	}, []);

	return {
		state,
		setState,
		undo,
		redo,
		canUndo: pastRef.current.length > 0,
		canRedo: futureRef.current.length > 0,
	};
};
