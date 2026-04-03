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

/** 破裂パーティクル — 風船の破片（薄い曲面片）+ 紐が落下 */
const PopParticles = ({
	position,
	color,
	onComplete,
}: {
	position: [number, number, number];
	color: string;
	onComplete: () => void;
}) => {
	const groupRef = useRef<THREE.Group>(null);
	const elapsed = useRef(0);
	const completed = useRef(false);
	const particles = useMemo(
		() =>
			Array.from({ length: 12 }, (_, i) => {
				const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
				const speed = 4 + Math.random() * 5;
				return {
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed * 0.6 + 3,
					vz: (Math.random() - 0.5) * speed * 0.5,
					rotSpeed: (Math.random() - 0.5) * 15,
					scale: 0.15 + Math.random() * 0.2,
				};
			}),
		[],
	);

	useFrame((_, delta) => {
		if (!groupRef.current) return;
		elapsed.current += delta;

		if (elapsed.current > 1.0 && !completed.current) {
			completed.current = true;
			onComplete();
			return;
		}

		const children = groupRef.current.children;
		for (let i = 0; i < children.length; i++) {
			const p = particles[i];
			const child = children[i];
			child.position.x += p.vx * delta;
			child.position.y += p.vy * delta;
			child.position.z += p.vz * delta;
			p.vy -= 10 * delta;
			child.rotation.z += p.rotSpeed * delta;
			const s = Math.max(0, 1 - elapsed.current * 1.5);
			child.scale.set(p.scale * s, p.scale * s * 0.6, 1);
		}
	});

	return (
		<group ref={groupRef} position={position}>
			{particles.map((p) => (
				<mesh key={`pop-${p.vx.toFixed(3)}-${p.vy.toFixed(3)}`}>
					<planeGeometry args={[1, 1]} />
					<meshStandardMaterial
						color={color}
						side={2}
						transparent
						opacity={0.9}
					/>
				</mesh>
			))}
		</group>
	);
};

export const BalloonTarget = ({ data, onDead }: Props) => {
	const groupRef = useRef<THREE.Group>(null);
	const [alive, setAlive] = useState(true);
	const [popPos, setPopPos] = useState<[number, number, number] | null>(null);
	const [showPop, setShowPop] = useState(false);
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
		setShowPop(true);
		setAlive(false);
	}, []);

	const handlePopComplete = useCallback(() => {
		setShowPop(false);
	}, []);

	if (!alive && !showPop) return null;

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
					<mesh scale={[2.0, 2.5, 2.0]}>
						<sphereGeometry args={[0.7, 16, 16]} />
						<meshStandardMaterial
							color={data.color}
							roughness={0.3}
							metalness={0.1}
						/>
					</mesh>
					{/* ハイライト */}
					<mesh position={[-0.25, 0.4, 0.9]} scale={[0.35, 0.5, 0.15]}>
						<sphereGeometry args={[1, 8, 8]} />
						<meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
					</mesh>
					{/* 結び目 */}
					<mesh position={[0, -1.8, 0]}>
						<coneGeometry args={[0.1, 0.2, 8]} />
						<meshStandardMaterial color={data.color} />
					</mesh>
					{/* 紐 */}
					<mesh position={[0, -2.4, 0]}>
						<cylinderGeometry args={[0.015, 0.015, 1.0, 4]} />
						<meshBasicMaterial color="#888888" />
					</mesh>
				</group>
			)}

			{showPop && popPos && (
				<PopParticles
					position={popPos}
					color={data.color}
					onComplete={handlePopComplete}
				/>
			)}
		</>
	);
};
