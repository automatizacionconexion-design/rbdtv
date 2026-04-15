import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { AppMode } from '../types';

interface PlayerProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onOverlayTrigger: () => void;
}

const VIDEO_STREAM = 'https://videostream.shockmedia.com.ar:19360/rbdradio/rbdradio.m3u8';
const AUDIO_STREAM = 'https://streaming.radiosenlinea.com.ar:10637/;'; // Added /; for better stream compatibility

export const Player: React.FC<PlayerProps> = ({ 
  mode, 
  setMode, 
  onOverlayTrigger 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [videoError, setVideoError] = useState(false);

  const isPlayingRef = useRef(false);

  const attemptPlay = useCallback(async (element: HTMLMediaElement | null) => {
    if (!element || isPlayingRef.current) return;
    
    // Guard: Only play the element that matches the current mode
    const isVideoElement = element === videoRef.current;
    const isAudioElement = element === audioRef.current;
    
    if (isVideoElement && mode === 'AUDIO') {
      element.pause();
      return;
    }
    if (isAudioElement && (mode === 'VIDEO' || mode === 'LOADING')) {
      element.pause();
      return;
    }

    // Don't try to play if already playing or in a state that doesn't need it
    if (!element.paused) return;
    
    element.muted = false;
    element.volume = 1;
    
    try {
      isPlayingRef.current = true;
      await element.play();
      console.log('Playback started successfully');
    } catch (error: any) {
      isPlayingRef.current = false;
      if (error.name === 'NotAllowedError') {
        console.log('Autoplay blocked, waiting for interaction');
      } else if (error.name === 'AbortError') {
        return;
      } else {
        console.error('Playback error:', error.name);
      }

      try {
        element.muted = true;
        await element.play();
      } catch (mutedError: any) {
        // Ignore secondary errors
      }
    }
  }, [mode]);

  // Screen Wake Lock
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          // Check if we are in an iframe and if the permission might be blocked
          if (window.self !== window.top) {
            console.log('Wake Lock: Running in iframe, skipping to avoid policy errors');
            return;
          }
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock is active');
        } catch (err: any) {
          // Silently handle permission errors in browser/iframe
          if (err.name !== 'NotAllowedError' && err.name !== 'SecurityError') {
            console.error(`Wake Lock error: ${err.name}, ${err.message}`);
          }
        }
      }
    };

    if (mode === 'VIDEO' || mode === 'AUDIO') {
      requestWakeLock();
    }

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, [mode]);

  // Heartbeat & Stall Detection
  useEffect(() => {
    let lastTime = 0;
    let stallCount = 0;

    const watchdog = setInterval(() => {
      const target = (mode === 'AUDIO') ? audioRef.current : videoRef.current;
      if (!target || isPlayingRef.current) return;

      // Only force play if it's truly paused and not currently buffering/loading
      if (target.paused && target.readyState >= 3 && (mode === 'VIDEO' || mode === 'LOADING' || mode === 'AUDIO')) {
        console.log('Watchdog: target is paused and ready, forcing play');
        target.play().catch(() => {});
      } else if (!target.paused && mode === 'VIDEO' && target === videoRef.current) {
        // Stall detection for video
        if (target.currentTime === lastTime && target.currentTime > 0) {
          stallCount++;
          console.log(`Watchdog: video stall count ${stallCount}`);
          if (stallCount === 5) {
            console.log('Watchdog: video stalled, forcing play/recovery');
            target.play().catch(() => {});
          }
          if (stallCount >= 15) {
            console.log('Watchdog: video stalled too long, switching to audio');
            setVideoError(true);
            setMode('AUDIO');
            stallCount = 0;
          }
        } else {
          lastTime = target.currentTime;
          stallCount = 0;
        }
      }
    }, 1000);

    return () => clearInterval(watchdog);
  }, [mode]);

  useEffect(() => {
    const handleInteraction = () => {
      const target = (mode === 'AUDIO') ? audioRef.current : videoRef.current;
      if (target && target.paused) {
        target.muted = false;
        target.volume = 1;
        target.play().catch(e => console.warn('Interaction play failed:', e));
      }
    };

    const events = ['click', 'keydown', 'touchstart', 'mousedown', 'pointerdown', 'wheel'];
    events.forEach(event => window.addEventListener(event, handleInteraction));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleInteraction));
    };
  }, [mode]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (mode === 'LOADING') {
      // Fallback timeout reduced to 8 seconds for faster Auto DJ switch
      timeout = setTimeout(() => {
        if (!videoRef.current || (videoRef.current.paused && videoRef.current.currentTime === 0)) {
          console.log('Video failed to start in 8s, switching to audio mode');
          setVideoError(true);
          setMode('AUDIO');
        }
      }, 8000);
    }

    return () => clearTimeout(timeout);
  }, [mode, setMode]);

  // Background Video Reconnection
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (mode === 'AUDIO') {
      interval = setInterval(async () => {
        try {
          const response = await fetch(VIDEO_STREAM, { method: 'GET', cache: 'no-store' });
          if (response.ok) {
            const text = await response.text();
            // Basic check to ensure it's a valid HLS manifest
            if (text.includes('#EXTM3U')) {
              console.log('Background check: Video stream detected, switching back to VIDEO mode');
              setVideoError(false);
              setMode('VIDEO');
            }
          }
        } catch (e) {
          // Silent fail, stream still down or unreachable
        }
      }, 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, setMode]);

  const hasTriggeredInitialOverlay = useRef(false);

  useEffect(() => {
    if (videoRef.current) {
      const handleEnded = () => {
        console.log('Video ended, switching to audio mode');
        setVideoError(true);
        setMode('AUDIO');
      };

      videoRef.current.addEventListener('ended', handleEnded);
      
      return () => {
        videoRef.current?.removeEventListener('ended', handleEnded);
      };
    }
  }, [setMode]);

  useEffect(() => {
    let hls: Hls | null = null;

    if (mode === 'LOADING' || mode === 'VIDEO') {
      if (Hls.isSupported() && videoRef.current) {
        hls = new Hls({
          autoStartLoad: true,
          manifestLoadingTimeOut: 15000,
          levelLoadingTimeOut: 15000,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(VIDEO_STREAM);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS Manifest parsed');
        });
        hls.on(Hls.Events.LEVEL_LOADED, () => {
          console.log('HLS Level loaded');
        });
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log('HLS Media attached');
        });
        let networkRetryCount = 0;
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                networkRetryCount++;
                console.log(`Fatal network error (retry ${networkRetryCount}), trying to recover...`);
                if (networkRetryCount > 2) {
                  console.log('Too many network errors, switching to audio');
                  setVideoError(true);
                  setMode('AUDIO');
                } else {
                  hls?.startLoad();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Fatal media error, trying to recover...');
                hls?.recoverMediaError();
                // Force play after recovery
                setTimeout(() => attemptPlay(videoRef.current), 1000);
                break;
              default:
                console.error('Unrecoverable HLS Error:', data.type, data.details);
                setVideoError(true);
                setMode('AUDIO');
                break;
            }
          }
        });
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = VIDEO_STREAM;
      }
    }

    return () => {
      if (hls) {
        hls.stopLoad();
        hls.detachMedia();
        hls.destroy();
      }
    };
  }, [mode, attemptPlay, setMode]);

  // Master Playback Controller
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    // Reset playing ref on mode change
    isPlayingRef.current = false;

    if (mode === 'VIDEO' || mode === 'LOADING') {
      if (audio) {
        audio.pause();
        audio.src = "";
        audio.load();
      }
      if (video) {
        attemptPlay(video);
      }
    } else if (mode === 'AUDIO') {
      if (video) {
        video.pause();
        // Don't clear video src here if HLS is managing it, 
        // HLS effect cleanup will handle it.
      }
      if (audio) {
        attemptPlay(audio);
      }
    }
  }, [mode, attemptPlay]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Video Player */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${(mode === 'VIDEO' || mode === 'LOADING') ? 'block' : 'hidden'}`}
        playsInline
        muted={false}
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Audio Player */}
      <audio 
        ref={audioRef} 
        src={mode === 'AUDIO' ? AUDIO_STREAM : undefined} 
        className="hidden" 
        preload="auto"
        crossOrigin="anonymous"
        muted={false}
      />

      {/* Audio Mode Background Video */}
      {mode === 'AUDIO' && (
        <video
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          src="https://rbdradio.com/placa.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {/* Off Air Screen */}
      {mode === 'OFF_AIR' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-center p-10">
          <h1 className="text-white text-7xl font-bold mb-6 tracking-tighter uppercase">RBD RADIO</h1>
          <p className="text-white/80 text-3xl font-light mb-4">En este momento no hay transmisión en vivo</p>
          <p className="text-white/40 text-xl uppercase tracking-widest">Las 24 horas haciendo radio</p>
        </div>
      )}
    </div>
  );
};
