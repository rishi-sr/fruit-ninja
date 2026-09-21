import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Heart } from 'lucide-react';
import { GAME_MODES } from '../../game/GameEngine.js';
import audioManager from '../../game/AudioManager.js';
import './GameHUD.scss';

export default function GameHUD({
  mode,
  score,
  combo,
  lives,
  timeLeft,
  speedPercent = 100,
  fruitPercent = 100,
  bombIncreasePercent = 0,
  onPause
}) {
  // Pad score: 02480
  const formattedScore = String(score).padStart(5, '0');

  // Format timer: 00:42
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const formattedTime = `${minutes}:${seconds}`;

  return (
    <div className="game-hud-container">
      {/* Top Left: Score */}
      <div className="hud-left">
        <span className="hud-label">SCORE</span>
        <span className="hud-score-value">{formattedScore}</span>
      </div>

      {/* Top Center: Combo or subtle mode notice */}
      <div className="hud-center">
        <AnimatePresence>
          {combo >= 2 && (
            <motion.div
              key={combo}
              className="combo-badge"
              initial={{ scale: 0.6, opacity: 0, y: -6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 25 }}
            >
              <span className="combo-x">x</span>
              <span className="combo-number">{combo}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top Right: Lives (Classic), Timer (Arcade/Zen), and Pause Button */}
      <div className="hud-right">
        {mode === GAME_MODES.CLASSIC && (
          <div className="lives-display">
            {[1, 2, 3].map((heartIndex) => {
              const hasLife = heartIndex <= lives;
              return (
                <div
                  key={heartIndex}
                  className={`heart-slot ${hasLife ? 'active' : 'lost'}`}
                >
                  <Heart
                    size={18}
                    className="heart-icon"
                    fill={hasLife ? '#FF3B30' : 'none'}
                    stroke={hasLife ? '#FF3B30' : '#4A5568'}
                  />
                </div>
              );
            })}
          </div>
        )}

        {(mode === GAME_MODES.ARCADE || mode === GAME_MODES.ZEN) && (
          <div className="timer-display">
            <span className="timer-label">{mode === GAME_MODES.ZEN ? 'TIME' : 'CLOCK'}</span>
            <span className={`timer-digits ${timeLeft <= 10 ? 'urgent' : ''}`}>
              {formattedTime}
            </span>
          </div>
        )}

        {/* Minimalist thumb-friendly pause button */}
        <button
          className="hud-pause-btn"
          onClick={() => {
            audioManager.playButton();
            onPause();
          }}
          aria-label="Pause game"
        >
          <Pause size={18} />
        </button>
      </div>
    </div>
  );
}

