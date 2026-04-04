import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getStage, saveStage } from "../../stores/creator-store";
import type { CreatorGroup, CreatorStage } from "../../types";
import { AnimationEditor } from "../animation-editor";
import { EditorCanvas } from "../editor-canvas";
import { EditorToolbar, type EditorMode } from "../editor-toolbar";
import { usePreviewPlayer } from "../preview-player/hooks";
import { PreviewScene } from "../preview-player/internal/preview-scene";
import { Timeline } from "../timeline";

type Props = {
	stageId: string;
	onBack: () => void;
};

type EditorTab = "placement" | "animation";

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const TAB_ITEMS: { key: EditorTab; label: string }[] = [
	{ key: "placement", label: "配置" },
	{ key: "animation", label: "アニメーション" },
];

export const StageEditor = ({ stageId, onBack }: Props) => {
	const [stage, setStage] = useState<CreatorStage | null>(() => {
		const loaded = getStage(stageId) ?? null;
		if (loaded && loaded.groups.length === 0) {
			const initialGroup: CreatorGroup = {
				id: crypto.randomUUID(),
				type: "targets",
				targets: [],
				steps: [{ targetIds: [], interval: 100 }],
				stepDelay: 300,
			};
			const updated = { ...loaded, groups: [initialGroup] };
			saveStage(updated);
			return updated;
		}
		return loaded;
	});
	const [selectedGroupIdx, setSelectedGroupIdx] = useState<number | null>(
		() => {
			const loaded = getStage(stageId);
			return loaded && loaded.groups.length > 0 ? 0 : null;
		},
	);
	const [activeTab, setActiveTab] = useState<EditorTab>("placement");
	const [editorMode, setEditorMode] = useState<EditorMode>("ground");

	// 全体プレビュー
	const stagePreview = usePreviewPlayer(stage ?? {
		id: "",
		name: "",
		groups: [],
		createdAt: 0,
		updatedAt: 0,
	});
	const isStagePreviewPlaying = stagePreview.state === "playing";

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
		(type: CreatorGroup["type"]) => {
			let newIndex = 0;
			updateStage((s) => {
				const newGroup: CreatorGroup =
					type === "targets"
						? {
								id: crypto.randomUUID(),
								type: "targets",
								targets: [],
								steps: [{ targetIds: [], interval: 100 }],
								stepDelay: 300,
							}
						: type === "balloons"
							? {
									id: crypto.randomUUID(),
									type: "balloons",
									balloons: [],
									steps: [{ targetIds: [], interval: 100 }],
									stepDelay: 300,
								}
							: {
									id: crypto.randomUUID(),
									type: "train",
									train: {
										direction: 1,
										speed: 2.0,
										slotsOscillate: false,
										slots: [],
									},
								};

				const newGroups = [...s.groups, newGroup];
				newIndex = newGroups.length - 1;
				return { ...s, groups: newGroups };
			});
			setSelectedGroupIdx(newIndex);
			setActiveTab("placement");
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

	const handleCellClick = useCallback(
		(gx: number, gy: number) => {
			if (selectedGroupIdx === null || activeTab !== "placement") return;
			const group = stage?.groups[selectedGroupIdx];
			if (!group || group.type !== "targets") return;

			const existing = group.targets.find(
				(t) => t.gx === gx && t.gy === gy,
			);

			if (editorMode === "delete") {
				if (!existing) return;
				const newTargets = group.targets.filter(
					(t) => !(t.gx === gx && t.gy === gy),
				);
				const newSteps = group.steps.map((s) => ({
					...s,
					targetIds: s.targetIds.filter((id) => id !== existing.id),
				}));
				updateGroup(selectedGroupIdx, {
					...group,
					targets: newTargets,
					steps: newSteps,
				});
				return;
			}

			if (existing) {
				if (existing.type === editorMode) return;
				updateGroup(selectedGroupIdx, {
					...group,
					targets: group.targets.map((t) =>
						t.id === existing.id ? { ...t, type: editorMode } : t,
					),
				});
			} else {
				const newTarget = {
					id: crypto.randomUUID(),
					gx,
					gy,
					type: editorMode,
					visibleDuration: 4.0,
				};
				updateGroup(selectedGroupIdx, {
					...group,
					targets: [...group.targets, newTarget],
				});
			}
		},
		[selectedGroupIdx, activeTab, stage, editorMode, updateGroup],
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
					<div className="ml-auto">
						{!isStagePreviewPlaying ? (
							<Button
								onClick={stagePreview.play}
								size="sm"
								className="bg-amber-900 font-bold text-white hover:bg-amber-800"
								style={rf}
								disabled={stagePreview.spawns.length === 0}
							>
								▶ 全体プレビュー
							</Button>
						) : (
							<Button
								onClick={stagePreview.stop}
								size="sm"
								variant="outline"
								style={rf}
							>
								■ 停止
							</Button>
						)}
					</div>
				</div>
			</div>

			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
				{/* 全体プレビュー中 */}
				{isStagePreviewPlaying ? (
					<div className="space-y-3">
						<EditorCanvas
							targets={[]}
							onCellClick={() => {}}
							onCellRightClick={() => {}}
							showGrid={false}
						>
							<PreviewScene
								spawns={stagePreview.spawns}
								elapsedMs={stagePreview.elapsedMs}
								isPlaying={isStagePreviewPlaying}
							/>
						</EditorCanvas>
						<p
							className="text-center text-amber-900/40 text-xs"
							style={rf}
						>
							{stagePreview.spawns.length}個のスポーン /{" "}
							{(stagePreview.elapsedMs / 1000).toFixed(1)}s
						</p>
					</div>
				) : (
					<>
						{/* エディター領域 */}
						{selectedGroup ? (
							<div className="space-y-4">
								{selectedGroup.type === "targets" && (
									<div className="flex gap-1 rounded-lg bg-amber-100/50 p-1">
										{TAB_ITEMS.map((tab) => (
											<button
												key={tab.key}
												type="button"
												className={cn(
													"flex-1 rounded-md px-4 py-1.5 text-sm font-bold transition-all",
													activeTab === tab.key
														? "bg-white text-amber-900 shadow-sm"
														: "text-amber-900/40 hover:text-amber-900/60",
												)}
												style={rf}
												onClick={() =>
													setActiveTab(tab.key)
												}
											>
												{tab.label}
											</button>
										))}
									</div>
								)}

								{activeTab === "placement" &&
									selectedGroup.type === "targets" && (
										<div className="space-y-3">
											<EditorCanvas
												targets={selectedGroup.targets}
												onCellClick={handleCellClick}
												onCellRightClick={() => {}}
											/>
											<EditorToolbar
												currentMode={editorMode}
												onModeChange={setEditorMode}
												targetCount={
													selectedGroup.targets.length
												}
											/>
										</div>
									)}

								{activeTab === "animation" &&
									selectedGroup.type === "targets" &&
									selectedGroupIdx !== null && (
										<AnimationEditor
											group={selectedGroup}
											onUpdateGroup={(g) =>
												updateGroup(
													selectedGroupIdx,
													g,
												)
											}
										/>
									)}

								{selectedGroup.type === "balloons" && (
									<p
										className="py-16 text-center text-amber-900/40"
										style={rf}
									>
										風船エディター（Phase D で実装）
									</p>
								)}
								{selectedGroup.type === "train" && (
									<p
										className="py-16 text-center text-amber-900/40"
										style={rf}
									>
										列車エディター（Phase D で実装）
									</p>
								)}
							</div>
						) : (
							<div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-amber-900/10">
								<p className="text-amber-900/30" style={rf}>
									グループを選択するか、追加してください
								</p>
							</div>
						)}

						{/* タイムライン（下部） */}
						<Timeline
							groups={stage.groups}
							selectedIdx={selectedGroupIdx}
							onSelect={setSelectedGroupIdx}
							onDelete={deleteGroup}
							onAdd={addGroup}
						/>
					</>
				)}
			</div>
		</div>
	);
};
