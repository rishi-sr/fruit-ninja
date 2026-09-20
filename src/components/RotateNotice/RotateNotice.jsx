import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import './RotateNotice.scss';

export default function RotateNotice() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Only trigger if mobile device or viewport is strongly landscape
      // and height is small like a phone in landscape (< 550px)
      const isNarrowHeight = window.innerHeight < 550 && window.innerWidth > window.innerHeight;
      setIsLandscape(isNarrowHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isLandscape) return null;

  return (
    <div className="rotate-notice-overlay">
      <div className="rotate-notice-content">
        <div className="phone-rotate-icon-wrapper">
          <Smartphone size={48} className="phone-icon" />
        </div>
        <h2 className="rotate-title">PORTRAIT REQUIRED</h2>
        <p className="rotate-subtitle">PLEASE ROTATE YOUR DEVICE</p>
      </div>
    </div>
  );
}

