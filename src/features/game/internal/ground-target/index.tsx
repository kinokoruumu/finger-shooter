import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
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

/** 通常の弓道の的 */
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

/** ゴールドの的: ツヤツヤ金色 + 中央に「+3」 */
const GoldTarget = () => {
	return (
		<group scale={1.8}>
			{/* 的本体（厚み） */}
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
				<cylinderGeometry args={[1.0, 1.0, 0.2, 32]} />
				<meshStandardMaterial
					color="#b8860b"
					metalness={0.8}
					roughness={0.15}
				/>
			</mesh>
			{/* 金色の面 */}
			<mesh position={[0, 0, 0]}>
				<circleGeometry args={[1.0, 32]} />
				<meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
			</mesh>
			{/* 内側のリング */}
			<mesh position={[0, 0, 0.01]}>
				<circleGeometry args={[0.7, 32]} />
				<meshStandardMaterial
					color="#daa520"
					metalness={0.85}
					roughness={0.12}
				/>
			</mesh>
			{/* 中央のハイライト */}
			<mesh position={[0, 0, 0.02]}>
				<circleGeometry args={[0.45, 32]} />
				<meshStandardMaterial color="#ffec80" metalness={0.7} roughness={0.1} />
			</mesh>
			{/* +3 テキスト */}
			<Text
				position={[0, 0, 0.05]}
				fontSize={0.45}
				color="#8b4513"
				fontWeight={900}
				anchorX="center"
				anchorY="middle"
			>
				+3
			</Text>
		</group>
	);
};

/** 破壊パーティクル — 円盤の破片がバラバラに飛び散る */
const DestroyParticles = ({
	position,
	isGold,
	onComplete,
}: {
	position: [number, number, number];
	isGold: boolean;
	onComplete: () => void;
}) => {
	const groupRef = useRef<THREE.Group>(null);
	const completed = useRef(false);
	const elapsed = useRef(0);

	const pieces = useMemo(() => {
		const colors = isGold
			? ["#ffd700", "#daa520", "#b8860b", "#ffec80", "#c5a000"]
			: ["#222222", "#ffffff", "#dd2222", "#444444", "#888888"];

		return Array.from({ length: 8 }, (_, i) => {
			const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
			const speed = 3 + Math.random() * 4;
			return {
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed * 0.7 + 2,
				vz: (Math.random() - 0.5) * speed * 0.8,
				rotX: (Math.random() - 0.5) * 12,
				rotY: (Math.random() - 0.5) * 12,
				color: colors[i % colors.length],
				scaleX: 0.3 + Math.random() * 0.4,
				scaleY: 0.15 + Math.random() * 0.2,
			};
		});
	}, [isGold]);

	useFrame((_, delta) => {
		if (!groupRef.current) return;
		elapsed.current += delta;

		if (elapsed.current > 1.2 && !completed.current) {
			completed.current = true;
			onComplete();
			return;
		}

		const children = groupRef.current.children;
		for (let i = 0; i < children.length; i++) {
			const p = pieces[i];
			const child = children[i];
			child.position.x += p.vx * delta;
			child.position.y += p.vy * delta;
			child.position.z += p.vz * delta;
			p.vy -= 8 * delta;
			child.rotation.x += p.rotX * delta;
			child.rotation.y += p.rotY * delta;
			const s = Math.max(0, 1 - elapsed.current * 1.2);
			child.scale.set(p.scaleX * s, p.scaleY * s, 1);
		}
	});

	return (
		<group ref={groupRef} position={position}>
			{pieces.map((p) => (
				<mesh key={`piece-${p.vx.toFixed(3)}-${p.vy.toFixed(3)}`}>
					<planeGeometry args={[1, 1]} />
					<meshStandardMaterial color={p.color} side={2} />
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

	const handleParticlesComplete = useCallback(() => {
		setShowParticles(false);
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
					{data.isGold ? <GoldTarget /> : <NormalTarget />}
				</group>
			)}
			{showParticles && (
				<DestroyParticles
					position={positionRef.current}
					isGold={data.isGold}
					onComplete={handleParticlesComplete}
				/>
			)}
		</>
	);
};
