export type AimPosition = {
	x: number;
	y: number;
};

export type FireEvent = {
	x: number;
	y: number;
	timestamp: number;
};

export type SharedState = {
	/** 照準座標（ミラー済み正規化座標 0-1） */
	aim: AimPosition | null;
	/** ガンポーズ中フラグ */
	isGunPose: boolean;
	/** 手が検出されているか */
	isHandDetected: boolean;
	/** 発射イベントキュー */
	fireEvents: FireEvent[];
	/** 最後の発射時刻 */
	lastFireTime: number;
};
