// AssetManager.js - Central asset cache for user's uploaded 3D Real Fruit Models & Background

class AssetManager {
  constructor() {
    this.images = {};
    this.loaded = false;
    this.listeners = [];
  }

  loadAll() {
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

    const promises = Object.entries(assets).map(([key, src]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          this.images[key] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`AssetManager: Failed to load asset ${src}`);
          resolve();
        };
      });
    });

    return Promise.all(promises).then(() => {
      this.loaded = true;
      this.listeners.forEach((fn) => fn());
      this.listeners = [];
    });
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
assetManager.loadAll();
export default assetManager;
