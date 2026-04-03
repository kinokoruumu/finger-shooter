import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { playSound } from "@/features/audio";

type TargetState = "appearing" | "visible" | "leaving" | "destroyed";

export type GroundTargetData = {
	id: number;
	x: number;
	y: number;
	z: number;
	isGold: boolean;
	isPenalty: boolean;
	/** 表示時間(秒) */
	visibleDuration: number;
	/** グリッド座標（被り判定用） */
	gx?: number;
	gy?: number;
	/** 的のスケール（画面幅に応じて動的） */
	scale: number;
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

/** ゴールドの的 */
const GoldTarget = () => {
	return (
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
};

/** ペナルティの的 */
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

const APPEAR_DURATION = 0.35;
const LEAVE_DURATION = 0.25;
const Z_BACK = -20;

export const GroundTarget = ({ data, onDead }: Props) => {
	const groupRef = useRef<THREE.Group>(null);
	const [state, setState] = useState<TargetState>("appearing");
	const [showParticles, setShowParticles] = useState(false);
	const elapsed = useRef(0);

	// 出現時に音を鳴らす
	useEffect(() => {
		playSound("target-appear", 0.5);
	}, []);
	const positionRef = useRef<[number, number, number]>([
		data.x,
		data.y,
		data.z,
	]);

	useFrame((_, delta) => {
		if (!groupRef.current || state === "destroyed") return;

		elapsed.current += delta;

		switch (state) {
			case "appearing": {
				// 奥(Z_BACK)から手前(data.z)にイン + Y軸90度回転(右向き→正面)
				const t = Math.min(elapsed.current / APPEAR_DURATION, 1);
				const eased = 1 - (1 - t) ** 3;

				const z = Z_BACK + (data.z - Z_BACK) * eased;
				groupRef.current.position.z = z;
				groupRef.current.rotation.y = (Math.PI / 2) * (1 - eased);

				// スケールでフェードイン
				const s = 0.3 + 0.7 * eased;
				groupRef.current.scale.setScalar(s);

				positionRef.current = [data.x, data.y, z];

				if (t >= 1) {
					groupRef.current.rotation.y = 0;
					groupRef.current.scale.setScalar(1);
					groupRef.current.position.z = data.z;
					positionRef.current = [data.x, data.y, data.z];
					setState("visible");
					elapsed.current = 0;
				}
				break;
			}
			case "visible": {
				// グリッド位置に留まる
				if (elapsed.current >= data.visibleDuration) {
					setState("leaving");
					elapsed.current = 0;
				}
				break;
			}
			case "leaving": {
				// 奥に戻りながら消える
				const t = Math.min(elapsed.current / LEAVE_DURATION, 1);
				const eased = t ** 2;

				const z = data.z + (Z_BACK - data.z) * eased;
				groupRef.current.position.z = z;
				groupRef.current.rotation.y = (Math.PI / 2) * eased;
				groupRef.current.scale.setScalar(1 - eased * 0.7);

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
					position={[data.x, data.y, Z_BACK]}
					userData={{
						type: "ground-target",
						id: data.id,
						isGold: data.isGold,
						isPenalty: data.isPenalty,
						positionRef,
						handleHit,
					}}
				>
					<group scale={data.scale / 1.8}>
						<TargetVisual isGold={data.isGold} isPenalty={data.isPenalty} />
					</group>
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
