export const GAME_CONFIG = {
	camera: {
		width: 640,
		height: 480,
	},

	gesture: {
		/** 照準ベクトル延長倍率 */
		aimExtensionMultiplier: 2.0,
		/** スムージングフレーム数 */
		smoothingFrames: 7,
		/** 発射距離閾値（正規化座標） */
		fireDistanceThreshold: 0.06,
		/** 発射インターバル（ms） */
		fireInterval: 150,
	},

	target: {
		/** 命中判定半径（px） */
		hitRadius: 40,
		/** 地上ターゲット出現間隔（ms） */
		groundSpawnInterval: 2000,
		/** 電車出現間隔（ms） */
		trainSpawnInterval: 8000,
		/** 電車移動速度（px/frame） */
		trainSpeed: 2,
		/** 風船出現間隔（ms） */
		balloonSpawnInterval: 1500,
		/** 風船上昇速度（最小〜最大） */
		balloonSpeedMin: 1.5,
		balloonSpeedMax: 3.5,
	},

	game: {
		/** ゲーム制限時間（秒） */
		timeLimit: 60,
	},
} as const;
