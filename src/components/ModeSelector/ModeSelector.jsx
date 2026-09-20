import React from 'react';
import { motion } from 'framer-motion';
import { GAME_MODES } from '../../game/GameEngine.js';
import audioManager from '../../game/AudioManager.js';
import hapticManager from '../../game/HapticManager.js';
import './ModeSelector.scss';

export default function ModeSelector({ currentMode, onSelectMode }) {
  const modes = [
    {
      id: GAME_MODES.CLASSIC,
      title: 'CLASSIC',
      desc: '3 LIVES • BOMBS • COMBOS'
    },
    {
      id: GAME_MODES.ARCADE,
      title: 'ARCADE',
      desc: '60 SECONDS • FRENZY'
    },
    {
      id: GAME_MODES.ZEN,
      title: 'ZEN',
      desc: 'NO BOMBS • PURE FLOW'
    }
  ];

  const handleSelect = (modeId) => {
    if (modeId !== currentMode) {
      audioManager.playButton();
      hapticManager.selection();
      onSelectMode(modeId);
    }
  };

  return (
    <div className="mode-selector-pill-group">
      {modes.map((m) => {
        const isSelected = m.id === currentMode;
        return (
          <button
            key={m.id}
            className={`mode-pill-btn ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSelect(m.id)}
          >
            {isSelected && (
              <motion.div
                className="mode-pill-active-bg"
                layoutId="activeModePill"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              />
            )}
            <span className="mode-title">{m.title}</span>
          </button>
        );
      })}
    </div>
  );
}

