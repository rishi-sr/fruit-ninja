// useGameState.js - High-performance Game State & LocalStorage Persistence Hook

import { useState, useEffect, useCallback } from 'react';
import { GAME_MODES } from '../game/GameEngine.js';

export const GAME_STATES = {
  MENU: 'MENU',
  MODE_SELECT: 'MODE_SELECT',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

const HIGH_SCORE_KEY = 'blade_high_scores_v1';
const SETTINGS_KEY = 'blade_settings_v1';

const DEFAULT_SETTINGS = {
  sound: true,
  music: true,
  particles: true,
  haptics: true,
  screenShake: true
};

const DEFAULT_SCORES = {
  [GAME_MODES.CLASSIC]: 8640,
  [GAME_MODES.ARCADE]: 4250,
  [GAME_MODES.ZEN]: 3120
};

export function useGameState() {
  const [gameState, setGameState] = useState(GAME_STATES.MENU);
  const [currentMode, setCurrentMode] = useState(GAME_MODES.CLASSIC);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // Load high scores from localStorage
  const [highScores, setHighScores] = useState(() => {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignored
    }
    return DEFAULT_SCORES;
  });

  // Load settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // Ignored
    }
    return DEFAULT_SETTINGS;
  });

  // Real-time HUD telemetry
  const [hudState, setHudState] = useState({
    score: 0,
    combo: 0,
    lives: 3,
    timeLeft: 60,
    maxCombo: 0,
    fruitsSliced: 0
  });

  // Summary at Game Over
  const [gameOverStats, setGameOverStats] = useState(null);

  // Persist settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  }, []);

  // Update high score
  const checkAndUpdateHighScore = useCallback((mode, score) => {
    let isNewBest = false;
    setHighScores(prev => {
      const currentBest = prev[mode] || 0;
      if (score > currentBest) {
        isNewBest = true;
        const updated = { ...prev, [mode]: score };
        try {
          localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(updated));
        } catch {
          // Ignored
        }
        return updated;
      }
      return prev;
    });
    return isNewBest;
  }, []);

  // Actions
  const startGame = useCallback((mode = currentMode) => {
    setCurrentMode(mode);
    setHudState({
      score: 0,
      combo: 0,
      lives: 3,
      timeLeft: mode === GAME_MODES.ARCADE ? 60 : mode === GAME_MODES.ZEN ? 90 : 0,
      maxCombo: 0,
      fruitsSliced: 0
    });
    setGameOverStats(null);
    setGameState(GAME_STATES.PLAYING);
    setSessionKey(prev => prev + 1);
  }, [currentMode]);

  const pauseGame = useCallback(() => {
    setGameState(GAME_STATES.PAUSED);
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(GAME_STATES.PLAYING);
  }, []);

  const handleGameOver = useCallback((stats) => {
    const isNewBest = checkAndUpdateHighScore(stats.mode, stats.score);
    const bestScore = Math.max(highScores[stats.mode] || 0, stats.score);
    setGameOverStats({
      ...stats,
      isNewBest,
      bestScore
    });
    setGameState(GAME_STATES.GAME_OVER);
  }, [checkAndUpdateHighScore, highScores]);

  const goToMenu = useCallback(() => {
    setGameState(GAME_STATES.MENU);
  }, []);

  const goToModeSelect = useCallback(() => {
    setGameState(GAME_STATES.MODE_SELECT);
  }, []);

  return {
    gameState,
    setGameState,
    currentMode,
    setCurrentMode,
    highScores,
    settings,
    updateSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    hudState,
    setHudState,
    gameOverStats,
    startGame,
    pauseGame,
    resumeGame,
    handleGameOver,
    goToMenu,
    goToModeSelect,
    sessionKey
  };
}

export default useGameState;

