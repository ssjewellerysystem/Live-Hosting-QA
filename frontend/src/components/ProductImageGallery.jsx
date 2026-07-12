import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, AlertTriangle, Loader2, Image as ImageIcon } from 'lucide-react';

export const ProductImageGallery = ({ images = [], productName = 'Product' }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const touchStartX = useRef(0);
  const modalRef = useRef(null);
  const imgRef = useRef(null);

  const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60';
  const safeImages = images && images.length > 0 ? images : [fallbackImage];
  const currentImage = safeImages[activeIndex];

  // Reset loading/error state when image changes, check if already complete in cache
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
      setImageError(false);
    } else {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [activeIndex, currentImage]);

  const nextImage = () => setActiveIndex((prev) => (prev + 1) % safeImages.length);
  const prevImage = () => setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);

  const zoomScale = 2.5;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) nextImage();
    else if (diff < -50) prevImage();
  };

  const handleMouseMove = (e) => {
    if (!e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    
    

    // Lens dimensions calculated based on zoom scale
    const lensWidth = width / zoomScale;
    const lensHeight = height / zoomScale;

    // Center lens on cursor
    let lensX = x - lensWidth / 2;
    let lensY = y - lensHeight / 2;

    // Constrain lens bounds inside image container
    if (lensX < 0) lensX = 0;
    if (lensY < 0) lensY = 0;
    if (lensX > width - lensWidth) lensX = width - lensWidth;
    if (lensY > height - lensHeight) lensY = height - lensHeight;

    const pctX = (lensX / (width - lensWidth)) * 100;
    const pctY = (lensY / (height - lensHeight)) * 100;
    
    

    setLensPosition({ x: pctX, y: pctY, width: lensWidth, height: lensHeight, left: lensX, top: lensY });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') setIsFullscreenOpen(false);
  };

  useEffect(() => {
    if (isFullscreenOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isFullscreenOpen]);

  return (
    <div className="flex flex-col-reverse gap-4 w-full select-none">
      {/* 1. THUMBNAIL GALLERY SECTION */}
      {safeImages.length > 1 && (
        <div className="flex flex-row gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 justify-center w-full shrink-0">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View ${productName} image ${idx + 1}`}
              className={`relative h-16 w-16 rounded-xl overflow-hidden border-2 bg-white dark:bg-slate-900 transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#D4A75F] outline-none ${
                activeIndex === idx
                  ? 'border-[#D4A75F] shadow-md ring-2 ring-[#D4A75F]/10 scale-95'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                onError={(e) => { e.currentTarget.src = fallbackImage; }}
                className="max-w-full max-h-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* 2. MAIN DISPLAY PORT WITH ZOOM HOVER */}
      {/* Removed overflow-hidden to allow zoom panel to appear outside */}
      <div className="relative flex-grow w-full h-auto min-h-[250px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-center group z-10 hover:z-20 p-5">
        
        {/* Placeholder / Loading State */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 z-10 rounded-3xl">
            <Loader2 className="h-8 w-8 text-[#D4A75F] animate-spin mb-2" />
            <span className="text-xs text-slate-400 font-medium tracking-wide">Loading image...</span>
          </div>
        )}

        {/* Error State */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 z-10 text-slate-400 rounded-3xl">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
            <span className="text-sm font-medium">Failed to load image</span>
            <button 
              onClick={() => { setImageError(false); setImageLoaded(false); }}
              className="mt-4 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Image Container */}
        <div
          onMouseMove={handleMouseMove}
          onMouseEnter={() => {
            
            setZoomActive(true);
          }}
          onMouseLeave={() => {
            
            setZoomActive(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (window.matchMedia('(max-width: 767px)').matches) return;
            setIsFullscreenOpen(true);
          }}
          className="relative w-full h-auto flex items-center justify-center md:cursor-zoom-in"
        >
          <img
            ref={imgRef}
            src={currentImage}
            alt={productName}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-auto object-contain transition-all duration-300 select-none pointer-events-none ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />

          {/* Zoom Lens */}
          {zoomActive && imageLoaded && !imageError && (
            <div
              style={{
                left: `${lensPosition.left}px`,
                top: `${lensPosition.top}px`,
                width: `${lensPosition.width}px`,
                height: `${lensPosition.height}px`,
              }}
              className="hidden md:block absolute bg-[#D4A75F]/10 border border-[#D4A75F]/30 pointer-events-none rounded-xl shadow-[0_0_8px_rgba(212,167,95,0.15)] z-20"
            />
          )}

          {/* Quick Expand Button (Mobile / Desktop) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreenOpen(true);
            }}
            aria-label="Open fullscreen image viewer"
            className={`hidden md:flex absolute bottom-4 right-4 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4A75F] z-30 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Maximize2 className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* 3. ZOOM PREVIEW PANEL (Desktop only, absolute positioned next to main image) */}
        {zoomActive && imageLoaded && !imageError && (
          <div
            className="hidden md:block absolute left-[104%] top-0 w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl z-[100] pointer-events-none overflow-hidden"
          >
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${currentImage})`,
                backgroundPosition: `${lensPosition.x}% ${lensPosition.y}%`,
                backgroundSize: `${zoomScale * 100}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        )}
      </div>

      {/* 4. FULLSCREEN INTERACTIVE MODAL VIEWER */}
      {isFullscreenOpen && (
        <div 
          ref={modalRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="fixed inset-0 bg-black/95 backdrop-blur-lg z-[9999] flex flex-col justify-between p-4 md:p-6 animate-fade-in outline-none"
        >
          {/* Header */}
          <div className="flex justify-between items-center w-full text-white">
            <span className="text-sm font-semibold tracking-wide text-slate-300 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {activeIndex + 1} / {safeImages.length}
            </span>
            <button
              onClick={() => setIsFullscreenOpen(false)}
              aria-label="Close viewer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white focus:outline-none focus:ring-2 focus:ring-[#D4A75F]"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main Large Image & Navigation Arrows */}
          <div className="flex-grow flex items-center justify-center relative my-4">
            {/* Left Button */}
            {safeImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                aria-label="Previous image"
                className="absolute left-2 md:left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white focus:outline-none focus:ring-2 focus:ring-[#D4A75F] z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Centered Image */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="max-w-[90vw] max-h-[75vh] flex items-center justify-center relative"
            >
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-[#D4A75F] animate-spin" />
                </div>
              )}
              <img
                src={currentImage}
                alt={productName}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={`max-w-full max-h-full object-contain rounded-lg select-none transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>

            {/* Right Button */}
            {safeImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                aria-label="Next image"
                className="absolute right-2 md:right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white focus:outline-none focus:ring-2 focus:ring-[#D4A75F] z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails inside Modal */}
          {safeImages.length > 1 && (
            <div className="flex justify-center gap-3 overflow-x-auto py-4 max-w-full scrollbar-none">
              {safeImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-12 w-12 rounded-lg overflow-hidden border-2 bg-slate-900 shrink-0 transition-all ${
                    activeIndex === idx
                      ? 'border-[#D4A75F] ring-2 ring-[#D4A75F]/20 scale-110'
                      : 'border-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <img 
                    src={img} 
                    alt="" 
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = fallbackImage; }}
                    className="w-full h-full object-contain p-0.5" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
