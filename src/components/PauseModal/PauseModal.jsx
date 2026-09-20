import React from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Home, Settings } from 'lucide-react';
import audioManager from '../../game/AudioManager.js';
import hapticManager from '../../game/HapticManager.js';
import './PauseModal.scss';

export default function PauseModal({
  isOpen,
  onResume,
  onRestart,
  onMainMenu,
  onOpenSettings
}) {
  if (!isOpen) return null;

  return (
    <div className="pause-modal-overlay">
      <motion.div
        className="pause-modal-card"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <span className="pause-badge">GAME SUSPENDED</span>
        <h2 className="pause-title">PAUSED</h2>

        <div className="pause-buttons">
          <button
            className="pause-btn-primary"
            onClick={() => {
              audioManager.playButton();
              hapticManager.selection();
              onResume();
            }}
          >
            <Play size={18} fill="currentColor" />
            <span>RESUME</span>
          </button>

          <button
            className="pause-btn-secondary"
            onClick={() => {
              audioManager.playButton();
              hapticManager.selection();
              onRestart();
            }}
          >
            <RotateCcw size={16} />
            <span>RESTART</span>
          </button>

          <button
            className="pause-btn-secondary"
            onClick={() => {
              audioManager.playButton();
              hapticManager.selection();
              onOpenSettings();
            }}
          >
            <Settings size={16} />
            <span>SETTINGS</span>
          </button>

          <button
            className="pause-btn-secondary danger"
            onClick={() => {
              audioManager.playButton();
              hapticManager.selection();
              onMainMenu();
            }}
          >
            <Home size={16} />
            <span>QUIT TO MENU</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

