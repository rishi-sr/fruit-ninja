// useGameLoop.js - High-precision requestAnimationFrame React hook

import { useEffect, useRef } from 'react';

export function useGameLoop(callback, isRunning = true) {
  const callbackRef = useRef(callback);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = (timestamp) => {
      const dt = Math.min(0.064, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      if (callbackRef.current) {
        callbackRef.current(dt, timestamp);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning]);
}

export default useGameLoop;

