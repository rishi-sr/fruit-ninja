import React, { useState } from 'react';
import GameCanvas from '../components/GameCanvas/GameCanvas.jsx';
import GameHUD from '../components/GameHUD/GameHUD.jsx';
import PauseModal from '../components/PauseModal/PauseModal.jsx';
import GameOver from '../components/GameOver/GameOver.jsx';
import SettingsSheet from '../components/SettingsSheet/SettingsSheet.jsx';
import { GAME_STATES } from '../hooks/useGameState.js';

export default function Game({
  gameState,
  currentMode,
  settings,
  onUpdateSettings,
  hudState,
  setHudState,
  gameOverStats,
  onPauseGame,
  onResumeGame,
  onRestartGame,
  onMainMenu,
  onGameOver,
  sessionKey
}) {
  const [isPauseSettingsOpen, setIsPauseSettingsOpen] = useState(false);

  const handleScoreUpdate = (stats) => {
    setHudState(stats);
  };

  const isPaused = gameState === GAME_STATES.PAUSED;
  const isGameOver = gameState === GAME_STATES.GAME_OVER;

  return (
    <div className="game-page-container" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* 60 FPS Canvas Game Engine */}
      <GameCanvas
        key={sessionKey}
        mode={currentMode}
        isPaused={isPaused}
        settings={settings}
        onScoreUpdate={handleScoreUpdate}
        onGameOver={onGameOver}
      />

      {/* Minimalist Top HUD */}
      <GameHUD
        mode={currentMode}
        score={hudState.score}
        combo={hudState.combo}
        lives={hudState.lives}
        timeLeft={hudState.timeLeft}
        speedPercent={hudState.speedPercent || 100}
        fruitPercent={hudState.fruitPercent || 100}
        bombIncreasePercent={hudState.bombIncreasePercent || 0}
        onPause={onPauseGame}
      />

      {/* Pause Modal */}
      <PauseModal
        isOpen={isPaused}
        onResume={onResumeGame}
        onRestart={onRestartGame}
        onMainMenu={onMainMenu}
        onOpenSettings={() => setIsPauseSettingsOpen(true)}
      />

      {/* Game Over Screen */}
      {isGameOver && (
        <GameOver
          stats={gameOverStats}
          onPlayAgain={onRestartGame}
          onMainMenu={onMainMenu}
        />
      )}

      {/* Settings Bottom Sheet (accessible from pause) */}
      <SettingsSheet
        isOpen={isPauseSettingsOpen}
        onClose={() => setIsPauseSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
}

