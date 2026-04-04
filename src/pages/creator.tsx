import { useState } from "react";
import { StageEditor } from "@/features/creator/components/stage-editor";
import { StageList } from "@/features/creator/components/stage-list";

export const CreatorPage = () => {
	const [editingId, setEditingId] = useState<string | null>(null);

	if (editingId) {
		return (
			<StageEditor stageId={editingId} onBack={() => setEditingId(null)} />
		);
	}

	return <StageList onEdit={setEditingId} />;
};
