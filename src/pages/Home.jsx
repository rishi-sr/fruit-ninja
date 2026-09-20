import React from 'react';
import MainMenu from '../components/MainMenu/MainMenu.jsx';

export default function Home({
  currentMode,
  onSelectMode,
  onStartGame,
  onOpenSettings,
  highScores
}) {
  return (
    <MainMenu
      currentMode={currentMode}
      onSelectMode={onSelectMode}
      onStartGame={onStartGame}
      onOpenSettings={onOpenSettings}
      highScores={highScores}
    />
  );
}

