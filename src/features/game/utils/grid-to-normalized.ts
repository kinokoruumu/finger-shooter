/** グリッド座標(gx: 0-7, gy: 0-3)→正規化座標(0-1)に変換 */
export const gridToNormalized = (gx: number, gy: number): [number, number] => {
	const nx = 0.2 + (gx / 7) * 0.6;
	const ny = 0.2 + (gy / 3) * 0.55;
	return [nx, ny];
};
