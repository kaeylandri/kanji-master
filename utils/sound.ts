// utils/sound.ts

// ==========================================
// 1. SUARA ACHIEVEMENT (Ta-da! / Ceria)
// ==========================================
export function playAchievementSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();

    // Nada C5, E5, G5, C6 (Chord C Major)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle"; // Suara lebih lembut
      osc.frequency.value = freq;
      
      // Mainkan berurutan (arpeggio)
      const startTime = ctx.currentTime + index * 0.1;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });
  } catch (e) {
    console.error("Audio tidak didukung browser", e);
  }
}

// ==========================================
// 2. SUARA API (Whoosh / Terbakar)
// ==========================================
export function playFireSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();

    // 1. Noise Buffer untuk suara angin/api
    const bufferSize = ctx.sampleRate * 1.5; // 1.5 detik
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // 2. Filter agar suara terdengar seperti "Whoosh" (bukan desis tajam)
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.5);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.5);

    // 3. Volume Envelope (naik lalu turun)
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    // 4. Sambungkan
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start();
    noiseNode.stop(ctx.currentTime + 1.5);
  } catch (e) {
    console.error("Audio tidak didukung browser", e);
  }
}

// ==========================================
// 3. SUARA NOTIFIKASI POP-UP (Ceria)
// ==========================================
export function playPopupSound() {
  if (typeof window === "undefined") return;
  
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    
    // Pastikan AudioContext langsung bangun (resume) jika browser memblokir
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Nada C5 - E5 - G5
    const notes = [523.25, 659.25, 783.99];
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + index * 0.1;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (e) {}
}