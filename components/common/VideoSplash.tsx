import React, { useEffect, useRef, useState } from 'react';

interface VideoSplashProps {
  onComplete: () => void;
}

const VideoSplash: React.FC<VideoSplashProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [offline, setOffline] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFadeOut(true);
    setTimeout(() => onComplete(), 600);
  };

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    // Hard fallback — always move to app after 12s no matter what
    const fallback = setTimeout(() => finish(), 12000);

    const video = videoRef.current;
    if (!video) { clearTimeout(fallback); finish(); return; }

    // Try to play as soon as possible
    const tryPlay = () => {
      video.play().catch(() => {
        // Autoplay blocked or error — just go to app
        clearTimeout(fallback);
        finish();
      });
    };

    video.addEventListener('canplay', tryPlay, { once: true });
    video.addEventListener('ended',   () => { clearTimeout(fallback); finish(); }, { once: true });
    video.addEventListener('error',   () => { clearTimeout(fallback); finish(); }, { once: true });

    // If video hasn't started within 5s, just proceed
    const quickFallback = setTimeout(() => {
      if (!video.currentTime || video.paused) finish();
    }, 5000);

    return () => {
      clearTimeout(fallback);
      clearTimeout(quickFallback);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.6s ease',
      overflow: 'hidden',
    }}>
      {/* Offline banner — only shows if device has no internet */}
      {offline && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px',
          background: 'rgba(220,38,38,0.95)',
          animation: 'slideDown 0.35s ease',
          fontFamily: 'Inter, sans-serif',
        }}>
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
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0 }}>Sin conexión a internet</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, margin: 0 }}>Tu red no está activa. Por favor volvé cuando tengas conexión.</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src="/tufix-intro.mp4"
        playsInline
        muted
        controls={false}
        preload="auto"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default VideoSplash;