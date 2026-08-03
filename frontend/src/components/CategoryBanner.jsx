import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';

// Centralized production-ready API endpoint builder for Category Banners
export const getCategoryBannerEndpoint = (subpath = '') => {
  const cleanBase = (API_BASE_URL || '').replace(/\/api\/?$/, '');
  const cleanSub = subpath ? (subpath.startsWith('/') ? subpath : `/${subpath}`) : '';
  return `${cleanBase}/api/category-banners${cleanSub}`;
};

export const CategoryBanner = ({ categoryName }) => {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!categoryName || categoryName === 'All') {
      setBanner(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setImageLoaded(false);

    const endpointUrl = getCategoryBannerEndpoint(`/category/${encodeURIComponent(categoryName)}`);

    axios.get(endpointUrl)
      .then(res => {
        if (isMounted) {
          if (res.data && res.data.banner && res.data.banner.is_active) {
            setBanner(res.data.banner);
          } else {
            setBanner(null);
          }
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("[CategoryBanner] Error fetching category banner:", err);
        if (isMounted) {
          setBanner(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [categoryName]);

  if (loading) {
    return (
      <div className="w-[96vw] max-w-7xl mx-auto my-6 h-[260px] xs:h-[300px] sm:h-[360px] md:h-[420px] lg:h-[460px] rounded-2xl md:rounded-3xl bg-[#0B1020] border border-[#D4A75F]/20 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 luxury-gold-shimmer pointer-events-none" />
        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-[#D4A75F] animate-spin" />
          <span className="text-[10px] tracking-widest text-[#D4A75F] uppercase font-semibold animate-pulse">
            Loading Banner...
          </span>
        </div>
      </div>
    );
  }

  // Empty State: If category has no banner or inactive, render null (no homepage hero fallback)
  if (!banner || !banner.banner_image) {
    return null;
  }

  return (
    <div className="w-[96vw] max-w-7xl mx-auto my-6 lg:my-8 px-2 xs:px-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-[#D4A75F]/30 bg-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.35)] group"
      >
        {/* Single Responsive Banner Image Container (Handles both Local uploads & Remote Image URLs seamlessly) */}
        <div className="relative w-full h-[280px] xs:h-[320px] sm:h-[380px] md:h-[440px] lg:h-[480px] overflow-hidden">
          <img
            src={banner.banner_image}
            alt={banner.title || categoryName}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover object-center transition-all duration-700 select-none no-zoom ${
              imageLoaded ? 'scale-100 blur-0 opacity-100' : 'scale-105 blur-sm opacity-60'
            } group-hover:scale-105`}
          />

          {/* Intelligent Responsive CSS Gradients for Maximum Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 sm:via-slate-950/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#D4A75F]/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A75F] to-transparent" />

          {/* Banner Content Section */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 xs:px-8 sm:px-12 md:px-16 lg:px-20 z-10">
            <div className="max-w-2xl space-y-2 sm:space-y-3">
              {/* Subtitle */}
              {banner.subtitle && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A75F]/15 border border-[#D4A75F]/30 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-[#D4A75F]" />
                  <span className="text-[#D4A75F] font-semibold text-[10px] xs:text-xs tracking-[0.2em] uppercase">
                    {banner.subtitle}
                  </span>
                </div>
              )}

              {/* Title */}
              {banner.title && (
                <h2 className="font-serif text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-wide leading-tight drop-shadow-md">
                  {banner.title}
                </h2>
              )}

              {/* Description */}
              {banner.description && (
                <p className="text-slate-200 text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3 leading-relaxed font-light drop-shadow max-w-xl">
                  {banner.description}
                </p>
              )}

              {/* CTA Button */}
              {banner.button_text && (
                <div className="pt-2 sm:pt-4">
                  <Link
                    to={banner.button_link || `/?category=${encodeURIComponent(categoryName)}`}
                    className="inline-flex items-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#D4A75F] via-[#E5B86F] to-[#B8860B] hover:from-[#E5B86F] hover:to-[#D4A75F] text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase shadow-[0_10px_25px_rgba(212,167,95,0.35)] hover:shadow-[0_15px_35px_rgba(212,167,95,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>{banner.button_text}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CategoryBanner;
