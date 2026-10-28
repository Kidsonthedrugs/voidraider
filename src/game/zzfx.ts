/**
 * Procedural Audio Synthesizer (ZzFX Architecture)
 * Generates rich 8-bit sound effects directly from mathematical arrays.
 * Zero external audio files or MP3 network requests.
 */

// ZzFX micro sound synthesizer
let audioCtx: AudioContext | null = null;
let masterVolume = 0.35;
let isMuted = false;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundVolume(volume: number) {
  masterVolume = Math.max(0, Math.min(1, volume));
}

export function toggleMute(muted?: boolean): boolean {
  if (muted !== undefined) {
    isMuted = muted;
  } else {
    isMuted = !isMuted;
  }
  return isMuted;
}

export function getMuteState(): boolean {
  return isMuted;
}

export function getSoundVolume(): number {
  return masterVolume;
}

/**
 * Core ZzFX micro synthesis function
 * [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo]
 */
export function zzfx(
  volume = 1,
  randomness = 0.05,
  frequency = 220,
  attack = 0,
  sustain = 0,
  release = 0.1,
  shape = 0,
  shapeCurve = 1,
  slide = 0,
  deltaSlide = 0,
  pitchJump = 0,
  pitchJumpTime = 0,
  repeatTime = 0,
  noise = 0,
  modulation = 0,
  bitCrush = 0,
  delay = 0,
  sustainVolume = 1,
  decay = 0,
  tremolo = 0
): AudioBufferSourceNode | null {
  if (isMuted || masterVolume <= 0) return null;

  try {
    const ctx = getAudioContext();
    const sampleRate = ctx.sampleRate;
    const PI2 = Math.PI * 2;

    const effectiveVolume = volume * masterVolume;
    if (effectiveVolume <= 0) return null;

    // Calculate parameter bounds & randomization
    const sign = (v: number) => (v < 0 ? -1 : 1);
    const startFrequency = frequency * (1 + randomness * (Math.random() * 2 - 1));
    let curSlide = slide;
    let curPitch = startFrequency;

    // Buffer duration calculation
    const totalTime = attack + decay + sustain + release + delay;
    const length = Math.max(1, Math.floor(sampleRate * totalTime));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let phase = 0;
    let b = 0;
    let t = 0;

    for (let i = 0; i < length; ++i) {
      t = i / sampleRate;

      // Envelope logic
      let env = 0;
      if (t < attack) {
        env = t / (attack || 1e-6);
      } else if (t < attack + decay) {
        env = 1 - ((t - attack) / (decay || 1e-6)) * (1 - sustainVolume);
      } else if (t < attack + decay + sustain) {
        env = sustainVolume;
      } else if (t < attack + decay + sustain + release) {
        env = sustainVolume * (1 - (t - attack - decay - sustain) / (release || 1e-6));
      }

      // Slide & frequency modulation
      curSlide += deltaSlide / sampleRate;
      curPitch += curSlide / sampleRate;

      if (pitchJump && t >= pitchJumpTime && pitchJumpTime > 0) {
        curPitch += pitchJump;
        pitchJump = 0;
      }

      if (repeatTime && t % repeatTime < 1 / sampleRate) {
        curPitch = startFrequency;
        curSlide = slide;
      }

      phase += (curPitch * PI2) / sampleRate;

      // Waveform shapes: 0=sin, 1=tri, 2=saw, 3=tan, 4=bitnoise
      let sample = 0;
      if (shape === 0) {
        sample = Math.sin(phase);
      } else if (shape === 1) {
        sample = Math.abs((phase % PI2) - Math.PI) / Math.PI * 2 - 1;
      } else if (shape === 2) {
        sample = ((phase % PI2) / Math.PI) - 1;
      } else if (shape === 3) {
        sample = Math.tan(phase % PI2);
        sample = Math.max(-1, Math.min(1, sample));
      } else {
        sample = Math.random() * 2 - 1;
      }

      // Bitcrush / noise modulation
      if (bitCrush > 0) {
        const steps = Math.max(2, Math.floor(32 * (1 - bitCrush)));
        sample = Math.round(sample * steps) / steps;
      }

      if (noise > 0) {
        sample = sample * (1 - noise) + (Math.random() * 2 - 1) * noise;
      }

      if (tremolo > 0) {
        sample *= 1 - tremolo * (0.5 + 0.5 * Math.sin(t * 30));
      }

      data[i] = sample * env * effectiveVolume * shapeCurve;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    return source;
  } catch {
    return null;
  }
}

// Preset sound effects
export const soundEffects = {
  // Laser blast: sharp fast frequency descent
  shoot: () => zzfx(0.4, 0.05, 520, 0.01, 0.02, 0.08, 2, 1, -800, -200, 0, 0, 0, 0.1),

  // Heavy plasma cannon
  heavyLaser: () => zzfx(0.6, 0.1, 280, 0.02, 0.05, 0.16, 1, 1.2, -450, -100, 0, 0, 0, 0.2),

  // Small shield bounce / collision ping
  shieldHit: () => zzfx(0.5, 0.05, 340, 0.01, 0.03, 0.09, 0, 1, -150, 0, 80, 0.02, 0, 0.05),

  // Explosion: low frequency with noise decay
  explosion: () => zzfx(0.8, 0.2, 90, 0.02, 0.12, 0.35, 4, 1.5, -60, 0, 0, 0, 0, 0.8),

  // Crypto / $VOID gem pickup: crisp dual-arpeggio chime
  cryptoPickup: () => zzfx(0.5, 0, 680, 0.01, 0.04, 0.18, 0, 1.3, 200, 0, 240, 0.04),

  // Shield recharge / buff
  powerup: () => zzfx(0.6, 0, 420, 0.03, 0.08, 0.25, 0, 1.2, 350, 50, 120, 0.06),

  // New wave / level reached: triumphant triad
  waveStart: () => {
    zzfx(0.5, 0, 440, 0.02, 0.08, 0.2, 0, 1);
    setTimeout(() => zzfx(0.5, 0, 554, 0.02, 0.08, 0.2, 0, 1), 100);
    setTimeout(() => zzfx(0.6, 0, 659, 0.02, 0.12, 0.3, 0, 1), 200);
  },

  // Game over descending distress tone
  gameOver: () => {
    zzfx(0.7, 0.1, 320, 0.05, 0.15, 0.4, 2, 1, -280, 0);
    setTimeout(() => zzfx(0.7, 0.1, 220, 0.05, 0.2, 0.5, 2, 1, -200, 0), 220);
    setTimeout(() => zzfx(0.8, 0.1, 140, 0.08, 0.3, 0.7, 4, 1.4, -100, 0), 450);
  },
};
