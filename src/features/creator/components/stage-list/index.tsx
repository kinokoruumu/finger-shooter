import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
						<DialogTrigger asChild>
							<Button
								className="rounded-xl bg-amber-900 px-6 py-2.5 font-bold text-white shadow-md hover:bg-amber-800"
								style={rf}
							>
								新規作成
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-sm">
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
								<Button
									className="rounded-xl bg-amber-900 px-6 py-2.5 font-bold text-white hover:bg-amber-800"
									style={rf}
									onClick={handleCreate}
								>
									作成
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					<Button
						variant="outline"
						className="rounded-xl border-2 border-amber-900/30 px-6 py-2.5 font-bold text-amber-900 hover:bg-amber-100"
						style={rf}
						onClick={handleImport}
					>
						インポート
					</Button>
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
								className="border-amber-900/10 transition-all hover:border-amber-900/25 hover:shadow-md"
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
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											className="bg-amber-900 font-bold text-white hover:bg-amber-800"
											style={rf}
											onClick={() => onEdit(stage.id)}
										>
											編集
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													size="icon-sm"
													className="border-amber-900/20 text-amber-900/60 hover:bg-amber-50"
												>
													...
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => handleDuplicate(stage.id)}
												>
													複製
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => handleExport(stage)}>
													JSONエクスポート
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-red-600 focus:text-red-600"
													onClick={() => handleDelete(stage.id)}
												>
													削除
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
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
