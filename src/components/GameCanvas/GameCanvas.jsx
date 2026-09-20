import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../../game/GameEngine.js';
import './GameCanvas.scss';

export default function GameCanvas({
  mode,
  isPaused,
  settings,
  onScoreUpdate,
  onGameOver,
  onLifeLost
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize game engine
    const engine = new GameEngine(canvas, {
      onScoreUpdate,
      onGameOver,
      onLifeLost
    });
    engineRef.current = engine;
    engine.applySettings(settings);

    // Dynamic resize handler using ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          engine.resize(width, height);
        }
      }
    });
    resizeObserver.observe(canvas.parentElement);

    // Initial sizing
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      engine.resize(rect.width, rect.height);
    }

    // Start game engine loop with chosen mode
    engine.start(mode);

    // Setup touch handlers with passive: false to block scrolling
    const getPos = (touch) => {
      const b = canvas.getBoundingClientRect();
      return {
        x: touch.clientX - b.left,
        y: touch.clientY - b.top
      };
    };

    const onTouchStart = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const pos = getPos(e.changedTouches[i]);
        engine.handleTouchStart(pos.x, pos.y);
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const pos = getPos(e.changedTouches[i]);
        engine.handleTouchMove(pos.x, pos.y);
      }
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      engine.handleTouchEnd();
    };

    // Pointer events for desktop testing fallback
    let isMouseDown = false;
    const onMouseDown = (e) => {
      isMouseDown = true;
      const b = canvas.getBoundingClientRect();
      engine.handleTouchStart(e.clientX - b.left, e.clientY - b.top);
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      const b = canvas.getBoundingClientRect();
      engine.handleTouchMove(e.clientX - b.left, e.clientY - b.top);
    };

    const onMouseUp = () => {
      if (isMouseDown) {
        isMouseDown = false;
        engine.handleTouchEnd();
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      engine.stop();
      resizeObserver.disconnect();
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [mode]);

  // Handle Pause/Resume
  useEffect(() => {
    if (!engineRef.current) return;
    if (isPaused) {
      engineRef.current.pause();
    } else {
      engineRef.current.resume();
    }
  }, [isPaused]);

  // Handle Settings updates
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.applySettings(settings);
    }
  }, [settings]);

  return (
    <div className="game-canvas-wrapper">
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}

