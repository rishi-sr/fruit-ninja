import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoaderScreen from './components/LoaderScreen/LoaderScreen.jsx';
import SettingsSheet from './components/SettingsSheet/SettingsSheet.jsx';
import RotateNotice from './components/RotateNotice/RotateNotice.jsx';
import { useGameState, GAME_STATES } from './hooks/useGameState.js';
import audioManager from './game/AudioManager.js';
import assetManager from './game/AssetManager.js';

// Lazy load game views
const Home = lazy(() => import('./pages/Home.jsx'));
const Game = lazy(() => import('./pages/Game.jsx'));

export default function App() {
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(assetManager.loaded);
  const [loadProgress, setLoadProgress] = useState(assetManager.progress);

  const {
    gameState,
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
    sessionKey
  } = useGameState();

  // Preload all assets (textures & slice audio) and unlock AudioContext
  useEffect(() => {
    // Start preloading all 12 game textures and audio buffer
    assetManager
      .loadAll((pct) => {
        setLoadProgress(pct);
      })
      .then(() => {
        setLoadProgress(100);
        // Brief pause at 100% so player sees completion before smooth fade
        setTimeout(() => {
          setIsAssetsLoaded(true);
        }, 360);
      });

    const unlockAudio = () => {
      audioManager.resume();
      audioManager.loadSliceAudio();
    };

    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('mousedown', unlockAudio, { once: true });
    window.addEventListener('click', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('mousedown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  const isGameActive =
    gameState === GAME_STATES.PLAYING ||
    gameState === GAME_STATES.PAUSED ||
    gameState === GAME_STATES.GAME_OVER;

  return (
    <>
      {/* Landscape Orientation Notice */}
      <RotateNotice />

      {/* Preload & Lazy Load Screen Gate */}
      <AnimatePresence mode="wait">
        {!isAssetsLoaded && (
          <LoaderScreen key="app-loader" progress={loadProgress} />
        )}
      </AnimatePresence>

      {/* Main Mobile Screen Stage - Only mounted when all assets are loaded */}
      {isAssetsLoaded && (
        <div className="mobile-viewport-stage">
          <Suspense fallback={null}>
            {/* Screen Routing */}
            {!isGameActive ? (
              <Home
                currentMode={currentMode}
                onSelectMode={setCurrentMode}
                onStartGame={() => startGame(currentMode)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                highScores={highScores}
              />
            ) : (
              <Game
                gameState={gameState}
                currentMode={currentMode}
                settings={settings}
                onUpdateSettings={updateSettings}
                hudState={hudState}
                setHudState={setHudState}
                gameOverStats={gameOverStats}
                onPauseGame={pauseGame}
                onResumeGame={resumeGame}
                onRestartGame={() => startGame(currentMode)}
                onMainMenu={goToMenu}
                onGameOver={handleGameOver}
                sessionKey={sessionKey}
              />
            )}
          </Suspense>

          {/* Global Settings Bottom Sheet */}
          <SettingsSheet
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        </div>
      )}
    </>
  );
}
