import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Maximize2, X, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

// 3D Parallax & Magnetic Card component
const ParallaxCard = ({ item, onExpand, index }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring configurations for realistic physics
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 180, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 180, damping: 25 });

  // Magnetic displacement (card shifts slightly toward cursor)
  const cardX = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 25 });
  const cardY = useSpring(useTransform(y, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 25 });

  // Anti-parallax shift for inner image (deep holographic/3D window effect)
  const imgX = useSpring(useTransform(x, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 25 });
  const imgY = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 25 });

  // Coordinates for the gold spotlight hover follower
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
      // Organic floating animation when idle (desynchronized by card index)
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 6 + index * 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
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
      className="relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer group border border-slate-200/50 dark:border-slate-800/80 bg-slate-950 shadow-lg"
    >
      {/* Background Ken Burns Zoom Image with Anti-Parallax Offset */}
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
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 saturate-[1.1] brightness-[0.85]"
        />
      </motion.div>

      {/* Dark overlay with dynamic backdrop-blur */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15 group-hover:via-black/50 transition-colors duration-300 z-10" />

      {/* Interactive Radial Spotlight Follower */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(212, 167, 95, 0.25) 0%, transparent 60%)`
        }}
      />

      {/* Detail Overlay Content */}
      <div 
        className="absolute inset-0 p-6 flex flex-col justify-between items-start z-30"
        style={{ transform: "translateZ(35px)" }}
      >
        {/* Top Tag */}
        <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/35 text-[10px] sm:text-xs font-bold text-[#D4A75F] uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          {item.tag}
        </span>

        {/* Bottom Metadata */}
        <div className="w-full space-y-2">
          <h3 className="text-lg sm:text-xl font-bold font-serif text-white tracking-wide leading-tight group-hover:text-[#D4A75F] transition-colors duration-300">
            {item.title}
          </h3>
          <p className="text-xs text-slate-350 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          <div className="pt-2 flex items-center gap-1.5 text-xs text-[#D4A75F] font-bold group-hover:gap-3 transition-all duration-300">
            <span>Explore Look</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Interactive Expand Trigger Button */}
      <div className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/65 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/10">
        <Maximize2 className="h-4.5 w-4.5" />
      </div>
    </motion.div>
  );
};

export const LuxuryGallery = () => {
  const { language } = useTranslation();
  const [selectedItem, setSelectedItem] = useState(null);

  const items = {
    en: [
      {
        id: 1,
        title: "The Royal Emerald Choker",
        tag: "Imperial Collection",
        image: "/luxury_emerald_necklace.png",
        description: "Intricately detailed 22K gold featuring handpicked deep Colombian emeralds and brilliant cut marquise diamonds.",
        details: ["Metal: 22K Yellow Gold", "Gemstone: Emerald 12.4 Carats", "Diamonds: VVS Clarity, F-G Color", "Timepiece: Handcrafted by Master Artisans (140 hours)"]
      },
      {
        id: 2,
        title: "The Queen's Bridal Trousseau",
        tag: "Heritage Craft",
        image: "/luxury_bridal_set.png",
        description: "A breathtaking bridal set with fine uncut diamonds (polki) and dangling natural Basra pearl embellishments.",
        details: ["Metal: 22K Kundan Gold", "Stones: Certified Uncut Polki Diamonds", "Accents: Basra Pearls & Rubies", "Fit: Custom Made for Regal Brides"]
      },
      {
        id: 3,
        title: "The Infinite Solitaire Band",
        tag: "Modern Romance",
        image: "/luxury_solitaire_ring.png",
        description: "A flawless 4-carat round brilliant cut diamond set in a minimal double-claw platinum setting.",
        details: ["Metal: Platinum 950", "Center Stone: 4.2 Carat Diamond", "Cut: Excellent Ideal Cut", "Certification: GIA Inspected & Laser Inscribed"]
      }
    ],
    hi: [
      {
        id: 1,
        title: "शाही पन्ना चोकर",
        tag: "शाही संग्रह",
        image: "/luxury_emerald_necklace.png",
        description: "चुनिंदा कोलंबियाई पन्ने और चमकदार हीरे से जड़ा हुआ 22 कैरेट सोने का बारीक नक्काशीदार आभूषण।",
        details: ["धातु: 22K पीला सोना", "रत्न: पन्ना 12.4 कैरेट", "हीरा: VVS स्पष्टता, F-G रंग", "निर्माण: मास्टर कारीगरों द्वारा हस्तनिर्मित (140 घंटे)"]
      },
      {
        id: 2,
        title: "राजकुमारी दुल्हन का सेट",
        tag: "विरासत शिल्प",
        image: "/luxury_bridal_set.png",
        description: "बिना कटे हीरों (पोलकी) और लटकते हुए प्राकृतिक बसरा मोती से सजाया गया एक शानदार दुल्हन सेट।",
        details: ["धातु: 22K कुंदन सोना", "पत्थर: प्रमाणित अनकट पोलकी हीरे", "विवरण: बसरा मोती और माणिक्य", "फिट: दुल्हन के लिए अनुकूलित"]
      },
      {
        id: 3,
        title: "अनंत सॉलिटेयर रिंग",
        tag: "आधुनिक रोमांस",
        image: "/luxury_solitaire_ring.png",
        description: "न्यूनतम डबल-क्लॉ प्लैटिनम सेटिंग में एक त्रुटिहीन 4-कैरेट गोल चमकदार कट हीरा।",
        details: ["धातु: प्लैटिनम 950", "मुख्य पत्थर: 4.2 कैरेट हीरा", "कट: उत्कृष्ट आइडियल कट", "प्रमाणन: जीआईए द्वारा प्रमाणित"]
      }
    ]
  }[language === 'hi' ? 'hi' : 'en'];

  return (
    <section className="relative w-full overflow-hidden py-16 bg-transparent transition-colors duration-300">
      {/* Background Ornamentation */}
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#3F1D5A]/5 dark:bg-[#3F1D5A]/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#D4A75F]/3 dark:bg-[#D4A75F]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-[#D4A75F] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            {language === 'hi' ? 'द इंपीरियल लुकबुक' : 'The Imperial Lookbook'}
          </motion.div>
          
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#3F1D5A] dark:text-[#EFE7DB] tracking-wide">
            {language === 'hi' ? 'शाही शिल्प कौशल की झलक' : 'Glimpses of Royal Craftsmanship'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">
            {language === 'hi' 
              ? 'प्रत्येक कृति हमारी सदियों पुरानी शिल्प कौशल और विलासिता की विरासत की गवाही देती है।' 
              : 'Each masterpiece is a testimony to our centuries-old heritage of artistry and luxury design.'
            }
          </p>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <ParallaxCard item={item} onExpand={setSelectedItem} index={index} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fullscreen Interactive Modal Overlay */}
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

              {/* Left Side: Zoomable Image Canvas */}
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

              {/* Right Side: Specifications & Look Details */}
              <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-white dark:bg-slate-950">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4A75F] block mb-1">
                      {selectedItem.tag}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-[#3F1D5A] dark:text-[#EFE7DB] leading-tight">
                      {selectedItem.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed">
                    {selectedItem.description}
                  </p>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                      {language === 'hi' ? 'सामग्री विवरण' : 'Composition Details'}
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-550 dark:text-slate-400">
                      {selectedItem.details.map((spec, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#D4A75F]" />
                          <span>{spec}</span>
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
