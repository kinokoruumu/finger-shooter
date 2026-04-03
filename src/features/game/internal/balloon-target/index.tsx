import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import type * as THREE from "three";

export type BalloonTargetData = {
	id: number;
	x: number;
	startY: number;
	z: number;
	speed: number;
	color: string;
};

type Props = {
	data: BalloonTargetData;
	onDead: (id: number) => void;
};

const BALLOON_COLORS = [
	"#ff4466",
	"#44aaff",
	"#44dd66",
	"#ffaa22",
	"#dd44ff",
	"#ff6644",
];

export const randomBalloonColor = () =>
	BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

/** 破裂パーティクル */
const PopParticles = ({
	position,
	color,
}: {
	position: [number, number, number];
	color: string;
}) => {
	const groupRef = useRef<THREE.Group>(null);
	const elapsed = useRef(0);
	const particles = useMemo(
		() =>
			Array.from({ length: 10 }, (_, i) => {
				const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
				const speed = 3 + Math.random() * 4;
				return {
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed * 0.6 + 2,
					vz: (Math.random() - 0.5) * speed * 0.5,
					scale: 0.06 + Math.random() * 0.1,
				};
			}),
		[],
	);

	useFrame((_, delta) => {
		if (!groupRef.current) return;
		elapsed.current += delta;
		const children = groupRef.current.children;
		for (let i = 0; i < children.length; i++) {
			const p = particles[i];
			const child = children[i];
			child.position.x += p.vx * delta;
			child.position.y += p.vy * delta;
			child.position.z += p.vz * delta;
			p.vy -= 8 * delta;
			const s = Math.max(0, 1 - elapsed.current * 2.5);
			child.scale.setScalar(p.scale * s);
		}
	});

	if (elapsed.current > 0.8) return null;

	return (
		<group ref={groupRef} position={position}>
			{particles.map((p) => (
				<mesh key={`pop-${p.vx.toFixed(3)}-${p.vy.toFixed(3)}`}>
					<sphereGeometry args={[1, 6, 6]} />
					<meshStandardMaterial color={color} />
				</mesh>
			))}
		</group>
	);
};

export const BalloonTarget = ({ data, onDead }: Props) => {
	const groupRef = useRef<THREE.Group>(null);
	const [alive, setAlive] = useState(true);
	const [popPos, setPopPos] = useState<[number, number, number] | null>(null);
	const wobbleOffset = useRef(Math.random() * Math.PI * 2);
	const positionRef = useRef<[number, number, number]>([
		data.x,
		data.startY,
		data.z,
	]);

	useFrame((_, delta) => {
		if (!groupRef.current || !alive) return;

		// 上昇
		groupRef.current.position.y += data.speed * delta;

		// 左右にゆらゆら
		wobbleOffset.current += delta * 2;
		groupRef.current.position.x = data.x + Math.sin(wobbleOffset.current) * 0.3;

		positionRef.current = [
			groupRef.current.position.x,
			groupRef.current.position.y,
			data.z,
		];

		// 画面外に出たら消滅
		if (groupRef.current.position.y > 15) {
			setAlive(false);
			onDead(data.id);
		}
	});

	const handleHit = useCallback(() => {
		setPopPos([...positionRef.current]);
		setAlive(false);
	}, []);

	if (!alive && !popPos) return null;

	return (
		<>
			{alive && (
				<group
					ref={groupRef}
					position={[data.x, data.startY, data.z]}
					userData={{
						type: "balloon-target",
						id: data.id,
						positionRef,
						handleHit,
					}}
				>
					{/* 風船本体（楕円球） */}
					<mesh scale={[1.1, 1.4, 1.1]}>
						<sphereGeometry args={[0.7, 16, 16]} />
						<meshStandardMaterial
							color={data.color}
							roughness={0.3}
							metalness={0.1}
						/>
					</mesh>
					{/* ハイライト */}
					<mesh position={[-0.15, 0.2, 0.5]} scale={[0.2, 0.3, 0.1]}>
						<sphereGeometry args={[1, 8, 8]} />
						<meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
					</mesh>
					{/* 結び目 */}
					<mesh position={[0, -1.0, 0]}>
						<coneGeometry args={[0.08, 0.15, 8]} />
						<meshStandardMaterial color={data.color} />
					</mesh>
					{/* 紐 */}
					<mesh position={[0, -1.5, 0]}>
						<cylinderGeometry args={[0.01, 0.01, 0.8, 4]} />
						<meshBasicMaterial color="#888888" />
					</mesh>
				</group>
			)}

			{popPos && <PopParticles position={popPos} color={data.color} />}
		</>
	);
};
