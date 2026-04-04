import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { CreatorBalloon, CreatorGroup } from "../../types";

type Props = {
	group: CreatorGroup;
	onUpdateGroup: (group: CreatorGroup) => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const BalloonEditor = ({ group, onUpdateGroup }: Props) => {
	const balloons = group.balloons ?? [];

	const handleAdd = useCallback(() => {
		const newBalloon: CreatorBalloon = {
			id: crypto.randomUUID(),
			nx: 0.5,
			speed: 3,
			color: "#44aaff",
		};
		onUpdateGroup({
			...group,
			balloons: [...balloons, newBalloon],
		});
	}, [group, balloons, onUpdateGroup]);

	const handleRemove = useCallback(
		(id: string) => {
			onUpdateGroup({
				...group,
				balloons: balloons.filter((b) => b.id !== id),
				steps: group.steps.map((s) => ({
					...s,
					targetIds: s.targetIds.filter((tid) => tid !== id),
				})),
			});
		},
		[group, balloons, onUpdateGroup],
	);

	const handleUpdate = useCallback(
		(id: string, update: Partial<CreatorBalloon>) => {
			onUpdateGroup({
				...group,
				balloons: balloons.map((b) =>
					b.id === id ? { ...b, ...update } : b,
				),
			});
		},
		[group, balloons, onUpdateGroup],
	);

	return (
		<div className="space-y-3" style={rf}>
			<div className="flex items-center justify-between">
				<span className="font-bold text-amber-900 text-sm">
					風船
				</span>
				<Button
					size="sm"
					className="bg-sky-500 text-white hover:bg-sky-600"
					onClick={handleAdd}
				>
					+ 風船追加
				</Button>
			</div>

			{balloons.length === 0 ? (
				<p className="py-3 text-center text-amber-900/30 text-xs">
					風船がありません
				</p>
			) : (
				<div className="space-y-2">
					{balloons.map((b, i) => (
						<div
							key={b.id}
							className="flex items-center gap-3 rounded-lg border border-amber-900/10 bg-white p-3"
						>
							<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-sky-400 text-[10px] font-bold text-white">
								{i + 1}
							</span>

							<div className="flex flex-1 items-center gap-2">
								<span className="shrink-0 text-amber-900/50 text-xs">
									横位置
								</span>
								<Slider
									value={[b.nx * 100]}
									min={10}
									max={90}
									step={5}
									onValueChange={(val) => {
										const v = Array.isArray(val) ? val[0] : val;
										handleUpdate(b.id, { nx: v / 100 });
									}}
									className="flex-1"
								/>
								<span className="w-10 text-right font-mono text-amber-900/50 text-[10px]">
									{Math.round(b.nx * 100)}%
								</span>
							</div>

							<div className="flex items-center gap-2">
								<span className="shrink-0 text-amber-900/50 text-xs">
									速度
								</span>
								<Input
									type="number"
									value={b.speed}
									onChange={(e) =>
										handleUpdate(b.id, {
											speed: Math.max(0.5, Number(e.target.value)),
										})
									}
									className="h-7 w-16 border-amber-900/15 text-center text-xs"
									min={0.5}
									max={10}
									step={0.5}
								/>
							</div>

							<button
								type="button"
								className="text-xs text-amber-900/20 transition-colors hover:text-red-500"
								onClick={() => handleRemove(b.id)}
							>
								削除
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
