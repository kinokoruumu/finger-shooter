/** Web Audio API ベースの低遅延オーディオマネージャー */

type SoundName = "balloon-pop";

const SOUND_PATHS: Record<SoundName, string> = {
	"balloon-pop": "/sounds/balloon-pop.mp3",
};

let audioCtx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
let loaded = false;

const getContext = (): AudioContext => {
	if (!audioCtx) {
		audioCtx = new AudioContext();
	}
	return audioCtx;
};

/** 全サウンドを事前にフェッチ＆デコード */
export const preloadSounds = async (): Promise<void> => {
	if (loaded) return;
	const ctx = getContext();

	await Promise.all(
		(Object.entries(SOUND_PATHS) as [SoundName, string][]).map(
			async ([name, path]) => {
				const res = await fetch(path);
				const arrayBuffer = await res.arrayBuffer();
				const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
				buffers.set(name, audioBuffer);
			},
		),
	);

	loaded = true;
};

/** サウンド再生（重複再生OK、遅延なし） */
export const playSound = (name: SoundName, volume = 1.0): void => {
	const ctx = getContext();
	const buffer = buffers.get(name);
	if (!buffer) return;

	// AudioContext が suspended なら resume（ユーザー操作後に必要）
	if (ctx.state === "suspended") {
		ctx.resume();
	}

	const source = ctx.createBufferSource();
	source.buffer = buffer;

	const gain = ctx.createGain();
	gain.gain.value = volume;

	source.connect(gain);
	gain.connect(ctx.destination);
	source.start(0);
};
