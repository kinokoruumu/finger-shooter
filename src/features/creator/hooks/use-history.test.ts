import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useHistory } from "./use-history";

describe("useHistory", () => {
	it("初期値が設定される", () => {
		const { result } = renderHook(() => useHistory({ count: 0 }));
		expect(result.current.state).toEqual({ count: 0 });
	});

	it("setState で状態が更新される", () => {
		const { result } = renderHook(() => useHistory({ count: 0 }));
		act(() => result.current.setState({ count: 1 }));
		expect(result.current.state).toEqual({ count: 1 });
	});

	it("undo で前の状態に戻る", () => {
		const { result } = renderHook(() => useHistory({ count: 0 }));
		act(() => result.current.setState({ count: 1 }));
		act(() => result.current.setState({ count: 2 }));
		act(() => result.current.undo());
		expect(result.current.state).toEqual({ count: 1 });
	});

	it("redo で元に戻した状態を再適用する", () => {
		const { result } = renderHook(() => useHistory({ count: 0 }));
		act(() => result.current.setState({ count: 1 }));
		act(() => result.current.setState({ count: 2 }));
		act(() => result.current.undo());
		act(() => result.current.redo());
		expect(result.current.state).toEqual({ count: 2 });
	});

	it("undo 後に setState すると redo 履歴がクリアされる", () => {
		const { result } = renderHook(() => useHistory({ count: 0 }));
		act(() => result.current.setState({ count: 1 }));
		act(() => result.current.setState({ count: 2 }));
		act(() => result.current.undo());
		act(() => result.current.setState({ count: 3 }));
		act(() => result.current.redo());
		// redo 履歴がクリアされているので変わらない
		expect(result.current.state).toEqual({ count: 3 });
	});

	it("履歴がない状態で undo しても変わらない", () => {
		const { result } = renderHook(() => useHistory({ count: 0 }));
		act(() => result.current.undo());
		expect(result.current.state).toEqual({ count: 0 });
	});

	it("redo 履歴がない状態で redo しても変わらない", () => {
		const { result } = renderHook(() => useHistory({ count: 0 }));
		act(() => result.current.setState({ count: 1 }));
		act(() => result.current.redo());
		expect(result.current.state).toEqual({ count: 1 });
	});

	it("canUndo / canRedo が正しく返る", () => {
		const { result } = renderHook(() => useHistory({ count: 0 }));
		expect(result.current.canUndo).toBe(false);
		expect(result.current.canRedo).toBe(false);

		act(() => result.current.setState({ count: 1 }));
		expect(result.current.canUndo).toBe(true);
		expect(result.current.canRedo).toBe(false);

		act(() => result.current.undo());
		expect(result.current.canUndo).toBe(false);
		expect(result.current.canRedo).toBe(true);
	});

	it("updater 関数で setState できる", () => {
		const { result } = renderHook(() => useHistory({ count: 0 }));
		act(() =>
			result.current.setState((prev) => ({ count: prev.count + 1 })),
		);
		expect(result.current.state).toEqual({ count: 1 });
	});

	it("最大履歴数を超えると古い履歴が削除される", () => {
		const { result } = renderHook(() =>
			useHistory({ count: 0 }, { maxHistory: 3 }),
		);
		act(() => result.current.setState({ count: 1 }));
		act(() => result.current.setState({ count: 2 }));
		act(() => result.current.setState({ count: 3 }));
		act(() => result.current.setState({ count: 4 }));

		// 3回分しか戻れない
		act(() => result.current.undo());
		act(() => result.current.undo());
		act(() => result.current.undo());
		expect(result.current.state).toEqual({ count: 1 });
		act(() => result.current.undo());
		// これ以上戻れない
		expect(result.current.state).toEqual({ count: 1 });
	});
});
