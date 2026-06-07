import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export async function playCelebration(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [1047, 1319, 1568, 2093, 2637];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.13;
        const hold = i === notes.length - 1 ? 0.6 : 0.35;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + hold);
        osc.start(t);
        osc.stop(t + hold);
      });
    } catch {}
    return;
  }
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    for (let i = 0; i < 3; i++) {
      await new Promise<void>(resolve => setTimeout(resolve, i * 180));
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/chime.wav'),
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate(status => {
        if ('didJustFinish' in status && status.didJustFinish) sound.unloadAsync();
      });
    }
  } catch {}
}

export async function playChime(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1047, ctx.currentTime);
      osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
    return;
  }
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/chime.wav'),
      { shouldPlay: true }
    );
    sound.setOnPlaybackStatusUpdate(status => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {}
}
