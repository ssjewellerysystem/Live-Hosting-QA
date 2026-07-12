import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const GlobalVideoFooter = () => {
  const containerRef = useRef(null);
  const text = "SS JEWELLERY";

  useEffect(() => {
    const letters = containerRef.current.querySelectorAll('.footer-letter');
    const shadowLetters = containerRef.current.querySelectorAll('.footer-shadow-letter');

    // Staggered stagger entrance reveal for the main letters
    gsap.fromTo(letters,
      {
        opacity: 0,
        filter: 'blur(20px)',
        y: 40,
        scale: 0.85
      },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        scale: 1,
        duration: 1.5,
        stagger: 0.08,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );

    // Staggered reveal for the drop shadow glow layer
    gsap.fromTo(shadowLetters,
      {
        opacity: 0,
        filter: 'blur(30px)',
        y: 40,
        scale: 0.85
      },
      {
        opacity: 0.75,
        filter: 'blur(15px)',
        y: 0,
        scale: 1,
        duration: 1.5,
        stagger: 0.08,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );

    // Dynamic wave hover & motion animations using GSAP
    const handleEnter = (i) => {
      // Scale, lift, and glow the hovered letter
      gsap.to(letters[i], {
        y: -18,
        scale: 1.25,
        filter: 'drop-shadow(0 0 15px rgba(212, 167, 95, 0.8))',
        duration: 0.3,
        ease: 'power2.out'
      });
      if (shadowLetters[i]) {
        gsap.to(shadowLetters[i], {
          y: -18,
          scale: 1.25,
          opacity: 1,
          filter: 'blur(8px)',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
      // Elastic lift for left letter
      if (letters[i - 1]) {
        gsap.to(letters[i - 1], {
          y: -6,
          scale: 1.1,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
      // Elastic lift for right letter
      if (letters[i + 1]) {
        gsap.to(letters[i + 1], {
          y: -6,
          scale: 1.1,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleLeave = (i) => {
      // Reset hovered letter back to baseline
      gsap.to(letters[i], {
        y: 0,
        scale: 1,
        filter: 'none',
        duration: 0.45,
        ease: 'power2.out'
      });
      if (shadowLetters[i]) {
        gsap.to(shadowLetters[i], {
          y: 0,
          scale: 1,
          opacity: 0.75,
          filter: 'blur(15px)',
          duration: 0.45,
          ease: 'power2.out'
        });
      }
      // Reset adjacent letters
      if (letters[i - 1]) {
        gsap.to(letters[i - 1], {
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: 'power2.out'
        });
      }
      if (letters[i + 1]) {
        gsap.to(letters[i + 1], {
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: 'power2.out'
        });
      }
    };

    const enterHandlers = [];
    const leaveHandlers = [];

    // Bind event listeners
    letters.forEach((letter, i) => {
      const enter = () => handleEnter(i);
      const leave = () => handleLeave(i);

      letter.addEventListener('mouseenter', enter);
      letter.addEventListener('mouseleave', leave);

      enterHandlers.push(enter);
      leaveHandlers.push(leave);
    });

    // Cleanup listeners on component unmount
    return () => {
      letters.forEach((letter, i) => {
        letter.removeEventListener('mouseenter', enterHandlers[i]);
        letter.removeEventListener('mouseleave', leaveHandlers[i]);
      });
    };
  }, []);

  return (
    <footer
      ref={containerRef}
      className="relative w-full bg-[#0F172A] dark:bg-slate-950 border-t border-[#D4A75F]/15 py-12 overflow-hidden flex flex-col items-center justify-center transition-colors duration-300"
    >
      {/* Continuous Shine Wave Animation Class Utility */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.cdnfonts.com/css/transcity');

        @keyframes gold-shine-wave {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .gold-shimmer-letter {
          background: linear-gradient(90deg, #8C601E 0%, #FFF2D4 30%, #D4A75F 50%, #FFF2D4 70%, #8C601E 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gold-shine-wave 8s linear infinite;
        }
        .ss-jewellery-font {
          font-family: 'Transcity', 'Playfair Display', Georgia, serif !important;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
      `}} />

      {/* Ambient glowing backdrops */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#3F1D5A]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-[#D4A75F]/4 rounded-full blur-[90px] pointer-events-none" />

      {/* Concentric jewelry orbit lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="w-[850px] h-[850px] rounded-full border border-dashed border-[#D4A75F] absolute"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
          className="w-[700px] h-[700px] rounded-full border border-double border-[#D4A75F] absolute"
        />
      </div>

      {/* Decorative Ornaments */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full border border-[#D4A75F] -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Responsive Logo Container with GSAP animated letters */}
      <div className="relative w-full max-w-[95%] mx-auto flex items-center justify-center py-8 select-none pointer-events-none overflow-visible">

        {/* Glistening Diamond Sparkle Stars */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
          {/* Sparkle 1 */}
          <motion.div
            animate={{ scale: [0.7, 1.25, 0.7], opacity: [0.2, 0.8, 0.2], rotate: [0, 180, 360] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-[20%] text-[#FFF2D4]"
          >
            <Sparkles className="h-5 w-5 fill-[#D4A75F]/20" />
          </motion.div>
          {/* Sparkle 2 */}
          <motion.div
            animate={{ scale: [1.2, 0.6, 1.2], opacity: [0.7, 0.1, 0.7], rotate: [360, 180, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-[22%] text-[#D4A75F]"
          >
            <Sparkles className="h-4 w-4 fill-[#D4A75F]/20" />
          </motion.div>
          {/* Sparkle 3 */}
          <motion.div
            animate={{ scale: [0.6, 1.3, 0.6], opacity: [0.15, 0.9, 0.15], rotate: [0, 360] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
            className="absolute top-1/3 right-[32%] text-[#FFF2D4]"
          >
            <Sparkles className="h-3.5 w-3.5 fill-[#D4A75F]/20" />
          </motion.div>
          {/* Sparkle 4 */}
          <motion.div
            animate={{ scale: [1, 0.5, 1], opacity: [0.8, 0.2, 0.8], rotate: [360, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="absolute bottom-1/3 left-[32%] text-[#D4A75F]"
          >
            <Sparkles className="h-4 w-4 fill-[#D4A75F]/20" />
          </motion.div>
        </div>

        {/* Layer 1: Blurred Soft Shadow Layer (Glow) */}
        <div className="absolute inset-0 flex items-center justify-center overflow-visible select-none pointer-events-none">
          <h2 className="ss-jewellery-font text-[7.5vw] sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-[0.08em] xs:tracking-widest text-center select-none uppercase flex justify-center items-center flex-nowrap whitespace-nowrap">
            {text.split('').map((char, index) => (
              <span
                key={`shadow-${index}`}
                className="footer-shadow-letter inline-block text-[#D4A75F] px-1 select-none pointer-events-none"
                style={{ filter: 'blur(15px)' }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h2>
        </div>

        {/* Layer 2: Sharp Metallic Gold Gradient & Outline */}
        <h2 className="ss-jewellery-font relative z-10 text-[7.5vw] sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-[0.08em] xs:tracking-widest text-center select-none uppercase flex justify-center items-center flex-nowrap whitespace-nowrap pointer-events-auto">
          {text.split('').map((char, index) => (
            <span
              key={`letter-${index}`}
              className="footer-letter gold-shimmer-letter inline-block bg-clip-text text-transparent px-1 cursor-pointer"
              style={{
                WebkitTextStroke: '1.2px rgba(212,167,95,0.3)',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h2>

      </div>

      <div className="w-full max-w-[90%] mx-auto flex flex-col items-center justify-center text-center mt-4 pointer-events-none">
        {/* Subtitle with gold accent */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 0.65, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-[9px] sm:text-xs tracking-[0.45em] uppercase text-[#D4A75F] font-bold mb-2"
        >
          Crafting Timeless Elegance
        </motion.p>
      </div>
    </footer>
  );
};
