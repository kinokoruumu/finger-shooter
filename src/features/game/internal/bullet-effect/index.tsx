import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

type BulletData = {
	id: number;
	startPos: [number, number, number];
	endPos: [number, number, number];
	progress: number;
};

type Props = {
	bullets: BulletData[];
	onComplete: (id: number) => void;
};

/** マズルフラッシュ（発射地点で一瞬光る） */
const MuzzleFlash = ({ position }: { position: [number, number, number] }) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const elapsed = useRef(0);

	useFrame((_, delta) => {
		if (!meshRef.current) return;
		elapsed.current += delta;
		const t = elapsed.current / 0.15;
		const scale = 1 + t * 3;
		meshRef.current.scale.setScalar(scale);
		const mat = meshRef.current.material as THREE.MeshBasicMaterial;
		mat.opacity = Math.max(0, 1 - t);
		if (t > 1) meshRef.current.visible = false;
	});

	return (
		<mesh ref={meshRef} position={position}>
			<sphereGeometry args={[0.3, 16, 16]} />
			<meshBasicMaterial color="#ffaa33" transparent opacity={1} />
		</mesh>
	);
};

/** 弾丸本体 + トレイル */
const Bullet = ({
	bullet,
	onComplete,
}: {
	bullet: BulletData;
	onComplete: (id: number) => void;
}) => {
	const groupRef = useRef<THREE.Group>(null);
	const bulletRef = useRef<THREE.Mesh>(null);
	const trailRefs = useRef<(THREE.Mesh | null)[]>([]);
	const progressRef = useRef(bullet.progress);
	const historyRef = useRef<[number, number, number][]>([]);

	useFrame((_, delta) => {
		if (!groupRef.current || !bulletRef.current) return;

		progressRef.current += delta * 4;
		const t = Math.min(progressRef.current, 1);

		const x = bullet.startPos[0] + (bullet.endPos[0] - bullet.startPos[0]) * t;
		const y = bullet.startPos[1] + (bullet.endPos[1] - bullet.startPos[1]) * t;
		const z = bullet.startPos[2] + (bullet.endPos[2] - bullet.startPos[2]) * t;

		bulletRef.current.position.set(x, y, z);

		// 弾が奥に行くほど小さく
		const scale = 1 - t * 0.6;
		bulletRef.current.scale.setScalar(scale);

		const mat = bulletRef.current.material as THREE.MeshBasicMaterial;
		mat.opacity = 1 - t * 0.5;

		// トレイル: 過去の位置を記録
		historyRef.current.push([x, y, z]);
		if (historyRef.current.length > 5) historyRef.current.shift();

		// トレイル描画
		for (let i = 0; i < trailRefs.current.length; i++) {
			const trail = trailRefs.current[i];
			if (!trail) continue;
			const histIdx = historyRef.current.length - 1 - (i + 1);
			if (histIdx >= 0 && histIdx < historyRef.current.length) {
				const [hx, hy, hz] = historyRef.current[histIdx];
				trail.position.set(hx, hy, hz);
				const trailScale = scale * (0.7 - i * 0.15);
				trail.scale.setScalar(Math.max(0.1, trailScale));
				const trailMat = trail.material as THREE.MeshBasicMaterial;
				trailMat.opacity = 0.5 - i * 0.12;
				trail.visible = true;
			} else {
				trail.visible = false;
			}
		}

		if (t >= 1) {
			onComplete(bullet.id);
		}
	});

	return (
		<group ref={groupRef}>
			{/* マズルフラッシュ */}
			<MuzzleFlash position={bullet.startPos} />

			{/* 弾丸本体 */}
			<mesh ref={bulletRef} position={bullet.startPos}>
				<sphereGeometry args={[0.15, 12, 12]} />
				<meshBasicMaterial color="#ffee55" transparent opacity={1} />
			</mesh>

			{/* トレイル */}
			{[0, 1, 2].map((i) => (
				<mesh
					key={`trail-${bullet.id}-${i}`}
					ref={(el) => {
						trailRefs.current[i] = el;
					}}
					visible={false}
				>
					<sphereGeometry args={[0.12, 8, 8]} />
					<meshBasicMaterial color="#ffaa22" transparent opacity={0.4} />
				</mesh>
			))}
		</group>
	);
};

export const BulletEffects = ({ bullets, onComplete }: Props) => {
	return (
		<>
			{bullets.map((b) => (
				<Bullet key={b.id} bullet={b} onComplete={onComplete} />
			))}
		</>
	);
};

export type { BulletData };
