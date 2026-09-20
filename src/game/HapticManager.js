// HapticManager - Safe mobile vibration feedback abstraction

class HapticManager {
  constructor() {
    this.isEnabled = true;
    this.hasVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Normal slice: crisp light haptic tap
  light() {
    if (!this.isEnabled || !this.hasVibrate) return;
    try {
      navigator.vibrate(12);
    } catch {
      // Ignored
    }
  }

  // Medium / Perfect slice / Combo: punchy double pulse
  medium() {
    if (!this.isEnabled || !this.hasVibrate) return;
    try {
      navigator.vibrate([18, 30, 22]);
    } catch {
      // Ignored
    }
  }

  // Bomb detonation: heavy visceral rumble
  heavy() {
    if (!this.isEnabled || !this.hasVibrate) return;
    try {
      navigator.vibrate([60, 40, 90]);
    } catch {
      // Ignored
    }
  }

  // UI Selection click
  selection() {
    if (!this.isEnabled || !this.hasVibrate) return;
    try {
      navigator.vibrate(8);
    } catch {
      // Ignored
    }
  }
}

export const hapticManager = new HapticManager();
export default hapticManager;

