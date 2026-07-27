import React, { useState, useEffect, useMemo } from 'react';

// Global cache for loaded image URLs to prevent double requests and loading states on re-render
const loadedImagesCache = new Set();

export const LuxuryImage = React.memo(({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  onLoad,
  onError,
  ...props
}) => {
  const isCached = useMemo(() => {
    return src ? loadedImagesCache.has(src) : false;
  }, [src]);
  
  const [status, setStatus] = useState(isCached ? 'loaded' : 'loading');

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    // If it's already in the client-side cache, keep it as 'loaded'
    if (loadedImagesCache.has(src)) {
      setStatus('loaded');
      return;
    }
    setStatus('loading');
  }, [src]);

  // Preload only the currently selected main product image (fetchPriority="high")
  useEffect(() => {
    if (fetchPriority === 'high' && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, fetchPriority]);

  const handleLoad = (e) => {
    if (src) {
      loadedImagesCache.add(src);
    }
    setStatus('loaded');
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setStatus('error');
    if (onError) onError(e);
  };

  return (
    <div className={`relative overflow-hidden w-full h-full flex items-center justify-center ${wrapperClassName}`}>
      {/* Lightweight skeleton loader with shimmer and logo, unrendered after image loads to clean DOM */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-900 z-10">
          <div className="absolute inset-0 luxury-gold-shimmer pointer-events-none" />
          <img
            src="/loading-logo.jpg"
            alt="Loading..."
            className="h-14 w-auto opacity-60 object-contain relative z-20 animate-pulse dark:mix-blend-screen mix-blend-multiply dark:invert-0 invert"
          />
        </div>
      )}

      {/* Error Fallback State */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 border border-[#F2E8D9]/40 dark:border-slate-800/80 p-4 text-center z-10">
          <img
            src="/loading-logo.jpg"
            alt="Image Unavailable"
            className="h-14 w-auto opacity-40 object-contain mb-2 dark:mix-blend-screen mix-blend-multiply dark:invert-0 invert"
          />
          <span className="text-[10px] sm:text-xs font-semibold text-[#D4A75F] tracking-wider uppercase">
            Image Unavailable
          </span>
        </div>
      )}

      {/* Actual Image component with object-fit: contain preserved */}
      {src && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          fetchPriority={fetchPriority}
          className={`${className} transition-opacity duration-500 ease-in-out ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
});

LuxuryImage.displayName = 'LuxuryImage';
