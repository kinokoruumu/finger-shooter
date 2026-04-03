import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type * as THREE from "three";
import { GAME_CONFIG } from "@/config/game-config";

type SlotState = {
	offsetX: number;
	offsetY: number;
	alive: boolean;
};

export type TrainTargetData = {
	id: number;
	startX: number;
	y: number;
	z: number;
};

type Props = {
	data: TrainTargetData;
	onDead: (id: number) => void;
	onSlotHit: () => void;
};

const SmallTarget = ({ alive }: { alive: boolean }) => {
	if (!alive) return null;

	const rings: { radius: number; color: string; z: number }[] = [
		{ radius: 0.6, color: "#222222", z: 0 },
		{ radius: 0.47, color: "#ffffff", z: 0.01 },
		{ radius: 0.34, color: "#222222", z: 0.02 },
		{ radius: 0.22, color: "#ffffff", z: 0.03 },
		{ radius: 0.12, color: "#dd2222", z: 0.04 },
	];

	return (
		<group scale={1.2}>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.06]}>
				<cylinderGeometry args={[0.6, 0.6, 0.12, 32]} />
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

const TrainBody = () => {
	return (
		<group scale={1.3}>
			{/* 車体 */}
			<mesh position={[0, 0, 0]}>
				<boxGeometry args={[5, 1.8, 1.5]} />
				<meshStandardMaterial color="#4488cc" />
			</mesh>
			{/* 屋根 */}
			<mesh position={[0, 1.0, 0]}>
				<boxGeometry args={[5.2, 0.2, 1.6]} />
				<meshStandardMaterial color="#3377aa" />
			</mesh>
			{/* 窓 */}
			{[-1.5, 0, 1.5].map((wx) => (
				<mesh key={wx} position={[wx, 0.3, 0.76]}>
					<planeGeometry args={[0.8, 0.5]} />
					<meshStandardMaterial color="#aaddff" />
				</mesh>
			))}
			{/* 車輪 */}
			{[-1.8, -0.8, 0.8, 1.8].map((wx) => (
				<mesh
					key={wx}
					position={[wx, -1.1, 0.8]}
					rotation={[Math.PI / 2, 0, 0]}
				>
					<cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
					<meshStandardMaterial color="#333333" />
				</mesh>
			))}
		</group>
	);
};

export const TrainTarget = ({ data, onDead, onSlotHit }: Props) => {
	const groupRef = useRef<THREE.Group>(null);
	const [alive, setAlive] = useState(true);
	const [slots, setSlots] = useState<SlotState[]>([
		{ offsetX: -2.0, offsetY: 0, alive: true },
		{ offsetX: 0, offsetY: 0, alive: true },
		{ offsetX: 2.0, offsetY: 0, alive: true },
	]);

	useFrame((_, delta) => {
		if (!groupRef.current || !alive) return;

		groupRef.current.position.x -= GAME_CONFIG.target.trainSpeed * delta * 2;

		if (groupRef.current.position.x < data.startX * -1 - 5) {
			setAlive(false);
			onDead(data.id);
		}
	});

	const handleSlotHit = (index: number) => {
		setSlots((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], alive: false };
			onSlotHit();

			// 全部倒したか
			if (next.every((s) => !s.alive)) {
				setAlive(false);
				onDead(data.id);
			}
			return next;
		});
	};

	if (!alive) return null;

	return (
		<group
			ref={groupRef}
			position={[data.startX, data.y, data.z]}
			userData={{ type: "train-target", id: data.id, slots, handleSlotHit }}
		>
			<TrainBody />
			{slots.map((slot) => (
				<group key={slot.offsetX} position={[slot.offsetX, slot.offsetY, 1.05]}>
					<SmallTarget alive={slot.alive} />
				</group>
			))}
		</group>
	);
};
