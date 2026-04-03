/** Web Audio API ベースの低遅延オーディオマネージャー */

type SoundName = "balloon-pop" | "target-hit";

const SOUND_PATHS: Record<SoundName, string> = {
	"balloon-pop": "/sounds/balloon-pop.mp3",
	"target-hit": "/sounds/target-hit.mp3",
};

let audioCtx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
let loaded = false;

/** 同時再生数を追跡して音量を自動調整 */
let activeSources = 0;
const MAX_CONCURRENT = 5;

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

/** サウンド再生（重複時は音量を自動で下げる） */
export const playSound = (name: SoundName, volume = 1.0): void => {
	const ctx = getContext();
	const buffer = buffers.get(name);
	if (!buffer) return;

	if (ctx.state === "suspended") {
		ctx.resume();
	}

	// 同時再生が多いときは音量を下げる
	const adjustedVolume =
		activeSources >= MAX_CONCURRENT
			? volume * 0.3
			: volume / (1 + activeSources * 0.4);

	const source = ctx.createBufferSource();
	source.buffer = buffer;

	const gain = ctx.createGain();
	gain.gain.value = adjustedVolume;

	source.connect(gain);
	gain.connect(ctx.destination);

	activeSources++;
	source.onended = () => {
		activeSources = Math.max(0, activeSources - 1);
	};

	source.start(0);
};
