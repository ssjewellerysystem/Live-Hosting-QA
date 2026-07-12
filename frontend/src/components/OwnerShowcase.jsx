import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Award, Gem, Heart, Star, Quote, CheckCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Animated counter hook
const useCounter = (target, duration = 2.5, start = false) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => setValue(Math.floor(obj.val)),
    });
  }, [start, target, duration]);
  return value;
};

const stats = [
  { icon: Award,  label: 'Years of Craft', value: 25,   suffix: '+' },
  { icon: Gem,    label: 'Unique Designs',  value: 1200, suffix: '+' },
  { icon: Heart,  label: 'Happy Clients',   value: 8500, suffix: '+' },
  { icon: Star,   label: 'Awards Won',      value: 18,   suffix: '' },
];

const badges = ['BIS Hallmark Certified', 'ISO 9001:2015', 'Rajasthan Ratna Awardee', 'GIA Member'];

export const OwnerShowcase = () => {
  const sectionRef  = useRef(null);
  const portraitRef = useRef(null);
  const contentRef  = useRef(null);
  const quoteRef    = useRef(null);
  const statsRef    = useRef(null);
  const [countersStarted, setCountersStarted] = useState(false);

  const counterValues = [
    useCounter(25,   2.2, countersStarted),
    useCounter(1200, 2.5, countersStarted),
    useCounter(8500, 2.8, countersStarted),
    useCounter(18,   2.0, countersStarted),
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Portrait: slide-in from left with soft 3D tilt
      gsap.fromTo(portraitRef.current,
        { opacity: 0, x: -60, rotateY: -15 },
        {
          opacity: 1, x: 0, rotateY: 0,
          duration: 1.3, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
        }
      );

      // Content lines: stagger rise
      gsap.fromTo(
        contentRef.current?.querySelectorAll('.reveal-line'),
        { opacity: 0, y: 28, skewY: 2 },
        {
          opacity: 1, y: 0, skewY: 0,
          duration: 0.85, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
        }
      );

      // Quote: clip-path wipe
      gsap.fromTo(quoteRef.current,
        { opacity: 0, clipPath: 'inset(100% 0 0 0)' },
        {
          opacity: 1, clipPath: 'inset(0% 0 0 0)',
          duration: 1, ease: 'power4.out', delay: 0.5,
          scrollTrigger: { trigger: quoteRef.current, start: 'top 88%', once: true },
        }
      );

      // Stats: spring pop-in
      gsap.fromTo(
        statsRef.current?.querySelectorAll('.stat-card'),
        { opacity: 0, y: 36, scale: 0.85 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.75, stagger: 0.1, ease: 'back.out(1.6)',
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 88%',
            once: true,
            onEnter: () => setCountersStarted(true),
          },
        }
      );

      // Portrait mouse-tilt on hover
      const portrait = portraitRef.current;
      if (portrait) {
        const onMove = (e) => {
          const r = portrait.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width / 2) / r.width;
          const dy = (e.clientY - r.top - r.height / 2) / r.height;
          gsap.to(portrait, { rotateY: dx * 10, rotateX: -dy * 8, duration: 0.35, ease: 'power2.out' });
        };
        const onLeave = () => gsap.to(portrait, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
        portrait.addEventListener('mousemove', onMove);
        portrait.addEventListener('mouseleave', onLeave);
        return () => { portrait.removeEventListener('mousemove', onMove); portrait.removeEventListener('mouseleave', onLeave); };
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-transparent py-20 md:py-28"
    >
      {/* Ambient blurred glows — match site pattern */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#3F1D5A]/5 dark:bg-[#3F1D5A]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] bg-[#D4A75F]/4 dark:bg-[#D4A75F]/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header — same style as LuxuryGallery / TrustShowcase ── */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-[#D4A75F] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Gem className="w-3 h-3" /> The Craftsman Behind the Craft
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-4xl font-serif font-bold text-[#3F1D5A] dark:text-[#EFE7DB] tracking-wide"
          >
            Meet Our Founder
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto"
          >
            A legacy of passion, precision, and pure craftsmanship passed down through generations.
          </motion.p>
          {/* Gold underline — same pattern as TrustShowcase */}
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="block mx-auto mt-3 w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4A75F] to-transparent origin-center"
          />
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mb-16">

          {/* LEFT: Portrait */}
          <div
            ref={portraitRef}
            className="flex-shrink-0 w-full max-w-[320px] sm:max-w-[360px] lg:max-w-[400px] mx-auto lg:mx-0"
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
          >
            {/* Rotating ring decorations */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-6 rounded-full border border-dashed border-[#D4A75F]/20 pointer-events-none"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-12 rounded-full border border-[#3F1D5A]/10 dark:border-[#D4A75F]/8 pointer-events-none"
            />

            {/* Gold corner brackets */}
            {[
              'top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl',
              'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-7 h-7 border-[#D4A75F]/70 ${cls} pointer-events-none z-20`} />
            ))}

            {/* Image card — matches site card style */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-[#3F1D5A]/10 dark:shadow-[#D4A75F]/5">
              <img
                src="/owner.png"
                alt="SS Jewellery Owner — Shri Suresh Soni"
                className="w-full h-auto object-cover object-top no-zoom"
                style={{ maxHeight: '480px' }}
              />
              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white/95 dark:from-slate-900/95 to-transparent" />

              {/* Shimmer scan line */}
              <motion.div
                animate={{ y: ['0%', '100%'] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A75F]/40 to-transparent pointer-events-none"
              />

              {/* Name plate badge */}
              <div className="absolute bottom-5 left-0 right-0 flex justify-center z-10">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-[#D4A75F]/30 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4A75F] animate-pulse" />
                  <span className="text-[#3F1D5A] dark:text-[#D4A75F] text-[10px] font-black tracking-widest uppercase">Founder & Master Craftsman</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Content */}
          <div ref={contentRef} className="flex-1 text-center lg:text-left">

            {/* Established tag */}
            <div className="reveal-line mb-3">
              <span className="inline-block text-[10px] tracking-[0.45em] uppercase font-black text-[#D4A75F] border border-[#D4A75F]/30 px-3.5 py-1.5 rounded-full bg-amber-500/8">
                Est. 1999 · Jaipur, India
              </span>
            </div>

            {/* Owner name */}
            <h3 className="reveal-line font-serif font-black text-[#3F1D5A] dark:text-[#EFE7DB] leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)' }}>
              Shri Suresh{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #D4A75F 0%, #BF934B 60%, #a97e3c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Soni
              </span>
            </h3>

            {/* Description */}
            <p className="reveal-line text-slate-600 dark:text-slate-400 leading-relaxed mb-4 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base">
              With over <span className="text-[#D4A75F] font-semibold">25 years of dedication</span> to the ancient art of Indian jewellery,
              Shri Suresh Soni has transformed SS Jewellery into a hallmark of excellence trusted by families across India.
            </p>
            <p className="reveal-line text-slate-500 dark:text-slate-500 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 text-xs sm:text-sm">
              A third-generation goldsmith trained in the royal ateliers of Jaipur, he brings Kundan, Meenakari,
              and Jadau traditions into every handcrafted piece — blending timeless heritage with contemporary elegance.
            </p>

            {/* Quote block — matches site's card style */}
            <div
              ref={quoteRef}
              className="reveal-line relative mb-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-l-4 border-l-[#D4A75F] rounded-r-2xl p-5 max-w-xl mx-auto lg:mx-0 shadow-sm"
            >
              <Quote className="absolute top-3 left-4 h-5 w-5 text-[#D4A75F]/30" />
              <p className="text-slate-700 dark:text-slate-300 italic font-serif text-sm sm:text-base leading-relaxed pl-3">
                "Every jewel we craft carries a piece of our soul — because true luxury is not just about gold,
                it is about the love and legacy it carries forever."
              </p>
              <p className="mt-2 pl-3 text-[#D4A75F] text-[10px] font-black tracking-widest uppercase">— Shri Suresh Soni</p>
            </div>

            {/* Achievement badges */}
            <div className="reveal-line flex flex-wrap gap-2.5 justify-center lg:justify-start">
              {badges.map((badge, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide text-[#3F1D5A] dark:text-[#D4A75F] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <CheckCircle className="w-3 h-3 text-[#D4A75F]" /> {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats row — same card style as TrustShowcase ── */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="stat-card group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-[#D4A75F]/35 transition-all duration-300 flex flex-col items-center text-center"
              >
                {/* Icon block — same as TrustShowcase */}
                <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 rounded-xl w-fit mb-4 group-hover:bg-gradient-to-r group-hover:from-[#D4A75F] group-hover:to-[#BF934B] transition-all duration-300">
                  <Icon className="h-5 w-5 text-[#D4A75F] group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Animated count */}
                <div className="font-black text-[#3F1D5A] dark:text-[#EFE7DB] leading-none mb-1" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)' }}>
                  {counterValues[i].toLocaleString()}<span className="text-[#D4A75F]">{s.suffix}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase">{s.label}</p>

                {/* Bottom accent line — same as TrustShowcase */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4A75F]">
                    SS Jewellery ✦
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
