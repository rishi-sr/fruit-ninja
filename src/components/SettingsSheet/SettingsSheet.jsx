import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Music, Sparkles, Vibrate, Activity } from 'lucide-react';
import audioManager from '../../game/AudioManager.js';
import hapticManager from '../../game/HapticManager.js';
import './SettingsSheet.scss';

export default function SettingsSheet({ isOpen, onClose, settings, onUpdateSettings }) {
  const handleToggle = (key) => {
    const nextVal = !settings[key];
    onUpdateSettings({ [key]: nextVal });
    audioManager.playButton();
    hapticManager.selection();
  };

  const options = [
    { key: 'sound', label: 'SOUND EFFECTS', icon: Volume2 },
    { key: 'music', label: 'AMBIENT SOUNDSCAPE', icon: Music },
    { key: 'particles', label: 'PARTICLE DYNAMICS', icon: Sparkles },
    { key: 'haptics', label: 'HAPTIC FEEDBACK', icon: Vibrate },
    { key: 'screenShake', label: 'SCREEN SHAKE', icon: Activity }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="settings-overlay">
          {/* Backdrop */}
          <motion.div
            className="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="settings-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Grab handle */}
            <div className="sheet-handle" onClick={onClose} />

            {/* Header */}
            <div className="sheet-header">
              <div className="sheet-title-box">
                <span className="sheet-category">SYSTEM CONFIG</span>
                <h3 className="sheet-title">SETTINGS</h3>
              </div>
              <button
                className="sheet-close-btn"
                onClick={() => {
                  audioManager.playButton();
                  onClose();
                }}
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>

            {/* Options List */}
            <div className="sheet-options">
              {options.map(({ key, label, icon: Icon }) => {
                const active = settings[key];
                return (
                  <div
                    key={key}
                    className="sheet-option-row"
                    onClick={() => handleToggle(key)}
                  >
                    <div className="option-info">
                      <div className={`option-icon-wrap ${active ? 'active' : ''}`}>
                        <Icon size={18} />
                      </div>
                      <span className="option-label">{label}</span>
                    </div>

                    {/* Minimalist Apple-style toggle */}
                    <div className={`toggle-track ${active ? 'on' : 'off'}`}>
                      <motion.div
                        className="toggle-thumb"
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Version / Info footer */}
            <div className="sheet-footer">
              <span className="version-tag">BLADE ARCADE • v1.0.0</span>
              <span className="spec-tag">60 FPS • HIGH PRECISION</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

