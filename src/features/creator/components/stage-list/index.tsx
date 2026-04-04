import { useCallback, useRef, useState } from "react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	createNewStage,
	deleteStage,
	duplicateStage,
	exportStageJson,
	getStages,
	importStageJson,
} from "../../stores/creator-store";
import type { CreatorStage } from "../../types";

type Props = {
	onEdit: (id: string) => void;
};

const rf = { fontFamily: '"Rounded Mplus 1c", sans-serif' };

export const StageList = ({ onEdit }: Props) => {
	const [stages, setStages] = useState<CreatorStage[]>(() => getStages());
	const [newName, setNewName] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const refresh = useCallback(() => setStages(getStages()), []);

	const handleCreate = useCallback(() => {
		if (!newName.trim()) return;
		const stage = createNewStage(newName.trim());
		setNewName("");
		setDialogOpen(false);
		refresh();
		onEdit(stage.id);
	}, [newName, onEdit, refresh]);

	const handleDelete = useCallback(
		(id: string) => {
			deleteStage(id);
			refresh();
		},
		[refresh],
	);

	const handleDuplicate = useCallback(
		(id: string) => {
			duplicateStage(id);
			refresh();
		},
		[refresh],
	);

	const handleExport = useCallback((stage: CreatorStage) => {
		const json = exportStageJson(stage);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${stage.name}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}, []);

	const handleImport = useCallback(() => {
		fileRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				importStageJson(reader.result as string);
				refresh();
			};
			reader.readAsText(file);
			e.target.value = "";
		},
		[refresh],
	);

	return (
		<div className="flex min-h-screen flex-col bg-[#f5f0e8]">
			<div className="mx-auto w-full max-w-2xl px-4 py-8">
				<h1
					className="mb-6 text-center font-black text-3xl text-amber-900"
					style={rf}
				>
					ステージクリエイター
				</h1>

				{/* アクションバー */}
				<div className="mb-6 flex gap-2">
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger
							className="rounded-xl bg-amber-800 px-6 py-2.5 font-bold text-amber-50 text-sm shadow-md transition-all hover:bg-amber-700 active:scale-[0.98]"
							style={rf}
						>
							新規作成
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle style={rf}>新しいステージ</DialogTitle>
							</DialogHeader>
							<div className="flex flex-col gap-4 pt-2">
								<Input
									placeholder="ステージ名"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleCreate()}
								/>
								<button
									type="button"
									className="rounded-xl bg-amber-800 px-6 py-2.5 font-bold text-amber-50 text-sm transition-all hover:bg-amber-700"
									style={rf}
									onClick={handleCreate}
								>
									作成
								</button>
							</div>
						</DialogContent>
					</Dialog>

					<button
						type="button"
						className="rounded-xl border-2 border-amber-900/15 bg-white px-6 py-2.5 font-bold text-amber-900/70 text-sm transition-all hover:bg-amber-50"
						style={rf}
						onClick={handleImport}
					>
						インポート
					</button>
					<input
						ref={fileRef}
						type="file"
						accept=".json"
						className="hidden"
						onChange={handleFileChange}
					/>
				</div>

				{/* ステージ一覧 */}
				{stages.length === 0 ? (
					<p className="py-12 text-center text-amber-900/40" style={rf}>
						ステージがありません
					</p>
				) : (
					<div className="flex flex-col gap-3">
						{stages.map((stage) => (
							<Card
								key={stage.id}
								className="cursor-pointer border-amber-900/10 transition-all hover:border-amber-900/25 hover:shadow-md"
								onClick={() => onEdit(stage.id)}
							>
								<CardHeader className="flex flex-row items-center justify-between py-4">
									<div>
										<CardTitle className="text-amber-900" style={rf}>
											{stage.name}
										</CardTitle>
										<CardDescription style={rf}>
											{stage.groups.length} グループ
										</CardDescription>
									</div>
									<div
										role="toolbar"
										className="flex gap-1"
										onClick={(e) => e.stopPropagation()}
										onKeyDown={(e) => e.stopPropagation()}
									>
										<ActionButton onClick={() => handleDuplicate(stage.id)}>
											複製
										</ActionButton>
										<ActionButton onClick={() => handleExport(stage)}>
											書出
										</ActionButton>
										<ActionButton
											variant="danger"
											onClick={() => handleDelete(stage.id)}
										>
											削除
										</ActionButton>
									</div>
								</CardHeader>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

const ActionButton = ({
	children,
	onClick,
	variant = "default",
}: {
	children: React.ReactNode;
	onClick: () => void;
	variant?: "default" | "danger";
}) => (
	<button
		type="button"
		className={cn(
			"rounded-lg px-3 py-1 text-xs font-medium transition-colors",
			variant === "danger"
				? "text-red-600 hover:bg-red-50"
				: "text-amber-900/60 hover:bg-amber-50",
		)}
		onClick={onClick}
	>
		{children}
	</button>
);
