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
