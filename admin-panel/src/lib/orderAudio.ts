// Web Audio API orqali yangi buyurtma signali (zero-dependency, har doim ishlaydi)
let audioCtx: AudioContext | null = null;
let alertInterval: ReturnType<typeof setInterval> | null = null;
let isAlerting = false;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // brauzer cheklovi bo'lsa kutamiz
  }
}

// Foydalanuvchi sahifani bosishi bilan audio kontekstini uyg'otish
if (typeof window !== 'undefined') {
  const wakeUp = () => {
    unlockAudio();
  };
  window.addEventListener('click', wakeUp, { passive: true });
  window.addEventListener('keydown', wakeUp, { passive: true });
  window.addEventListener('touchstart', wakeUp, { passive: true });
}

/**
 * Restoran buyurtmasi uchun 3-bosqichli maxsus yangroq qo'ng'iroq chimesi
 * Tonalik: 784 Hz (G5) -> 1046.5 Hz (C6) -> 1318.5 Hz (E6)
 */
export function playChime(): void {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // 1-ohang (G5 - 784 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(784, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.4, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.31);

    // 2-ohang (C6 - 1046.5 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.14);
    gain2.gain.setValueAtTime(0.001, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.45, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.49);

    // 3-ohang (E6 - 1318.5 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.5, now + 0.28);
    gain3.gain.setValueAtTime(0.001, now + 0.28);
    gain3.gain.exponentialRampToValueAtTime(0.5, now + 0.32);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.28);
    osc3.stop(now + 0.86);
  } catch (err) {
    console.warn('Audio chalishda xatolik:', err);
  }
}

/**
 * Yangi buyurtma kelganda ovozli signalni boshlash.
 * Buyurtma qabul qilinmaguncha har 2 soniyada qayta-qayta chalinadi.
 */
export function startOrderAlert(): void {
  if (isAlerting) return;
  isAlerting = true;
  unlockAudio();
  playChime();

  if (alertInterval) {
    clearInterval(alertInterval);
  }
  alertInterval = setInterval(() => {
    if (!isAlerting) {
      if (alertInterval) {
        clearInterval(alertInterval);
        alertInterval = null;
      }
      return;
    }
    playChime();
  }, 2000);
}

/**
 * Buyurtma qabul qilinganda yoki barcha yangi buyurtmalar holati o'zgarganda ovozni darhol to'xtatish.
 */
export function stopOrderAlert(): void {
  isAlerting = false;
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}

export function isOrderAlertPlaying(): boolean {
  return isAlerting;
}

export function setSoundMuted(muted: boolean): void {
  isMuted = !!muted;
  if (isMuted) {
    stopOrderAlert();
  }
}

export function getSoundMuted(): boolean {
  return isMuted;
}
