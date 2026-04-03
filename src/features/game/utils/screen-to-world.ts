import * as THREE from "three";

/**
 * 正規化されたスクリーン座標 (0-1) を 3Dワールド座標に変換する。
 * カメラの視錐台を使って特定のz平面上の座標を算出。
 */
export const createScreenToWorld = (camera: THREE.PerspectiveCamera) => {
	const vec = new THREE.Vector3();

	return (
		nx: number,
		ny: number,
		targetZ: number,
	): [number, number, number] => {
		vec.set(nx * 2 - 1, -(ny * 2 - 1), 0.5);
		vec.unproject(camera);
		vec.sub(camera.position).normalize();

		const dist = (targetZ - camera.position.z) / vec.z;
		const worldPos = camera.position.clone().add(vec.multiplyScalar(dist));

		return [worldPos.x, worldPos.y, worldPos.z];
	};
};
