import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<
	React.ComponentProps<typeof Input>,
	"value" | "onChange" | "type"
> & {
	value: number;
	onChange: (value: number) => void;
	defaultValue?: number;
};

/**
 * 編集中に空文字を許容する number input。
 * blur 時に空や無効値なら defaultValue（省略時 0）に戻す。
 */
export const NumberInput = ({
	value,
	onChange,
	defaultValue = 0,
	min,
	max,
	...rest
}: Props) => {
	const [editing, setEditing] = useState(false);
	const [text, setText] = useState("");

	const displayValue = editing ? text : String(value);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value;
			setText(raw);
			setEditing(true);

			if (raw === "" || raw === "-") return;

			let num = Number(raw);
			if (Number.isNaN(num)) return;

			const minVal = min != null ? Number(min) : undefined;
			const maxVal = max != null ? Number(max) : undefined;
			if (minVal != null) num = Math.max(minVal, num);
			if (maxVal != null) num = Math.min(maxVal, num);
			onChange(num);
		},
		[onChange, min, max],
	);

	const handleFocus = useCallback(() => {
		setEditing(true);
		setText(String(value));
	}, [value]);

	const handleBlur = useCallback(() => {
		setEditing(false);
		if (text === "" || Number.isNaN(Number(text))) {
			onChange(defaultValue);
		}
	}, [text, onChange, defaultValue]);

	return (
		<Input
			type="number"
			value={displayValue}
			onChange={handleChange}
			onFocus={handleFocus}
			onBlur={handleBlur}
			min={min}
			max={max}
			{...rest}
		/>
	);
};
