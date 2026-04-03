import { useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";
import type * as THREE from "three";

type TargetState = "rising" | "hovering" | "falling" | "destroyed";

export type GroundTargetData = {
	id: number;
	x: number;
	groundY: number;
	peakY: number;
	isGold: boolean;
};

type Props = {
	data: GroundTargetData;
	onDead: (id: number) => void;
};

/** 弓道の的: 同心円の短いシリンダー */
const ArcheryTarget = ({ isGold }: { isGold: boolean }) => {
	const rings: { radius: number; color: string; z: number }[] = isGold
		? [
				{ radius: 1.0, color: "#b8860b", z: 0 },
				{ radius: 0.78, color: "#ffd700", z: 0.01 },
				{ radius: 0.57, color: "#b8860b", z: 0.02 },
				{ radius: 0.36, color: "#ffd700", z: 0.03 },
				{ radius: 0.2, color: "#ff4444", z: 0.04 },
			]
		: [
				{ radius: 1.0, color: "#222222", z: 0 },
				{ radius: 0.78, color: "#ffffff", z: 0.01 },
				{ radius: 0.57, color: "#222222", z: 0.02 },
				{ radius: 0.36, color: "#ffffff", z: 0.03 },
				{ radius: 0.2, color: "#dd2222", z: 0.04 },
			];

	return (
		<group scale={1.8}>
			{/* 的本体（厚み） */}
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
				<cylinderGeometry args={[1.0, 1.0, 0.2, 32]} />
				<meshStandardMaterial color={isGold ? "#8b6914" : "#3a3a3a"} />
			</mesh>
			{/* 同心円リング（前面） */}
			{rings.map((ring) => (
				<mesh key={ring.color + ring.radius} position={[0, 0, ring.z]}>
					<circleGeometry args={[ring.radius, 32]} />
					<meshStandardMaterial color={ring.color} />
				</mesh>
			))}
		</group>
	);
};

/** 破壊パーティクル */
const DestroyParticles = ({
	position,
}: {
	position: [number, number, number];
}) => {
	const groupRef = useRef<THREE.Group>(null);
	const particlesRef = useRef(
		Array.from({ length: 12 }, (_, i) => {
			const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
			const speed = 2 + Math.random() * 3;
			const colors = ["#222222", "#ffffff", "#dd2222", "#444444", "#ffcccc"];
			return {
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed * 0.8 + 1,
				vz: (Math.random() - 0.5) * speed,
				color: colors[i % colors.length],
				scale: 0.08 + Math.random() * 0.12,
			};
		}),
	);
	const elapsed = useRef(0);

	useFrame((_, delta) => {
		if (!groupRef.current) return;
		elapsed.current += delta;
		const children = groupRef.current.children;
		for (let i = 0; i < children.length; i++) {
			const p = particlesRef.current[i];
			const child = children[i];
			child.position.x += p.vx * delta;
			child.position.y += p.vy * delta;
			child.position.z += p.vz * delta;
			p.vy -= 6 * delta; // gravity
			const s = Math.max(0, 1 - elapsed.current * 2);
			child.scale.setScalar(p.scale * s);
		}
	});

	if (elapsed.current > 1) return null;

	return (
		<group ref={groupRef} position={position}>
			{particlesRef.current.map((p) => (
				<mesh key={`${p.color}-${p.scale}`}>
					<boxGeometry args={[1, 1, 1]} />
					<meshStandardMaterial color={p.color} />
				</mesh>
			))}
		</group>
	);
};

export const GroundTarget = ({ data, onDead }: Props) => {
	const groupRef = useRef<THREE.Group>(null);
	const [state, setState] = useState<TargetState>("rising");
	const [showParticles, setShowParticles] = useState(false);
	const elapsed = useRef(0);
	const positionRef = useRef<[number, number, number]>([
		data.x,
		data.groundY,
		-15,
	]);

	const riseDuration = 0.6;
	const hoverDuration = 2.5;
	const fallDuration = 0.5;

	useFrame((_, delta) => {
		if (!groupRef.current || state === "destroyed") return;

		elapsed.current += delta;

		switch (state) {
			case "rising": {
				const t = Math.min(elapsed.current / riseDuration, 1);
				const eased = 1 - (1 - t) ** 2;
				const y = data.groundY + (data.peakY - data.groundY) * eased;
				groupRef.current.position.y = y;
				positionRef.current = [data.x, y, -15];
				if (t >= 1) {
					setState("hovering");
					elapsed.current = 0;
				}
				break;
			}
			case "hovering": {
				const y = data.peakY + Math.sin(elapsed.current * 3) * 0.1;
				groupRef.current.position.y = y;
				positionRef.current = [data.x, y, -15];
				if (elapsed.current >= hoverDuration) {
					setState("falling");
					elapsed.current = 0;
				}
				break;
			}
			case "falling": {
				const t = Math.min(elapsed.current / fallDuration, 1);
				const eased = t ** 2;
				const y = data.peakY + (data.groundY - 2 - data.peakY) * eased;
				groupRef.current.position.y = y;
				if (t >= 1) {
					setState("destroyed");
					onDead(data.id);
				}
				break;
			}
		}
	});

	const handleHit = useCallback(() => {
		setState("destroyed");
		setShowParticles(true);
	}, []);

	if (state === "destroyed" && !showParticles) return null;

	return (
		<>
			{state !== "destroyed" && (
				<group
					ref={groupRef}
					position={[data.x, data.groundY, -15]}
					userData={{
						type: "ground-target",
						id: data.id,
						isGold: data.isGold,
						positionRef,
						handleHit,
					}}
				>
					<ArcheryTarget isGold={data.isGold} />
				</group>
			)}
			{showParticles && <DestroyParticles position={positionRef.current} />}
		</>
	);
};
