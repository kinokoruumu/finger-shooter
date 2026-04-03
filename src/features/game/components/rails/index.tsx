/** 常設の線路（画面下部に固定表示） */
export const Rails = ({ y, z }: { y: number; z: number }) => {
	const railLength = 300;
	const tieCount = 120;
	const tieSpacing = railLength / tieCount;

	return (
		<group position={[0, y, z]}>
			{/* レール2本 */}
			<mesh position={[0, 0, 0.5]}>
				<boxGeometry args={[railLength, 0.1, 0.1]} />
				<meshStandardMaterial color="#777777" metalness={0.7} roughness={0.2} />
			</mesh>
			<mesh position={[0, 0, -0.5]}>
				<boxGeometry args={[railLength, 0.1, 0.1]} />
				<meshStandardMaterial color="#777777" metalness={0.7} roughness={0.2} />
			</mesh>
			{/* 枕木 */}
			{Array.from({ length: tieCount }, (_, i) => {
				const x = (i - tieCount / 2) * tieSpacing;
				return (
					<mesh key={`tie-${x}`} position={[x, -0.06, 0]}>
						<boxGeometry args={[0.4, 0.08, 1.5]} />
						<meshStandardMaterial color="#5c3a1e" />
					</mesh>
				);
			})}
		</group>
	);
};
