import React, { useEffect, useRef, useState } from 'react';

interface VideoSplashProps {
  onComplete: () => void;
}

const VideoSplash: React.FC<VideoSplashProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [fadeOut, setFadeOut] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const LOAD_TIMEOUT_MS = 6000;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = () => {
    if (fadeOut) return;
    setFadeOut(true);
    setTimeout(() => onComplete(), 650);
  };

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    // If video doesn't start within timeout, just skip to app silently
    timeoutRef.current = setTimeout(() => {
      if (!videoLoaded) finish();
    }, LOAD_TIMEOUT_MS);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleEnded = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    finish();
  };

  // Video failed to load — just skip silently, no error banner
  const handleError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    finish();
  };

  const handleCanPlay = () => {
    setVideoLoaded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease',
        overflow: 'hidden',
      }}
    >
      {/* Only show offline banner when the device is genuinely offline */}
      {offline && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 20px',
            background: 'rgba(239,68,68,0.95)',
            backdropFilter: 'blur(8px)',
            animation: 'slideDown 0.35s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
          <div>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Sin conexión a internet
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Tu red no está activa. Por favor volvé cuando tengas conexión.
            </p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src="/tufix-intro.mp4"
        autoPlay
        playsInline
        muted
        controls={false}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={handleCanPlay}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VideoSplash;

const VideoSplash: React.FC<VideoSplashProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [videoError, setVideoError] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  // How many seconds to wait before assuming the video is stalled on slow network
  const LOAD_TIMEOUT_MS = 8000;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = () => {
    if (fadeOut) return;
    setFadeOut(true);
    setTimeout(() => onComplete(), 650);
  };

  useEffect(() => {
    // Online / offline listeners
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    // Stall / slow-network timeout
    timeoutRef.current = setTimeout(() => {
      // If the video hasn't started playing after LOAD_TIMEOUT_MS, show offline banner
      if (videoRef.current && videoRef.current.readyState < 3) {
        setVideoError(true);
        // Give 3 more seconds with the banner, then proceed to app
        setTimeout(() => finish(), 3000);
      }
    }, LOAD_TIMEOUT_MS);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleEnded = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    finish();
  };

  const handleError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVideoError(true);
    setTimeout(() => finish(), 3000);
  };

  const handleCanPlay = () => {
    // Video is ready — clear the slow-network timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Offline / slow-network banner ─────────────────────────── */}
      {(offline || videoError) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 20px',
            background: 'rgba(239,68,68,0.95)',
            backdropFilter: 'blur(8px)',
            animation: 'slideDown 0.35s ease',
          }}
        >
          {/* Wifi-off icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
          <div>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Sin conexión a internet
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Tu red no está activa. Por favor volvé cuando tengas conexión.
            </p>
          </div>
        </div>
      )}

      {/* ── Video ───────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src="/tufix-intro.mp4"
        autoPlay
        playsInline
        muted={false}
        controls={false}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={handleCanPlay}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VideoSplash;