import { Ring } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { sharedState } from "@/stores/game-store";

type Props = {
	screenToWorld: (
		nx: number,
		ny: number,
		z: number,
	) => [number, number, number];
};

export const Crosshair = ({ screenToWorld }: Props) => {
	const groupRef = useRef<THREE.Group>(null);

	useFrame(() => {
		if (!groupRef.current) return;

		if (sharedState.isGunPose && sharedState.aim) {
			const [wx, wy, wz] = screenToWorld(
				sharedState.aim.x,
				sharedState.aim.y,
				-5,
			);
			groupRef.current.position.set(wx, wy, wz);
			groupRef.current.visible = true;
		} else {
			groupRef.current.visible = false;
		}
	});

	return (
		<group ref={groupRef} visible={false}>
			{/* 外側リング */}
			<Ring args={[0.35, 0.42, 32]}>
				<meshBasicMaterial color="#ff3333" transparent opacity={0.8} />
			</Ring>
			{/* 内側ドット */}
			<mesh>
				<circleGeometry args={[0.08, 16]} />
				<meshBasicMaterial color="#ff3333" transparent opacity={0.9} />
			</mesh>
			{/* 十字線 */}
			{[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((rot) => (
				<mesh
					key={rot}
					position={[Math.cos(rot) * 0.55, Math.sin(rot) * 0.55, 0]}
				>
					<planeGeometry args={[0.03, 0.25]} />
					<meshBasicMaterial color="#ff3333" transparent opacity={0.8} />
				</mesh>
			))}
		</group>
	);
};
