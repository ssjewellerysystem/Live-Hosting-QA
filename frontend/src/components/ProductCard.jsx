import React, { useContext, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { LuxuryImage } from './LuxuryImage';
import { formatPrice } from '../utils/priceFormatter';
import { translateCategory } from '../utils/categoryTranslations';

export const ProductCard = React.memo(({ product, onAdminAction }) => {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, triggerAuthModal } = useContext(CartContext);
  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, localize, language } = useTranslation();

  const isProductInWishlist = useMemo(() => isInWishlist(product._id), [isInWishlist, product._id]);
  const discountedPrice = useMemo(() => Math.round(product.price - (product.price * (product.discount / 100))), [product.price, product.discount]);

  const handleWishlistToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      triggerAuthModal(t('product_card.login_wishlist'), window.location.pathname);
      return;
    }
    if (isProductInWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  }, [user, triggerAuthModal, t, isProductInWishlist, product, removeFromWishlist, addToWishlist]);

  const handleCardClick = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(`/product/${product._id}`);
  }, [navigate, product._id]);

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-[#D4A75F]/30 transition-all duration-500 overflow-hidden flex flex-col h-full cursor-pointer"
    >
      {/* Wishlist Button */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleWishlistToggle}
        className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
      >
        <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isProductInWishlist ? 'text-red-500 fill-current animate-heart-beat' : 'transition-transform'}`} />
      </motion.button>

      {/* Discount Badge */}
      {product.discount > 0 && (
        <span className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10 bg-red-500 text-white font-semibold text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm">
          {product.discount}% {t('product_card.off')}
        </span>
      )}

      <Link to={`/product/${product._id}`} className="block relative aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        <LuxuryImage
          src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60'}
          alt={localize(product, 'name')}
          className={`no-zoom w-full h-full object-cover transition-all duration-700 ease-in-out ${
            product.images && product.images.length > 1
              ? 'group-hover:scale-108 group-hover:opacity-0'
              : 'group-hover:scale-108'
          }`}
          loading="lazy"
          width="600"
          height="600"
          fetchPriority="low"
        />
        {product.images && product.images.length > 1 && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-in-out pointer-events-none">
            <LuxuryImage
              src={product.images[1]}
              alt={`${localize(product, 'name')} - Alternate`}
              className="no-zoom w-full h-full object-cover transition-all duration-700 ease-in-out scale-102 group-hover:scale-108"
              loading="lazy"
              width="600"
              height="600"
              fetchPriority="low"
            />
          </div>
        )}
      </Link>

      {/* Content Block */}
      <div className="p-2.5 sm:p-4.5 flex-grow flex flex-col">
        {/* Category */}
        <span className="text-[9px] sm:text-xs font-semibold text-[#D4A75F] uppercase tracking-wider">
          {translateCategory(product.category, language)}
        </span>

        {/* Product Title */}
        <Link to={`/product/${product._id}`} className="block mt-0.5">
          <h3 className="text-xs sm:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#3F1D5A] dark:group-hover:text-[#D4A75F] transition-colors line-clamp-1">
            {localize(product, 'name')}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mt-1 mb-2 flex-wrap gap-0.5 sm:gap-0">
          <div className="flex items-center text-amber-400">
            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
            <span className="ml-0.5 text-[10px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              {(product.ratings || 0).toFixed(1)}
            </span>
          </div>
          <span className="mx-1 text-slate-300 dark:text-slate-600 sm:inline">•</span>
          <span className="text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">
            {product.review_count !== undefined ? product.review_count : (product.reviews ? product.reviews.length : 0)} {t('product_details.reviews') || 'reviews'}
          </span>
        </div>

        {/* Description */}
        <p className="hidden sm:block text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 flex-grow">
          {localize(product, 'description')}
        </p>

        {/* Price Row */}
        <div className="flex items-baseline space-x-1.5 mb-1 flex-wrap">
          <span className="text-sm sm:text-xl font-extrabold text-[#3F1D5A] dark:text-[#EFE7DB] price-amount">
            ₹{formatPrice(discountedPrice)}
          </span>
          {product.discount > 0 && (
            <span className="text-[10px] sm:text-sm text-slate-400 line-through font-medium price-amount">
              ₹{formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Admin Action Button */}
        {isAdmin && (
          <div className="mt-auto pt-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onAdminAction) {
                  onAdminAction(product._id);
                } else {
                  navigate('/admin');
                }
              }}
              className="w-full py-1.5 px-2 bg-slate-100 hover:bg-[#D4A75F] hover:text-white dark:bg-slate-700/50 dark:hover:bg-[#D4A75F] text-slate-800 dark:text-slate-200 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs tracking-wide transition-all text-center block border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
            >
              🛠️ {t('navbar.admin_panel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// Premium Shimmer Skeleton Loader for Product Cards
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm p-3 sm:p-4 flex flex-col h-full space-y-3 sm:space-y-4">
      {/* Image skeleton */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-lg sm:rounded-xl flex items-center justify-center">
        <div className="absolute inset-0 luxury-gold-shimmer pointer-events-none" />
        <img
          src="/loading-logo.jpg"
          alt="Loading..."
          className="h-12 w-auto opacity-50 object-contain relative z-20 animate-pulse dark:mix-blend-screen mix-blend-multiply dark:invert-0 invert"
        />
      </div>
      
      {/* Category skeleton */}
      <div className="skeleton-premium h-3 w-1/4 rounded" />
      
      {/* Title skeleton */}
      <div className="skeleton-premium h-4 sm:h-5 w-3/4 rounded" />
      
      {/* Rating & Stock skeleton */}
      <div className="flex space-x-2">
        <div className="skeleton-premium h-3.5 sm:h-4 w-10 rounded" />
        <div className="skeleton-premium h-3.5 sm:h-4 w-14 rounded" />
      </div>
      
      {/* Description skeleton */}
      <div className="hidden sm:block space-y-2 flex-grow">
        <div className="skeleton-premium h-3 w-full rounded" />
        <div className="skeleton-premium h-3 w-5/6 rounded" />
      </div>
      
      {/* Price skeleton */}
      <div className="skeleton-premium h-5 sm:h-6 w-1/3 rounded" />
    </div>
  );
};
