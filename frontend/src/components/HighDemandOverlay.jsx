import React, { useEffect, useRef, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useHighDemand } from '../context/HighDemandContext';
import { AuthContext } from '../context/AuthContext';

export const HighDemandOverlay = () => {
  const { isHighDemandMode } = useHighDemand();
  const { user, loginType, isAdmin } = useContext(AuthContext);
  const location = useLocation();
  const videoRef = useRef(null);

  // Determine if current user or route is exempt (Admin authentication or Admin routes)
  const isExemptAdmin = Boolean(
    isAdmin ||
    user?.is_admin ||
    loginType === 'admin' ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login'
  );

  const shouldShowOverlay = isHighDemandMode && !isExemptAdmin;

  // Imperative DOM ref callback to guarantee iOS Safari & WebKit HTML attributes are set early
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node) {
      node.setAttribute('muted', '');
      node.setAttribute('playsinline', '');
      node.setAttribute('webkit-playsinline', '');
      node.setAttribute('autoplay', '');
      node.setAttribute('loop', '');
      node.setAttribute('disablepictureinpicture', '');
      node.setAttribute('disableremoteplayback', '');
      node.muted = true;
      node.defaultMuted = true;
      node.playsInline = true;
    }
  }, []);

  const attemptPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Autoplay successfully initiated
        })
        .catch((err) => {
          console.warn("[HIGH_DEMAND] Video autoplay restricted by policy:", err);
          
          // Fallback: If autoplay is restricted by platform policy (e.g. iOS Low Power Mode),
          // capture the user's first touch/click anywhere to play seamlessly within a user gesture
          const handleFirstInteraction = () => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
            window.removeEventListener('pointerdown', handleFirstInteraction, true);
            window.removeEventListener('touchstart', handleFirstInteraction, true);
            window.removeEventListener('click', handleFirstInteraction, true);
            window.removeEventListener('keydown', handleFirstInteraction, true);
          };

          window.addEventListener('pointerdown', handleFirstInteraction, { capture: true, once: true });
          window.addEventListener('touchstart', handleFirstInteraction, { capture: true, once: true });
          window.addEventListener('click', handleFirstInteraction, { capture: true, once: true });
          window.addEventListener('keydown', handleFirstInteraction, { capture: true, once: true });
        });
    }
  }, []);

  useEffect(() => {
    if (!shouldShowOverlay) return;

    // Prevent background scrolling while overlay is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Intercept and block keyboard navigation / shortcuts
    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Intercept and block right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Intercept and block mouse wheel & touch scrolling
    const handleScrollTouch = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Handle tab visibility change (e.g., switching back to browser on iOS)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        attemptPlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('wheel', handleScrollTouch, { capture: true, passive: false });
    window.addEventListener('touchmove', handleScrollTouch, { capture: true, passive: false });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Attempt video play programmatically to ensure autoplay success across all browsers
    attemptPlay();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('wheel', handleScrollTouch, { capture: true });
      window.removeEventListener('touchmove', handleScrollTouch, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldShowOverlay, attemptPlay]);

  if (!shouldShowOverlay) return null;

  const handleContainerTap = (e) => {
    // Preserve trusted user activation gesture token by NOT calling e.preventDefault()
    e.stopPropagation();
    attemptPlay();
  };

  return (
    <div
      tabIndex={-1}
      onClick={handleContainerTap}
      onTouchEnd={handleContainerTap}
      className="fixed inset-0 top-0 left-0 w-screen h-screen z-[999999] bg-black overflow-hidden select-none pointer-events-auto flex items-center justify-center cursor-pointer"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 999999
      }}
    >
      <style>{`
        .high-demand-video::-webkit-media-controls {
          display: none !important;
          -webkit-appearance: none !important;
        }
        .high-demand-video::-webkit-media-controls-start-playback-button {
          display: none !important;
          -webkit-appearance: none !important;
        }
        .high-demand-video::-webkit-media-controls-enclosure {
          display: none !important;
        }
      `}</style>
      <video
        ref={setVideoRef}
        src="/high_demand.mp4"
        preload="auto"
        autoPlay
        muted
        defaultMuted
        loop
        playsInline
        webkit-playsinline="true"
        disablePictureInPicture
        controls={false}
        onLoadedMetadata={attemptPlay}
        onCanPlay={attemptPlay}
        onLoadedData={attemptPlay}
        className="high-demand-video w-full h-full object-contain md:object-cover block select-none pointer-events-none"
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};
