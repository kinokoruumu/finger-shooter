import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStage, saveStage } from "../../stores/creator-store";
import type { CreatorGroup, CreatorStage } from "../../types";
import { BalloonEntryDialog } from "../balloon-entry-dialog";
import {
	EditorCanvasWrapper,
	EditorScene,
} from "../editor-canvas";
import { usePreviewPlayer } from "../preview-player/hooks";
import { PreviewScene } from "../preview-player/internal/preview-scene";
import { StageTimeline } from "../stage-timeline";
import { TargetStepDialog } from "../target-step-dialog";
import { Timeline } from "../timeline";
import { TrainEditor } from "../train-editor";

type Props = {
	stageId: string;
	onBack: () => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

const createEmptyGroup = (): CreatorGroup => ({
	id: crypto.randomUUID(),
	targets: [],
	targetSteps: [{ targetIds: [], interval: 100 }],
	targetStepDelay: 300,
	balloonEntries: [],
	train: null,
	trainStartTime: null,
});

export const StageEditor = ({ stageId, onBack }: Props) => {
	const [stage, setStage] = useState<CreatorStage | null>(() => {
		const loaded = getStage(stageId) ?? null;
		if (loaded && loaded.groups.length === 0) {
			const updated = { ...loaded, groups: [createEmptyGroup()] };
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
	const [targetDialogOpen, setTargetDialogOpen] = useState(false);
	const [editingBalloonId, setEditingBalloonId] = useState<string | null>(null);
	const [trainDialogOpen, setTrainDialogOpen] = useState(false);

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

	// プレビュー
	const selectedGroup =
		selectedGroupIdx !== null
			? (stage?.groups[selectedGroupIdx] ?? null)
			: null;

	const groupPreview = usePreviewPlayer(
		selectedGroup ?? createEmptyGroup(),
	);
	const stagePreview = usePreviewPlayer(
		stage ?? { id: "", name: "", groups: [], createdAt: 0, updatedAt: 0 },
	);

	const isGroupPreviewPlaying = groupPreview.state === "playing";
	const isStagePreviewPlaying = stagePreview.state === "playing";
	const isAnyPreviewPlaying =
		isGroupPreviewPlaying || isStagePreviewPlaying;

	const activePreviewSpawns = isStagePreviewPlaying
		? stagePreview.spawns
		: isGroupPreviewPlaying
			? groupPreview.spawns
			: null;

	if (!stage) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#f5f0e8]">
				<p className="text-amber-900/60">ステージが見つかりません</p>
			</div>
		);
	}

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
					<div className="ml-auto flex gap-2">
						{isAnyPreviewPlaying ? (
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
						) : (
							<>
								{selectedGroup && (
									<Button
										onClick={groupPreview.play}
										size="sm"
										variant="outline"
										style={rf}
										disabled={
											groupPreview.spawns.length === 0
										}
									>
										▶ グループ
									</Button>
								)}
								<Button
									onClick={stagePreview.play}
									size="sm"
									className="bg-amber-900 font-bold text-white hover:bg-amber-800"
									style={rf}
									disabled={
										stagePreview.spawns.length === 0
									}
								>
									▶ 全体
								</Button>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4">
				{/* Canvas（プレビュー兼） */}
				{selectedGroup && (
					<EditorCanvasWrapper>
						{isAnyPreviewPlaying && activePreviewSpawns ? (
							<>
								<ambientLight intensity={0.6} />
								<directionalLight
									position={[5, 10, 5]}
									intensity={0.8}
								/>
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
						) : (
							<EditorScene
								targets={selectedGroup.targets}
								onCellClick={() => {}}
								onCellRightClick={() => {}}
								showGrid={false}
							/>
						)}
					</EditorCanvasWrapper>
				)}

				{/* 選択グループの編集 */}
				{selectedGroup && selectedGroupIdx !== null && !isAnyPreviewPlaying && (
					<div className="space-y-4">
						{/* タイムライン */}
						<StageTimeline
							group={selectedGroup}
							onUpdateGroup={(g) =>
								updateGroup(selectedGroupIdx, g)
							}
							onEditTargets={() => setTargetDialogOpen(true)}
							onEditBalloon={(id) => setEditingBalloonId(id)}
							onEditTrain={() => setTrainDialogOpen(true)}
						/>
					</div>
				)}

				{!selectedGroup && !isAnyPreviewPlaying && (
					<div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-amber-900/10">
						<p className="text-amber-900/30" style={rf}>
							グループを選択するか、追加してください
						</p>
					</div>
				)}

				{/* グループ選択（下部） */}
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

			{/* 的編集ダイアログ */}
			{selectedGroup && selectedGroupIdx !== null && (
				<TargetStepDialog
					open={targetDialogOpen}
					onClose={() => setTargetDialogOpen(false)}
					group={selectedGroup}
					onUpdateGroup={(g) => updateGroup(selectedGroupIdx, g)}
				/>
			)}

			{/* 風船編集ダイアログ */}
			{selectedGroup &&
				selectedGroupIdx !== null &&
				editingBalloonId && (() => {
					const entry = (selectedGroup.balloonEntries ?? []).find(
						(e) => e.id === editingBalloonId,
					);
					if (!entry) return null;
					return (
						<BalloonEntryDialog
							open
							onClose={() => setEditingBalloonId(null)}
							entry={entry}
							onUpdate={(updated) =>
								updateGroup(selectedGroupIdx, {
									...selectedGroup,
									balloonEntries: (
										selectedGroup.balloonEntries ?? []
									).map((e) =>
										e.id === updated.id ? updated : e,
									),
								})
							}
							onDelete={() => {
								updateGroup(selectedGroupIdx, {
									...selectedGroup,
									balloonEntries: (
										selectedGroup.balloonEntries ?? []
									).filter(
										(e) => e.id !== editingBalloonId,
									),
								});
								setEditingBalloonId(null);
							}}
						/>
					);
				})()}

			{/* 列車編集ダイアログ */}
			{selectedGroup && selectedGroupIdx !== null && (
				<TrainEditor
					open={trainDialogOpen}
					onClose={() => setTrainDialogOpen(false)}
					group={selectedGroup}
					onUpdateGroup={(g) => updateGroup(selectedGroupIdx, g)}
				/>
			)}
		</div>
	);
};
