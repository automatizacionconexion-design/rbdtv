/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { Player } from './components/Player';
import { Overlay } from './components/Overlay';
import { PermanentInfo } from './components/PermanentInfo';
import { Loader } from './components/Loader';
import { useProgramming } from './hooks/useProgramming';
import { AppMode } from './types';

export default function App() {
  const [mode, setMode] = useState<AppMode>('LOADING');
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const programName = useProgramming();

  useEffect(() => {
    // Minimum splash time of 3.5 seconds, but maximum of 10 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 10000);

    // Safety net: If still loading after 12 seconds, force AUDIO mode
    const modeTimer = setTimeout(() => {
      setMode(prev => prev === 'LOADING' ? 'AUDIO' : prev);
    }, 12000);

    return () => {
      clearTimeout(splashTimer);
      clearTimeout(modeTimer);
    };
  }, []);

  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerOverlay = useCallback(() => {
    // Clear any existing timer
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }

    setIsOverlayVisible(true);
    setShowSplash(false); // Hide splash immediately when video starts
    
    overlayTimerRef.current = setTimeout(() => {
      setIsOverlayVisible(false);
      overlayTimerRef.current = null;
    }, 5000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);

  // Remote Control & Interaction Listener
  useEffect(() => {
    const handleInteraction = (e: KeyboardEvent | MouseEvent) => {
      // OK button on most Android TV remotes is 'Enter' or 13
      // Also trigger on any click
      if (e instanceof MouseEvent || e.key === 'Enter' || e.keyCode === 13 || e.key === 'Select') {
        triggerOverlay();
      }
    };

    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [triggerOverlay]);

  // Keep Screen On (Prevent Screensaver)
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && !wakeLock) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock active');
          
          wakeLock.addEventListener('release', () => {
            console.log('Wake Lock released');
            wakeLock = null;
          });
        }
      } catch (err) {
        // Only log if it's not a permission error we expect on first load
        if (!(err instanceof Error && err.name === 'NotAllowedError')) {
          console.error('Wake Lock error:', err);
        }
      }
    };

    // Attempt on visibility change if we already had one
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    // Attempt on any interaction
    const handleInteraction = () => {
      requestWakeLock();
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden cursor-none">
      <AnimatePresence>
        {(showSplash || mode === 'LOADING') && (
          <Loader key="loader" />
        )}
      </AnimatePresence>
      
      <Player 
        mode={mode} 
        setMode={setMode} 
        onOverlayTrigger={triggerOverlay}
      />
      
      <Overlay 
        isVisible={isOverlayVisible} 
        mode={mode} 
        programName={programName} 
      />
      
      <PermanentInfo />
    </div>
  );
}

