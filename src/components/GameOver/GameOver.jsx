import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Home, Trophy, Zap, Award } from 'lucide-react';
import audioManager from '../../game/AudioManager.js';
import hapticManager from '../../game/HapticManager.js';
import './GameOver.scss';

export default function GameOver({ stats, onPlayAgain, onMainMenu }) {
  if (!stats) return null;

  const { score, bestScore, maxCombo, fruitsSliced, isNewBest, mode } = stats;

  const formattedScore = score.toLocaleString('en-US', { minimumIntegerDigits: 5 });
  const formattedBest = bestScore.toLocaleString('en-US', { minimumIntegerDigits: 5 });

  const handlePlayAgain = () => {
    audioManager.playButton();
    hapticManager.medium();
    onPlayAgain();
  };

  const handleMainMenu = () => {
    audioManager.playButton();
    hapticManager.selection();
    onMainMenu();
  };

  return (
    <div className="game-over-overlay">
      <motion.div
        className="game-over-card"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
      >
        {/* Mode Tag */}
        <div className="game-over-header">
          <span className="mode-badge">{mode} MODE</span>
          <h2 className="game-over-title">GAME OVER</h2>
        </div>

        {/* Score Telemetry */}
        <div className="score-primary-section">
          <span className="score-caption">FINAL SCORE</span>
          <div className="score-number-wrapper">
            <span className="final-score-value">{formattedScore}</span>
            {isNewBest && (
              <motion.span
                className="new-best-pill"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                ★ NEW BEST
              </motion.span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="game-over-stats-grid">
          <div className="stat-item">
            <div className="stat-label-wrap">
              <Trophy size={13} className="stat-icon gold" />
              <span className="stat-label">BEST</span>
            </div>
            <span className="stat-val">{formattedBest}</span>
          </div>

          <div className="stat-item">
            <div className="stat-label-wrap">
              <Zap size={13} className="stat-icon volt" />
              <span className="stat-label">MAX COMBO</span>
            </div>
            <span className="stat-val volt">x{maxCombo}</span>
          </div>

          <div className="stat-item">
            <div className="stat-label-wrap">
              <Award size={13} className="stat-icon" />
              <span className="stat-label">SLICED</span>
            </div>
            <span className="stat-val">{fruitsSliced}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="game-over-actions">
          <button className="btn-play-again" onClick={handlePlayAgain}>
            <RotateCcw size={17} />
            <span>PLAY AGAIN</span>
          </button>

          <button className="btn-main-menu" onClick={handleMainMenu}>
            <Home size={17} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

