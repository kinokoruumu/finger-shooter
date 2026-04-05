import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DraggableBar } from ".";

afterEach(cleanup);

const defaultProps = {
	x: 100,
	width: 60,
	color: "bg-sky-400",
	activeColor: "bg-sky-600",
	label: "テスト",
	trackHeight: 44,
};

describe("DraggableBar", () => {
	describe("クリック", () => {
		it("クリックで onClick が呼ばれる", () => {
			const onClick = vi.fn();
			render(<DraggableBar {...defaultProps} onClick={onClick} />);

			fireEvent.click(screen.getByTestId("draggable-bar"));
			expect(onClick).toHaveBeenCalledOnce();
		});

		it("ドラッグ後のクリックでは onClick が呼ばれない", () => {
			const onClick = vi.fn();
			const onDrag = vi.fn();
			render(
				<DraggableBar {...defaultProps} onClick={onClick} onDrag={onDrag} />,
			);

			const bar = screen.getByTestId("draggable-bar");

			// pointerdown → pointermove（3px以上）→ pointerup → click
			fireEvent.pointerDown(bar, { clientX: 100 });
			fireEvent(window, new PointerEvent("pointermove", { clientX: 110 }));
			fireEvent(window, new PointerEvent("pointerup"));
			fireEvent.click(bar);

			expect(onClick).not.toHaveBeenCalled();
		});
	});

	describe("ドラッグ移動", () => {
		it("pointerdown → pointermove で onDrag が累積 delta で呼ばれる", () => {
			const onDrag = vi.fn();
			const onDragStart = vi.fn();
			render(
				<DraggableBar
					{...defaultProps}
					onDragStart={onDragStart}
					onDrag={onDrag}
				/>,
			);

			const bar = screen.getByTestId("draggable-bar");

			fireEvent.pointerDown(bar, { clientX: 200 });
			expect(onDragStart).toHaveBeenCalledOnce();

			// 右に50px移動
			fireEvent(window, new PointerEvent("pointermove", { clientX: 250 }));
			expect(onDrag).toHaveBeenCalledWith(50, "move");

			// さらに右に30px（開始からは80px）
			fireEvent(window, new PointerEvent("pointermove", { clientX: 280 }));
			expect(onDrag).toHaveBeenCalledWith(80, "move");
		});

		it("pointerup で onDragEnd が呼ばれ、以降 pointermove は無視される", () => {
			const onDrag = vi.fn();
			const onDragEnd = vi.fn();
			render(
				<DraggableBar
					{...defaultProps}
					onDrag={onDrag}
					onDragEnd={onDragEnd}
				/>,
			);

			const bar = screen.getByTestId("draggable-bar");

			fireEvent.pointerDown(bar, { clientX: 200 });
			fireEvent(window, new PointerEvent("pointermove", { clientX: 250 }));
			fireEvent(window, new PointerEvent("pointerup"));

			expect(onDragEnd).toHaveBeenCalledOnce();

			onDrag.mockClear();
			fireEvent(window, new PointerEvent("pointermove", { clientX: 300 }));
			expect(onDrag).not.toHaveBeenCalled();
		});
	});

	describe("リサイズ", () => {
		it("右端ハンドルのドラッグで mode=resize-right が渡される", () => {
			const onDrag = vi.fn();
			render(<DraggableBar {...defaultProps} onDrag={onDrag} />);

			const handle = screen.getByTestId("resize-right-handle");

			fireEvent.pointerDown(handle, { clientX: 160 });
			fireEvent(window, new PointerEvent("pointermove", { clientX: 190 }));

			expect(onDrag).toHaveBeenCalledWith(30, "resize-right");
		});

		it("左端ハンドルのドラッグで mode=resize-left が渡される", () => {
			const onDrag = vi.fn();
			render(<DraggableBar {...defaultProps} onDrag={onDrag} />);

			const handle = screen.getByTestId("resize-left-handle");

			fireEvent.pointerDown(handle, { clientX: 100 });
			fireEvent(window, new PointerEvent("pointermove", { clientX: 80 }));

			expect(onDrag).toHaveBeenCalledWith(-20, "resize-left");
		});
	});
});
