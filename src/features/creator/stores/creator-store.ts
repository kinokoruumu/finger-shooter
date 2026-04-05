import type { CreatorStage, RoundConfig } from "../types";

const STAGES_KEY = "matate-creator-stages";
const ROUND_CONFIG_KEY = "matate-round-config";

// --- ステージ CRUD ---

export const getStages = (): CreatorStage[] => {
	const raw = localStorage.getItem(STAGES_KEY);
	if (!raw) return [];
	return JSON.parse(raw) as CreatorStage[];
};

export const getStage = (id: string): CreatorStage | undefined => {
	return getStages().find((s) => s.id === id);
};

export const saveStage = (stage: CreatorStage): void => {
	const stages = getStages();
	const idx = stages.findIndex((s) => s.id === stage.id);
	if (idx >= 0) {
		stages[idx] = { ...stage, updatedAt: Date.now() };
	} else {
		stages.push({ ...stage, createdAt: Date.now(), updatedAt: Date.now() });
	}
	localStorage.setItem(STAGES_KEY, JSON.stringify(stages));
};

export const deleteStage = (id: string): void => {
	const stages = getStages().filter((s) => s.id !== id);
	localStorage.setItem(STAGES_KEY, JSON.stringify(stages));
};

export const duplicateStage = (id: string): CreatorStage | undefined => {
	const original = getStage(id);
	if (!original) return undefined;
	const newStage: CreatorStage = {
		...original,
		id: crypto.randomUUID(),
		name: `${original.name} (コピー)`,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	saveStage(newStage);
	return newStage;
};

export const createNewStage = (name: string): CreatorStage => {
	const stage: CreatorStage = {
		id: crypto.randomUUID(),
		name,
		groups: [],
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	saveStage(stage);
	return stage;
};

// --- JSON エクスポート/インポート ---

export const exportStageJson = (stage: CreatorStage): string => {
	return JSON.stringify(stage, null, 2);
};

export const importStageJson = (json: string): CreatorStage => {
	const stage = JSON.parse(json) as CreatorStage;
	stage.id = crypto.randomUUID();
	stage.createdAt = Date.now();
	stage.updatedAt = Date.now();
	saveStage(stage);
	return stage;
};

// --- ラウンド構成 ---

export const getRoundConfig = (): RoundConfig => {
	const raw = localStorage.getItem(ROUND_CONFIG_KEY);
	if (!raw) return { round1: null, round2: null, round3: null };
	return JSON.parse(raw) as RoundConfig;
};

export const saveRoundConfig = (config: RoundConfig): void => {
	localStorage.setItem(ROUND_CONFIG_KEY, JSON.stringify(config));
};
