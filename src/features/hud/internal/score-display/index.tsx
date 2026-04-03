type Props = {
	score: number;
};

export const ScoreDisplay = ({ score }: Props) => {
	return (
		<div className="flex flex-col items-start">
			<span className="font-bold text-white/60 text-xs uppercase tracking-wider">
				SCORE
			</span>
			<span className="font-bold text-3xl text-white tabular-nums">
				{score.toLocaleString()}
			</span>
		</div>
	);
};
