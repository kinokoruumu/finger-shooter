import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import type { CreatorTarget } from "@/features/creator/types";
import { gridToNormalized } from "@/features/game/utils/grid-to-normalized";
import { createScreenToWorld } from "@/features/game/utils/screen-to-world";

type Props = {
	target: CreatorTarget;
	ghost?: boolean;
	label?: string;
};

const NormalTarget = () => {
	const rings: { radius: number; color: string; z: number }[] = [
		{ radius: 1.0, color: "#222222", z: 0 },
		{ radius: 0.78, color: "#ffffff", z: 0.01 },
		{ radius: 0.57, color: "#222222", z: 0.02 },
		{ radius: 0.36, color: "#ffffff", z: 0.03 },
		{ radius: 0.2, color: "#dd2222", z: 0.04 },
	];

	return (
		<group scale={1.8}>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
				<cylinderGeometry args={[1.0, 1.0, 0.2, 32]} />
				<meshStandardMaterial color="#3a3a3a" />
			</mesh>
			{rings.map((ring) => (
				<mesh key={ring.color + ring.radius} position={[0, 0, ring.z]}>
					<circleGeometry args={[ring.radius, 32]} />
					<meshStandardMaterial color={ring.color} />
				</mesh>
			))}
		</group>
	);
};

const GoldTarget = () => (
	<group scale={1.8}>
		<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
			<cylinderGeometry args={[1.0, 1.0, 0.2, 32]} />
			<meshStandardMaterial color="#daa520" metalness={0.5} roughness={0.3} />
		</mesh>
		<mesh position={[0, 0, 0.01]}>
			<circleGeometry args={[1.0, 32]} />
			<meshStandardMaterial color="#ffe566" />
		</mesh>
		<mesh position={[0, 0, 0.05]}>
			<circleGeometry args={[0.7, 32]} />
			<meshStandardMaterial color="#ffcc00" />
		</mesh>
		<mesh position={[0, 0, 0.09]}>
			<circleGeometry args={[0.45, 32]} />
			<meshStandardMaterial color="#fff2a0" />
		</mesh>
		<Text
			position={[0, 0, 0.13]}
			fontSize={0.5}
			color="#552200"
			fontWeight={900}
			anchorX="center"
			anchorY="middle"
			outlineWidth={0.03}
			outlineColor="#ffffff"
		>
			+3
		</Text>
	</group>
);

const PenaltyTarget = () => {
	const rings: { radius: number; color: string; z: number }[] = [
		{ radius: 1.0, color: "#1a1a1a", z: 0 },
		{ radius: 0.78, color: "#444444", z: 0.01 },
		{ radius: 0.57, color: "#1a1a1a", z: 0.02 },
		{ radius: 0.36, color: "#333333", z: 0.03 },
	];

	return (
		<group scale={1.8}>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
				<cylinderGeometry args={[1.0, 1.0, 0.2, 32]} />
				<meshStandardMaterial color="#111111" />
			</mesh>
			{rings.map((ring) => (
				<mesh key={ring.color + ring.radius} position={[0, 0, ring.z]}>
					<circleGeometry args={[ring.radius, 32]} />
					<meshStandardMaterial color={ring.color} />
				</mesh>
			))}
			<Text
				position={[0, 0, 0.05]}
				fontSize={0.5}
				color="#ff2222"
				fontWeight={900}
				anchorX="center"
				anchorY="middle"
				outlineWidth={0.03}
				outlineColor="#ffffff"
			>
				-3
			</Text>
		</group>
	);
};

const TargetVisual = ({ type }: { type: CreatorTarget["type"] }) => {
	switch (type) {
		case "ground-gold":
			return <GoldTarget />;
		case "ground-penalty":
			return <PenaltyTarget />;
		default:
			return <NormalTarget />;
	}
};

const APPEAR_DURATION = 0.25;

/** 出現アニメーション付きの静的ターゲット */
export const StaticTarget = ({ target, ghost, label }: Props) => {
	const { camera } = useThree();
	const groupRef = useRef<THREE.Group>(null);
	const elapsed = useRef(0);
	const appeared = useRef(false);

	const screenToWorld = useMemo(
		() => createScreenToWorld(camera as THREE.PerspectiveCamera),
		[camera],
	);

	const position = useMemo((): [number, number, number] => {
		const [nx, ny] = gridToNormalized(target.gx, target.gy);
		const [worldX] = screenToWorld(nx, 0.5, -15);
		const [, worldY] = screenToWorld(0.5, ny, -15);
		return [worldX, worldY, -15];
	}, [target.gx, target.gy, screenToWorld]);

	const targetScale = useMemo(() => {
		const [leftX] = screenToWorld(0.2, 0.5, -15);
		const [rightX] = screenToWorld(0.8, 0.5, -15);
		const gridWidth = rightX - leftX;
		const cellWidth = gridWidth / 7;
		const maxDiameter = cellWidth * 0.8;
		const scale = Math.min(1.8, maxDiameter / 2.0);
		return Math.max(0.8, scale);
	}, [screenToWorld]);

	// 出現アニメーション（スケールとY回転��み、位置は固定）
	useFrame((_, delta) => {
		if (!groupRef.current || appeared.current) return;

		elapsed.current += delta;
		const t = Math.min(elapsed.current / APPEAR_DURATION, 1);
		const eased = 1 - (1 - t) ** 3;

		groupRef.current.rotation.y = (Math.PI / 2) * (1 - eased);
		const s = 0.3 + 0.7 * eased;
		groupRef.current.scale.setScalar(s);

		if (t >= 1) {
			groupRef.current.rotation.y = 0;
			groupRef.current.scale.setScalar(1);
			appeared.current = true;
		}
	});

	return (
		<group
			ref={groupRef}
			position={position}
			scale={0.3}
		>
			<group scale={targetScale / 1.8} renderOrder={ghost ? -1 : 0}>
				<TargetVisual type={target.type} />
			</group>
			{label && (
				<Text
					position={[0, 2.5, 0.1]}
					fontSize={1.2}
					color="#ffffff"
					fontWeight={900}
					anchorX="center"
					anchorY="middle"
					outlineWidth={0.08}
					outlineColor="#000000"
				>
					{label}
				</Text>
			)}
		</group>
	);
};
