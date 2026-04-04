import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStage, saveStage } from "../../stores/creator-store";
import type { CreatorGroup, CreatorGroupType, CreatorStage } from "../../types";
import { TargetGrid } from "../target-grid";
import { Timeline } from "../timeline";

type Props = {
	stageId: string;
	onBack: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const StageEditor = ({ stageId, onBack }: Props) => {
	const [stage, setStage] = useState<CreatorStage | null>(
		() => getStage(stageId) ?? null,
	);
	const [selectedGroupIdx, setSelectedGroupIdx] = useState<number | null>(null);

	const updateStage = useCallback(
		(updater: (s: CreatorStage) => CreatorStage) => {
			setStage((prev) => {
				if (!prev) return prev;
				const next = updater(prev);
				saveStage(next);
				return next;
			});
		},
		[],
	);

	const addGroup = useCallback(
		(type: CreatorGroupType) => {
			updateStage((s) => ({
				...s,
				groups: [
					...s.groups,
					{
						id: crypto.randomUUID(),
						type,
						targets: type === "targets" ? [] : undefined,
						balloons: type === "balloons" ? [] : undefined,
						train:
							type === "train"
								? {
										direction: 1,
										speed: 2.0,
										slotsOscillate: false,
										slots: [],
									}
								: undefined,
					},
				],
			}));
		},
		[updateStage],
	);

	const deleteGroup = useCallback(
		(idx: number) => {
			updateStage((s) => ({
				...s,
				groups: s.groups.filter((_, i) => i !== idx),
			}));
			if (selectedGroupIdx === idx) setSelectedGroupIdx(null);
		},
		[updateStage, selectedGroupIdx],
	);

	const updateGroup = useCallback(
		(idx: number, group: CreatorGroup) => {
			updateStage((s) => ({
				...s,
				groups: s.groups.map((g, i) => (i === idx ? group : g)),
			}));
		},
		[updateStage],
	);

	const handleNameChange = useCallback(
		(name: string) => {
			updateStage((s) => ({ ...s, name }));
		},
		[updateStage],
	);

	if (!stage) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#f5f0e8]">
				<p className="text-amber-900/60">ステージが見つかりません</p>
			</div>
		);
	}

	const selectedGroup =
		selectedGroupIdx !== null ? stage.groups[selectedGroupIdx] : null;

	return (
		<div className="flex min-h-screen flex-col bg-[#f5f0e8]">
			{/* ヘッダー */}
			<div className="border-b border-amber-900/10 bg-white/80 px-4 py-3">
				<div className="mx-auto flex max-w-4xl items-center gap-4">
					<button
						type="button"
						className="font-medium text-amber-900/60 text-sm hover:text-amber-900"
						onClick={onBack}
					>
						← 一覧
					</button>
					<Input
						value={stage.name}
						onChange={(e) => handleNameChange(e.target.value)}
						className="max-w-xs border-amber-900/15 font-bold text-amber-900"
						style={rf}
					/>
					<span className="text-amber-900/40 text-xs">
						{stage.groups.length} グループ
					</span>
				</div>
			</div>

			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
				{/* タイムライン */}
				<Timeline
					groups={stage.groups}
					selectedIdx={selectedGroupIdx}
					onSelect={setSelectedGroupIdx}
					onDelete={deleteGroup}
					onAdd={addGroup}
				/>

				{/* エディター領域 */}
				{selectedGroup ? (
					<div className="flex-1 rounded-2xl border-2 border-amber-900/10 bg-white p-4">
						<Tabs value={selectedGroup.type}>
							<TabsList>
								<TabsTrigger value="targets">的</TabsTrigger>
								<TabsTrigger value="balloons">風船</TabsTrigger>
								<TabsTrigger value="train">列車</TabsTrigger>
							</TabsList>
							<TabsContent value="targets">
								{selectedGroup.type === "targets" &&
									selectedGroupIdx !== null && (
										<TargetGrid
											targets={selectedGroup.targets ?? []}
											onChange={(targets) =>
												updateGroup(selectedGroupIdx, {
													...selectedGroup,
													targets,
												})
											}
										/>
									)}
							</TabsContent>
							<TabsContent value="balloons">
								<p className="py-8 text-center text-amber-900/40">
									風船エディター（Phase 4 で実装）
								</p>
							</TabsContent>
							<TabsContent value="train">
								<p className="py-8 text-center text-amber-900/40">
									列車エディター（Phase 4 で実装）
								</p>
							</TabsContent>
						</Tabs>
					</div>
				) : (
					<div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-amber-900/10">
						<p className="text-amber-900/30" style={rf}>
							グループを選択するか、追加してください
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
