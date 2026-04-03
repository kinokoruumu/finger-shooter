/**
 * 3Dワールド座標間の距離でヒット判定（XY平面のみ）
 */
export const checkHit3D = (
	aimWorld: [number, number, number],
	targetWorld: [number, number, number],
	hitRadius: number,
): boolean => {
	const dx = aimWorld[0] - targetWorld[0];
	const dy = aimWorld[1] - targetWorld[1];
	return dx * dx + dy * dy < hitRadius * hitRadius;
};
