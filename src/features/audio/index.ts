/**
 * オーディオマネージャー
 * - ヒット音等: Web Audio API (低遅延)
 * - 出現音: HTMLAudioElement プール (初回再生問題回避)
 */

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
	"target-appear": "/sounds/target-appear.mp3",
};

/** HTMLAudioElement プールを使うサウンド */
const HTML_AUDIO_SOUNDS: Set<SoundName> = new Set(["target-appear"]);
const POOL_SIZE = 4;

// --- Web Audio API ---

let audioCtx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
let loaded = false;

let activeSources = 0;
const MAX_CONCURRENT = 5;

const getContext = (): AudioContext => {
	if (!audioCtx) {
		audioCtx = new AudioContext();
	}
	return audioCtx;
};

// --- HTMLAudioElement プール ---

const audioPools = new Map<SoundName, HTMLAudioElement[]>();
const poolIndex = new Map<SoundName, number>();

const initHtmlPool = (name: SoundName, path: string) => {
	const pool: HTMLAudioElement[] = [];
	for (let i = 0; i < POOL_SIZE; i++) {
		const audio = new Audio(path);
		audio.preload = "auto";
		audio.load();
		pool.push(audio);
	}
	audioPools.set(name, pool);
	poolIndex.set(name, 0);
};

const playHtmlAudio = (name: SoundName, volume: number) => {
	const pool = audioPools.get(name);
	if (!pool) return;
	const idx = poolIndex.get(name) ?? 0;
	const audio = pool[idx];
	audio.volume = volume;
	audio.currentTime = 0;
	audio.play().catch(() => {});
	poolIndex.set(name, (idx + 1) % pool.length);
};

// --- 公開 API ---

/** 全サウンドを事前にフェッチ＆デコード/プリロード */
export const preloadSounds = async (): Promise<void> => {
	if (loaded) return;
	const ctx = getContext();

	await Promise.all(
		(Object.entries(SOUND_PATHS) as [SoundName, string][]).map(
			async ([name, path]) => {
				if (name in HTML_AUDIO_SOUNDS) {
					initHtmlPool(name, path);
				} else {
					const res = await fetch(path);
					const arrayBuffer = await res.arrayBuffer();
					const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
					buffers.set(name, audioBuffer);
				}
			},
		),
	);

	loaded = true;
};

/** サウンド再生 */
export const playSound = (name: SoundName, volume = 1.0): void => {
	if (name in HTML_AUDIO_SOUNDS) {
		playHtmlAudio(name, volume);
		return;
	}

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

/** 不要になったトリミング・オフセット関連（UIカタログ用に残す） */
export const setSoundOffset = (_name: SoundName, _offset: number): void => {};
export const getSoundOffset = (_name: SoundName): number => 0;
export const getSoundDuration = (_name: SoundName): number => 0;
export const warmupSounds = (): void => {};
