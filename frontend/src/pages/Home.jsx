import React, { useState, useEffect, useContext, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { useLocation, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, Star, Sparkles, X, Search, Users, Calendar, Clock, DollarSign, MapPin, Check, Lock, RefreshCw, Plus, Trash2, Edit3, Upload, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
const ProductDetails = lazy(() => import('./ProductDetails').then(m => ({ default: m.ProductDetails })));
const HomeAdminAnalytics = lazy(() => import('../components/HomeAdminAnalytics').then(m => ({ default: m.HomeAdminAnalytics })));
const HomeUserManagement = lazy(() => import('../components/HomeUserManagement').then(m => ({ default: m.HomeUserManagement })));
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { LuxuryImage } from '../components/LuxuryImage';
import { formatPrice } from '../utils/priceFormatter';
import { translateCategory, translateUiLabel } from '../utils/categoryTranslations';
import { GoldCalculator } from '../components/GoldCalculator';
import { TrustShowcase } from '../components/TrustShowcase';
import { LuxuryGallery } from '../components/LuxuryGallery';
import { OccasionGallery } from '../components/OccasionGallery';
import { OwnerShowcase } from '../components/OwnerShowcase';
import { VideoShowcase } from '../components/VideoShowcase';


const ACTION_TYPES = [
  "Product Added",
  "Product Updated",
  "Product Deleted",
  "Stock Updated",
  "Price Changed",
  "Category Changed",
  "User Blocked",
  "User Unblocked",
  "Order Updated",
  "Order Cancelled",
  "Support Ticket Updated",
  "Admin Login",
  "Admin Logout"
];

const BannerSkeleton = () => (
  <div className="relative h-[480px] lg:h-[680px] xl:h-[740px] min-h-[450px] overflow-hidden rounded-[16px] lg:rounded-[20px] bg-[#1B0B26] border border-[#D4A75F]/15 flex items-center justify-center">
    <div className="absolute inset-0 pointer-events-none luxury-gold-shimmer" />
    <img
      src="/loading-logo.png"
      alt="SSJewellery"
      className="relative z-20 object-contain w-auto h-32 opacity-60 animate-pulse mix-blend-screen"
    />
  </div>
);

const MobileBannerSkeleton = () => (
  <div className="relative h-[390px] xs:h-[420px] sm:h-[440px] overflow-hidden rounded-[16px] bg-[#1B0B26] border border-[#D4A75F]/15 flex items-center justify-center">
    <div className="absolute inset-0 pointer-events-none luxury-gold-shimmer" />
    <img
      src="/loading-logo.png"
      alt="SSJewellery"
      className="relative z-20 object-contain w-auto h-24 opacity-60 animate-pulse mix-blend-screen"
    />
  </div>
);

const CategorySkeleton = () => (
  <div className="hidden md:block w-full bg-white dark:bg-[#0B1020] border-y border-[#F2E8D9] dark:border-slate-800/80 py-10 lg:py-12">
    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-48 h-8 rounded-lg skeleton-premium animate-pulse" />
        <div className="w-64 h-3 mt-3 rounded skeleton-premium animate-pulse" />
      </div>
      <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
        {[
          { label: "Rings" },
          { label: "Necklaces" },
          { label: "Earrings" },
          { label: "Bracelets" },
          { label: "Bridal Collection" }
        ].map((cat, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center w-24 sm:w-28">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#F2E8D9]/60 dark:border-slate-800/80 p-1 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 pointer-events-none luxury-gold-shimmer" />
              <img
                src="/loading-logo.png"
                alt="Loading..."
                className="relative z-20 object-contain w-10 h-auto opacity-50 animate-pulse dark:mix-blend-screen mix-blend-multiply dark:invert-0 invert"
              />
            </div>
            <div className="skeleton-premium h-3.5 w-16 rounded mt-3 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MobileCategorySkeleton = () => (
  <div className="block md:hidden w-full bg-white dark:bg-[#0B1020] border-y border-[#F2E8D9] dark:border-slate-800/80 py-4">
    <div className="w-[94vw] mx-auto px-1">
      <div className="flex flex-col items-center mb-4 text-center">
        <div className="h-6 rounded skeleton-premium w-36 animate-pulse" />
      </div>
      <div className="flex overflow-x-auto gap-3.5 pb-2">
        {[
          { label: "Rings" },
          { label: "Necklaces" },
          { label: "Earrings" },
          { label: "Bracelets" },
          { label: "Bridal Collection" }
        ].map((cat, idx) => (
          <div key={idx} className="flex-none flex flex-col items-center justify-center w-[76px]">
            <div className="w-[68px] h-[68px] rounded-full border-2 border-[#F2E8D9]/60 dark:border-slate-800/80 p-1 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 pointer-events-none luxury-gold-shimmer" />
              <img
                src="/loading-logo.png"
                alt="Loading..."
                className="relative z-20 object-contain h-auto opacity-50 w-9 animate-pulse dark:mix-blend-screen mix-blend-multiply dark:invert-0 invert"
              />
            </div>
            <div className="skeleton-premium h-3 w-12 rounded mt-2.5 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SearchSpotlight = ({ products, language }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'All';
  const activeSearch = searchParams.get('search') || '';

  useEffect(() => {
    setActiveIndex(0);
  }, [products]);

  useEffect(() => {
    if (!products || products.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [products]);

  if (!products || products.length === 0) return null;

  const mainProduct = products[activeIndex];
  const leftProduct = products.length > 1 ? products[(activeIndex - 1 + products.length) % products.length] : null;
  const rightProduct = products.length > 2 ? products[(activeIndex + 1) % products.length] : null;

  // Helper to extract first image
  const getProductImage = (prod) => {
    if (!prod) return null;
    if (prod.product_images && prod.product_images.length > 0) {
      const sorted = [...prod.product_images].sort((a, b) => a.image_order - b.image_order);
      return sorted[0].image_url;
    }
    if (prod.images && prod.images.length > 0) {
      return prod.images[0];
    }
    return '/logo.svg'; // fallback
  };

  const mainImg = getProductImage(mainProduct);
  const leftImg = getProductImage(leftProduct);
  const rightImg = getProductImage(rightProduct);

  return (
    <div className="relative w-full overflow-hidden mt-0 py-10 md:py-16 px-4 md:px-8 bg-gradient-to-b from-[#0A0512] via-[#150A21] to-[#0A0512] dark:from-[#0A0512] dark:to-[#150A21] border-b border-[#D4A75F]/20 text-white">
      {/* Background Decorative Rings/Ornaments */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] rounded-full border border-[#D4A75F] -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full border border-[#D4A75F] -translate-y-1/2" />
      </div>

      <div className="grid items-center grid-cols-1 gap-8 mx-auto text-left max-w-7xl lg:grid-cols-12">
        {/* Left Side Column - Product Info */}
        <div className="flex flex-col justify-center order-2 text-center lg:col-span-4 lg:order-1 lg:text-left">
          <span className="inline-flex self-center lg:self-start items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold bg-[#D4A75F]/15 text-[#D4A75F] border border-[#D4A75F]/35 uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3 animate-pulse" />
            {activeSearch 
              ? (language === 'hi' ? 'शीर्ष खोज मिलान' : 'Top Search Match')
              : activeCategory !== 'All'
              ? `${translateCategory(activeCategory, language)} ${language === 'hi' ? 'विशेष संग्रह' : 'Spotlight'}`
              : (language === 'hi' ? 'विशेष संग्रह' : 'Featured Collection')
            }
          </span>
          
          <motion.h2 
            key={`title-${activeIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 font-serif text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl"
          >
            {mainProduct.name}
          </motion.h2>
          
          <motion.p 
            key={`desc-${activeIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-md mx-auto mb-6 text-sm leading-relaxed text-slate-300 md:text-base lg:mx-0"
          >
            {mainProduct.description || mainProduct.desc || (language === 'hi' ? 'हमारे उत्तम संग्रह से एक उत्कृष्ट हस्तनिर्मित आभूषण।' : 'An exquisite handcrafted piece from our luxury collection.')}
          </motion.p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <Link
              to={`/product/${mainProduct._id || mainProduct.id}`}
              className="group inline-flex items-center gap-2 px-8 py-3.5 bg-[#D4A75F] hover:bg-[#BF934B] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full transition-all duration-300 hover:scale-105 shadow-lg animate-pulse"
            >
              {language === 'hi' ? 'विवरण देखें' : 'Explore The Craft'}
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-slate-950" />
            </Link>
            
            <motion.span 
              key={`price-${activeIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-serif text-xl md:text-2xl font-bold text-[#D4A75F]"
            >
              ₹{Number(mainProduct.price).toLocaleString('en-IN')}
            </motion.span>
          </div>
        </div>

        {/* Center/Right Column - 3D Jewelry Stands display */}
        <div className="lg:col-span-8 order-1 lg:order-2 relative h-[300px] md:h-[400px] flex items-center justify-center">
          
          {/* 1. Left Background Stand (Blurred) */}
          {leftProduct && (
            <div className="absolute left-[5%] md:left-[15%] bottom-[10%] scale-[0.7] opacity-40 blur-[1.5px] transition-all hover:opacity-75 hover:blur-0 duration-500 z-10 hidden sm:block">
              <div className="relative flex flex-col items-center">
                {/* Mannequin / Display shape */}
                <div className="w-[120px] h-[160px] bg-gradient-to-b from-[#20142A] to-[#0F0715] rounded-t-[50px] shadow-lg flex items-center justify-center p-3 border border-[#D4A75F]/15">
                  <motion.img 
                    key={`left-img-${activeIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    src={leftImg} 
                    alt={leftProduct.name} 
                    className="w-[85px] h-[85px] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]" 
                  />
                </div>
                {/* Gold collar collar base */}
                <div className="w-[100px] h-[8px] bg-gradient-to-r from-[#BF934B] via-[#D4A75F] to-[#BF934B] rounded-full shadow-inner" />
                {/* Marble cylinder pedestal */}
                <div className="w-[110px] h-[30px] bg-gradient-to-b from-[#2C2C2C] to-[#1A1A1A] rounded-md shadow-md border-t border-white/10" />
              </div>
            </div>
          )}

          {/* 2. Main Center Stand (Highlighted) */}
          <div className="relative z-20 scale-[0.7] xs:scale-[0.8] sm:scale-[0.9] md:scale-110 transform transition-transform duration-500 hover:scale-[1.03] md:hover:scale-[1.12]">
            <div className="relative flex flex-col items-center">
              
              {/* Mannequin Bust */}
              <div className="w-[180px] h-[230px] bg-gradient-to-b from-[#2B1B35] to-[#140C1A] rounded-t-[80px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex items-center justify-center p-4 border border-[#D4A75F]/35 relative">
                <motion.img 
                  key={`main-img-${activeIndex}`}
                  src={mainImg} 
                  alt={mainProduct.name} 
                  className="w-[130px] h-[130px] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                  transition={{ 
                    opacity: { duration: 0.4 },
                    scale: { duration: 0.4 },
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" } 
                  }}
                />
              </div>
              
              {/* Gold neck joint */}
              <div className="w-[130px] h-[10px] bg-gradient-to-r from-[#B38F4B] via-[#D4A75F] to-[#B38F4B] rounded-full shadow-md" />
              
              {/* Marble Pillar Pedestal */}
              <div className="w-[150px] h-[40px] bg-gradient-to-b from-[#333333] to-[#222222] rounded-md shadow-lg border-t border-white/20 relative overflow-hidden">
                {/* Marble texture gloss */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
              </div>
              
              {/* Gold Base Ring */}
              <div className="w-[160px] h-[6px] bg-[#D4A75F] rounded-full shadow-md" />
            </div>
          </div>

          {/* 3. Right Background Stand (Blurred) */}
          {rightProduct && (
            <div className="absolute right-[5%] md:right-[15%] bottom-[10%] scale-[0.7] opacity-40 blur-[1.5px] transition-all hover:opacity-75 hover:blur-0 duration-500 z-10 hidden sm:block">
              <div className="relative flex flex-col items-center">
                {/* Mannequin / Display shape */}
                <div className="w-[120px] h-[160px] bg-gradient-to-b from-[#20142A] to-[#0F0715] rounded-t-[50px] shadow-lg flex items-center justify-center p-3 border border-[#D4A75F]/15">
                  <motion.img 
                    key={`right-img-${activeIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    src={rightImg} 
                    alt={rightProduct.name} 
                    className="w-[85px] h-[85px] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]" 
                  />
                </div>
                {/* Gold collar base */}
                <div className="w-[100px] h-[8px] bg-gradient-to-r from-[#BF934B] via-[#D4A75F] to-[#BF934B] rounded-full shadow-inner" />
                {/* Marble pedestal */}
                <div className="w-[110px] h-[30px] bg-gradient-to-b from-[#2C2C2C] to-[#1A1A1A] rounded-md shadow-md border-t border-white/10" />
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

const BannerSlider = React.memo(({ 
  slides, 
  activeSlide, 
  setActiveSlide, 
  isAdmin, 
  handleNextSlide, 
  handlePrevSlide, 
  opacityParallax, 
  yParallax,
  bannersLoading,
  onCategoryClick
}) => {
  const slideRefs = React.useRef([]);
  const contentRef = React.useRef(null);
  const badgeRef = React.useRef(null);
  const titleRef = React.useRef(null);
  const subtitleRef = React.useRef(null);
  const descRef = React.useRef(null);
  const btnRef = React.useRef(null);
  const progressBarRef = React.useRef(null);

  const currentSlide = slides[activeSlide] || {};

  const handleBannerButtonClick = (e, slide) => {
    const link = slide.btnLink || `/?category=${slide.catFilter}`;
    if (link.startsWith('/?category=') || link === '/') {
      e.preventDefault();
      onCategoryClick(slide.catFilter || 'All', 'banner');
    }
  };

  if (bannersLoading) {
    return (
      <>
        {/* Desktop Loading Skeleton */}
        <div className="relative hidden w-full md:block">
          <div className="relative overflow-hidden bg-[#1B0B26] flex items-center justify-center h-screen min-h-[600px]">
            <div className="absolute inset-0 pointer-events-none luxury-gold-shimmer" />
            <img src="/loading-logo.png" alt="SSJewellery" className="relative z-20 object-contain w-auto h-28 opacity-60 animate-pulse mix-blend-screen" />
          </div>
        </div>
        {/* Mobile Loading Skeleton */}
        <div className="block md:hidden w-[94vw] mx-auto mt-4 mb-8">
          <MobileBannerSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop view */}
      <div
        className="relative hidden w-full mb-10 md:block lg:mb-12 hero-slider-container"
        style={{ perspective: '1400px' }}
      >
        {/* ======== SLIDER CONTAINER ======== */}
        <div
          className="relative overflow-hidden"
          style={{
            height: '100vh',
            minHeight: '600px',
            maxHeight: '1000px',
            boxShadow: '0 0 80px rgba(212,167,95,0.12) inset',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* ---- BACKGROUND SLIDES ---- */}
          {slides.map((slide, idx) => (
            <div
              key={idx}
              ref={el => { slideRefs.current[idx] = el; }}
              style={{
                position: 'absolute', inset: 0,
                opacity: idx === activeSlide ? 1 : 0,
                zIndex: idx === activeSlide ? 10 : 1,
                transformStyle: 'preserve-3d',
                willChange: 'transform, opacity'
              }}
            >
              {/* Full-bleed image — brightness boosted for vivid, glowing look */}
              {slide.image_url ? (
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="hero-image-glow no-zoom"
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                    userSelect: 'none'
                  }}
                  draggable={false}
                />
              ) : (
                <div
                  style={{ position: 'absolute', inset: 0 }}
                  className={`bg-gradient-to-br ${slide.gradient || 'from-[#1B0B26] via-[#3F1D5A] to-[#2E1442]'}`}
                />
              )}

              {/* Lightweight gradient — left side only for text, right side stays clear */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.42) 38%, rgba(0,0,0,0.10) 62%, rgba(0,0,0,0.04) 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 35%, rgba(0,0,0,0.08) 100%)' }} />
              {/* Vibrant gold radial glow on left — makes image pop */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 5% 70%, rgba(212,167,95,0.20), transparent 60%)' }} />
              {/* Warm amber inner glow at image center */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 65% 50%, rgba(255,200,100,0.06), transparent 55%)' }} />
              {/* Bottom fade to blend into page */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px', background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)' }} />
              {/* Gold top rule */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to right, transparent, rgba(212,167,95,0.80), transparent)' }} />
            </div>
          ))}

          {/* ---- FLOATING GOLD PARTICLES ---- */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none', overflow: 'hidden' }}>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="animate-float-slow"
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  background: `rgba(212,167,95,${0.08 + i * 0.025})`,
                  width: `${5 + i * 3}px`,
                  height: `${5 + i * 3}px`,
                  left: `${8 + i * 9}%`,
                  top: `${15 + (i % 5) * 17}%`,
                  animationDuration: `${4.5 + i * 0.7}s`,
                  animationDelay: `${i * 0.35}s`,
                  filter: 'blur(1.5px)'
                }}
              />
            ))}
          </div>

          {/* ---- DECORATIVE CORNER ORNAMENT ---- */}
          <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 25, pointerEvents: 'none' }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" opacity="0.45">
              <path d="M2 2 L24 2" stroke="#D4A75F" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M2 2 L2 24" stroke="#D4A75F" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="2" cy="2" r="2.5" fill="#D4A75F"/>
            </svg>
          </div>

          {/* ---- CONTENT OVERLAY ---- */}
          <div
            className="absolute inset-0 z-30 flex items-center"
          >
            <div className="w-full max-w-2xl px-8 text-left xl:max-w-3xl sm:px-12 md:px-14 lg:px-20">
              {/* Badge */}
              <motion.div
                key={`badge-${activeSlide}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mb-4 sm:mb-5"
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#D4A75F]/15 text-[#D4A75F] border border-[#D4A75F]/35 backdrop-blur-sm tracking-[0.15em] uppercase shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  {currentSlide.badge}
                </span>
              </motion.div>

              {/* Main Title */}
              <motion.h1
                key={`title-${activeSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="font-serif font-bold text-white leading-[1.07] tracking-tight mb-3 sm:mb-4"
                style={{ fontSize: 'clamp(1.85rem, 4.8vw, 4.5rem)', textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
              >
                {currentSlide.title}
              </motion.h1>

              {/* Gold Subtitle */}
              <motion.p
                key={`subtitle-${activeSlide}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="font-serif text-[#D4A75F] mb-3"
                style={{ fontSize: 'clamp(1rem, 2vw, 1.45rem)', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
              >
                {currentSlide.subtitle}
              </motion.p>

              {/* Description */}
              <motion.p
                key={`desc-${activeSlide}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="hidden max-w-lg text-sm leading-relaxed text-slate-300/85 mb-7 sm:mb-8 sm:block"
              >
                {currentSlide.desc}
              </motion.p>

              {/* CTA Row */}
              <motion.div
                key={`cta-${activeSlide}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="flex items-center gap-4"
              >
                <Link
                  to={currentSlide.btnLink || `/?category=${currentSlide.catFilter}`}
                  onClick={(e) => handleBannerButtonClick(e, currentSlide)}
                  className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#D4A75F] hover:bg-[#BF934B] text-white font-bold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:scale-105 gold-shimmer-btn relative overflow-hidden"
                  style={{ boxShadow: '0 8px 36px rgba(212,167,95,0.50), 0 2px 8px rgba(0,0,0,0.3)' }}
                >
                  {currentSlide.btnText}
                  <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <div className="hidden w-px h-10 sm:block bg-white/20" />
                <Link
                  to="/?category=All"
                  onClick={(e) => {
                    e.preventDefault();
                    onCategoryClick('All', 'banner');
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 text-white/55 hover:text-[#D4A75F] text-xs font-semibold uppercase tracking-widest transition-colors duration-200"
                >
                  View All
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </motion.div>
            </div>
          </div>

          {/* ---- ADMIN EDIT BUTTON ---- */}
          {isAdmin && (
            <Link
              to="/admin-control?tab=config"
              className="absolute top-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold backdrop-blur-md transition-all hover:scale-105 cursor-pointer animate-pulse"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Banners</span>
            </Link>
          )}

          {/* ---- PAGINATION DOT INDICATORS ---- */}
          <div
            className="absolute z-40 flex items-center gap-2.5"
            style={{ bottom: '28px', left: '50%', transform: 'translateX(-50%)' }}
          >
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="rounded-full cursor-pointer"
                style={{
                  width: idx === activeSlide ? '28px' : '8px',
                  height: '8px',
                  background: idx === activeSlide ? '#D4A75F' : 'rgba(255,255,255,0.30)',
                  boxShadow: idx === activeSlide ? '0 0 12px rgba(212,167,95,0.80), 0 0 4px rgba(212,167,95,0.50)' : 'none',
                  border: 'none', padding: 0,
                  transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)'
                }}
              />
            ))}
          </div>

          {/* ---- ANIMATED GOLD BOTTOM STRIP ---- */}
          <div
            className="hero-gold-bottom"
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 45, height: '3px', pointerEvents: 'none' }}
          />

          {/* ---- PROGRESS STRIPS (bottom) ---- */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40, display: 'flex', height: '3px' }}>
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                style={{
                  flex: 1,
                  background: idx === activeSlide ? 'transparent' : 'rgba(255,255,255,0.18)',
                  position: 'relative',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'background 0.3s'
                }}
              >
                {idx === activeSlide && (
                  <div
                    ref={progressBarRef}
                    style={{
                      position: 'absolute', inset: 0,
                      background: '#D4A75F',
                      transformOrigin: 'left center',
                      transform: 'scaleX(0)'
                    }}
                  />
                )}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile view */}
      <div className="block md:hidden w-[94vw] mx-auto mt-4 mb-8">
        <div className="relative h-[390px] xs:h-[420px] sm:h-[440px] overflow-hidden rounded-[16px] shadow-[0_20px_50px_rgba(27,11,38,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#D4A75F]/15 dark:border-white/5 bg-gradient-to-tr from-[#1B0B26] via-[#3F1D5A] to-[#2E1442]">
          {isAdmin && (
            <Link
              to="/admin-control?tab=config"
              className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold backdrop-blur-md transition-all duration-300 hover:scale-105 shadow-sm cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Banner</span>
            </Link>
          )}

          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => {
              const swipeThreshold = 40;
              if (info.offset.x < -swipeThreshold) {
                handleNextSlide();
              } else if (info.offset.x > swipeThreshold) {
                handlePrevSlide();
              }
            }}
            className="relative w-full h-full cursor-grab active:cursor-grabbing"
          >
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 bg-gradient-to-tr ${slide.gradient} transition-opacity duration-1000 ${
                  idx === activeSlide 
                    ? 'opacity-100 z-10' 
                    : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-[#1B0B26]/30 to-[#3F1D5A]/10 mix-blend-multiply opacity-90 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,167,95,0.15),transparent_50%)] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4A75F]/20 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center justify-between h-full px-4 pt-5 pb-8 text-center text-white">
                  
                  <div className="flex flex-col items-center">
                    <motion.h1
                      initial={{ opacity: 0, y: 15 }}
                      animate={idx === activeSlide ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-[28px] xs:text-[32px] sm:text-[36px] font-serif font-bold tracking-normal leading-[1.2] text-white mb-1.5 max-w-[280px] xs:max-w-md break-words animate-in fade-in"
                    >
                      {slide.title}
                    </motion.h1>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={idx === activeSlide ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-[14px] xs:text-[15px] sm:text-[16px] font-serif text-[#D4A75F] max-w-[280px] xs:max-w-md break-words"
                    >
                      {slide.subtitle}
                    </motion.p>
                  </div>

                  <div className="my-2">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={idx === activeSlide ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="w-fit"
                    >
                      <Link
                        to={slide.btnLink || `/?category=${slide.catFilter}`}
                        onClick={(e) => handleBannerButtonClick(e, slide)}
                        className="px-5 py-2 bg-[#D4A75F] text-white font-bold text-[11px] uppercase tracking-wider rounded-full shadow-lg transition-transform active:scale-95 duration-300 w-fit flex items-center gap-1.5 cursor-pointer gold-shimmer-btn relative overflow-hidden"
                      >
                        {slide.btnText}
                      </Link>
                    </motion.div>
                  </div>

                  {slide.image_url && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={idx === activeSlide ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                      transition={{ duration: 0.6, delay: 0.45 }}
                      className="w-full h-[140px] xs:h-[160px] sm:h-[180px] flex items-center justify-center relative mt-2"
                    >
                      <LuxuryImage
                        src={slide.image_url}
                        alt={slide.title}
                        draggable="false"
                        className="h-full w-auto object-contain rounded-xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] select-none no-zoom"
                        width="300"
                        height="200"
                      />
                    </motion.div>
                  )}

                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                idx === activeSlide ? 'bg-[#D4A75F] w-6' : 'bg-slate-350 dark:bg-slate-800 hover:bg-slate-200 w-1.5'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
});

export const ScrollableTrack = ({ children, autoScrollSpeed = 0.5 }) => {
  const containerRef = useRef(null);
  const isHovered = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);
  const dragDistance = useRef(0);
  const scrollPosRef = useRef(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    // Check again after a small delay to handle mount adjustments
    const timer = setTimeout(checkOverflow, 400);

    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timer);
    };
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let animId;
    const scrollLoop = () => {
      if (!isHovered.current && !isDragging.current && el.scrollWidth > el.clientWidth) {
        scrollPosRef.current += autoScrollSpeed;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0 && scrollPosRef.current >= maxScroll + 20) {
          scrollPosRef.current = 0;
        }
        el.scrollLeft = Math.round(scrollPosRef.current);
      } else {
        scrollPosRef.current = el.scrollLeft;
      }
      animId = requestAnimationFrame(scrollLoop);
    };

    animId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animId);
  }, [autoScrollSpeed]);

  const handleMouseDown = (e) => {
    const el = containerRef.current;
    if (!el) return;
    isDragging.current = true;
    dragDistance.current = 0;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftVal.current = el.scrollLeft;
    scrollPosRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const el = containerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    dragDistance.current = Math.abs(x - startX.current);
    el.scrollLeft = scrollLeftVal.current - walk;
    scrollPosRef.current = el.scrollLeft;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleLinkClick = (e) => {
    if (dragDistance.current > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="relative w-full overflow-hidden group/track">
      {/* Track Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => { isHovered.current = true; }}
        onMouseLeave={() => {
          isDragging.current = false;
          isHovered.current = false;
        }}
        onClickCapture={handleLinkClick}
        className={`flex w-full gap-6 px-4 py-6 overflow-x-auto select-none flex-nowrap cursor-grab active:cursor-grabbing no-scrollbar scroll-smooth ${isOverflowing ? 'justify-start' : 'justify-center'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
};

const CategoryGrid = React.memo(({ activeCategory, loading: parentLoading, onCategoryClick }) => {
  const { language } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/products/categories`);
        if (isMounted) {
          const mapped = (response.data || []).map(cat => ({
            name: cat.name,
            name_en: cat.name_en || cat.name,
            name_hi: cat.name_hi || cat.name,
            label: cat.name,
            img: cat.image_url || "/logo.svg"
          }));
          setCategories(mapped);
        }
      } catch (err) {
        console.error("Error fetching categories in CategoryGrid:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  if (loading || parentLoading) {
    return (
      <div className="w-full bg-[#0F172A] py-16 animate-pulse border-y border-amber-500/10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-48 mb-3 rounded-lg h-7 bg-slate-850" />
            <div className="h-3.5 bg-slate-850 rounded w-64" />
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-20 h-20 mb-3 rounded-full sm:w-24 sm:h-24 md:w-28 md:h-28 bg-slate-800" />
                <div className="w-16 h-3 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getSubtitleTranslation = (lang) => {
    return lang === 'hi'
      ? "हमारे उत्कृष्ट हस्तनिर्मित कलाकृतियों की खोज करें"
      : "Discover our exquisite handcrafted masterpieces";
  };

  return (
    <div className="w-full bg-[#0F172A] border-y border-amber-500/10 py-16 transition-colors duration-300">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        {/* ==================================================
            SHOP BY CATEGORY
            ================================================== */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#D4AF37] tracking-wider relative inline-block pb-2">
            {translateUiLabel("Shop By Category", language)}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#D4AF37]"></span>
          </h2>
          <p className="mt-2 font-sans text-xs tracking-widest uppercase text-slate-400">
            {getSubtitleTranslation(language)}
          </p>
        </div>

        <ScrollableTrack autoScrollSpeed={0.4}>
          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat.name;
            return (
              <div
                key={`${cat.name}-${idx}`}
                className="w-[90px] sm:w-[110px] md:w-[130px] flex-shrink-0 flex flex-col items-center justify-center"
              >
                <Link
                  to={`/?category=${encodeURIComponent(cat.name)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onCategoryClick(cat.name);
                  }}
                  className="flex flex-col items-center justify-center w-full cursor-pointer select-none focus:outline-none group"
                >
                  <div
                    className={`rounded-full flex items-center justify-center overflow-hidden border-2 p-0.5 transition-all duration-550 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ${
                      isActive
                        ? 'bg-transparent border-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.85),_0_0_35px_rgba(212,175,55,0.4)] ring-2 ring-[#D4AF37]/20'
                        : 'bg-transparent border-slate-700 group-hover:border-[#D4AF37]/80 group-hover:shadow-[0_0_12px_rgba(212,175,55,0.45)]'
                    }`}
                  >
                    <img
                      src={cat.img}
                      alt={language === 'hi' ? cat.name_hi : cat.name_en}
                      className="object-cover w-full h-full transition-transform duration-500 rounded-full pointer-events-none group-hover:scale-110"
                    />
                  </div>

                  <span className={`mt-3 text-xs md:text-sm font-bold tracking-wide transition-colors duration-300 text-center w-full px-0.5 ${
                    isActive
                      ? 'text-[#D4AF37]'
                      : 'text-slate-300 dark:text-[#F8FAFC] group-hover:text-[#D4AF37]'
                  }`}>
                    {language === 'hi' ? cat.name_hi : cat.name_en}
                  </span>
                </Link>
              </div>
            );
          })}
        </ScrollableTrack>

      </div>
    </div>
  );
});

const parseJsonSafe = (str, fallback) => {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
};

export const Home = () => {
  const { language, isAdmin } = useContext(AuthContext);

  // Parallax scroll effects for Hero Banner
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 500], [0, 80]);
  const opacityParallax = useTransform(scrollY, [0, 400], [1, 0]);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allProductsLoading, setAllProductsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAdminProductId, setSelectedAdminProductId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [activeTab, setActiveTab] = useState('products');
  const [usersComplete, setUsersComplete] = useState([]);
  const [usersAnalytics, setUsersAnalytics] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const itemsPerPage = 10;

  const [usersRefreshTrigger, setUsersRefreshTrigger] = useState(0);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    confirm_password: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    role: 'customer'
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState(null);
  const [addUserSuccess, setAddUserSuccess] = useState(null);

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setAddUserError(null);
    setAddUserSuccess(null);

    if (isAdminPincodeInvalid) {
      setAddUserError("Please enter a valid 6-digit PIN Code.");
      return;
    }

    if (addUserForm.password !== addUserForm.confirm_password) {
      setAddUserError("Passwords do not match.");
      return;
    }

    setAddUserLoading(true);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/admin/users`,
        {
          name: addUserForm.name,
          email: addUserForm.email,
          password: addUserForm.password,
          confirm_password: addUserForm.confirm_password,
          mobile: addUserForm.mobile,
          role: addUserForm.role,
          address: addUserForm.address,
          city: addUserForm.city,
          state: addUserForm.state,
          pincode: addUserForm.pincode
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAddUserSuccess("User created successfully");
        setAddUserForm({
          name: '',
          mobile: '',
          email: '',
          password: '',
          confirm_password: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          role: 'customer'
        });

        setUsersRefreshTrigger(prev => prev + 1);

        setTimeout(() => {
          setAddUserSuccess(null);
          setShowAddUserModal(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setAddUserError(err.response?.data?.message || "Failed to create user. Please try again.");
    } finally {
      setAddUserLoading(false);
    }
  };

  const [generalAuditLogs, setGeneralAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSearchVal, setAuditSearchVal] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setAuditSearch(auditSearchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [auditSearchVal]);
  const [auditActionType, setAuditActionType] = useState('');
  const [auditStatus, setAuditStatus] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const auditPerPage = 10;

  const fetchGeneralAuditLogs = async () => {
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const params = {};
      if (auditSearch.trim()) params.search = auditSearch;
      if (auditActionType) params.action_type = auditActionType;
      if (auditStatus) params.status = auditStatus;

      const res = await axios.get(`${API_BASE_URL}/admin/general-audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: params
      });
      setGeneralAuditLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch general audit logs:", err);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'analytics') {
      fetchGeneralAuditLogs();
    }
  }, [isAdmin, activeTab, auditSearch, auditActionType, auditStatus]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch, auditActionType, auditStatus]);

  useEffect(() => {
    if (isAdmin && (activeTab === 'users' || activeTab === 'analytics')) {
      const fetchUsersComplete = async () => {
        setUsersLoading(true);
        setUsersError(null);
        try {
          const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
          const response = await axios.get(`${API_BASE_URL}/admin/users-complete`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setUsersComplete(response.data.users || []);
          setUsersAnalytics(response.data.analytics || null);
        } catch (err) {
          console.error("Error fetching complete users list:", err);
          setUsersError("Failed to fetch customer data. Make sure you are authorized as admin.");
        } finally {
          setUsersLoading(false);
        }
      };
      fetchUsersComplete();
    }
  }, [activeTab, isAdmin, usersRefreshTrigger]);

  const filteredUsers = usersComplete.filter(u => {
    const query = userSearchQuery.toLowerCase();
    const matchesSearch =
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.mobile || '').toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (userFilter === 'active') return !u.is_blocked;
    if (userFilter === 'blocked') return u.is_blocked;
    if (userFilter === 'new') {
      const uDate = new Date(u.created_at);
      const now = new Date();
      return uDate.getMonth() === now.getMonth() && uDate.getFullYear() === now.getFullYear();
    }
    if (userFilter === 'with_orders') return u.total_orders > 0;
    if (userFilter === 'without_orders') return u.total_orders === 0;

    return true;
  });

  const indexOfLastItem = userPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const renderAddress = (addr) => {
    if (!addr) return 'N/A';
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.pincode,
      addr.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return { date: 'N/A', time: 'N/A' };
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) return { date: 'N/A', time: 'N/A' };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = months[dateObj.getMonth()];
    const y = dateObj.getFullYear();
    const dateStr = `${d}-${m}-${y}`;

    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    return { date: dateStr, time: timeStr };
  };

  const renderAdminAnalytics = () => {
    return (
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-emerald-500"></div>
          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading analytics...</p>
        </div>
      }>
        <HomeAdminAnalytics
          usersAnalytics={usersAnalytics}
          generalAuditLogs={generalAuditLogs}
          auditSearchVal={auditSearchVal}
          setAuditSearchVal={setAuditSearchVal}
          auditActionType={auditActionType}
          setAuditActionType={setAuditActionType}
          auditStatus={auditStatus}
          setAuditStatus={setAuditStatus}
          auditPage={auditPage}
          setAuditPage={setAuditPage}
          auditPerPage={auditPerPage}
          formatPrice={formatPrice}
        />
      </Suspense>
    );
  };

  const renderUsersData = () => {
    return (
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-emerald-500"></div>
          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading user data...</p>
        </div>
      }>
        <HomeUserManagement
          usersAnalytics={usersAnalytics}
          userSearchQuery={userSearchQuery}
          setUserSearchQuery={setUserSearchQuery}
          setUserPage={setUserPage}
          userFilter={userFilter}
          setUserFilter={setUserFilter}
          setShowAddUserModal={setShowAddUserModal}
          currentUsers={currentUsers}
          formatPrice={formatPrice}
          setSelectedUserForDetails={setSelectedUserForDetails}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={indexOfLastItem}
          filteredUsers={filteredUsers}
          totalPages={totalPages}
          userPage={userPage}
        />
      </Suspense>
    );
  };

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'All';
  const activeSearch = searchParams.get('search') || '';

  const handleCategoryClick = useCallback((categoryName, source = 'grid') => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryName === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', categoryName);
    }
    setSearchParams(newParams, { preventScrollReset: true });

    // Smooth scroll to the top of the page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, [searchParams, setSearchParams]);

  // Banner Management States
  const [slides, setSlides] = useState([
    {
      title: "The Solitaire Diamond Collection",
      subtitle: "Eternal Brilliance, Handcrafted Elegance",
      desc: "Explore our signature 18k yellow gold and white gold diamond solitaire rings. Perfect for weddings, proposals, and lifetime memories.",
      badge: "Rings Special",
      gradient: "from-[#3F1D5A] via-[#2C143F] to-[#1B0B26]",
      accent: "text-[#D4A75F]",
      btnText: "Shop Solitaires",
      btnLink: "/?category=Rings",
      catFilter: "Rings",
      image_url: "/luxury_solitaire_ring.png"
    },
    {
      title: "The Royal Empress Collection",
      subtitle: "Ornate Emerald & Pearl Artistry",
      desc: "Adorn yourself with masterfully crafted necklaces, chokers, and bridal neckwear set in solid 22k gold and premium gemstones.",
      badge: "Necklaces Special",
      gradient: "from-[#3F1D5A] via-[#5C2E7E] to-[#3F1D5A]",
      accent: "text-[#D4A75F]",
      btnText: "Shop Necklaces",
      catFilter: "Necklaces",
      image_url: "/luxury_emerald_necklace.png"
    },
    {
      title: "Imperial Bridal Heirlooms",
      subtitle: "Maang Tikkas, Polki Sets & Rubies",
      desc: "Celebrate your grand day with timeless heirloom bridal sets, meticulously set with uncut Polki diamonds and fine rubies.",
      badge: "Bridal Special",
      gradient: "from-[#1B0B26] via-[#3F1D5A] to-[#1B0B26]",
      accent: "text-[#D4A75F]",
      btnText: "Explore Bridal Set",
      catFilter: "Bridal Collection",
      image_url: "/luxury_bridal_set.png"
    }
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannerRefreshTrigger, setBannerRefreshTrigger] = useState(0);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [allBanners, setAllBanners] = useState([]);
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    button_text: '',
    button_link: '',
    image_url: '',
    background_style: 'from-[#3F1D5A] via-[#2C143F] to-[#1B0B26]',
    category: '',
    display_order: 0,
    is_active: true
  });
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const [bannerError, setBannerError] = useState(null);
  const [bannerSuccess, setBannerSuccess] = useState(null);

  const [siteSettings, setSiteSettings] = useState({
    owner_image: "/owner.png",
    owner_name: "Shri Suresh Soni",
    owner_title: "Founder & Master Craftsman",
    owner_est: "Est. 1999 · Jaipur, India",
    owner_bio_1: "With over 25 years of dedication to the ancient art of Indian jewellery...",
    owner_bio_2: "A third-generation goldsmith trained in the royal ateliers...",
    owner_quote: "Every jewel we craft carries a piece of our soul...",
    video_showcase_url: "/golden-stage.mp4",
    luxury_gallery_items: []
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Auto scroll slides
  useEffect(() => {
    if (slides.length === 0 || bannersLoading) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, bannersLoading]);

  const handlePrevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setActiveSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const handleNextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setActiveSlide(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/settings`);
      if (response.data) {
        let galleryItems = [];
        if (response.data.luxury_gallery_items) {
          try {
            galleryItems = JSON.parse(response.data.luxury_gallery_items);
          } catch (e) {
            console.error("Error parsing luxury gallery items:", e);
          }
        }
        setSiteSettings({
          owner_image: response.data.owner_image || "/owner.png",
          owner_name: response.data.owner_name || "Shri Suresh Soni",
          owner_title: response.data.owner_title || "Founder & Master Craftsman",
          owner_est: response.data.owner_est || "Est. 1999 · Jaipur, India",
          owner_bio_1: response.data.owner_bio_1 || "",
          owner_bio_2: response.data.owner_bio_2 || "",
          owner_quote: response.data.owner_quote || "",
          video_showcase_url: response.data.video_showcase_url || "/golden-stage.mp4",
          luxury_gallery_items: galleryItems,
          owner_stats: response.data.owner_stats,
          owner_badges: response.data.owner_badges,
          occasion_items_en: response.data.occasion_items_en,
          occasion_items_hi: response.data.occasion_items_hi,
          owners_list: response.data.owners_list
        });
      }
    } catch (err) {
      console.error("Error fetching site settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch active banners from backend
  useEffect(() => {
    const fetchActiveBanners = async () => {
      setBannersLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/banners`);
        if (response.data && response.data.length > 0) {
          const mapped = response.data.map(b => {
            let img = b.image_url;
            if (!img) {
              if (b.title.includes("Solitaire") || b.category === "Rings") img = "/luxury_solitaire_ring.png";
              else if (b.title.includes("Empress") || b.category === "Necklaces") img = "/luxury_emerald_necklace.png";
              else if (b.title.includes("Bridal") || b.category === "Bridal Collection") img = "/luxury_bridal_set.png";
            }
            return {
              id: b.id,
              title: b.title,
              subtitle: b.subtitle,
              desc: b.description,
              badge: b.category || "Offer",
              gradient: b.background_style || "from-[#3F1D5A] via-[#2C143F] to-[#1B0B26]",
              accent: "text-[#D4A75F]",
              btnText: b.button_text || "Shop Now",
              btnLink: b.button_link || "/?category=Rings",
              catFilter: b.category || "Rings",
              image_url: img
            };
          });
          setSlides(mapped);
        } else {
          setSlides([
            {
              title: "The Solitaire Diamond Collection",
              subtitle: "Eternal Brilliance, Handcrafted Elegance",
              desc: "Explore our signature 18k yellow gold and white gold diamond solitaire rings. Perfect for weddings, proposals, and lifetime memories.",
              badge: "Rings Special",
              gradient: "from-[#3F1D5A] via-[#2C143F] to-[#1B0B26]",
              accent: "text-[#D4A75F]",
              btnText: "Shop Solitaires",
              btnLink: "/?category=Rings",
              catFilter: "Rings",
              image_url: "/luxury_solitaire_ring.png"
            },
            {
              title: "The Royal Empress Collection",
              subtitle: "Ornate Emerald & Pearl Artistry",
              desc: "Adorn yourself with masterfully crafted necklaces, chokers, and bridal neckwear set in solid 22k gold and premium gemstones.",
              badge: "Necklaces Special",
              gradient: "from-[#3F1D5A] via-[#5C2E7E] to-[#3F1D5A]",
              accent: "text-[#D4A75F]",
              btnText: "Shop Necklaces",
              btnLink: "/?category=Necklaces",
              catFilter: "Necklaces",
              image_url: "/luxury_emerald_necklace.png"
            },
            {
              title: "Imperial Bridal Heirlooms",
              subtitle: "Maang Tikkas, Polki Sets & Rubies",
              desc: "Celebrate your grand day with timeless heirloom bridal sets, meticulously set with uncut Polki diamonds and fine rubies.",
              badge: "Bridal Special",
              gradient: "from-[#1B0B26] via-[#3F1D5A] to-[#1B0B26]",
              accent: "text-[#D4A75F]",
              btnText: "Explore Bridal Set",
              btnLink: "/?category=Bridal Collection",
              catFilter: "Bridal Collection",
              image_url: "/luxury_bridal_set.png"
            }
          ]);
        }
      } catch (err) {
        console.error("Error fetching active banners from backend:", err);
      } finally {
        setBannersLoading(false);
      }
    };
    fetchActiveBanners();
    fetchSiteSettings();
  }, [bannerRefreshTrigger]);

  const fetchAllBanners = async () => {
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/banners/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAllBanners(response.data || []);
    } catch (err) {
      console.error("Error fetching all banners for admin:", err);
      setBannerError("Failed to fetch all banners.");
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBannerImage(true);
    setBannerError(null);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/banners/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setBannerForm(prev => ({ ...prev, image_url: response.data.image_url }));
      setBannerSuccess("Image uploaded successfully!");
    } catch (err) {
      console.error("Error uploading banner image:", err);
      setBannerError(err.response?.data?.message || "Failed to upload banner image.");
    } finally {
      setUploadingBannerImage(false);
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const payload = {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        description: bannerForm.description,
        button_text: bannerForm.button_text,
        button_link: bannerForm.button_link,
        image_url: bannerForm.image_url,
        background_style: bannerForm.background_style,
        category: bannerForm.category,
        display_order: parseInt(bannerForm.display_order) || 0,
        is_active: bannerForm.is_active
      };

      let res;
      if (editingBannerId) {
        res = await axios.put(`${API_BASE_URL}/admin/banners/${editingBannerId}`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBannerSuccess("Banner slide updated successfully!");
      } else {
        res = await axios.post(`${API_BASE_URL}/admin/banners`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBannerSuccess("Banner slide created successfully!");
      }
      setIsEditingBanner(false);
      setEditingBannerId(null);
      setBannerRefreshTrigger(prev => prev + 1);
      fetchAllBanners();
    } catch (err) {
      console.error("Error saving banner:", err);
      setBannerError(err.response?.data?.message || "Failed to save banner slide.");
    }
  };

  const startEditBanner = (banner) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      button_text: banner.button_text || 'Shop Now',
      button_link: banner.button_link || '',
      image_url: banner.image_url || '',
      background_style: banner.background_style || 'from-slate-900 via-indigo-950 to-slate-900',
      category: banner.category || '',
      display_order: banner.display_order || 1,
      is_active: banner.is_active !== undefined ? banner.is_active : true
    });
    setIsEditingBanner(true);
    setBannerError(null);
    setBannerSuccess(null);
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner slide?")) return;
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/admin/banners/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBannerSuccess("Banner deleted successfully!");
      setBannerRefreshTrigger(prev => prev + 1);
      fetchAllBanners();
    } catch (err) {
      console.error("Error deleting banner:", err);
      setBannerError(err.response?.data?.message || "Failed to delete banner.");
    }
  };

  useEffect(() => {
    if (isAdmin && isBannerModalOpen) {
      fetchAllBanners();
    }
  }, [isAdmin, isBannerModalOpen]);

  // Fetch products from backend APIs
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${API_BASE_URL}/products`;
        const params = [];
        if (activeCategory && activeCategory !== 'All') {
          params.push(`category=${encodeURIComponent(activeCategory)}`);
        }
        if (activeSearch) {
          params.push(`search=${encodeURIComponent(activeSearch)}`);
        }
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }

        const response = await axios.get(url);
        setProducts(response.data);

        // Fetch all products (filtered by category if selected, but NOT by search query) if searching
        if (activeSearch) {
          setAllProductsLoading(true);
          let allUrl = `${API_BASE_URL}/products`;
          if (activeCategory && activeCategory !== 'All') {
            allUrl += `?category=${encodeURIComponent(activeCategory)}`;
          }
          const allResponse = await axios.get(allUrl);
          setAllProducts(allResponse.data);
          setAllProductsLoading(false);
        } else {
          setAllProducts([]);
        }
      } catch (err) {
        console.error("Error fetching products", err);
        setError("Could not connect to the backend server. Make sure MongoDB and the Flask app are running.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory, activeSearch, language, refreshTrigger]);

  const isAdminAddressEmpty = !addUserForm.address?.trim() && !addUserForm.city?.trim() && !addUserForm.state?.trim() && !addUserForm.pincode?.trim();
  const isAdminPincodeInvalid = isAdminAddressEmpty ? false : addUserForm.pincode?.trim().length !== 6;

  return (
    <div className="min-h-screen pb-16 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">

      {!activeSearch && activeCategory === 'All' ? (
        <BannerSlider
          slides={slides}
          activeSlide={activeSlide}
          setActiveSlide={setActiveSlide}
          isAdmin={isAdmin}
          handleNextSlide={handleNextSlide}
          handlePrevSlide={handlePrevSlide}
          opacityParallax={opacityParallax}
          yParallax={yParallax}
          bannersLoading={bannersLoading}
          onCategoryClick={handleCategoryClick}
        />
      ) : (
        <SearchSpotlight products={products} language={language} />
      )}

      {!activeSearch && activeCategory === 'All' && (
        <CategoryGrid 
          activeCategory={activeCategory} 
          loading={loading} 
          onCategoryClick={handleCategoryClick}
        />
      )}




      {/* Main Content Area */}
      <div id="all-products-heading" className="w-full max-w-[97%] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Title / Filter Info */}
        <div className="flex flex-col items-baseline justify-between pb-4 mb-8 border-b sm:flex-row border-slate-200/50 dark:border-slate-800">
          <div>
            {isAdmin ? (
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-2">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'products'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'users'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  Users Data
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'analytics'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  Admin Analytics
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {activeSearch 
                    ? (language === 'hi' ? `"${activeSearch}" के लिए खोज परिणाम` : `Search Results for "${activeSearch}"`)
                    : (activeCategory === 'All' 
                        ? translateUiLabel("All Products", language) 
                        : `${translateCategory(activeCategory, language)} ${language === 'hi' ? 'उत्पाद' : 'Products'}`
                      )
                  }
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {translateUiLabel("Showing premium handpicked items in stock.", language)}
                </p>
              </>
            )}
          </div>
          <div className="relative flex items-center self-end gap-4 mt-4 sm:mt-0 sm:self-auto">
            {activeCategory !== 'All' && activeTab === 'products' && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryClick('All');
                }}
                className="text-xs text-[#D4A75F] hover:text-[#B38F4B] hover:underline font-bold transition-colors"
              >
                Clear filters
              </button>
            )}

            {isAdmin && (
              <Link
                to="/admin-control"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white border border-slate-900 dark:bg-[#1E1E1E] dark:border-[#D4A75F] dark:text-[#FFFFFF] rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 dark:hover:bg-[#2A2A2A] dark:hover:border-[#D4A75F] dark:shadow-[0_4px_15px_rgba(212,167,95,0.25)] transition-all cursor-pointer"
                id="admin-control-btn"
              >
                <span>Admin Control</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Loading Skeletons */}
        {activeTab === 'products' && loading && (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Error State */}
        {activeTab === 'products' && error && (
          <div className="max-w-xl p-6 mx-auto my-12 text-center border border-red-200 bg-red-50 dark:bg-red-955/20 dark:border-red-900 rounded-2xl">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Failed to Load Products</h3>
            <p className="mt-2 text-sm text-slate-555 dark:text-slate-400">{error}</p>
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="px-4 py-2 mt-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {activeTab === 'products' && !activeSearch && !loading && !error && products.length === 0 && (
          <div className="max-w-md py-20 mx-auto text-center">
            <div className="flex items-center justify-center w-16 h-16 p-4 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold">No Products Found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              We couldn't find any products matching your current category filter or search query.
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleCategoryClick('All');
              }}
              className="mt-6 px-5 py-2 bg-[#D4A75F] hover:bg-[#B38F4B] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              View All Products
            </button>
          </div>
        )}

        {/* Product Grid (No Search) */}
        {activeTab === 'products' && !activeSearch && !loading && !error && products.length > 0 && (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="product-grid"
          >
            {products.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                onAdminAction={(productId) => setSelectedAdminProductId(productId)}
              />
            ))}
          </motion.div>
        )}

        {/* Product Grid & All Products (With Search) */}
        {activeTab === 'products' && activeSearch && !loading && !error && (
          <>
            {/* Search Results */}
            {products.length === 0 ? (
              <div className="max-w-md py-10 mx-auto text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'hi' ? 'खोज के अनुसार कोई उत्पाद नहीं मिला।' : 'No products matched your search query.'}
                </p>
              </div>
            ) : (
              <motion.div
                key={`search-${activeCategory}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="product-grid"
              >
                {products.map(product => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAdminAction={(productId) => setSelectedAdminProductId(productId)}
                  />
                ))}
              </motion.div>
            )}

          </>
        )}

        {/* Users Data Tab Content */}
        {isAdmin && activeTab === 'users' && (
          usersLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-emerald-500"></div>
              <p className="mt-4 text-sm font-semibold text-slate-550 dark:text-slate-400">Loading customer database...</p>
            </div>
          ) : usersError ? (
            <div className="max-w-xl p-6 mx-auto my-12 text-center border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 rounded-2xl">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Error Loading Users</h3>
              <p className="mt-2 text-sm text-slate-550 dark:text-slate-400">{usersError}</p>
              <button
                onClick={() => {
                  setActiveTab('products');
                  setTimeout(() => setActiveTab('users'), 50);
                }}
                className="px-4 py-2 mt-4 text-xs font-bold text-white shadow-md cursor-pointer bg-emerald-500 hover:bg-emerald-600 rounded-xl"
              >
                Try Again
              </button>
            </div>
          ) : (
            renderUsersData()
          )
        )}

        {/* Admin Analytics Tab Content */}
        {isAdmin && activeTab === 'analytics' && (
          usersLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-emerald-500"></div>
              <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading analytics...</p>
            </div>
          ) : usersError ? (
            <div className="max-w-xl p-6 mx-auto my-12 text-center border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 rounded-2xl">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Error Loading Analytics</h3>
              <p className="mt-2 text-sm text-slate-550 dark:text-slate-400">{usersError}</p>
            </div>
          ) : (
            renderAdminAnalytics()
          )
        )}
      </div>



      {!activeSearch && activeTab === 'products' && activeCategory === 'All' && (
        <>
          <LuxuryGallery items={siteSettings.luxury_gallery_items} />
          <OccasionGallery
            items={parseJsonSafe(language === 'hi' ? siteSettings.occasion_items_hi : siteSettings.occasion_items_en, null)}
            englishItems={parseJsonSafe(siteSettings.occasion_items_en, [])}
            onCategoryClick={handleCategoryClick}
          />
          <TrustShowcase />
          <GoldCalculator />
          <VideoShowcase url={siteSettings.video_showcase_url} />
          {parseJsonSafe(siteSettings.owners_list, [
            {
              id: 1,
              name: siteSettings.owner_name || "Shri Suresh Soni",
              title: siteSettings.owner_title || "Founder & Master Craftsman",
              est: siteSettings.owner_est || "Est. 1999 · Jaipur, India",
              bio1: siteSettings.owner_bio_1 || "With over 25 years of dedication to the ancient art of Indian jewellery, Shri Suresh Soni has transformed SS Jewellery into a hallmark of excellence trusted by families across India.",
              bio2: siteSettings.owner_bio_2 || "A third-generation goldsmith trained in the royal ateliers of Jaipur, he brings Kundan, Meenakari, and Jadau traditions into every handcrafted piece — blending timeless heritage with contemporary elegance.",
              quote: siteSettings.owner_quote || "Every jewel we craft carries a piece of our soul — because true luxury is not just about gold, it is about the love and legacy it carries forever.",
              image: siteSettings.owner_image || "/owner.png",
              stats: parseJsonSafe(siteSettings.owner_stats, [
                { label: 'Years of Craft', value: 25, suffix: '+' },
                { label: 'Unique Designs', value: 1200, suffix: '+' },
                { label: 'Happy Clients', value: 8500, suffix: '+' },
                { label: 'Awards Won', value: 18, suffix: '' }
              ]),
              badges: parseJsonSafe(siteSettings.owner_badges, ['BIS Hallmark Certified', 'ISO 9001:2015', 'Rajasthan Ratna Awardee', 'GIA Member'])
            }
          ]).map((owner, idx) => (
            <OwnerShowcase 
              key={owner.id || idx}
              image={owner.image}
              name={owner.name}
              title={owner.title}
              est={owner.est}
              bio1={owner.bio1}
              bio2={owner.bio2}
              quote={owner.quote}
              stats={owner.stats}
              badges={owner.badges}
              showStatsAndBadges={idx === 0}
              isReversed={idx % 2 !== 0}
            />
          ))}
        </>
      )}

      {/* Admin Panel Modal */}
      {selectedAdminProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 transform scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🛠️</span>
                <h3 className="text-base font-extrabold tracking-wide uppercase text-slate-850 dark:text-slate-100">
                  Inline Admin Management
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedAdminProductId(null);
                  setRefreshTrigger(prev => prev + 1);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 p-2 overflow-y-auto sm:p-6 bg-slate-50 dark:bg-slate-950">
              <Suspense fallback={
                <div className="w-full min-h-[300px] flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-[#D4A75F] border-t-transparent rounded-full animate-spin"></div>
                </div>
              }>
                <ProductDetails productId={selectedAdminProductId} />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-all transform scale-100">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-850 dark:text-slate-100">Add New User Account</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Create a new customer or admin user in the system</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setAddUserError(null);
                  setAddUserSuccess(null);
                }}
                className="p-2 transition-colors cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleCreateUserSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto">
              {addUserError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-500 text-xs font-semibold flex items-center gap-2 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <span>{addUserError}</span>
                </div>
              )}

              {addUserSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-500 text-xs font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>{addUserSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={addUserForm.name}
                    onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@example.com"
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={addUserForm.mobile}
                    onChange={(e) => setAddUserForm({ ...addUserForm, mobile: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Role *</label>
                  <select
                    value={addUserForm.role}
                    onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={addUserForm.password}
                    onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={addUserForm.confirm_password}
                    onChange={(e) => setAddUserForm({ ...addUserForm, confirm_password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Address Fields Section */}
              <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-850">
                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address Details</h4>

                {/* Street Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Street Address</label>
                  <input
                    type="text"
                    placeholder="Flat, House no., Building, Company, Apartment, Street"
                    value={addUserForm.address}
                    onChange={(e) => setAddUserForm({ ...addUserForm, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={addUserForm.city}
                      onChange={(e) => setAddUserForm({ ...addUserForm, city: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">State</label>
                    <input
                      type="text"
                      placeholder="e.g. Maharashtra"
                      value={addUserForm.state}
                      onChange={(e) => setAddUserForm({ ...addUserForm, state: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pincode</label>
                    <input
                      type="text"
                      placeholder="e.g. 400001"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={addUserForm.pincode}
                      onChange={(e) => setAddUserForm({ ...addUserForm, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
                    />
                    {addUserForm.pincode && addUserForm.pincode.length !== 6 && (
                      <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                        Please enter a valid 6-digit PIN Code.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setAddUserError(null);
                    setAddUserSuccess(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading || isAdminPincodeInvalid}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
                >
                  {addUserLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected User Details Modal */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 transform scale-100">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 text-base font-black bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-500">
                  {selectedUserForDetails.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                    Customer Details & History
                  </h3>
                  <p className="text-[10px] text-slate-405">
                    User ID: {selectedUserForDetails.id} • {selectedUserForDetails.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">

              {/* User Stats Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-4 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200/50 dark:border-slate-800">
                  <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Orders</span>
                    <span className="text-sm font-black text-slate-850 dark:text-white price-amount">
                      {selectedUserForDetails.total_orders} orders
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200/50 dark:border-slate-800">
                  <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Spending</span>
                    <span className="text-sm font-black text-slate-850 dark:text-white price-amount">
                      ₹{formatPrice(selectedUserForDetails.total_spent)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200/50 dark:border-slate-800">
                  <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Last Order Date</span>
                    <span className="text-sm font-black text-slate-855 dark:text-white price-amount">
                      {selectedUserForDetails.last_order_date ? formatDateTime(selectedUserForDetails.last_order_date).date : 'No orders'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="p-5 space-y-3 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200/50 dark:border-slate-800">
                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-805 dark:text-slate-200">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>Delivery Address Details</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                  <div>
                    <span className="text-[10px] text-slate-450 block font-bold">Full Address</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedUserForDetails.address?.street || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 block font-bold">City</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedUserForDetails.address?.city || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 block font-bold">State</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedUserForDetails.address?.state || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 block font-bold">Pincode / Country</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedUserForDetails.address?.pincode || 'N/A'} • {selectedUserForDetails.address?.country || 'India'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order History Table */}
              <div className="p-5 space-y-4 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200/50 dark:border-slate-800">
                <h4 className="flex items-center gap-2 pb-3 text-xs font-bold border-b text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Complete Order History ({selectedUserForDetails.orders?.length || 0})</span>
                </h4>

                {(!selectedUserForDetails.orders || selectedUserForDetails.orders.length === 0) ? (
                  <p className="py-4 text-xs italic text-slate-450">No order history found for this customer.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="font-bold tracking-wider uppercase border-b text-slate-400 border-slate-100 dark:border-slate-800">
                          <th className="px-2 py-3">Order ID</th>
                          <th className="px-2 py-3">Products</th>
                          <th className="px-2 py-3 text-center">Quantity</th>
                          <th className="px-2 py-3 text-right">Amount</th>
                          <th className="px-2 py-3 text-center">Payment Method</th>
                          <th className="px-2 py-3 text-center">Order Date</th>
                          <th className="px-2 py-3 text-center">Order Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {selectedUserForDetails.orders.map((order, oIdx) => {
                          const { date } = formatDateTime(order.created_at);
                          return (
                            <tr key={oIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                              <td className="py-3 px-2 font-mono text-[11px] text-slate-450">
                                {order.order_id}
                              </td>
                              <td className="max-w-xs px-2 py-3">
                                {order.items?.map((item, iIdx) => (
                                  <div key={iIdx} className="flex items-center gap-2 my-1">
                                    {item.image && (
                                      <img src={item.image} alt={item.name} className="object-cover border rounded-lg w-7 h-7 border-slate-200/50 dark:border-slate-800" />
                                    )}
                                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate block max-w-[180px]">
                                      {item.name}
                                    </span>
                                  </div>
                                ))}
                              </td>
                              <td className="px-2 py-3 font-mono font-bold text-center text-slate-600 dark:text-slate-300">
                                {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                              </td>
                              <td className="px-2 py-3 font-mono font-black text-right text-emerald-500 price-amount">
                                ₹{formatPrice(order.total_amount)}
                              </td>
                              <td className="px-2 py-3 font-bold text-center text-slate-500 dark:text-slate-400">
                                {order.payment_method}
                              </td>
                              <td className="px-2 py-3 font-mono text-center text-slate-450">
                                {date}
                              </td>
                              <td className="px-2 py-3 text-center">
                                <span className={`inline-flex items-center px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm ${
                                  (order.order_status || '').toLowerCase() === 'pending'
                                    ? 'status-badge-pending'
                                    : (order.order_status || '').toLowerCase() === 'processing' || (order.order_status || '').toLowerCase() === 'confirmed' || (order.order_status || '').toLowerCase() === 'packed'
                                    ? 'bg-[#3B82F6] text-white border-[#2563EB]'
                                    : (order.order_status || '').toLowerCase() === 'shipped' || (order.order_status || '').toLowerCase() === 'dispatched'
                                    ? 'bg-[#06B6D4] text-white border-[#0891B2]'
                                    : (order.order_status || '').toLowerCase() === 'out for delivery'
                                    ? 'bg-[#8B5CF6] text-white border-[#7C3AED]'
                                    : (order.order_status || '').toLowerCase() === 'delivered'
                                    ? 'status-badge-success'
                                    : (order.order_status || '').toLowerCase() === 'cancelled'
                                    ? 'bg-[#EF4444] text-white border-[#DC2626]'
                                    : 'bg-[#6B7280] text-white border-[#4B5563]'
                                }`}>
                                  {order.order_status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Banner Management Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🖼️</span>
                <h3 className="text-base font-extrabold tracking-wide uppercase text-slate-850 dark:text-slate-100">
                  Homepage Banner Slider Management
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsBannerModalOpen(false);
                  setIsEditingBanner(false);
                  setEditingBannerId(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-955">
              {bannerError && (
                <div className="mb-4 p-3.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl text-xs font-semibold">
                  {bannerError}
                </div>
              )}
              {bannerSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl text-xs font-semibold">
                  {bannerSuccess}
                </div>
              )}

              {!isEditingBanner ? (
                // Banner List View
                <div className="space-y-6">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure background gradients, titles, images, and display order of slides rendered on the store homepage hero banner.
                    </p>
                    <button
                      onClick={() => {
                        setEditingBannerId(null);
                        setBannerForm({
                          title: '',
                          subtitle: '',
                          description: '',
                          button_text: 'Shop Now',
                          button_link: '',
                          image_url: '',
                          background_style: 'from-slate-900 via-indigo-950 to-slate-900',
                          category: '',
                          display_order: allBanners.length + 1,
                          is_active: true
                        });
                        setIsEditingBanner(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Banner</span>
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {allBanners.length === 0 ? (
                      <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
                        <span className="block mb-2 text-3xl">📭</span>
                        <p className="text-xs">No custom banners created yet. The homepage will display standard seeded/fallback slides.</p>
                      </div>
                    ) : (
                      allBanners.map((banner) => (
                        <div
                          key={banner.id}
                          className="flex items-center justify-between gap-4 p-4 transition-shadow bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-100 dark:border-slate-800 hover:shadow-md"
                        >
                          <div className="flex items-center flex-1 min-w-0 gap-4">
                            {/* Gradient preview circle */}
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${banner.background_style} flex items-center justify-center border border-white/10 flex-shrink-0`}>
                              {banner.image_url ? (
                                <img src={banner.image_url} alt="" className="object-contain w-10 h-10 rounded" />
                              ) : (
                                <span className="font-mono text-xs font-bold text-white">B</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-extrabold truncate text-slate-800 dark:text-slate-200">
                                  {banner.title}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${banner.is_active
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                  }`}>
                                  {banner.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-450 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {banner.subtitle || banner.description || 'No subtitle/description'}
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-semibold">
                                <span>Order: <strong className="text-slate-600 dark:text-slate-200">{banner.display_order}</strong></span>
                                <span>•</span>
                                <span>Category: <strong className="text-slate-600 dark:text-slate-200">{banner.category || 'All'}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditBanner(banner)}
                              className="p-2 transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl"
                              title="Edit Banner"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="p-2 transition-all cursor-pointer bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl"
                              title="Delete Banner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                // Banner Create/Edit Form View
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      {editingBannerId ? '✏ Edit Slide Details' : '✨ Create New Banner Slide'}
                    </h4>
                    <button
                      onClick={() => {
                        setIsEditingBanner(false);
                        setEditingBannerId(null);
                      }}
                      className="text-xs font-bold cursor-pointer text-slate-500 hover:text-slate-750 dark:hover:text-slate-200"
                    >
                      ← Back to list
                    </button>
                  </div>

                  {/* Live Preview Container */}
                  <div className="relative overflow-hidden border shadow-lg border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-900">
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                      Live Preview
                    </div>
                    <div className={`bg-gradient-to-r ${bannerForm.background_style} flex items-center justify-between p-6 sm:p-8 min-h-[160px] sm:min-h-[220px] transition-all duration-300`}>
                      <div className="flex-1 pr-4 text-white">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-400 border border-white/10 w-fit mb-2">
                          <Sparkles className="w-3 h-3" />
                          {bannerForm.category || 'Special Offer'}
                        </span>
                        <h2 className="text-xl font-black leading-tight tracking-tight sm:text-3xl line-clamp-1">
                          {bannerForm.title || 'Enter Title...'}
                        </h2>
                        <h3 className="text-xs sm:text-sm font-bold text-emerald-400 line-clamp-1 mt-0.5">
                          {bannerForm.subtitle || 'Enter Subtitle...'}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-slate-300 mt-1.5 max-w-md line-clamp-2">
                          {bannerForm.description || 'Enter Description details here...'}
                        </p>
                        <span className="mt-3 inline-block px-4 py-1.5 bg-emerald-500 text-white rounded-xl font-bold text-[10px] shadow-sm select-none">
                          {bannerForm.button_text || 'Shop Now'}
                        </span>
                      </div>
                      {bannerForm.image_url && (
                        <div className="flex items-center justify-center flex-shrink-0 w-24 h-24 sm:w-36 sm:h-36">
                          <img
                            src={bannerForm.image_url}
                            alt=""
                            className="object-contain w-auto max-h-full shadow-md rounded-xl"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSaveBanner} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Inputs Left */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Banner Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={bannerForm.title}
                          onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. SSJewellery Big Savings Day"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Banner Subtitle
                        </label>
                        <input
                          type="text"
                          value={bannerForm.subtitle}
                          onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. Experience Premium Audio Gear"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Description
                        </label>
                        <textarea
                          rows="3"
                          value={bannerForm.description}
                          onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="e.g. Get flat 15% off on Active Noise-Cancelling Headphones."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Button Text
                          </label>
                          <input
                            type="text"
                            value={bannerForm.button_text}
                            onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="e.g. Shop Now"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Button Redirect Link
                          </label>
                          <input
                            type="text"
                            value={bannerForm.button_link}
                            onChange={(e) => setBannerForm({ ...bannerForm, button_link: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="e.g. /?category=Electronics"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inputs Right */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Category / Badge Accent
                        </label>
                        <select
                          value={bannerForm.category}
                          onChange={(e) => setBannerForm({ ...bannerForm, category: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="">Choose Category...</option>
                          <option value="Rings">Rings</option>
                          <option value="Necklaces">Necklaces</option>
                          <option value="Earrings">Earrings</option>
                          <option value="Bracelets">Bracelets</option>
                          <option value="Bangles">Bangles</option>
                          <option value="Bridal Collection">Bridal Collection</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Display Order
                          </label>
                          <input
                            type="number"
                            value={bannerForm.display_order}
                            onChange={(e) => setBannerForm({ ...bannerForm, display_order: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>

                        <div className="flex items-center h-full pt-6">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={bannerForm.is_active}
                              onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                              className="w-4 h-4 rounded cursor-pointer border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable Slide</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Background Gradient Style
                        </label>
                        <select
                          value={bannerForm.background_style}
                          onChange={(e) => setBannerForm({ ...bannerForm, background_style: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-2"
                        >
                          <option value="from-slate-900 via-indigo-950 to-slate-900">Indigo Dark</option>
                          <option value="from-slate-900 via-emerald-950 to-slate-900">Emerald Dark</option>
                          <option value="from-slate-900 via-rose-950 to-slate-900">Rose Dark</option>
                          <option value="from-slate-900 via-purple-950 to-slate-900">Purple Dark</option>
                          <option value="from-slate-900 via-amber-950 to-slate-900">Amber Dark</option>
                          <option value="from-slate-900 via-teal-950 to-slate-900">Teal Dark</option>
                        </select>
                        <input
                          type="text"
                          value={bannerForm.background_style}
                          onChange={(e) => setBannerForm({ ...bannerForm, background_style: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                          placeholder="Or enter custom Tailwind CSS gradient classes"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Slide Image
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={bannerForm.image_url}
                            onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="Image URL (e.g. https://... or leave empty)"
                          />
                          <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-extrabold cursor-pointer border border-slate-200 dark:border-slate-850 h-[38px] min-w-[100px] text-center whitespace-nowrap">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingBannerImage ? '...' : 'Upload'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBannerImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {bannerForm.image_url && (
                          <button
                            type="button"
                            onClick={() => setBannerForm({ ...bannerForm, image_url: '' })}
                            className="text-[10px] text-rose-500 hover:underline mt-1 font-bold block"
                          >
                            Delete Current Image
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end col-span-1 gap-3 pt-4 mt-6 border-t md:col-span-2 border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingBanner(false);
                          setEditingBannerId(null);
                        }}
                        className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Save Slide
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
