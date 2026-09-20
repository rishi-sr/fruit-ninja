import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Trophy, Sparkles, Play } from 'lucide-react';
import MenuCanvas from './MenuCanvas.jsx';
import audioManager from '../../game/AudioManager.js';
import hapticManager from '../../game/HapticManager.js';
import './MainMenu.scss';

export default function MainMenu({
  currentMode,
  onSelectMode,
  onStartGame,
  onOpenSettings,
  highScores
}) {
  const [isLaunching, setIsLaunching] = useState(false);
  const currentBestScore = highScores[currentMode] || 0;
  const formattedBest = String(currentBestScore).padStart(6, '0');

  const handleStart = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    audioManager.resume();
    audioManager.playLevelUp();
    hapticManager.heavy();
    setTimeout(() => {
      onStartGame();
    }, 280);
  };

  return (
    <div className="main-menu-screen">
      {/* 60 FPS Interactive Canvas: Slicing, Splashes, Floating 3D Fruits */}
      <MenuCanvas onStartGame={onStartGame} isStarting={isLaunching} />

      {/* Top Header Controls with Safe Area */}
      <header className="menu-header">
        <div className="header-badge">
          <Sparkles size={13} className="badge-sparkle" />
          <span>ARCADE EDITION</span>
        </div>
        <button
          className="header-icon-btn settings-btn"
          onClick={() => {
            audioManager.playButton();
            hapticManager.selection();
            onOpenSettings();
          }}
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Center Cinematic Title & Slice Prompt */}
      <main className="menu-center">
        <motion.div
          className="title-block"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="title-blade-wrapper">
            <h1 className="title-blade">BLADE</h1>
            <div className="title-blade-slash" />
          </div>
          <h2 className="title-sub">FRUIT SLICER</h2>
          <p className="title-tagline">PRECISION • SPEED • CONTROL</p>
        </motion.div>

        {/* Static Play Game Button */}
        <div className="menu-actions">
          <div className="slice-guide-container">
            <button
              className="slice-guide-badge static"
              onClick={handleStart}
              aria-label="Play Game"
            >
              <div className="guide-content">
                <div className="guide-icon-pulse">
                  <Play size={18} fill="currentColor" />
                </div>
                <span className="guide-main-text">PLAY GAME</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Best Score */}
      <footer className="menu-footer">
        <div className="best-score-display">
          <Trophy size={14} className="trophy-icon" />
          <span className="best-label">BEST SCORE</span>
          <span className="best-value">{formattedBest}</span>
        </div>
      </footer>
    </div>
  );
}

