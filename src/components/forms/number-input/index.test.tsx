import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NumberInput } from ".";

afterEach(cleanup);

const getInput = () => screen.getByRole("spinbutton") as HTMLInputElement;

describe("NumberInput", () => {
	it("外部値を表示する", () => {
		render(<NumberInput value={42} onChange={() => {}} />);
		expect(getInput().value).toBe("42");
	});

	it("入力した数値でonChangeが呼ばれる", () => {
		const onChange = vi.fn();
		render(<NumberInput value={100} onChange={onChange} />);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "200" } });
		expect(onChange).toHaveBeenCalledWith(200);
	});

	it("空文字にしても即座にonChangeは呼ばれない", () => {
		const onChange = vi.fn();
		render(<NumberInput value={100} onChange={onChange} />);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "" } });
		expect(onChange).not.toHaveBeenCalled();
		expect(input.value).toBe("");
	});

	it("空文字のままblurするとdefaultValue(0)でonChangeが呼ばれる", () => {
		const onChange = vi.fn();
		render(<NumberInput value={100} onChange={onChange} />);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "" } });
		fireEvent.blur(input);
		expect(onChange).toHaveBeenCalledWith(0);
	});

	it("カスタムdefaultValueでblur時に復元される", () => {
		const onChange = vi.fn();
		render(
			<NumberInput value={100} onChange={onChange} defaultValue={50} />,
		);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "" } });
		fireEvent.blur(input);
		expect(onChange).toHaveBeenCalledWith(50);
	});

	it("minを下回る値はminにクランプされる", () => {
		const onChange = vi.fn();
		render(<NumberInput value={10} onChange={onChange} min={5} />);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "2" } });
		expect(onChange).toHaveBeenCalledWith(5);
	});

	it("maxを上回る値はmaxにクランプされる", () => {
		const onChange = vi.fn();
		render(<NumberInput value={10} onChange={onChange} max={20} />);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "30" } });
		expect(onChange).toHaveBeenCalledWith(20);
	});

	it("'-'の入力中はonChangeが呼ばれない", () => {
		const onChange = vi.fn();
		render(<NumberInput value={0} onChange={onChange} />);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "-" } });
		expect(onChange).not.toHaveBeenCalled();
	});

	it("無効な文字列ではonChangeが呼ばれない", () => {
		const onChange = vi.fn();
		render(<NumberInput value={0} onChange={onChange} />);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "abc" } });
		expect(onChange).not.toHaveBeenCalled();
	});

	it("無効な文字列でblurするとdefaultValueに戻る", () => {
		const onChange = vi.fn();
		render(<NumberInput value={0} onChange={onChange} />);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "abc" } });
		fireEvent.blur(input);
		expect(onChange).toHaveBeenCalledWith(0);
	});

	it("focus → 有効な値入力 → blurでdefaultValueに戻らない", () => {
		const onChange = vi.fn();
		render(<NumberInput value={100} onChange={onChange} />);
		const input = getInput();
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "200" } });
		fireEvent.blur(input);
		// onChangeは入力時のみ呼ばれ、blurでは呼ばれない
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith(200);
	});
});
