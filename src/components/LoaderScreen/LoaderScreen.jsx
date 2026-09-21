import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import './LoaderScreen.scss';

export default function LoaderScreen({ progress = 0 }) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // Dynamic tactical arcade status text
  let statusText = 'SHARPENING KATANA...';
  if (clampedProgress >= 100) {
    statusText = 'DOJO READY • ENTERING...';
  } else if (clampedProgress >= 80) {
    statusText = 'TUNING BLADE ACOUSTICS...';
  } else if (clampedProgress >= 55) {
    statusText = 'POLISHING MAHOGANY BOARD...';
  } else if (clampedProgress >= 25) {
    statusText = 'PREPARING 3D ORCHARD FRUITS...';
  }

  return (
    <motion.div
      className="loader-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Ambient background glow */}
      <div className="loader-ambient-glow" />

      {/* Floating particles background */}
      <div className="loader-particles">
        {[...Array(12)].map((_, i) => (
          <span key={i} className={`particle p-${i}`} />
        ))}
      </div>

      <div className="loader-content">
        {/* Animated Blade Crest Emblem */}
        <div className="loader-crest">
          <div className="crest-ring-outer" />
          <div className="crest-ring-inner" />
          <div className="crest-core">
            <span className="crest-fruit-emoji">🍉</span>
          </div>
          <div className="crest-blade-slash" />
        </div>

        {/* Title Header */}
        <div className="loader-title-block">
          <h1 className="loader-title">BLADE</h1>
          <h2 className="loader-subtitle">PRECISION FRUIT SLICER</h2>
        </div>

        {/* Progress Bar Container */}
        <div className="loader-bar-section">
          <div className="loader-progress-track">
            <motion.div
              className="loader-progress-fill"
              style={{ width: `${clampedProgress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            >
              <div className="fill-shimmer" />
            </motion.div>
          </div>

          {/* Progress Digits and Status */}
          <div className="loader-meta-row">
            <span className="loader-status-text">
              <Sparkles size={11} className="sparkle-icon" />
              {statusText}
            </span>
            <span className="loader-percent-digit">{clampedProgress}%</span>
          </div>
        </div>
      </div>

      {/* Safe bottom watermark */}
      <footer className="loader-footer">
        <span>ARCADE EDITION • 60 FPS</span>
      </footer>
    </motion.div>
  );
}

