import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronUp, X, Heart, Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

// 3D Parallax & Magnetic Card component for Occasion
const ParallaxOccasionCard = ({ item, onExpand, index }) => {
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
      onClick={() => onExpand(item)}
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

export const OccasionGallery = () => {
  const { language } = useTranslation();
  const [selectedItem, setSelectedItem] = useState(null);

  // Occasions Lookbook Data
  const items = {
    en: [
      {
        id: 1,
        title: "Date Night",
        subtitle: "Elegance & Layered Statements",
        image: "/cat_necklaces.png",
        description: "Perfect combinations of layered gold chains, subtle collar necklaces, and delicate hoops. Crafted to make statement memories under candlelit tables.",
        tips: ["Pair with solid dark necklines to highlight gold textures.", "Layer 2-3 chains of varying lengths.", "Keep earrings minimal if layering necklaces."]
      },
      {
        id: 2,
        title: "Wedding Wear",
        subtitle: "Regal Heritage Kundan",
        image: "/cat_bridal.png",
        description: "Ornate traditional bridal choker sets, heavy designer jhumkas, and matching hand ornaments. Tailored for classic royal elegance.",
        tips: ["Complement heavily embroidered outfits with choker-length sets.", "Style with matching maang-tika for classic look.", "Incorporate natural pearls for color balance."]
      },
      {
        id: 3,
        title: "Office Wear",
        subtitle: "Minimalistic Luxury Studs",
        image: "/cat_earrings.png",
        description: "Chic, lightweight, and modern daily-wear items. Understated solitaire bands, studs, and sleek bracelets designed for executive confidence.",
        tips: ["Stick to one key statement piece (e.g. sleek studs or minimalist watch).", "Platinum/white-gold options work best with formal suits.", "Avoid noisy jingling bracelets."]
      },
      {
        id: 4,
        title: "Daily Wear",
        subtitle: "Versatile Chic Bangles",
        image: "/cat_bracelets.png",
        description: "Comfortable, durable, yet elegant gold bands and bracelets. Built for regular wear while retaining luxurious gold textures.",
        tips: ["Mix different gold karats for unique color play.", "Opt for smooth, snag-free lock styles.", "Great for layering alongside wristwatches."]
      }
    ],
    hi: [
      {
        id: 1,
        title: "डिनर डेट",
        subtitle: "लालित्य और लेयर्ड आभूषण",
        image: "/cat_necklaces.png",
        description: "लेयर्ड सोने की जंजीरों, सूक्ष्म कॉलर हार और नाजुक हुप्स का सही संयोजन। मोमबत्ती की रोशनी में सुखद यादें बनाने के लिए डिज़ाइन किया गया।",
        tips: ["सोने की बनावट को उभारने के लिए गहरे रंग के कपड़ों के साथ पहनें।", "अलग-अलग लंबाई की 2-3 चेन लेयर करें।", "हार लेयर करते समय झुमके हल्के रखें।"]
      },
      {
        id: 2,
        title: "शादी विवाह",
        subtitle: "शाही विरासत कुंदन",
        image: "/cat_bridal.png",
        description: "कढ़ाई वाले परिधानों के साथ चोकर-लंबाई वाले सेट पहनें। क्लासिक लुक के लिए मांग-टीका के साथ स्टाइल करें।",
        tips: ["कढ़ाई वाले परिधानों के साथ चोकर-लंबाई वाले सेट पहनें।", "क्लासिक लुक के लिए मांग-टीका के साथ स्टाइल करें।", "रंग संतुलन के लिए प्राकृतिक मोतियों को शामिल करें।"]
      },
      {
        id: 3,
        title: "ऑफिस वियर",
        subtitle: "न्यूनतम लक्जरी स्टड्स",
        image: "/cat_earrings.png",
        description: "ठाठ, हल्के और आधुनिक दैनिक-पहनने वाले आभूषण। कार्यकारी आत्मविश्वास के लिए सुरुचिपूर्ण सॉलिटेयर रिंग, स्टड्स और चिकनी ब्रेसलेट।",
        tips: ["एक प्रमुख आभूषण पहनें (जैसे सूक्ष्म स्टड्स या न्यूनतम ब्रेसलेट)।", "औपचारिक सूट के साथ सफेद सोना/प्लैटिनम सबसे अच्छे लगते हैं।", "आवाज करने वाले कंगन पहनने से बचें।"]
      },
      {
        id: 4,
        title: "दैनिक पहनावा",
        subtitle: "बहुमुखी ब्रेसलेट",
        image: "/cat_bracelets.png",
        description: "आरामदायक, टिकाऊ, फिर भी सुरुचिपूर्ण सोने के छल्ले और कंगन। शानदार बनावट के साथ नियमित रूप से पहनने के लिए उपयुक्त।",
        tips: ["अनोखे लुक के लिए सोने के विभिन्न रंगों को मिलाएं।", "स्मूथ और सुरक्षित लॉक स्टाइल चुनें।", "कलाई घड़ी के साथ लेयरिंग के लिए बेहतरीन।"]
      }
    ]
  }[language === 'hi' ? 'hi' : 'en'];

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
          {language === 'hi' ? 'अवसर के अनुसार लुकबुक' : 'Shop by Occasion'}
        </motion.div>
        
        <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#3F1D5A] dark:text-[#EFE7DB] tracking-wide">
          {language === 'hi' ? 'हर अवसर के लिए विशेष स्टाइल' : 'Styling Curated for Every Occasion'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">
          {language === 'hi' 
            ? 'चाहे दैनिक पहनावा हो या विशेष विवाह समारोह, हमारे संग्रह हर पल को अनमोल बनाते हैं।' 
            : 'From daily office statement wear to royal wedding celebrations, find the perfect design matches.'
          }
        </p>
      </div>

      {/* Full-width Carousel Track (no margins, edge-to-edge width) */}
      <div className="w-full overflow-hidden py-4 relative z-10">
        <div className="animate-marquee-track">
          {/* Double items array for seamless looping visual alignment */}
          {[...items, ...items].map((item, index) => (
            <ParallaxOccasionCard 
              key={`${item.id}-${index}`} 
              item={item} 
              onExpand={setSelectedItem} 
              index={index} 
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
                <motion.img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover saturate-[1.1] brightness-[0.95]"
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8 }}
                />
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
