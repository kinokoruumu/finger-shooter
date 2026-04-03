/** Web Audio API ベースの低遅延オーディオマネージャー */

type SoundName =
	| "balloon-pop"
	| "target-hit"
	| "penalty-hit"
	| "gold-hit"
	| "target-appear";

const SOUND_PATHS: Record<SoundName, string> = {
	"balloon-pop": "/sounds/balloon-pop.mp3",
	"target-hit": "/sounds/target-hit.mp3",
	"penalty-hit": "/sounds/penalty-hit.mp3",
	"gold-hit": "/sounds/gold-hit.mp3",
	"target-appear": "/sounds/target-appear.wav",
};

/** 各サウンドの再生開始オフセット（秒） */
const soundOffsets: Partial<Record<SoundName, number>> = {
	"target-appear": 0,
};

let audioCtx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
const originalBuffers = new Map<SoundName, AudioBuffer>();
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

/**
 * AudioBufferの先頭から指定秒数をトリミングした新しいBufferを返す
 */
const trimBuffer = (
	ctx: AudioContext,
	buffer: AudioBuffer,
	startSec: number,
): AudioBuffer => {
	if (startSec <= 0) return buffer;
	const startSample = Math.floor(startSec * buffer.sampleRate);
	const newLength = buffer.length - startSample;
	if (newLength <= 0) return buffer;

	const trimmed = ctx.createBuffer(
		buffer.numberOfChannels,
		newLength,
		buffer.sampleRate,
	);
	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		const src = buffer.getChannelData(ch);
		const dst = trimmed.getChannelData(ch);
		dst.set(src.subarray(startSample));
	}
	return trimmed;
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
				// 元のバッファも保持（トリミング用）
				originalBuffers.set(name, audioBuffer);
			},
		),
	);

	loaded = true;
};

/** サウンド再生（トリミング済みバッファから再生） */
export const playSound = (name: SoundName, volume = 1.0): void => {
	const ctx = getContext();
	const buffer = buffers.get(name);
	if (!buffer) return;

	if (ctx.state === "suspended") {
		ctx.resume().then(() => playSoundInternal(ctx, buffer, volume));
		return;
	}

	playSoundInternal(ctx, buffer, volume);
};

const playSoundInternal = (
	ctx: AudioContext,
	buffer: AudioBuffer,
	volume: number,
): void => {
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

/** サウンドのオフセットを設定し、バッファをトリミングして差し替え */
export const setSoundOffset = (name: SoundName, offset: number): void => {
	soundOffsets[name] = offset;
	const ctx = getContext();
	const original = originalBuffers.get(name);
	if (original) {
		buffers.set(name, trimBuffer(ctx, original, offset));
	}
};

/** 現在のオフセットを取得 */
export const getSoundOffset = (name: SoundName): number => {
	return soundOffsets[name] ?? 0;
};

/** サウンドの元の長さ（秒）を取得 */
export const getSoundDuration = (name: SoundName): number => {
	return originalBuffers.get(name)?.duration ?? 0;
};
