import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getStage, saveStage } from "../../stores/creator-store";
import type { CreatorGroup, CreatorStage } from "../../types";
import { AnimationEditor } from "../animation-editor";
import { useAnimationEditor } from "../animation-editor/hooks";
import {
	EditorCanvasWrapper,
	EditorScene,
} from "../editor-canvas";
import { EditorToolbar, type EditorMode } from "../editor-toolbar";
import { usePreviewPlayer } from "../preview-player/hooks";
import { PreviewScene } from "../preview-player/internal/preview-scene";
import { TrainEditor } from "../train-editor";
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

const createEmptyGroup = (): CreatorGroup => ({
	id: crypto.randomUUID(),
	targets: [],
	balloon: null,
	train: null,
	steps: [{ targetIds: [], targetInterval: 100, balloonCount: 0, balloonInterval: 500, trainStart: false }],
	stepDelay: 300,
});

export const StageEditor = ({ stageId, onBack }: Props) => {
	const [stage, setStage] = useState<CreatorStage | null>(() => {
		const loaded = getStage(stageId) ?? null;
		if (loaded && loaded.groups.length === 0) {
			const updated = {
				...loaded,
				groups: [createEmptyGroup()],
			};
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

	const addGroup = useCallback(() => {
		let newIndex = 0;
		updateStage((s) => {
			const newGroups = [...s.groups, createEmptyGroup()];
			newIndex = newGroups.length - 1;
			return { ...s, groups: newGroups };
		});
		setSelectedGroupIdx(newIndex);
		setActiveTab("placement");
	}, [updateStage]);

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

	const selectedGroup =
		selectedGroupIdx !== null
			? (stage?.groups[selectedGroupIdx] ?? null)
			: null;

	// グループプレビュー
	const groupPreview = usePreviewPlayer(
		selectedGroup ?? createEmptyGroup(),
	);
	const isGroupPreviewPlaying = groupPreview.state === "playing";

	// 全体プレビュー
	const stagePreview = usePreviewPlayer(
		stage ?? {
			id: "",
			name: "",
			groups: [],
			createdAt: 0,
			updatedAt: 0,
		},
	);
	const isStagePreviewPlaying = stagePreview.state === "playing";

	const isAnyPreviewPlaying =
		isGroupPreviewPlaying || isStagePreviewPlaying;

	// アニメーションエディター（Canvas シーン用の props を取得）
	const animEditor = useAnimationEditor(
		selectedGroup ?? createEmptyGroup(),
		(g) => {
			if (selectedGroupIdx !== null) updateGroup(selectedGroupIdx, g);
		},
	);

	const handleCellClick = useCallback(
		(gx: number, gy: number) => {
			if (selectedGroupIdx === null || activeTab !== "placement") return;
			const group = stage?.groups[selectedGroupIdx];
			if (!group) return;

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
					targetIds: s.targetIds.filter(
						(id) => id !== existing.id,
					),
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
						t.id === existing.id
							? { ...t, type: editorMode }
							: t,
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

	// --- Canvas シーンの内容を決定 ---
	const activePreviewSpawns = isStagePreviewPlaying
		? stagePreview.spawns
		: isGroupPreviewPlaying
			? groupPreview.spawns
			: null;

	const renderCanvasContent = () => {
		// プレビュー再生中
		if (activePreviewSpawns) {
			return (
				<>
					<ambientLight intensity={0.6} />
					<directionalLight position={[5, 10, 5]} intensity={0.8} />
					<PreviewScene
						spawns={activePreviewSpawns}
						isPlaying
						onComplete={
							isStagePreviewPlaying
								? stagePreview.onComplete
								: groupPreview.onComplete
						}
					/>
				</>
			);
		}

		// 通常エディター
		if (!selectedGroup) return null;

		if (activeTab === "animation") {
			return (
				<EditorScene
					targets={selectedGroup.targets}
					onCellClick={() => {}}
					onCellRightClick={() => {}}
					ghostTargetIds={animEditor.ghostTargetIds}
					disabledTargetIds={animEditor.disabledTargetIds}
					targetLabels={animEditor.targetLabels}
					onTargetClick={animEditor.handleTargetClick}
					showGrid={false}
				/>
			);
		}

		return (
			<EditorScene
				targets={selectedGroup.targets}
				onCellClick={handleCellClick}
				onCellRightClick={() => {}}
			/>
		);
	};

	return (
		<div className="flex min-h-screen flex-col bg-[#f5f0e8]">
			{/* ヘッダー */}
			<div className="border-b border-amber-900/10 bg-white/80 px-4 py-3">
				<div className="mx-auto flex max-w-6xl items-center gap-4">
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
								disabled={
									stagePreview.spawns.length === 0 ||
									isGroupPreviewPlaying
								}
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

			<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4">
				{/* Canvas — 常に1つだけ存在 */}
				{selectedGroup && (
					<EditorCanvasWrapper>
						{renderCanvasContent()}
					</EditorCanvasWrapper>
				)}

				{isAnyPreviewPlaying ? (
					<div className="flex items-center justify-center gap-3">
						<Button
							onClick={
								isStagePreviewPlaying
									? stagePreview.stop
									: groupPreview.stop
							}
							size="sm"
							variant="outline"
							style={rf}
						>
							■ 停止
						</Button>
						<span
							className="text-amber-900/40 text-xs"
							style={rf}
						>
							{(activePreviewSpawns ?? []).length}個のスポーン
						</span>
					</div>
				) : selectedGroup ? (
					<div className="space-y-4">
						{/* タブ切り替え */}
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
									onClick={() => setActiveTab(tab.key)}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* 配置タブ */}
						{activeTab === "placement" &&
							selectedGroupIdx !== null && (
								<div className="space-y-6">
									<EditorToolbar
										currentMode={editorMode}
										onModeChange={setEditorMode}
										targetCount={
											selectedGroup.targets.length
										}
									/>

									{/* 風船設定 */}
									<div className="space-y-2" style={rf}>
										<span className="font-bold text-amber-900 text-sm">
											風船
										</span>
										<div className="flex items-center gap-2">
											<span className="text-amber-900/50 text-xs">
												出現位置
											</span>
											{(
												[
													{
														value: "random",
														label: "ランダム",
													},
													{
														value: "left",
														label: "左寄り",
													},
													{
														value: "center",
														label: "中央",
													},
													{
														value: "right",
														label: "右寄り",
													},
												] as const
											).map((opt) => (
												<button
													key={opt.value}
													type="button"
													className={cn(
														"rounded-lg border-2 px-2 py-1 text-xs font-bold transition-all",
														(selectedGroup.balloon
															?.spread ??
															"random") ===
															opt.value
															? "border-sky-500 bg-sky-50 text-sky-700"
															: "border-amber-900/15 bg-white text-amber-900/50 hover:border-amber-900/30",
													)}
													onClick={() =>
														updateGroup(
															selectedGroupIdx,
															{
																...selectedGroup,
																balloon: {
																	spread: opt.value,
																},
															},
														)
													}
												>
													{opt.label}
												</button>
											))}
										</div>
										<p className="text-amber-900/30 text-[10px]">
											風船の個数はアニメーションタブのステップで設定
										</p>
									</div>

									<TrainEditor
										group={selectedGroup}
										onUpdateGroup={(g) =>
											updateGroup(selectedGroupIdx, g)
										}
									/>
								</div>
							)}

						{/* アニメーションタブ */}
						{activeTab === "animation" &&
							selectedGroupIdx !== null && (
								<AnimationEditor
									group={selectedGroup}
									animEditor={animEditor}
									isPreviewPlaying={isGroupPreviewPlaying}
									onPlay={groupPreview.play}
									onStop={groupPreview.stop}
									spawnCount={groupPreview.spawns.length}
								/>
							)}
					</div>
				) : (
					<div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-amber-900/10">
						<p className="text-amber-900/30" style={rf}>
							グループを選択するか、追加してください
						</p>
					</div>
				)}

				{/* タイムライン（プレビュー中は非表示） */}
				{!isAnyPreviewPlaying && (
					<Timeline
						groups={stage.groups}
						selectedIdx={selectedGroupIdx}
						onSelect={setSelectedGroupIdx}
						onDelete={deleteGroup}
						onAdd={addGroup}
					/>
				)}
			</div>
		</div>
	);
};
