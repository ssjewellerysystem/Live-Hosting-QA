import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { ScrollableTrack } from '../pages/Home';

// 3D Parallax & Magnetic Card component for Collection
const ParallaxOccasionCard = ({ item, onClick }) => {
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

  const [spotlightPos, setSpotlightPos] = React.useState({ x: 0, y: 0 });

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
      onClick={onClick}
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
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 saturate-[1.1] brightness-[0.85] no-zoom"
        />
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
        <h3 className="text-white text-base sm:text-lg font-bold tracking-[0.25em] uppercase border-b border-white/90 pb-1.5 mb-1 group-hover:text-[#D4A75F] group-hover:border-[#D4A75F] transition-colors duration-300">
          {item.title}
        </h3>
      </div>
    </motion.div>
  );
};

export const OccasionGallery = ({ items: propItems, englishItems, onCategoryClick }) => {
  const { language } = useTranslation();

  // Fallback defaults
  const defaultItems = {
    en: [
      {
        id: 1,
        title: "Bridal Collection",
        subtitle: "Elegance & Layered Statements",
        image: "/cat_bridal.png",
        description: "Perfect combinations of layered gold chains and heavy bridal ornaments.",
        tips: []
      },
      {
        id: 2,
        title: "Wedding Collection",
        subtitle: "Regal Heritage Kundan",
        image: "/cat_necklaces.png",
        description: "Timeless traditional bridal sets.",
        tips: []
      },
      {
        id: 3,
        title: "Office Wear",
        subtitle: "Minimalistic Luxury Studs",
        image: "/cat_earrings.png",
        description: "Chic and modern office wear.",
        tips: []
      },
      {
        id: 4,
        title: "Daily Wear",
        subtitle: "Versatile Chic Bangles",
        image: "/cat_bracelets.png",
        description: "Comfortable daily wear gold charms.",
        tips: []
      }
    ],
    hi: [
      {
        id: 1,
        title: "ब्राइडल कलेक्शन",
        subtitle: "लालित्य और लेयर्ड आभूषण",
        image: "/cat_bridal.png",
        description: "ब्राइडल आभूषणों का सही संयोजन।",
        tips: []
      },
      {
        id: 2,
        title: "शादी विवाह",
        subtitle: "शाही विरासत कुंदन",
        image: "/cat_necklaces.png",
        description: "सदाबहार पारंपरिक विवाह संग्रह।",
        tips: []
      },
      {
        id: 3,
        title: "ऑफिस वियर",
        subtitle: "न्यूनतम लक्जरी स्टड्स",
        image: "/cat_earrings.png",
        description: "ठाठ और आधुनिक कार्यालय के आभूषण।",
        tips: []
      },
      {
        id: 4,
        title: "दैनिक पहनावा",
        subtitle: "बहुमुखी ब्रेसलेट",
        image: "/cat_bracelets.png",
        description: "आरामदायक सोने के कंगन और झुमके।",
        tips: []
      }
    ]
  };

  const items = (propItems && propItems.length > 0) 
    ? propItems 
    : (propItems && propItems.length === 0 ? [] : defaultItems[language === 'hi' ? 'hi' : 'en']);

  if (!items || items.length === 0) {
    return null;
  }

  const handleCardClick = (item, index) => {
    if (!onCategoryClick) return;
    
    // Resolve corresponding English category name to query the DB correctly
    const engItems = englishItems || [];
    const engItem = engItems[index % items.length];
    const categoryName = engItem ? engItem.title : item.title;
    
    onCategoryClick(categoryName);
  };

  return (
    <section className="relative w-full overflow-hidden py-16 bg-transparent transition-colors duration-300">
      
      {/* Infinite Seamless Marquee CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-horizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-track {
          display: flex;
          gap: 20px;
          width: max-content;
          animation: marquee-horizontal 35s linear infinite;
        }
        .animate-marquee-track:hover {
          animation-play-state: paused;
        }
      `}} />

      {/* Title block remains aligned with parent margins */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl mb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-[#D4A75F] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {language === 'hi' ? 'कलेक्शन के अनुसार खरीदें' : 'Shop by Collection'}
        </motion.div>
        
        <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#3F1D5A] dark:text-[#EFE7DB] tracking-wide">
          {language === 'hi' ? 'कलेक्शन के अनुसार खरीदें' : 'Shop by Collection'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">
          {language === 'hi' 
            ? 'हमारे विशेष रूप से तैयार किए गए आभूषणों के संग्रह की खोज करें।' 
            : 'Discover our exclusive curated jewelry collections.'
          }
        </p>
      </div>

      {/* Full-width Carousel Track */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <ScrollableTrack autoScrollSpeed={0.35}>
          {items.map((item, index) => (
            <ParallaxOccasionCard 
              key={`${item.id}-${index}`} 
              item={item} 
              onClick={() => handleCardClick(item, index)} 
              index={index} 
            />
          ))}
        </ScrollableTrack>
      </div>
    </section>
  );
};
