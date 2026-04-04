import { useState } from "react";
import { StageList } from "@/features/creator/components/stage-list";

export const CreatorPage = () => {
	const [editingId, setEditingId] = useState<string | null>(null);

	if (editingId) {
		// Phase 2 で実装
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#f5f0e8]">
				<div className="text-center">
					<p className="mb-4 text-amber-900/60">ステージエディター（実装中）</p>
					<button
						type="button"
						className="rounded-xl bg-amber-800 px-6 py-2.5 font-bold text-amber-50 text-sm"
						onClick={() => setEditingId(null)}
					>
						一覧に戻る
					</button>
				</div>
			</div>
		);
	}

	return <StageList onEdit={setEditingId} />;
};
