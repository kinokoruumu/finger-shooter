import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import type * as THREE from "three";

type TargetState =
	| "appearing"
	| "rising"
	| "hovering"
	| "falling"
	| "destroyed";

export type GroundTargetData = {
	id: number;
	x: number;
	groundY: number;
	peakY: number;
	isGold: boolean;
	isPenalty: boolean;
	/** ステージ2: 回転しながら出現 */
	rotateIn?: boolean;
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

/** ゴールドの的: 明るい金色 + 中央に「+3」 */
const GoldTarget = () => {
	return (
		<group scale={1.8}>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
				<cylinderGeometry args={[1.0, 1.0, 0.2, 32]} />
				<meshStandardMaterial color="#daa520" metalness={0.5} roughness={0.3} />
			</mesh>
			<mesh position={[0, 0, 0]}>
				<circleGeometry args={[1.0, 32]} />
				<meshStandardMaterial
					color="#ffe566"
					metalness={0.4}
					roughness={0.25}
				/>
			</mesh>
			<mesh position={[0, 0, 0.01]}>
				<circleGeometry args={[0.7, 32]} />
				<meshStandardMaterial
					color="#ffcc00"
					metalness={0.35}
					roughness={0.3}
				/>
			</mesh>
			<mesh position={[0, 0, 0.02]}>
				<circleGeometry args={[0.45, 32]} />
				<meshStandardMaterial
					color="#fff2a0"
					metalness={0.3}
					roughness={0.25}
				/>
			</mesh>
			<Text
				position={[0, 0, 0.05]}
				fontSize={0.45}
				color="#996600"
				fontWeight={900}
				anchorX="center"
				anchorY="middle"
			>
				+3
			</Text>
		</group>
	);
};

/** ペナルティの的: 黒/グレー + 中央に「-3」 */
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
				fontSize={0.4}
				color="#ff4444"
				fontWeight={900}
				anchorX="center"
				anchorY="middle"
			>
				-3
			</Text>
		</group>
	);
};

const TargetVisual = ({
	isGold,
	isPenalty,
}: {
	isGold: boolean;
	isPenalty: boolean;
}) => {
	if (isPenalty) return <PenaltyTarget />;
	if (isGold) return <GoldTarget />;
	return <NormalTarget />;
};

/** 破壊パーティクル */
const DestroyParticles = ({
	position,
	isGold,
	isPenalty,
	onComplete,
}: {
	position: [number, number, number];
	isGold: boolean;
	isPenalty: boolean;
	onComplete: () => void;
}) => {
	const groupRef = useRef<THREE.Group>(null);
	const completed = useRef(false);
	const elapsed = useRef(0);

	const pieces = useMemo(() => {
		const colors = isPenalty
			? ["#1a1a1a", "#444444", "#333333", "#222222", "#555555"]
			: isGold
				? ["#ffe566", "#ffcc00", "#daa520", "#fff2a0", "#c5a000"]
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
	}, [isGold, isPenalty]);

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
	const initialState: TargetState = data.rotateIn ? "appearing" : "rising";
	const [state, setState] = useState<TargetState>(initialState);
	const [showParticles, setShowParticles] = useState(false);
	const elapsed = useRef(0);
	const positionRef = useRef<[number, number, number]>([
		data.x,
		data.groundY,
		-15,
	]);

	const appearDuration = 0.6;
	const riseDuration = 0.6;
	const hoverDuration = 2.5;
	const fallDuration = 0.5;

	useFrame((_, delta) => {
		if (!groupRef.current || state === "destroyed") return;

		elapsed.current += delta;

		switch (state) {
			case "appearing": {
				// 側面(Y軸90度回転)→正面(0度)に回転しながらフェードイン
				const t = Math.min(elapsed.current / appearDuration, 1);
				const eased = 1 - (1 - t) ** 3;
				groupRef.current.rotation.y = (Math.PI / 2) * (1 - eased);
				// 同時にスケールでフェードイン
				const s = 0.3 + 0.7 * eased;
				groupRef.current.scale.setScalar(s);

				if (t >= 1) {
					groupRef.current.rotation.y = 0;
					groupRef.current.scale.setScalar(1);
					setState("rising");
					elapsed.current = 0;
				}
				break;
			}
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
						isPenalty: data.isPenalty,
						positionRef,
						handleHit,
					}}
				>
					<TargetVisual isGold={data.isGold} isPenalty={data.isPenalty} />
				</group>
			)}
			{showParticles && (
				<DestroyParticles
					position={positionRef.current}
					isGold={data.isGold}
					isPenalty={data.isPenalty}
					onComplete={handleParticlesComplete}
				/>
			)}
		</>
	);
};
