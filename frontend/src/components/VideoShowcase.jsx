import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const VideoShowcase = () => {
  const sectionRef = useRef(null);
  const videoWrapperRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Smooth fade-in and scale reveal on scroll
      gsap.fromTo(
        videoWrapperRef.current,
        { opacity: 0, scale: 0.98 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: videoWrapperRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-transparent py-0"
    >
      {/* Edge-to-Edge Video Player Container */}
      <div
        ref={videoWrapperRef}
        className="relative w-full aspect-video bg-black shadow-2xl overflow-hidden"
      >
        {/* Top and Bottom Gold Borders to Blend with the Luxury Theme */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A75F]/60 to-transparent z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A75F]/60 to-transparent z-10" />

        {/* Local video — autoplay, loop, muted, no controls */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/golden-stage.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
    </section>
  );
};
