import type { CreatorTarget } from "../types";

export type PresetType =
	| "all-at-once"
	| "top-to-bottom"
	| "bottom-to-top"
	| "left-to-right"
	| "right-to-left";

export const PRESET_LABELS: Record<PresetType, string> = {
	"all-at-once": "同時",
	"top-to-bottom": "上→下",
	"bottom-to-top": "下→上",
	"left-to-right": "左→右",
	"right-to-left": "右→左",
};

/**
 * プリセットに基づいて的のID順序を返す。
 * 同じ行/列の場合は副軸でソート。
 */
export const sortTargetsByPreset = (
	targets: CreatorTarget[],
	preset: PresetType,
): string[] => {
	if (targets.length === 0) return [];

	const sorted = [...targets];

	switch (preset) {
		case "all-at-once":
			// 順序不問（元の順序のまま）
			break;
		case "top-to-bottom":
			sorted.sort((a, b) => a.gy - b.gy || a.gx - b.gx);
			break;
		case "bottom-to-top":
			sorted.sort((a, b) => b.gy - a.gy || a.gx - b.gx);
			break;
		case "left-to-right":
			sorted.sort((a, b) => a.gx - b.gx || a.gy - b.gy);
			break;
		case "right-to-left":
			sorted.sort((a, b) => b.gx - a.gx || a.gy - b.gy);
			break;
	}

	return sorted.map((t) => t.id);
};

/** プリセットに応じたデフォルト間隔(ms) */
export const getPresetInterval = (preset: PresetType): number => {
	return preset === "all-at-once" ? 0 : 100;
};
