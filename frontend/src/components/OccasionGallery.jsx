import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronUp, X, Heart, Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import axios from 'axios';
import { API_BASE_URL } from '../context/AuthContext';

// 3D Parallax & Magnetic Card component for Occasion
const ParallaxOccasionCard = ({ item, onExpand, onCollectionClick, index, hasDraggedRef }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for 3D tilt
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 180, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 180, damping: 25 });

  // Magnetic displacement
  const cardX = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 25 });
  const cardY = useSpring(useTransform(y, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 25 });

  // Parallax for inner image
  const imgX = useSpring(useTransform(x, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 25 });
  const imgY = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 25 });

  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const relativeX = (e.clientX - rect.left) / width - 0.5;
    const relativeY = (e.clientY - rect.top) / height - 0.5;
    
    x.set(relativeX);
    y.set(relativeY);

    setSpotlightPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        x: cardX,
        y: cardY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (hasDraggedRef && hasDraggedRef.current) return;
        if (onCollectionClick) {
          onCollectionClick(item.title);
        } else if (onExpand) {
          onExpand(item);
        }
      }}
      className="relative w-[260px] sm:w-[330px] aspect-[9/14] rounded-2xl overflow-hidden cursor-pointer group border border-slate-200/40 dark:border-slate-800/80 bg-slate-900 shadow-md hover:shadow-2xl transition-shadow duration-350 select-none flex-shrink-0 no-zoom"
    >
      {/* Background Image with Parallax Offset */}
      <motion.div 
        className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)]"
        style={{ 
          transformStyle: "preserve-3d",
          x: imgX,
          y: imgY
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 saturate-[1.1] brightness-[0.85] no-zoom"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1B0B26] via-[#3F1D5A] to-[#0F071A] flex flex-col items-center justify-center text-center p-4">
            <Sparkles className="h-10 w-10 text-[#D4A75F] animate-pulse mb-2" />
          </div>
        )}
      </motion.div>

      {/* Dark overlay with dynamic gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 group-hover:via-black/50 transition-colors duration-300 z-10" />

      {/* Interactive Spotlight Follower */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(212, 167, 95, 0.22) 0%, transparent 60%)`
        }}
      />

      {/* Text overlay at the bottom exactly matching the reference layout */}
      <div 
        className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center text-center z-30 px-4"
        style={{ transform: "translateZ(30px)" }}
      >
        <h3 className="text-white text-base sm:text-lg font-bold tracking-[0.25em] uppercase border-b border-white/90 pb-1.5 mb-3 group-hover:text-[#D4A75F] group-hover:border-[#D4A75F] transition-colors duration-300">
          {item.title}
        </h3>
        
        {/* Upward Chevron Circle Indicator */}
        <div className="p-2 sm:p-2.5 rounded-full bg-white text-slate-900 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg transform">
          <ChevronUp className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
};

export const OccasionGallery = ({ items: propItems, activeCollection, onCollectionClick }) => {
  const { language } = useTranslation();
  const [selectedItem, setSelectedItem] = useState(null);
  const [dbCollections, setDbCollections] = useState([]);

  const trackRef = useRef(null);
  const trackContainerRef = useRef(null);
  const positionRef = useRef(0);
  const isInteractingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPositionRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const velocityRef = useRef(0);
  const lastMouseXRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const resumeTimeoutRef = useRef(null);
  const singleSetWidthRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const fetchDbCollections = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/collections`);
        if (isMounted && response.data) {
          const mapped = response.data
            .filter(c => c.is_active !== false)
            .map(c => ({
              id: c.id,
              title: c.name || c.title,
              subtitle: c.subtitle || c.description || (language === 'hi' ? 'विशेष संग्रह' : 'Curated Masterpiece'),
              image: (c.image && !c.image.includes('cat_')) ? c.image : ((c.image_url && !c.image_url.includes('cat_')) ? c.image_url : ((c.thumbnail_image && !c.thumbnail_image.includes('cat_')) ? c.thumbnail_image : null)),
              description: c.description || (language === 'hi' ? 'हमारे नवीनतम संग्रह की खोज करें।' : 'Discover our latest handcrafted collection.'),
              tips: Array.isArray(c.styling_tips) && c.styling_tips.length > 0 ? c.styling_tips : [
                language === 'hi' ? 'सुंदर लुक के लिए परिधानों के साथ पहनें।' : 'Pair with classic ensembles for timeless luxury.',
                language === 'hi' ? 'सदाबहार चमक के लिए सोने के डिज़ाइन चुनें।' : 'Explore fine gold craftsmanship for special milestones.'
              ]
            }));
          setDbCollections(mapped);
        }
      } catch (err) {
        console.error("Error fetching dynamic collections:", err);
      }
    };
    fetchDbCollections();
    return () => { isMounted = false; };
  }, [language]);

  const items = (propItems && propItems.length > 0) ? propItems : dbCollections;

  const handleInteractionStart = () => {
    isInteractingRef.current = true;
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const handleInteractionEnd = () => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2500);
  };

  // RAF loop for continuous 60fps auto-play & smooth wrap-around
  useEffect(() => {
    let animationFrameId;
    let lastTimestamp = performance.now();

    const updatePosition = (timestamp) => {
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const track = trackRef.current;
      if (track && items.length > 0) {
        const totalWidth = track.scrollWidth;
        const singleSetWidth = totalWidth / 3;
        singleSetWidthRef.current = singleSetWidth;

        if (singleSetWidth > 0) {
          // Initialize position to middle set once measured
          if (positionRef.current === 0) {
            positionRef.current = -singleSetWidth;
          }

          // Auto-play when not interacting, hovering, or dragging
          if (!isInteractingRef.current && !isHoveredRef.current && !isDraggingRef.current) {
            const speed = singleSetWidth / 35; // 35 seconds per single set loop
            positionRef.current -= speed * Math.min(deltaTime, 0.1);
          } else if (!isDraggingRef.current && Math.abs(velocityRef.current) > 0.05) {
            positionRef.current += velocityRef.current;
            velocityRef.current *= 0.90; // Momentum inertia friction
          }

          // Infinite wrap within [-2*W, 0]
          if (positionRef.current <= -2 * singleSetWidth) {
            positionRef.current += singleSetWidth;
          } else if (positionRef.current > 0) {
            positionRef.current -= singleSetWidth;
          }

          track.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
        }
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [items.length]);

  // Global mousemove and mouseup listeners for desktop drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;

      const currentX = e.clientX;
      const dx = currentX - dragStartXRef.current;
      if (Math.abs(dx) > 5) {
        hasDraggedRef.current = true;
      }

      const now = performance.now();
      const dt = (now - lastTimeRef.current) / 1000;
      if (dt > 0) {
        const mouseDx = currentX - lastMouseXRef.current;
        velocityRef.current = mouseDx;
      }
      lastMouseXRef.current = currentX;
      lastTimeRef.current = now;

      positionRef.current = dragStartPositionRef.current + dx;

      const W = singleSetWidthRef.current;
      if (W > 0) {
        while (positionRef.current <= -2 * W) positionRef.current += W;
        while (positionRef.current > 0) positionRef.current -= W;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        handleInteractionEnd();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Wheel listener for horizontal scroll / trackpad support
  useEffect(() => {
    const container = trackContainerRef.current;
    if (!container) return;

    let wheelTimer = null;

    const handleWheel = (e) => {
      const deltaX = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (deltaX !== 0) {
        e.preventDefault();
        handleInteractionStart();

        positionRef.current -= deltaX * 1.2;

        const W = singleSetWidthRef.current;
        if (W > 0) {
          while (positionRef.current <= -2 * W) positionRef.current += W;
          while (positionRef.current > 0) positionRef.current -= W;
        }

        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => {
          handleInteractionEnd();
        }, 200);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    handleInteractionStart();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartPositionRef.current = positionRef.current;
    hasDraggedRef.current = false;
    velocityRef.current = 0;
    lastMouseXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
  };

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    handleInteractionStart();
    isDraggingRef.current = true;
    dragStartXRef.current = e.touches[0].clientX;
    dragStartPositionRef.current = positionRef.current;
    hasDraggedRef.current = false;
    velocityRef.current = 0;
    lastMouseXRef.current = e.touches[0].clientX;
    lastTimeRef.current = performance.now();
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || !e.touches || e.touches.length === 0) return;

    const currentX = e.touches[0].clientX;
    const dx = currentX - dragStartXRef.current;
    if (Math.abs(dx) > 5) {
      hasDraggedRef.current = true;
    }

    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    if (dt > 0) {
      const touchDx = currentX - lastMouseXRef.current;
      velocityRef.current = touchDx;
    }
    lastMouseXRef.current = currentX;
    lastTimeRef.current = now;

    positionRef.current = dragStartPositionRef.current + dx;

    const W = singleSetWidthRef.current;
    if (W > 0) {
      while (positionRef.current <= -2 * W) positionRef.current += W;
      while (positionRef.current > 0) positionRef.current -= W;
    }
  };

  const handleTouchEnd = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      handleInteractionEnd();
    }
  };

  return (
    <section className="relative w-full overflow-hidden py-16 bg-transparent transition-colors duration-300">
      
      {/* Title block remains aligned with parent margins */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl mb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-[#D4A75F] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {language === 'hi' ? 'संग्रह के अनुसार खरीदें' : 'Shop by Collection'}
        </motion.div>
        
        <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#3F1D5A] dark:text-[#EFE7DB] tracking-wide">
          {language === 'hi' ? 'हर संग्रह के लिए विशेष स्टाइल' : 'Styling Curated for Every Collection'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">
          {language === 'hi' 
            ? 'चाहे दैनिक पहनावा हो या विशेष विवाह समारोह, हमारे संग्रह हर पल को अनमोल बनाते हैं।' 
            : 'From daily office statement wear to royal wedding celebrations, find the perfect design matches.'
          }
        </p>
      </div>

      {/* Full-width Carousel Track (no margins, edge-to-edge width) */}
      <div 
        ref={trackContainerRef}
        className="w-full overflow-hidden py-4 relative z-10 select-none touch-pan-y cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => { isHoveredRef.current = true; }}
        onMouseLeave={() => { isHoveredRef.current = false; }}
      >
        <div 
          ref={trackRef} 
          className="flex gap-5 pointer-events-auto"
          style={{ gap: '20px', width: 'max-content' }}
        >
          {/* Triple items array for seamless looping visual alignment */}
          {[...items, ...items, ...items].map((item, index) => (
            <ParallaxOccasionCard 
              key={`${item.id}-${index}`} 
              item={item} 
              onExpand={setSelectedItem} 
              onCollectionClick={onCollectionClick}
              index={index} 
              hasDraggedRef={hasDraggedRef}
            />
          ))}
        </div>
      </div>

      {/* Fullscreen Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-[210] p-2.5 rounded-full bg-slate-100 dark:bg-black/60 text-slate-700 dark:text-white hover:bg-amber-500/20 border border-slate-200 dark:border-white/10 hover:text-[#D4A75F] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Left Side: Occasion Canvas */}
              <div className="md:w-3/5 h-[40vh] md:h-auto relative overflow-hidden bg-slate-900 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
                {selectedItem.image ? (
                  <motion.img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover saturate-[1.1] brightness-[0.95]"
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8 }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1B0B26] via-[#3F1D5A] to-[#0F071A] flex flex-col items-center justify-center p-6 text-center">
                    <Sparkles className="h-12 w-12 text-[#D4A75F] animate-pulse mb-3" />
                    <span className="text-[#D4A75F] text-sm font-serif font-bold uppercase tracking-widest">
                      {selectedItem.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Side: Styling Tips & Description */}
              <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-white dark:bg-slate-950">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4A75F] block mb-1">
                      {selectedItem.subtitle}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-[#3F1D5A] dark:text-[#EFE7DB] leading-tight">
                      {selectedItem.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed">
                    {selectedItem.description}
                  </p>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-[#D4A75F] fill-[#D4A75F]/15" />
                      {language === 'hi' ? 'स्टाइलिंग टिप्स' : 'Expert Styling Tips'}
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-550 dark:text-slate-400">
                      {selectedItem.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A75F] mt-1.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full py-3.5 bg-gradient-to-r from-[#D4A75F] to-[#BF934B] hover:from-[#E4B76F] hover:to-[#CF9F52] text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/5 cursor-pointer"
                  >
                    {language === 'hi' ? 'वापस जाएं' : 'Close Lookbook'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
