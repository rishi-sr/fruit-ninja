// AssetManager.js - Central asset cache & preloader for 3D Real Fruit Models, Background & Slice Audio
import audioManager from './AudioManager.js';

class AssetManager {
  constructor() {
    this.images = {};
    this.loaded = false;
    this.progress = 0;
    this.listeners = [];
    this.progressListeners = [];
    this.loadingPromise = null;
  }

  loadAll(onProgress) {
    if (onProgress && typeof onProgress === 'function') {
      this.progressListeners.push(onProgress);
    }

    if (this.loaded) {
      if (onProgress) onProgress(100, 'ready');
      return Promise.resolve();
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    const rawBase = import.meta.env.BASE_URL || '/';
    const base = rawBase.endsWith('/') ? rawBase : rawBase + '/';
    const assets = {
      fnbg: `${base}fnbg.png`,
      apple: `${base}assets/fruits/apple.png`,
      applecut: `${base}assets/fruits/applecut.png`,
      watermelon: `${base}assets/fruits/watermelon.png`,
      watermeloncut: `${base}assets/fruits/watermeloncut.png`,
      orange: `${base}assets/fruits/orange.png`,
      orangecut: `${base}assets/fruits/orangecut.png`,
      kiwi: `${base}assets/fruits/kiwi.png`,
      kiwicut: `${base}assets/fruits/kiwicut.png`,
      strawberry: `${base}assets/fruits/strawberry.png`,
      strawberrycut: `${base}assets/fruits/strawberrycut.png`,
      bomb: `${base}assets/fruits/bomb.png`
    };

    const entries = Object.entries(assets);
    const totalAssets = entries.length + 1; // +1 for slice.mp3 Web Audio buffer
    let loadedCount = 0;

    const notify = (key) => {
      loadedCount++;
      const pct = Math.min(100, Math.round((loadedCount / totalAssets) * 100));
      this.progress = pct;
      this.progressListeners.forEach((fn) => {
        try {
          fn(pct, key);
        } catch (e) {
          console.error(e);
        }
      });
    };

    // Preload slice audio buffer polyphonically
    const audioPromise = audioManager
      .loadSliceAudio()
      .then(() => notify('sliceAudio'))
      .catch(() => notify('sliceAudio'));

    // Preload & decode all 12 images
    const imagePromises = entries.map(([key, src]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;

        let handled = false;
        const handleSuccess = () => {
          if (handled) return;
          handled = true;
          this.images[key] = img;
          notify(key);
          resolve();
        };

        const handleError = () => {
          if (handled) return;
          handled = true;
          console.warn(`AssetManager: Failed to load asset ${src}`);
          notify(key);
          resolve();
        };

        if (img.decode) {
          img
            .decode()
            .then(handleSuccess)
            .catch(() => {
              if (img.complete && img.naturalWidth > 0) {
                handleSuccess();
              } else {
                img.onload = handleSuccess;
                img.onerror = handleError;
              }
            });
        } else {
          img.onload = handleSuccess;
          img.onerror = handleError;
        }
      });
    });

    this.loadingPromise = Promise.all([...imagePromises, audioPromise]).then(() => {
      this.loaded = true;
      this.progress = 100;
      this.listeners.forEach((fn) => {
        try {
          fn();
        } catch (e) {
          console.error(e);
        }
      });
      this.listeners = [];
    });

    return this.loadingPromise;
  }

  onReady(fn) {
    if (this.loaded) {
      fn();
    } else {
      this.listeners.push(fn);
    }
  }

  get(key) {
    return this.images[key] || null;
  }
}

export const assetManager = new AssetManager();
export default assetManager;
