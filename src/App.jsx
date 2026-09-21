import React, { useEffect } from 'react';
import Home from './pages/Home.jsx';
import Game from './pages/Game.jsx';
import SettingsSheet from './components/SettingsSheet/SettingsSheet.jsx';
import RotateNotice from './components/RotateNotice/RotateNotice.jsx';
import { useGameState, GAME_STATES } from './hooks/useGameState.js';
import audioManager from './game/AudioManager.js';

export default function App() {
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

  // Unlock AudioContext & preload slice.mp3 audio
  useEffect(() => {
    audioManager.loadSliceAudio();

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

      {/* Main Mobile Screen Stage */}
      <div className="mobile-viewport-stage">
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

        {/* Global Settings Bottom Sheet from Home */}
        <SettingsSheet
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
        />
      </div>
    </>
  );
}

