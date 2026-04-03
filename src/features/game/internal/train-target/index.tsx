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
	slotsOscillate: boolean;
	direction: number;
	lane: number;
};

type Props = {
	data: TrainTargetData;
	onDead: (id: number) => void;
	onSlotHit: () => void;
};

const SCALE = 4.5;
const CARS = 3;
const CAR_WIDTH = 5 * SCALE + 2; // 車体幅 + 隙間
const WINDOW_XS = [-1.5, 0, 1.5];
const SLOT_Y = 0.3 * SCALE;
const SLOT_Z = 0.76 * SCALE + 0.1;

const SmallTarget = ({ alive }: { alive: boolean }) => {
	if (!alive) return null;

	const rings: { radius: number; color: string; z: number }[] = [
		{ radius: 0.6, color: "#222222", z: 0 },
		{ radius: 0.47, color: "#ffffff", z: 0.02 },
		{ radius: 0.34, color: "#222222", z: 0.04 },
		{ radius: 0.22, color: "#ffffff", z: 0.06 },
		{ radius: 0.12, color: "#dd2222", z: 0.08 },
	];

	return (
		<group scale={3.0}>
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
		<group scale={SCALE}>
			<mesh position={[0, 0, 0]}>
				<boxGeometry args={[5, 1.8, 1.5]} />
				<meshStandardMaterial color="#4488cc" />
			</mesh>
			<mesh position={[0, 1.0, 0]}>
				<boxGeometry args={[5.2, 0.2, 1.5]} />
				<meshStandardMaterial color="#3377aa" />
			</mesh>
			{WINDOW_XS.map((wx) => (
				<mesh key={wx} position={[wx, 0.3, 0.76]}>
					<planeGeometry args={[0.8, 0.6]} />
					<meshStandardMaterial color="#aaddff" />
				</mesh>
			))}
			{[-1.8, -0.8, 0.8, 1.8].map((wx) => (
				<mesh
					key={`f-${wx}`}
					position={[wx, -1.1, 0.8]}
					rotation={[Math.PI / 2, 0, 0]}
				>
					<cylinderGeometry args={[0.35, 0.35, 0.15, 16]} />
					<meshStandardMaterial color="#333333" />
				</mesh>
			))}
			{[-1.8, -0.8, 0.8, 1.8].map((wx) => (
				<mesh
					key={`b-${wx}`}
					position={[wx, -1.1, -0.8]}
					rotation={[Math.PI / 2, 0, 0]}
				>
					<cylinderGeometry args={[0.35, 0.35, 0.15, 16]} />
					<meshStandardMaterial color="#333333" />
				</mesh>
			))}
		</group>
	);
};

const buildSlots = (): SlotState[] => {
	const slots: SlotState[] = [];
	for (let c = 0; c < CARS; c++) {
		const carOffset = (c - (CARS - 1) / 2) * CAR_WIDTH;
		for (const wx of WINDOW_XS) {
			slots.push({
				offsetX: carOffset + wx * SCALE,
				offsetY: SLOT_Y,
				alive: true,
			});
		}
	}
	return slots;
};

export const TrainTarget = ({ data, onDead, onSlotHit }: Props) => {
	const groupRef = useRef<THREE.Group>(null);
	const [alive, setAlive] = useState(true);
	const oscillateTime = useRef(Math.random() * Math.PI * 2);
	const dir = data.direction;

	const [slots, setSlots] = useState<SlotState[]>(() => buildSlots());

	useFrame((_, delta) => {
		if (!groupRef.current || !alive) return;

		groupRef.current.position.x -=
			GAME_CONFIG.target.trainSpeed * delta * 2 * dir;

		if (data.slotsOscillate) {
			oscillateTime.current += delta * 2.5;
			// 屋根上端(的中心の上限) と 車体下端(的中心の下限)
			const roofTop = (1.0 + 0.1) * SCALE;
			const bodyBottom = -0.9 * SCALE;
			const slotGroups = groupRef.current.children.filter(
				(c) => c.userData.isSlot,
			);
			for (let i = 0; i < slotGroups.length; i++) {
				const phase = oscillateTime.current + (i * Math.PI * 2) / 3;
				const raw = slots[i].offsetY + Math.sin(phase) * 2.5;
				slotGroups[i].position.y = Math.max(bodyBottom, Math.min(roofTop, raw));
			}
		}

		const exitThreshold = Math.abs(data.startX) + CARS * CAR_WIDTH;
		if (
			(dir > 0 && groupRef.current.position.x < -exitThreshold) ||
			(dir < 0 && groupRef.current.position.x > exitThreshold)
		) {
			setAlive(false);
			onDead(data.id);
		}
	});

	const handleSlotHit = (index: number) => {
		setSlots((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], alive: false };
			onSlotHit();

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
			{Array.from({ length: CARS }, (_, c) => {
				const pos = (c - (CARS - 1) / 2) * CAR_WIDTH;
				return (
					<group key={`car-${pos}`} position={[pos, 0, 0]}>
						<TrainBody />
					</group>
				);
			})}
			{slots.map((slot, i) => (
				<group
					key={`slot-${slot.offsetX}`}
					position={[slot.offsetX, slot.offsetY, SLOT_Z]}
					userData={{ isSlot: true, slotIndex: i }}
				>
					<SmallTarget alive={slot.alive} />
				</group>
			))}
		</group>
	);
};
