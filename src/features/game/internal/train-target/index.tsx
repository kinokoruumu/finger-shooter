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
	/** 移動方向: 1=右→左, -1=左→右 */
	direction: number;
	/** レーン 0=上, 1=中, 2=下 */
	lane: number;
	/** 車両数（1〜3） */
	cars: number;
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
		<group scale={1.8}>
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

/** 線路（列車の下に表示、十分な長さ） */
const Rails = () => {
	const railLength = 200;
	const tieCount = 80;
	const tieSpacing = railLength / tieCount;

	return (
		<group position={[0, -1.15 * 2.5, 0]}>
			{/* レール2本 */}
			<mesh position={[0, 0, 0.4]}>
				<boxGeometry args={[railLength, 0.08, 0.08]} />
				<meshStandardMaterial color="#666666" metalness={0.6} roughness={0.3} />
			</mesh>
			<mesh position={[0, 0, -0.4]}>
				<boxGeometry args={[railLength, 0.08, 0.08]} />
				<meshStandardMaterial color="#666666" metalness={0.6} roughness={0.3} />
			</mesh>
			{/* 枕木 */}
			{Array.from({ length: tieCount }, (_, i) => {
				const x = (i - tieCount / 2) * tieSpacing;
				return (
					<mesh key={`tie-${x}`} position={[x, -0.04, 0]}>
						<boxGeometry args={[0.3, 0.06, 1.2]} />
						<meshStandardMaterial color="#5c3a1e" />
					</mesh>
				);
			})}
		</group>
	);
};

const TrainBody = () => {
	return (
		<group scale={2.5}>
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
					<planeGeometry args={[0.8, 0.6]} />
					<meshStandardMaterial color="#aaddff" />
				</mesh>
			))}
			{/* 車輪（手前） */}
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
			{/* 車輪（奥） */}
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

// 車両幅(scale 2.5): 5 * 2.5 = 12.5、車両間隔
const CAR_WIDTH = 13;
const WINDOW_OFFSETS = [-1.5 * 2.5, 0, 1.5 * 2.5];
const SLOT_Y = 0.3 * 2.5;

const buildSlots = (cars: number): SlotState[] => {
	const slots: SlotState[] = [];
	for (let c = 0; c < cars; c++) {
		const carOffset = (c - (cars - 1) / 2) * CAR_WIDTH;
		for (const wx of WINDOW_OFFSETS) {
			slots.push({ offsetX: carOffset + wx, offsetY: SLOT_Y, alive: true });
		}
	}
	return slots;
};

export const TrainTarget = ({ data, onDead, onSlotHit }: Props) => {
	const groupRef = useRef<THREE.Group>(null);
	const [alive, setAlive] = useState(true);
	const oscillateTime = useRef(Math.random() * Math.PI * 2);
	const dir = data.direction;
	const cars = data.cars;

	const [slots, setSlots] = useState<SlotState[]>(() => buildSlots(cars));

	useFrame((_, delta) => {
		if (!groupRef.current || !alive) return;

		// dir=1: 右→左（x減少）, dir=-1: 左→右（x増加）
		groupRef.current.position.x -=
			GAME_CONFIG.target.trainSpeed * delta * 2 * dir;

		// ステージ2以降: 的が上下に揺れる
		if (data.slotsOscillate) {
			oscillateTime.current += delta * 2.5;
			const slotGroups = groupRef.current.children.filter(
				(c) => c.userData.isSlot,
			);
			for (let i = 0; i < slotGroups.length; i++) {
				const phase = oscillateTime.current + (i * Math.PI * 2) / 3;
				slotGroups[i].position.y = slots[i].offsetY + Math.sin(phase) * 0.6;
			}
		}

		// 画面外に出たか（連結分を考慮）
		const exitThreshold = Math.abs(data.startX) + cars * CAR_WIDTH;
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
			{/* 線路 */}
			<Rails />
			{/* 連結車両 */}
			{Array.from({ length: cars }, (_, c) => {
				const pos = (c - (cars - 1) / 2) * CAR_WIDTH;
				return (
					<group key={`car-${pos}`} position={[pos, 0, 0]}>
						<TrainBody />
					</group>
				);
			})}
			{/* 的（全車両分） */}
			{slots.map((slot, i) => (
				<group
					key={`slot-${slot.offsetX}`}
					position={[slot.offsetX, slot.offsetY, 0.76 * 2.5 + 0.1]}
					userData={{ isSlot: true, slotIndex: i }}
				>
					<SmallTarget alive={slot.alive} />
				</group>
			))}
		</group>
	);
};
