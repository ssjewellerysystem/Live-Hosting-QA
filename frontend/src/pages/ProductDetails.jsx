/* eslint-disable no-unused-vars */
// ProductDetails v2.1 - updated: stars fix, full reviewer name, jewellery attributes
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Globe, 
  Save, 
  TrendingUp, 
  History, 
  Activity,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Copy,
  Edit2,
  Package,
  Tag,
  FileText,
  Truck,
  Headphones,
  Award,
  MapPin,
  Zap,
  Calendar,
  Share2,
  RotateCcw,
  X,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { useMaintenance } from '../context/MaintenanceContext';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { LuxuryImage } from '../components/LuxuryImage';
import { formatPrice } from '../utils/priceFormatter';
import { translateCategory as centralizedTranslateCategory } from '../utils/categoryTranslations';


const ReviewsSkeleton = () => (
  <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4 w-full">
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="pt-4 first:pt-0 space-y-2">
        <div className="flex justify-between items-center">
          <div className="space-y-1 w-full animate-pulse">
            <div className="skeleton-premium h-4 w-24 rounded" />
            <div className="skeleton-premium h-3 w-16 rounded mt-1" />
          </div>
          <div className="skeleton-premium h-3 w-12 rounded animate-pulse" />
        </div>
        <div className="skeleton-premium h-3.5 w-full rounded animate-pulse" />
        <div className="skeleton-premium h-3.5 w-3/4 rounded mt-1 animate-pulse" />
      </div>
    ))}
  </div>
);

const translationDictionary = {
  // Option attributes
  'Color': 'रंग',
  'Storage': 'स्टोरेज',
  'RAM': 'रैम',
  'Size': 'आकार',
  'Weight': 'वजन',
  'Purity': 'शुद्धता',
  'Metal': 'धातु',
  'Gemstone': 'रत्न',
  'Ring Size': 'अंगूठी का आकार',
  'Yellow Gold': 'पीला सोना',
  'White Gold': 'सफेद सोना',
  'Rose Gold': 'गुलाबी सोना',
  'Platinum': 'प्लेटिनम',
  'None': 'कोई नहीं',
  'Diamond': 'हीरा',
  'Ruby': 'माणिक',
  'Emerald': 'पन्ना',
  'Sapphire': 'नीलम',
  'Format': 'प्रारूप',
  'Model': 'मॉडल',
  'Pack Size': 'पैक का आकार',
  'Edition': 'संस्करण',
  'Author': 'लेखक',
  'Language': 'भाषा',
  'Fabric': 'कपड़ा',
  'Fit Type': 'फिट प्रकार',
  'Connectivity': 'कनेक्टिविटी',
  'Material': 'सामग्री',
  'Necklace Length': 'हार की लंबाई',
  'Necklace Length (Optional)': 'हार की लंबाई (वैकल्पिक)',
  'Bracelet Size': 'कंगन का आकार',
  'Bangle Size': 'चूड़ी का आकार',
  'Chain Length': 'चेन की लंबाई',
  'Special Requirements': 'विशेष आवश्यकताएं',
  'Special Requirements (Optional)': 'विशेष आवश्यकताएं (वैकल्पिक)',
  'Product Summary': 'उत्पाद सारांश',
  'Category': 'श्रेणी',
  'Location / City': 'स्थान / शहर',
  'Quantity Required': 'आवश्यक मात्रा',

  // Option values
  'Carbon Gray': 'कार्बन ग्रे',
  'Blue': 'नीला',
  'Black': 'काला',
  'White': 'सफेद',
  'Red': 'लाल',
  'Paperback': 'पेपरबैक',
  'Hardcover': 'हार्डकवर',
  '500g': '500 ग्राम',
  '1kg': '1 किलोग्राम',
  '5kg': '5 किलोग्राम',
  'Cotton': 'सूती',
  'Single Pack': 'सिंगल पैक',
  'Sapphire Blue': 'सफायर ब्लू',
  'Forest Green': 'फॉरेस्ट ग्रीन',
  'Rose Gold': 'रोज़ गोल्ड',
  'Phantom Black': 'फैंटम ब्लैक',
  'Navy Blue': 'नेवी ब्लू',
  'Olive Green': 'ऑलिव ग्रीन',
  'Burgundy': 'बरगंडी',
  'Charcoal Grey': 'चारकोल ग्रे',

  // Highlights
  'Product Highlights': 'उत्पाद की मुख्य विशेषताएं',
  '100% Genuine and authentic quality product sourced directly.': 'सीधे स्रोत से प्राप्त 100% असली और प्रामाणिक गुणवत्ता वाला उत्पाद।',
  'Eligible for Free Delivery and cash on delivery payments.': 'मुफ़्त डिलीवरी और कैश ऑन डिलीवरी भुगतान के लिए पात्र।',
  'Top rated customer support and easy hassle-free return options.': 'शीर्ष रेटेड ग्राहक सहायता और आसान परेशानी मुक्त वापसी विकल्प।',

  // Breadcrumbs & tabs
  'Description': 'विवरण',
  'Specifications': 'विनिर्देश',
  'Reviews': 'समीक्षाएं',
  'Related Products': 'संबंधित उत्पाद',
  'Recently Viewed Products': 'हाल ही में देखे गए उत्पाद',

  // Seller & Offers
  'Seller Information': 'विक्रेता की जानकारी',
  'SSJewellery Retail Partner': 'SSJewellery रिटेल पार्टनर',
  '4.8★ Seller Rating • 99% positive feedback': '4.8★ विक्रेता रेटिंग • 99% सकारात्मक प्रतिक्रिया',
  'SuperCoin Benefits': 'सुपरकॉइन लाभ',
  'No Cost EMI': 'बिना ब्याज की ईएमआई',
  'Bank Offer': 'बैंक ऑफ़र',
  '10% Instant Discount on HDFC Bank Cards': 'HDFC बैंक कार्डों पर 10% तत्काल छूट',

  // Review section strings
  'Customer Reviews': 'ग्राहक समीक्षाएं',
  'Based on': 'आधारित',
  'customer ratings': 'ग्राहक रेटिंग',
  'Write a Review': 'एक समीक्षा लिखें',
  'Share your thoughts with other customers': 'अन्य ग्राहकों के साथ अपने विचार साझा करें',
  'Rating': 'रेटिंग',
  'Comment': 'समीक्षा टिप्पणी',
  'Submit Review': 'समीक्षा सबमिट करें',
  'Submitting...': 'सबमिट किया जा रहा है...',
  'No reviews yet. Be the first to review this product!': 'अभी तक कोई समीक्षा नहीं है। इस उत्पाद की समीक्षा करने वाले पहले व्यक्ति बनें!',
  'Submit a written review to share your feedback.': 'अपनी प्रतिक्रिया साझा करने के लिए एक लिखित समीक्षा सबमिट करें।'
};

const RelatedProductCard = React.memo(({ item }) => {
  const navigate = useNavigate();
  const { user, language, isPreviewMode } = useContext(AuthContext);
  const { addToWishlist, removeFromWishlist, isInWishlist, triggerAuthModal } = useContext(CartContext);

  const isItemInWishlist = isInWishlist(item._id);
  const itemDiscountedPrice = Math.round(item.price - (item.price * ((item.discount || 0) / 100)));

  const handleItemWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      triggerAuthModal(language === 'hi' ? 'कृपया अपनी विशलिस्ट देखने के लिए लॉगिन करें।' : 'Please login to access your wishlist.', window.location.pathname);
      return;
    }
    if (isItemInWishlist) {
      removeFromWishlist(item._id);
    } else {
      addToWishlist(item);
    }
  };

  const translateCategory = (cat) => {
    return centralizedTranslateCategory(cat, language);
  };

  return (
    <div 
      onClick={() => {
        navigate(`/product/${item._id}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
    >
      {/* Wishlist Button */}
      <button
        onClick={handleItemWishlistToggle}
        disabled={isPreviewMode}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border border-slate-100 dark:border-slate-850 text-slate-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Heart className={`h-4 w-4 ${isItemInWishlist ? 'text-red-500 fill-current' : ''}`} />
      </button>

      {/* Discount Badge */}
      {item.discount > 0 && (
        <span className="absolute top-3 left-3 z-10 bg-red-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-sm">
          {item.discount}% {language === 'hi' ? 'छूट' : 'OFF'}
        </span>
      )}

      {/* Image Block */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center p-2 mt-2">
        <LuxuryImage
          src={item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
          alt={item.name}
          className="max-h-24 max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
          fetchPriority="low"
          width="400"
          height="225"
        />
      </div>

      {/* Content Block */}
      <div className="p-3 sm:p-4 flex-grow flex flex-col">
        {/* Category */}
        <span className="text-[9px] font-semibold text-[#D4A75F] uppercase tracking-wider">
          {translateCategory(item.category)}
        </span>

        {/* Product Title */}
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#D4A75F] line-clamp-1 mt-0.5">
          {language === 'hi' ? (item.name_hi || item.name) : (item.name_en || item.name)}
        </h3>

        {/* Rating & Review Count */}
        <div className="flex items-center mt-1 mb-2">
          <div className="flex items-center text-amber-500">
            <Star className="h-3 w-3 fill-current" />
            <span className="ml-1 text-[11px] font-bold text-slate-700 dark:text-slate-350">
              {parseFloat(item.ratings || item.rating || 0).toFixed(1)}
            </span>
          </div>
          <span className="mx-1 text-slate-300 dark:text-slate-650">•</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {item.review_count !== undefined ? item.review_count : (item.reviews ? item.reviews.length : 0)} {language === 'hi' ? 'समीक्षाएं' : 'reviews'}
          </span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 flex-grow">
          {language === 'hi' ? (item.description_hi || item.description) : (item.description_en || item.description)}
        </p>

        {/* Price Row */}
        <div className="flex items-baseline space-x-1.5 mb-1 mt-auto font-black text-slate-900 dark:text-slate-100">
          <span className="text-sm sm:text-base font-extrabold text-[#3F1D5A] dark:text-[#EFE7DB] price-amount">
            ₹{formatPrice(itemDiscountedPrice)}
          </span>
          {item.discount > 0 && (
            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-normal price-amount">
              ₹{formatPrice(item.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export const ProductDetails = ({ productId }) => {
  const { id: paramId } = useParams();
  const id = productId || paramId;
  const navigate = useNavigate();
  
  const { user, token, language, isAdmin } = useContext(AuthContext);
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, triggerAuthModal } = useContext(CartContext);
  const { isMaintenanceMode, showMaintenancePopup } = useMaintenance();

  const translateText = (text) => {
    if (language === 'hi') {
      return translationDictionary[text] || text;
    }
    return text;
  };

  const translateCategory = (cat) => {
    return centralizedTranslateCategory(cat, language);
  };

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Gallery state
  const [activeImage, setActiveImage] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedTitle, setZoomedTitle] = useState('');
  const fileInputRef = React.useRef(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Quantity selector state
  const [quantity, setQuantity] = useState(1);
  
  // Review submission state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewErr, setReviewErr] = useState('');

  // Variant selection states
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('Cotton');
  const [selectedFormat, setSelectedFormat] = useState('Paperback');
  const [selectedWeight, setSelectedWeight] = useState('1kg');
  const [selectedPackSize, setSelectedPackSize] = useState('Single Pack');
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Dynamic Variant States
  const [editVariants, setEditVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [savingVariants, setSavingVariants] = useState(false);
  const [variantInputs, setVariantInputs] = useState({}); // Stores inline inputs by attribute name

  // Active tab state
  const [activeTab, setActiveTab] = useState('description');

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isAutoSlidePaused, setIsAutoSlidePaused] = useState(false);

  // Request Buy state
  const [showRequestBuyModal, setShowRequestBuyModal] = useState(false);
  const [requestBuyLoading, setRequestBuyLoading] = useState(false);
  const [requestBuySuccess, setRequestBuySuccess] = useState(false);
  const [modalQty, setModalQty] = useState(1);
  const [modalStorage, setModalStorage] = useState('128GB');
  const [modalRam, setModalRam] = useState('8GB');
  const [modalColor, setModalColor] = useState('Carbon Gray');
  const [modalWeight, setModalWeight] = useState('1kg');
  const [modalSize, setModalSize] = useState('M');
  const [modalFormat, setModalFormat] = useState('Paperback');
  const [modalPurity, setModalPurity] = useState('18k');
  const [modalMetal, setModalMetal] = useState('Yellow Gold');
  const [modalGemstone, setModalGemstone] = useState('None');
  const [modalRingSize, setModalRingSize] = useState('6');
  const [modalNecklaceLength, setModalNecklaceLength] = useState('18 inches');
  const [modalBraceletSize, setModalBraceletSize] = useState('7.0 inches');
  const [modalBangleSize, setModalBangleSize] = useState('2.6');
  const [modalChainLength, setModalChainLength] = useState('20 inches');
  const [modalSpecialReqs, setModalSpecialReqs] = useState('');
  const [modalCity, setModalCity] = useState('');

  // Side zoom window and mouse tracking state
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // Related products states
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Recently viewed products states
  const [recentlyViewed, setRecentlyViewed] = useState([]);


  const getCategoryType = (categoryName) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('ring') || cat.includes('neck') || cat.includes('ear') || cat.includes('brace') || cat.includes('bang') || cat.includes('bridal') || cat.includes('jewelry') || cat.includes('jewel')) {
      return 'jewelry';
    }
    if (cat.includes('grocery') || cat.includes('food') || cat.includes('spices') || cat.includes('oil') || cat.includes('organic')) {
      return 'grocery';
    }
    if (cat.includes('elec') || cat.includes('phone') || cat.includes('laptop') || cat.includes('tv') || cat.includes('tech') || cat.includes('mobile') || cat.includes('audio')) {
      return 'electronics';
    }
    if (cat.includes('fashion') || cat.includes('shirt') || cat.includes('clothing') || cat.includes('shoe') || cat.includes('wear') || cat.includes('jeans')) {
      return 'fashion';
    }
    if (cat.includes('book') || cat.includes('novel') || cat.includes('read') || cat.includes('literature') || cat.includes('author') || cat.includes('publish')) {
      return 'books';
    }
    return 'home_kitchen';
  };

  const getGroupedVariants = () => {
    if (!product || !product.variants) return {};
    const groups = {};
    product.variants.forEach(v => {
      const name = v.attribute_name;
      if (!groups[name]) {
        groups[name] = [];
      }
      if (!groups[name].includes(v.attribute_value)) {
        groups[name].push(v.attribute_value);
      }
    });
    return groups;
  };

  const getAllowedAttributesForCategory = (categoryName) => {
    const catType = getCategoryType(categoryName);
    switch (catType) {
      case 'jewelry':
        return ['Purity', 'Metal', 'Gemstone', 'Ring Size', 'Weight'];
      case 'electronics':
        return ['Storage', 'RAM', 'Color', 'Model', 'Connectivity'];
      case 'fashion':
        return ['Size', 'Color', 'Fabric', 'Fit Type'];
      case 'grocery':
        return ['Weight', 'Pack Size', 'Flavor', 'Quantity'];
      case 'books':
        return ['Author', 'Language', 'Format', 'Edition'];
      default:
        return ['Size', 'Color', 'Material', 'Pack Size'];
    }
  };

  const handleAddVariant = async (attrName, attrValue) => {
    if (!attrValue.trim()) return;
    const newVariant = { attribute_name: attrName, attribute_value: attrValue.trim() };
    const updated = [...editVariants, newVariant];
    setEditVariants(updated);
    
    // Clear inline input
    setVariantInputs(prev => ({ ...prev, [attrName]: '' }));
    
    // Auto-save to DB
    await saveVariantsToDb(updated);
  };

  const handleDeleteVariant = async (indexToDelete) => {
    const updated = editVariants.filter((_, idx) => idx !== indexToDelete);
    setEditVariants(updated);
    
    // Auto-save to DB
    await saveVariantsToDb(updated);
  };

  const saveVariantsToDb = async (variantsList) => {
    setSavingVariants(true);
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      const response = await axios.put(`${API_BASE_URL}/products/${id}`, {
        name_en: editNameEn,
        name_hi: editNameHi,
        description_en: editDescEn,
        description_hi: editDescHi,
        features_en: editFeaturesEn,
        features_hi: editFeaturesHi,
        specifications_en: editSpecsEn,
        specifications_hi: editSpecsHi,
        category: editCategory,
        price: editPrice,
        discount: editDiscount,
        stock: editStock,
        variants: variantsList
      }, config);
      setProduct(response.data.product);
    } catch (err) {
      console.error(err);
      alert("Failed to save variants: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingVariants(false);
    }
  };

  const handleZoomMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
    setIsZooming(true);
    
    e.currentTarget.style.setProperty('--zoom-x', `${x}%`);
    e.currentTarget.style.setProperty('--zoom-y', `${y}%`);
  };

  const handleZoomMouseLeave = () => {
    setIsZooming(false);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 160; // offset to account for navbar (~64px) + sticky subnav (~52px) + cushion
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // RelatedProductCard is now defined as a memoized top-level component outside ProductDetails

  // Editing state for admin
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameHi, setEditNameHi] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editDescHi, setEditDescHi] = useState('');
  const [editFeaturesEn, setEditFeaturesEn] = useState('');
  const [editFeaturesHi, setEditFeaturesHi] = useState('');
  const [editSpecsEn, setEditSpecsEn] = useState('');
  const [editSpecsHi, setEditSpecsHi] = useState('');
  
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editCategory, setEditCategory] = useState('');
  
  // Admin controls and analytics state
  const [translationOpen, setTranslationOpen] = useState(false);
  const [editorLangTab, setEditorLangTab] = useState('en'); // 'en' or 'hi'
  const [activeAdminTab, setActiveAdminTab] = useState('analytics'); // 'analytics', 'stock-logs', 'audit-trail', 'reviews'
  const [logs, setLogs] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [salesData, setSalesData] = useState({ sales: [], total_sold: 0, total_revenue: 0, daily_sales: [] });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // 'Saving...', 'Saved!', etc.
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [savingDetails, setSavingDetails] = useState(false);
  const [savingStock, setSavingStock] = useState(false);
  const [savingFinancials, setSavingFinancials] = useState(false);

  const getLocalizedFeatures = () => {
    if (!product) return [];
    const featuresText = (language === 'hi' && product.features_hi) 
      ? product.features_hi 
      : (product.features_en || product.features);
    if (!featuresText) return [];
    return featuresText.split('\n').map(f => translateText(f.trim())).filter(Boolean);
  };

  const getLocalizedSpecifications = () => {
    if (!product) return [];
    const specsText = (language === 'hi' && product.specifications_hi) 
      ? product.specifications_hi 
      : (product.specifications_en || product.specifications);
    if (!specsText) return [];
    return specsText.split('\n').map(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return { key: translateText(line.trim()), value: '' };
      return {
        key: translateText(line.slice(0, idx).trim()),
        value: translateText(line.slice(idx + 1).trim())
      };
    }).filter(item => item.key);
  };

  // Detect jewellery metal type and karats from product data
  const getJewelleryAttributes = () => {
    if (!product) return {};
    const searchText = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
    const variantKeys = Object.keys(getGroupedVariants()).join(' ').toLowerCase();
    const variantVals = Object.values(getGroupedVariants()).flat().join(' ').toLowerCase();
    const allText = `${searchText} ${variantKeys} ${variantVals}`;

    // Detect Metal
    let metal = null;
    if (/platinum/i.test(allText)) metal = language === 'hi' ? 'प्लेटिनम' : 'Platinum';
    else if (/gold|सोना|गोल्ड/i.test(allText)) metal = language === 'hi' ? 'शुद्ध सोना (Gold)' : 'Gold';
    else if (/silver|चाँदी|चांदी|सिल्वर/i.test(allText)) metal = language === 'hi' ? 'चाँदी (Silver)' : 'Silver';

    // Detect Karats / Purity from name/description
    let karats = null;
    const karatMatch = allText.match(/\b(24\s*k(?:t|arat)?|22\s*k(?:t|arat)?|18\s*k(?:t|arat)?|14\s*k(?:t|arat)?|10\s*k(?:t|arat)?|916|750|585|999|925|sterling)\b/i);
    if (karatMatch) {
      const k = karatMatch[1].replace(/\s/g, '').toUpperCase();
      const karatMap = {
        '24K': '24K (999 - 99.9% Pure)', '24KT': '24K (999 - 99.9% Pure)', '24KARAT': '24K (999 - 99.9% Pure)', '999': '24K (999 - 99.9% Pure)',
        '22K': '22K (916 - 91.6% Pure)', '22KT': '22K (916 - 91.6% Pure)', '22KARAT': '22K (916 - 91.6% Pure)', '916': '22K (916 - 91.6% Pure)',
        '18K': '18K (750 - 75% Pure)',   '18KT': '18K (750 - 75% Pure)',   '18KARAT': '18K (750 - 75% Pure)',   '750': '18K (750 - 75% Pure)',
        '14K': '14K (585 - 58.5% Pure)', '14KT': '14K (585 - 58.5% Pure)', '14KARAT': '14K (585 - 58.5% Pure)', '585': '14K (585 - 58.5% Pure)',
        '10K': '10K (417 - 41.7% Pure)', '925': '925 Sterling Silver',      'STERLING': '925 Sterling Silver',
      };
      karats = karatMap[k] || k;
    } else if (metal === 'Gold' || metal?.includes('सोना')) {
      karats = language === 'hi' ? '22K (916) - 91.6% शुद्ध' : '22K (916 - 91.6% Pure)';
    } else if (metal === 'Silver' || metal?.includes('चाँदी')) {
      karats = language === 'hi' ? '925 स्टर्लिंग सिल्वर' : '925 Sterling Silver';
    }

    return { metal, karats };
  };


  const fetchProductDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${id}`);
      setProduct(response.data);
      if (response.data.images && response.data.images.length > 0) {
        setActiveImage(response.data.images[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Product not found or database connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      const [logsRes, historyRes, salesRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products/${id}/logs`, config),
        axios.get(`${API_BASE_URL}/products/${id}/stock-history`, config),
        axios.get(`${API_BASE_URL}/products/${id}/sales`, config),
        axios.get(`${API_BASE_URL}/admin/analytics/product/${id}`, config)
      ]);
      setLogs(logsRes.data);
      setStockHistory(historyRes.data);
      setSalesData(salesRes.data);
      setAnalyticsData(analyticsRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchProductDetails();
    setIsPreviewMode(false);
  }, [id, language]);

  useEffect(() => {
    if (isAdmin) {
      // eslint-disable-next-line
      fetchAdminData();
    }
  }, [id, isAdmin, token]);

  // Track mobile view state reactively
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to document clicks to resume auto-slideshow when user taps outside the image/thumbnails
  useEffect(() => {
    if (!isAutoSlidePaused) return;

    const handleDocumentClick = () => {
      setIsAutoSlidePaused(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleDocumentClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isAutoSlidePaused]);

  // Auto-slideshow for product images (cycles every 3 seconds)
  useEffect(() => {
    const isCustomerView = !isAdmin || isPreviewMode;
    const imgs = product?.images && product.images.length > 0 ? product.images : [];
    
    if (!isCustomerView || isAutoSlidePaused || imgs.length <= 1) return;

    const interval = setInterval(() => {
      const currentImg = activeImage || imgs[0];
      const currentIndex = imgs.indexOf(currentImg);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % imgs.length;
      
      setActiveImage(imgs[nextIndex]);
      setPreviewImageIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeImage, product, isAdmin, isPreviewMode, isAutoSlidePaused]);

  useEffect(() => {
    if (product) {
      // eslint-disable-next-line
      setEditNameEn(product.name_en || product.name || '');
      setEditNameHi(product.name_hi || '');
      setEditDescEn(product.description_en || product.description || '');
      setEditDescHi(product.description_hi || '');
      setEditFeaturesEn(product.features_en || '');
      setEditFeaturesHi(product.features_hi || '');
      setEditSpecsEn(product.specifications_en || '');
      setEditSpecsHi(product.specifications_hi || '');
      
      setEditPrice(product.price || 0);
      setEditDiscount(product.discount || 0);
      setEditStock(product.stock || 0);
      setEditCategory(product.category || '');

      // Set defaults for variants based on category & database values
      setEditVariants(product.variants || []);
      if (product.variants && product.variants.length > 0) {
        const initialSel = {};
        product.variants.forEach(v => {
          if (!initialSel[v.attribute_name]) {
            initialSel[v.attribute_name] = v.attribute_value;
          }
        });
        setSelectedVariants(initialSel);
        
        // Sync legacy states for compatibility
        if (initialSel['Color']) setSelectedColor(initialSel['Color']);
        if (initialSel['RAM']) setSelectedRam(initialSel['RAM']);
        if (initialSel['Storage']) setSelectedSize(initialSel['Storage']);
        if (initialSel['Size']) setSelectedSize(initialSel['Size']);
        if (initialSel['Weight']) setSelectedWeight(initialSel['Weight']);
        if (initialSel['Pack Size']) setSelectedPackSize(initialSel['Pack Size']);
        if (initialSel['Format']) setSelectedFormat(initialSel['Format']);
      } else {
        setSelectedVariants({});
        
        const catType = getCategoryType(product.category);
        if (catType === 'jewelry') {
          setSelectedColor('Gold');
          setSelectedWeight('10g');
        } else if (catType === 'grocery') {
          setSelectedWeight('1kg');
          setSelectedPackSize('Single Pack');
          setSelectedSize('1kg');
        } else if (catType === 'electronics') {
          setSelectedSize('128GB');
          setSelectedRam('8GB');
          setSelectedColor('Carbon Gray');
        } else if (catType === 'fashion') {
          setSelectedSize('M');
          setSelectedColor('Black');
          setSelectedMaterial('Cotton');
        } else if (catType === 'books') {
          setSelectedFormat('Paperback');
        } else {
          setSelectedSize('Single Pack');
          setSelectedPackSize('Single Pack');
        }
      }
    }
  }, [product]);

  // Effect to fetch related products
  useEffect(() => {
    if (!product) return;
    const fetchRelated = async () => {
      setLoadingRelated(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/products?category=${encodeURIComponent(product.category)}`);
        // filter out current product
        const filtered = response.data.filter(p => p._id !== product._id);
        setRelatedProducts(filtered);
      } catch (err) {
        console.error("Error fetching related products", err);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [product, id]);

  // Effect to update recently viewed list in localStorage
  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem('recentlyViewed');
      let list = stored ? JSON.parse(stored) : [];
      
      // Filter out the current product to avoid showing it in the list
      list = list.filter(item => item._id !== product._id);
      
      // Add current product to the beginning
      const currentItem = {
        _id: product._id,
        name: product.name,
        name_en: product.name_en,
        name_hi: product.name_hi,
        price: product.price,
        discount: product.discount,
        images: product.images,
        ratings: product.ratings || product.rating,
        stock: product.stock,
        category: product.category,
        description: product.description
      };
      list.unshift(currentItem);
      
      // Limit to 7 items
      list = list.slice(0, 7);
      
      localStorage.setItem('recentlyViewed', JSON.stringify(list));
      
      // For display, filter out the current product
      // eslint-disable-next-line
      setRecentlyViewed(list.filter(item => item._id !== product._id).slice(0, 6));
    } catch (err) {
      console.error("Error updating recently viewed", err);
    }
  }, [product, id]);



  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <div className="skeleton-premium aspect-square w-full rounded-3xl" />
          <div className="flex gap-4">
            <div className="skeleton-premium h-20 w-20 rounded-2xl animate-pulse" />
            <div className="skeleton-premium h-20 w-20 rounded-2xl animate-pulse" />
            <div className="skeleton-premium h-20 w-20 rounded-2xl animate-pulse" />
          </div>
        </div>
        {/* Product Info Skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="skeleton-premium h-4 w-24 rounded" />
            <div className="skeleton-premium h-8 w-3/4 rounded" />
            <div className="skeleton-premium h-4 w-1/3 rounded" />
          </div>
          <div className="skeleton-premium h-16 w-1/3 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton-premium h-4 w-full rounded" />
            <div className="skeleton-premium h-4 w-full rounded" />
            <div className="skeleton-premium h-4 w-2/3 rounded" />
          </div>
          <div className="flex gap-4 pt-4">
            <div className="skeleton-premium h-12 w-1/2 rounded-full" />
            <div className="skeleton-premium h-12 w-1/2 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center shadow-lg">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold mt-4 text-slate-800 dark:text-slate-100">Could Not Find Product</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{error || "Product may have been removed or database is inaccessible."}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-4 py-2 bg-[#D4A75F] hover:bg-[#c39650] text-white rounded-xl text-xs font-bold"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    e.currentTarget.style.setProperty('--zoom-x', `${x}%`);
    e.currentTarget.style.setProperty('--zoom-y', `${y}%`);
  };

  const isProductInWishlist = isInWishlist(product._id);
  const discountedPrice = Math.round(product.price - (product.price * (product.discount / 100)));

  const handleWishlistToggle = () => {
    if (!user) {
      triggerAuthModal('Please login to access your wishlist.', window.location.pathname);
      return;
    }
    if (isProductInWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      triggerAuthModal('Please login to add products to your cart.', window.location.pathname);
      return;
    }
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (isMaintenanceMode) {
      showMaintenancePopup();
      return;
    }
    if (!user) {
      triggerAuthModal('Please login before placing an order.', '/login');
      return;
    }
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const getProductSpecification = (keyName) => {
    if (!product) return '';
    // 1. Look in product variants
    if (product.variants && Array.isArray(product.variants)) {
      const variant = product.variants.find(v => (v.attribute_name || '').toLowerCase() === keyName.toLowerCase());
      if (variant && variant.attribute_value) return variant.attribute_value;
    }
    // 2. Look in parsed specifications
    const specs = getLocalizedSpecifications();
    const spec = specs.find(s => (s.key || '').toLowerCase() === keyName.toLowerCase());
    if (spec && spec.value) return spec.value;

    // 3. Smart fallbacks based on product details
    const nameLower = (product.name || '').toLowerCase();
    const descLower = (product.description || '').toLowerCase();

    if (keyName.toLowerCase() === 'metal') {
      if (nameLower.includes('white gold') || descLower.includes('white gold')) return 'White Gold';
      if (nameLower.includes('rose gold') || descLower.includes('rose gold')) return 'Rose Gold';
      if (nameLower.includes('platinum') || descLower.includes('platinum')) return 'Platinum';
      return 'Yellow Gold'; // default fallback
    }

    if (keyName.toLowerCase() === 'purity') {
      if (nameLower.includes('18k') || descLower.includes('18k')) return '18K';
      if (nameLower.includes('22k') || descLower.includes('22k')) return '22K';
      if (nameLower.includes('24k') || descLower.includes('24k')) return '24K';
      return '22K'; // default fallback
    }

    if (keyName.toLowerCase() === 'gemstone') {
      if (nameLower.includes('diamond') || descLower.includes('diamond')) return 'Diamond';
      if (nameLower.includes('ruby') || descLower.includes('ruby')) return 'Ruby';
      if (nameLower.includes('emerald') || descLower.includes('emerald')) return 'Emerald';
      if (nameLower.includes('sapphire') || descLower.includes('sapphire')) return 'Sapphire';
      if (nameLower.includes('pearl') || descLower.includes('pearl')) return 'Pearl';
      return 'None'; // default fallback
    }

    return '';
  };

  const handleOpenRequestBuyModal = () => {
    if (isMaintenanceMode) {
      showMaintenancePopup();
      return;
    }
    if (!user) {
      triggerAuthModal('Please login to request to buy this product.', window.location.pathname);
      return;
    }
    
    // Initialize modal option states
    setModalQty(quantity || 1);
    setModalCity('');
    
    // Fallbacks or detected read-only specs
    const detectedMetal = getProductSpecification('Metal');
    const detectedPurity = getProductSpecification('Purity');
    const detectedGemstone = getProductSpecification('Gemstone');
    
    setModalMetal(detectedMetal);
    setModalPurity(detectedPurity);
    setModalGemstone(detectedGemstone);

    // Reset specific size states
    setModalRingSize('7');
    setModalNecklaceLength('18 inches');
    setModalBraceletSize('7.0 inches');
    setModalBangleSize('2.6');
    setModalChainLength('20 inches');
    setModalSpecialReqs('');

    // Legacy states
    setModalStorage(selectedSize || '128GB');
    setModalRam(selectedRam || '8GB');
    setModalColor(selectedColor || 'Carbon Gray');
    setModalWeight(selectedWeight || '1kg');
    setModalSize(selectedSize || 'M');
    setModalFormat(selectedFormat || 'Paperback');
    
    setRequestBuySuccess(false);
    setShowRequestBuyModal(true);
  };

  const handleConfirmRequestBuy = async () => {
    if (!modalCity || !modalCity.trim()) {
      alert(language === 'hi' ? "कृपया अपना शहर दर्ज करें।" : "Please enter your city.");
      return;
    }
    setRequestBuyLoading(true);
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      let selected_variant = {};
      const catLower = (product.category || '').toLowerCase();
      
      const isRing = catLower.includes('ring') && !catLower.includes('earring');
      const isEarring = catLower.includes('earring');
      const isNecklace = catLower.includes('necklace') || catLower.includes('choker');
      const isBracelet = catLower.includes('bracelet');
      const isBangle = catLower.includes('bangle');
      const isChain = catLower.includes('chain');
      const isBridal = catLower.includes('bridal');
      
      // Check if it is a jewelry item
      const isJewelry = isRing || isEarring || isNecklace || isBracelet || isBangle || isChain || isBridal || getCategoryType(product.category) === 'jewelry';

      if (isJewelry) {
        selected_variant = {
          Purity: modalPurity,
          Metal: modalMetal,
          Gemstone: modalGemstone
        };
        
        if (isRing) {
          selected_variant['Ring Size'] = modalRingSize;
        } else if (isNecklace) {
          selected_variant['Necklace Length'] = modalNecklaceLength;
        } else if (isBracelet) {
          selected_variant['Bracelet Size'] = modalBraceletSize;
        } else if (isBangle) {
          selected_variant['Bangle Size'] = modalBangleSize;
        } else if (isChain) {
          selected_variant['Chain Length'] = modalChainLength;
        } else if (isBridal) {
          if (modalSpecialReqs && modalSpecialReqs.trim()) {
            selected_variant['Special Requirements'] = modalSpecialReqs;
          }
        }
      } else {
        const catType = getCategoryType(product.category);
        if (catType === 'electronics') {
          selected_variant = {
            Storage: modalStorage,
            RAM: modalRam,
            Color: modalColor
          };
        } else if (catType === 'grocery') {
          selected_variant = {
            Weight: modalWeight
          };
        } else if (catType === 'fashion') {
          selected_variant = {
            Size: modalSize,
            Color: modalColor
          };
        } else if (catType === 'books') {
          selected_variant = {
            Format: modalFormat
          };
        }
      }
      
      const res = await axios.post(`${API_BASE_URL}/products/${product._id}/request-buy`, {
        quantity: modalQty,
        selected_variant: selected_variant,
        city: modalCity
      }, config);
      
      if (res.data.success || res.status === 200 || res.status === 201) {
        setRequestBuySuccess(true);
      } else {
        alert(res.data.message || (language === 'hi' ? "कुछ गलत हो गया।" : "Something went wrong."));
        setShowRequestBuyModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || (language === 'hi' ? "अनुरोध सबमिट करने में विफल।" : "Failed to submit request."));
      setShowRequestBuyModal(false);
    } finally {
      setRequestBuyLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewErr(language === 'hi' ? "कृपया एक लिखित समीक्षा दर्ज करें।" : "Please enter a written review.");
      return;
    }
    
    setSubmittingReview(true);
    setReviewErr('');
    setReviewMessage('');

    try {
      await axios.post(`${API_BASE_URL}/products/${product._id}/review`, {
        rating,
        comment
      });
      setReviewMessage(language === 'hi' ? "समीक्षा सफलतापूर्वक सबमिट की गई!" : "Review submitted successfully!");
      setComment('');
      setRating(5);
      fetchProductDetails();
    } catch (err) {
      console.error(err);
      setReviewErr(err.response?.data?.message || (language === 'hi' ? "समीक्षा सबमिट करने में विफल। पुनः प्रयास करें।" : "Failed to submit review. Try again."));
    } finally {
      setSubmittingReview(false);
    }
  };

  // Inline Admin Save Handlers
  const handleIncrementStock = () => {
    setEditStock(prev => prev + 1);
  };

  const handleDecrementStock = () => {
    setEditStock(prev => Math.max(0, prev - 1));
  };

  const handleSaveStock = async () => {
    setSavingStock(true);
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      const response = await axios.put(`${API_BASE_URL}/products/${id}`, {
        name_en: editNameEn,
        name_hi: editNameHi,
        description_en: editDescEn,
        description_hi: editDescHi,
        features_en: editFeaturesEn,
        features_hi: editFeaturesHi,
        specifications_en: editSpecsEn,
        specifications_hi: editSpecsHi,
        category: editCategory,
        price: editPrice,
        discount: editDiscount,
        stock: editStock,
        images: product.images || []
      }, config);
      setProduct(response.data.product);
      alert(`Stock updated successfully! Set to ${editStock}.`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert("Failed to update stock: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingStock(false);
    }
  };

  const handleSaveFinancials = async () => {
    setSavingFinancials(true);
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      const response = await axios.put(`${API_BASE_URL}/products/${id}`, {
        name_en: editNameEn,
        name_hi: editNameHi,
        description_en: editDescEn,
        description_hi: editDescHi,
        features_en: editFeaturesEn,
        features_hi: editFeaturesHi,
        specifications_en: editSpecsEn,
        specifications_hi: editSpecsHi,
        category: editCategory,
        price: editPrice,
        discount: editDiscount,
        stock: editStock,
        images: product.images || []
      }, config);
      setProduct(response.data.product);
      alert("Price & Discount updated successfully!");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert("Failed to update price & discount: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingFinancials(false);
    }
  };

  const handleUploadMedia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    const formData = new FormData();
    formData.append('image', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    try {
      // 1. Upload the image file to the backend
      const uploadResponse = await axios.post(`${API_BASE_URL}/products/upload`, formData, config);
      const uploadedImageUrl = uploadResponse.data.url;

      // 2. Append the new image URL to the product's image list
      const existingImages = product.images && product.images.length > 0 ? product.images : [];
      const updatedImages = [...existingImages, uploadedImageUrl];

      // 3. Save the updated image list to the database via PUT
      const updateConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.put(`${API_BASE_URL}/products/${id}`, {
        name_en: editNameEn,
        name_hi: editNameHi,
        description_en: editDescEn,
        description_hi: editDescHi,
        features_en: editFeaturesEn,
        features_hi: editFeaturesHi,
        specifications_en: editSpecsEn,
        specifications_hi: editSpecsHi,
        category: editCategory,
        price: editPrice,
        discount: editDiscount,
        stock: editStock,
        images: updatedImages
      }, updateConfig);

      setProduct(response.data.product);
      setActiveImage(uploadedImageUrl);
      alert("Image uploaded and added to product gallery successfully!");
      fetchAdminData();
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Failed to upload image: " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingMedia(false);
      if (e.target) e.target.value = '';
    }
  };


  const handleSaveDetails = async () => {
    setSavingDetails(true);
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      const response = await axios.put(`${API_BASE_URL}/products/${id}`, {
        name_en: editNameEn,
        name_hi: editNameHi,
        description_en: editDescEn,
        description_hi: editDescHi,
        features_en: editFeaturesEn,
        features_hi: editFeaturesHi,
        specifications_en: editSpecsEn,
        specifications_hi: editSpecsHi,
        category: editCategory,
        price: editPrice,
        discount: editDiscount,
        stock: editStock,
        images: product.images || []
      }, config);
      setProduct(response.data.product);
      alert("Product details and translations saved successfully!");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert("Failed to save product details: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingDetails(false);
    }
  };

  const handleBlurSave = async () => {
    if (!isAdmin) return;
    setAutoSaveStatus('Saving...');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      const response = await axios.put(`${API_BASE_URL}/products/${id}`, {
        name_en: editNameEn,
        name_hi: editNameHi,
        description_en: editDescEn,
        description_hi: editDescHi,
        features_en: editFeaturesEn,
        features_hi: editFeaturesHi,
        specifications_en: editSpecsEn,
        specifications_hi: editSpecsHi,
        category: editCategory,
        price: editPrice,
        discount: editDiscount,
        stock: editStock
      }, config);
      setProduct(response.data.product);
      setAutoSaveStatus('Saved!');
      setTimeout(() => setAutoSaveStatus(''), 2000);
      fetchAdminData();
    } catch (err) {
      console.error("Auto-save failed:", err);
      setAutoSaveStatus('Error saving');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  };

  // Safe images array fallback
  const imagesList = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60'];

  const stockDiff = editStock - product.stock;

  const renderSalesChart = () => {
    const dailyData = salesData.daily_sales || [];
    if (dailyData.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-400 text-xs italic">No sales recorded yet to plot trend.</p>
        </div>
      );
    }
    
    const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1);
    
    return (
      <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm mt-6">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>Daily Revenue Trend (INR)</span>
        </h4>
        <div className="flex items-end justify-between h-48 gap-2 pt-4 px-2">
          {dailyData.map((day, idx) => {
            const heightPct = (day.revenue / maxRevenue) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-950 text-white text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap z-10 font-mono price-amount">
                  ₹{formatPrice(day.revenue)}
                </div>
                {/* Bar */}
                <div 
                  className="w-full bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t-sm transition-all duration-300"
                  style={{ height: `${Math.max(4, heightPct)}%` }}
                />
                {/* Label */}
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 rotate-45 origin-left whitespace-nowrap">
                  {day.date.substring(5)} {/* MM-DD */}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-6" />
      </div>
    );
  };

  const catLower = (product?.category || '').toLowerCase();
  const isRing = catLower.includes('ring') && !catLower.includes('earring');
  const isEarring = catLower.includes('earring');
  const isNecklace = catLower.includes('necklace') || catLower.includes('choker');
  const isBracelet = catLower.includes('bracelet');
  const isBangle = catLower.includes('bangle');
  const isChain = catLower.includes('chain');
  const isBridal = catLower.includes('bridal');
  const isJewelry = isRing || isEarring || isNecklace || isBracelet || isBangle || isChain || isBridal || getCategoryType(product?.category) === 'jewelry';

  return (
    <div className={productId ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans" : "bg-slate-55 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen pb-6 font-sans"}>
      
      {/* Header Bar */}
      {!productId && (
        <div className={`bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 py-3 mb-4 w-full ${(isAdmin && !isPreviewMode) ? 'hidden md:block' : 'block'}`}>
          <div className="max-w-[1700px] mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col space-y-0.5">
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span className="cursor-pointer hover:text-emerald-500" onClick={() => navigate('/admin')}>{language === 'hi' ? 'उत्पाद' : 'Products'}</span>
                <ChevronRight className="h-3 w-3 mx-1" />
                <span className="text-slate-700 dark:text-slate-330 font-bold">{language === 'hi' ? 'उत्पाद विवरण' : 'Product Details'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                  {language === 'hi' ? (product.name_hi || product.name) : (product.name_en || product.name)}
                </h1>
                {((isAdmin && !isPreviewMode) || product.stock <= 0) && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${product.stock > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                    {product.stock > 0 ? (language === 'hi' ? 'सक्रिय' : 'ACTIVE') : (language === 'hi' ? 'आउट ऑफ स्टॉक' : 'OUT OF STOCK')}
                  </span>
                )}
              </div>
            </div>
            
                        {isAdmin && (
              <div className="flex items-center gap-2">
                {/* Desktop and Tablet Action Buttons (>768px) */}
                <div className="hidden md:flex items-center gap-2">
                  {!isPreviewMode ? (
                    <>
                      <button 
                        onClick={() => setIsPreviewMode(true)} 
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Product
                      </button>
                      <button 
                        onClick={handleSaveDetails} 
                        disabled={savingDetails} 
                        className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        {savingDetails ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsPreviewMode(false)} 
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Product
                    </button>
                  )}
                </div>

                {/* Mobile Action Buttons (<=768px) */}
                <div className="flex md:hidden items-center gap-2.5">
                  {!isPreviewMode ? (
                    <>
                      {/* View Product Icon Button */}
                      <div className="relative group">
                        <button 
                          onClick={() => setIsPreviewMode(true)} 
                          title={language === 'hi' ? 'उत्पाद देखें' : 'View Product'}
                          className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 text-emerald-500 hover:border-[#D4A75F] hover:text-[#D4A75F] active:border-[#D4A75F] active:text-[#D4A75F] flex items-center justify-center shadow-sm transition-all cursor-pointer"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 z-50 shadow-sm">
                          {language === 'hi' ? 'उत्पाद देखें' : 'View Product'}
                        </span>
                      </div>
                      
                      {/* Save Changes Icon Button */}
                      <div className="relative group">
                        <button 
                          onClick={handleSaveDetails} 
                          disabled={savingDetails} 
                          title={language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes'}
                          className={`w-10 h-10 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 text-emerald-500 hover:border-[#D4A75F] hover:text-[#D4A75F] active:border-[#D4A75F] active:text-[#D4A75F] flex items-center justify-center shadow-sm transition-all cursor-pointer ${savingDetails ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {savingDetails ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit2 className="h-4 w-4" />
                          )}
                        </button>
                        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 z-50 shadow-sm">
                          {language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes'}
                        </span>
                      </div>
                    </>
                  ) : (
                    /* Edit Product Icon Button */
                    <div className="relative group">
                      <button 
                        onClick={() => setIsPreviewMode(false)} 
                        title={language === 'hi' ? 'उत्पाद संपादित करें' : 'Edit Product'}
                        className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 text-emerald-500 hover:border-[#D4A75F] hover:text-[#D4A75F] active:border-[#D4A75F] active:text-[#D4A75F] flex items-center justify-center shadow-sm transition-all cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 z-50 shadow-sm">
                        {language === 'hi' ? 'उत्पाद संपादित करें' : 'Edit Product'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
                              </div>
        </div>
      )}

      <div className={`w-full ${(isAdmin && !isPreviewMode) ? 'max-w-[1700px]' : 'max-w-[1600px]'} mx-auto px-4 md:px-6`}>
        
        {isAdmin && isPreviewMode && (
          <div className="flex justify-end mt-4 mb-6">
            <div className="bg-amber-500 text-white text-[11px] font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-amber-400 w-fit">
              <span>👁 Customer Preview Mode</span>
            </div>
          </div>
        )}

        {isAdmin && !isPreviewMode ? (
          /* Admin Dashboard Redesign */
          <div className="flex flex-col gap-6 lg:gap-8 pb-10">
            {/* Top Layout 45/55 */}
            <div className="grid grid-cols-1 lg:grid-cols-[45%_1fr] gap-6 lg:gap-8 items-start">
               
               {/* Left Column (45%) */}
               <div className="flex flex-col space-y-6">
                 {/* Mobile Header Block (Apply ONLY on Mobile <=768px) */}
                 <div className="block md:hidden w-full px-1">
                   {/* Breadcrumb */}
                   <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                     <span className="cursor-pointer hover:text-[#D4A75F]" onClick={() => navigate(`/?category=${encodeURIComponent(product.category || 'All')}`)}>{language === 'hi' ? 'उत्पाद' : 'Products'}</span>
                     <ChevronRight className="h-3 w-3 mx-1 text-slate-400" />
                     <span className="text-slate-700 dark:text-slate-330 font-bold">{language === 'hi' ? 'उत्पाद विवरण' : 'Product Details'}</span>
                   </div>


                    {/* Product Name (Full Width) */}
                    <div className="mb-[8px]">
                      <h1 className="text-[22px] font-bold text-slate-800 dark:text-slate-100 leading-[1.3]">
                        {language === 'hi' ? (product.name_hi || product.name) : (product.name_en || product.name)}
                      </h1>
                    </div>

                    {/* Action & Status Row (Icons on left, badge on right) */}
                    <div className="flex items-center justify-between mb-[12px]">
                      {/* Left: Compact Action Icons */}
                      <div className="flex items-center gap-[10px]">
                        {!isPreviewMode ? (
                          <>
                            {/* View Product (Eye) Icon Button */}
                            <button 
                              onClick={() => setIsPreviewMode(true)} 
                              title={language === 'hi' ? 'उत्पाद देखें' : 'View Product'}
                              className="w-[44px] h-[44px] flex items-center justify-center text-[#5B1E7A] hover:opacity-80 active:scale-95 transition-all cursor-pointer bg-transparent border-0 p-0 outline-none"
                            >
                              <Eye className="h-[18px] w-[18px]" />
                            </button>
                            
                            {/* Save Changes Premium Button */}
                            <button 
                              onClick={handleSaveDetails} 
                              disabled={savingDetails} 
                              title={language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes'}
                              className={`h-[30px] px-[12px] rounded-[8px] bg-[#D4A75F] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:brightness-95 active:scale-95 transition-all cursor-pointer border-0 outline-none shadow-sm ${savingDetails ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {savingDetails ? (
                                <RefreshCw className="h-[13px] w-[13px] animate-spin" />
                              ) : null}
                              <span>{language === 'hi' ? 'सहेजें' : 'Save'}</span>
                            </button>
                          </>
                        ) : (
                          /* Edit Product Premium Button */
                          <button 
                            onClick={() => setIsPreviewMode(false)} 
                            title={language === 'hi' ? 'उत्पाद संपादित करें' : 'Edit Product'}
                            className="h-[30px] px-[12px] rounded-[8px] bg-[#5B1E7A] text-white text-[12px] font-semibold flex items-center justify-center hover:brightness-95 active:scale-95 transition-all cursor-pointer border-0 outline-none shadow-sm"
                          >
                            <span>{language === 'hi' ? 'संपादित करें' : 'Edit'}</span>
                          </button>
                        )}
                      </div>

                      {/* Right: Active Status Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${product.stock > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                        {product.stock > 0 ? (language === 'hi' ? 'सक्रिय' : 'ACTIVE') : (language === 'hi' ? 'आउट ऑफ स्टॉक' : 'OUT OF STOCK')}
                      </span>
                    </div>
                  </div>

                 {/* Product Image Gallery & Media */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col relative overflow-hidden group !mt-[16px] md:!mt-0">
                    <div className="w-full relative bg-slate-50 dark:bg-slate-955/60 rounded-xl overflow-hidden mb-4 border border-slate-100 dark:border-slate-800">
                      <div className="absolute top-4 left-4 z-10">
                        <span className={`px-2 py-1 rounded bg-white/90 backdrop-blur shadow text-[10px] font-black uppercase border ${product.stock > 0 ? 'text-emerald-600 border-emerald-100' : 'text-rose-600 border-rose-100'}`}>
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <ProductImageGallery images={imagesList} productName={product.name} />
                    </div>
                                       <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div className="text-xs text-slate-500 font-medium">Images ({imagesList.length})</div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUploadMedia}
                        accept="image/*"
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingMedia}
                        className="px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {uploadingMedia ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Uploading...
                          </>
                        ) : 'Upload Media'}
                      </button>
                    </div>
                  </div>
                 </div>
               
               {/* Right Column (55%) */}
               <div className="flex flex-col space-y-6">
                 
                 {/* Core Product Info */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                     <FileText className="h-4 w-4 text-emerald-500" />
                     Core Information
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Product Title</label>
                       <input
                         type="text"
                         value={editNameEn}
                         onChange={(e) => setEditNameEn(e.target.value)}
                         onBlur={handleBlurSave}
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Category</label>
                       <input
                         type="text"
                         value={editCategory}
                         onChange={(e) => setEditCategory(e.target.value)}
                         onBlur={handleBlurSave}
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold uppercase"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Short Description</label>
                     <textarea
                       value={editDescEn}
                       onChange={(e) => setEditDescEn(e.target.value)}
                       onBlur={handleBlurSave}
                       rows="3"
                       className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                     />
                   </div>
                 </div>

                 {/* Pricing & Profitability */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                     <Tag className="h-4 w-4 text-emerald-500" />
                     Pricing & Profitability
                   </h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">MRP (₹)</label>
                       <input
                         type="number"
                         value={editPrice}
                         onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                         onBlur={handleBlurSave}
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold text-slate-500 line-through"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Selling Price (₹)</label>
                       <input
                         type="text"
                         value={discountedPrice}
                         disabled
                         className="w-full px-3 py-2 text-sm bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 rounded-lg font-bold text-emerald-600"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Discount (%)</label>
                       <input
                         type="number"
                         value={editDiscount}
                         onChange={(e) => setEditDiscount(parseFloat(e.target.value) || 0)}
                         onBlur={handleBlurSave}
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold text-rose-500"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Profit Margin</label>
                       <input
                         type="text"
                         value={product.discount > 0 ? "~" + (product.discount * 0.8).toFixed(1) + "%" : "Standard"}
                         disabled
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-600"
                       />
                     </div>
                   </div>
                 </div>

                 {/* Inventory Management */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                   <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                     <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                       <Package className="h-4 w-4 text-emerald-500" />
                       Inventory Management
                     </h3>
                     <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${editStock > 10 ? 'bg-emerald-50 text-emerald-600' : editStock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                       {editStock > 10 ? 'Healthy' : editStock > 0 ? 'Low Stock' : 'Out of Stock'}
                     </span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Adjust Stock Level</label>
                       <div className="flex items-center gap-3">
                         <button onClick={handleDecrementStock} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors text-slate-600">
                           <Minus className="h-4 w-4" />
                         </button>
                         <input
                           type="number"
                           value={editStock}
                           onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                           onBlur={handleBlurSave}
                           className="w-20 px-3 py-2 text-center text-base bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-black focus:outline-none focus:border-emerald-500"
                         />
                         <button onClick={handleIncrementStock} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors text-slate-600">
                           <Plus className="h-4 w-4" />
                         </button>
                         <button onClick={handleSaveStock} disabled={savingStock} className="ml-auto px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
                           {savingStock ? '...' : 'Update'}
                         </button>
                       </div>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                       <div className="flex justify-between mb-2">
                         <span className="text-slate-500">Current Stock:</span>
                         <span className="font-bold">{product.stock} units</span>
                       </div>
                       <div className="flex justify-between mb-2">
                         <span className="text-slate-500">Pending Orders:</span>
                         <span className="font-bold text-amber-500">{salesData.sales?.filter(s => s.status === 'Pending').length || 0}</span>
                       </div>
                       <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                         <span className="text-slate-500">Available:</span>
                         <span className="font-black text-emerald-600">{Math.max(0, product.stock - (salesData.sales?.filter(s => s.status === 'Pending').length || 0))} units</span>
                       </div>
                     </div>
                   </div>
                 </div>

                  {/* Dynamic Variant Management */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Dynamic Variants Management</span>
                      </div>
                      {savingVariants && <span className="text-[10px] text-slate-400 animate-pulse font-normal">Saving...</span>}
                    </h3>
                    
                    <div className="space-y-6">
                      {getAllowedAttributesForCategory(product.category).map((attrName) => {
                        const attrValues = editVariants.map((v, idx) => ({ ...v, originalIndex: idx })).filter(v => v.attribute_name === attrName);
                        
                        return (
                          <div key={attrName} className="border-b border-slate-50 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                              {attrName}
                            </label>
                            
                            {/* Badges for existing variants */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {attrValues.length === 0 ? (
                                <span className="text-xs text-slate-400 italic">No {attrName.toLowerCase()} values added yet.</span>
                              ) : (
                                attrValues.map((v) => (
                                  <span 
                                    key={v.originalIndex} 
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                                  >
                                    {v.attribute_value}
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteVariant(v.originalIndex)}
                                      className="hover:bg-slate-200 dark:hover:bg-slate-700 p-0.5 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                      title={`Delete ${v.attribute_value}`}
                                    >
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>
                            
                            {/* Input to add new value */}
                            <div className="flex gap-2 max-w-md">
                              <input 
                                type="text"
                                placeholder={`Add ${attrName.toLowerCase()} value...`}
                                value={variantInputs[attrName] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVariantInputs(prev => ({ ...prev, [attrName]: val }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddVariant(attrName, variantInputs[attrName] || '');
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddVariant(attrName, variantInputs[attrName] || '')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
             </div>

                         {/* Bottom Layout: Analytics & Audit */}
            <div className="grid grid-cols-1 gap-6">
              
              {/* Pandas Analytics Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    Performance Analytics
                  </h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-bold text-slate-500">7 Days</span>
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded text-xs font-bold text-indigo-600">30 Days</span>
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-bold text-slate-500">All Time</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Orders</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">{analyticsData?.sales_stats?.orders_count ?? salesData?.sales?.length ?? 0}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Units Sold</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">{salesData.total_sold || 0}</span>
                  </div>
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                    <span className="text-[10px] text-indigo-600 dark:text-[#4ADE80] font-bold uppercase tracking-wider block mb-1">Revenue Generated</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-[#4ADE80] price-amount">₹{formatPrice(analyticsData?.sales_stats?.revenue_generated ?? salesData?.total_revenue ?? 0)}</span>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-[rgba(212,167,95,0.08)] p-4 rounded-xl border border-emerald-100 dark:border-[rgba(212,167,95,0.25)]">
                    <span className="text-[10px] text-emerald-600 dark:text-[#D4A75F] font-bold dark:font-semibold uppercase tracking-wider dark:tracking-[0.08em] block mb-1">CONVERSION RATE</span>
                    <span className="text-xl dark:text-[24px] font-black dark:font-bold text-emerald-600 dark:text-[#FFD700]">3.8%</span>
                  </div>
                </div>

                {/* Combined Charts Box - "One Box" */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/60">
                    <BarChart2 className="h-4 w-4 text-[#D4A75F]" />
                    Visual Trend Charts
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">Revenue Trend (30 Days)</span>
                      <div className="h-44 sm:h-52 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 overflow-hidden shadow-inner cursor-zoom-in group/chart relative">
                        {analyticsData?.charts?.revenue_chart ? (
                          <img 
                            src={`${API_BASE_URL.replace('/api', '')}${analyticsData.charts.revenue_chart}`} 
                            alt="Revenue Trend" 
                            onClick={() => {
                              setZoomedImage(`${API_BASE_URL.replace('/api', '')}${analyticsData.charts.revenue_chart}`);
                              setZoomedTitle('Revenue Trend (30 Days)');
                            }}
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover/chart:scale-[1.02]" 
                          />
                        ) : (
                          <div className="w-full h-full animate-pulse flex flex-col items-end justify-end space-y-2 pb-2">
                            <div className="w-full flex items-end justify-around space-x-2 h-4/5">
                              <div className="w-1/6 h-[30%] bg-slate-200 dark:bg-slate-800 rounded-t-sm"></div>
                              <div className="w-1/6 h-[50%] bg-slate-200 dark:bg-slate-800 rounded-t-sm"></div>
                              <div className="w-1/6 h-[40%] bg-slate-200 dark:bg-slate-800 rounded-t-sm"></div>
                              <div className="w-1/6 h-[80%] bg-slate-200 dark:bg-slate-800 rounded-t-sm"></div>
                              <div className="w-1/6 h-[60%] bg-slate-200 dark:bg-slate-800 rounded-t-sm"></div>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sales Chart */}
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">Sales Volume & Orders Trend</span>
                      <div className="h-44 sm:h-52 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 overflow-hidden shadow-inner cursor-zoom-in group/chart relative">
                        {analyticsData?.charts?.sales_trend ? (
                          <img 
                            src={`${API_BASE_URL.replace('/api', '')}${analyticsData.charts.sales_trend}`} 
                            alt="Sales Trend" 
                            onClick={() => {
                              setZoomedImage(`${API_BASE_URL.replace('/api', '')}${analyticsData.charts.sales_trend}`);
                              setZoomedTitle('Sales Volume & Orders Trend');
                            }}
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover/chart:scale-[1.02]" 
                          />
                        ) : (
                          <div className="w-full h-full animate-pulse flex flex-col items-end justify-end space-y-2 pb-2">
                            <div className="w-full flex items-end justify-around space-x-2 h-4/5">
                              <div className="w-1/6 h-[20%] bg-indigo-100 dark:bg-indigo-900/40 rounded-t-sm"></div>
                              <div className="w-1/6 h-[45%] bg-indigo-100 dark:bg-indigo-900/40 rounded-t-sm"></div>
                              <div className="w-1/6 h-[65%] bg-indigo-100 dark:bg-indigo-900/40 rounded-t-sm"></div>
                              <div className="w-1/6 h-[35%] bg-indigo-100 dark:bg-indigo-900/40 rounded-t-sm"></div>
                              <div className="w-1/6 h-[85%] bg-indigo-100 dark:bg-indigo-900/40 rounded-t-sm"></div>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit & History */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <History className="h-5 w-5 text-amber-500" />
                    Audit Trail & History
                  </h3>
                  <div className="flex border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => setActiveAdminTab('audit-trail')} className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeAdminTab !== 'stock-logs' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>General Edits</button>
                    <button onClick={() => setActiveAdminTab('stock-logs')} className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeAdminTab === 'stock-logs' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Stock Updates</button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  {activeAdminTab !== 'stock-logs' ? (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date & Time</th>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Admin / User</th>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Field Changed</th>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Old Value</th>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                        {(!logs || logs.length === 0) ? (
                          <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic text-xs">No audit logs found for this product.</td></tr>
                        ) : (
                          logs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                              <td className="px-6 py-3 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                              <td className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">Admin System</td>
                              <td className="px-6 py-3 font-mono font-medium text-amber-600 text-xs bg-amber-50 dark:bg-amber-900/10 inline-block mt-2 mb-2 rounded px-2">{log.field_name || 'System Edit'}</td>
                              <td className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 line-through text-xs truncate max-w-[150px]" title={log.old_value}>{log.old_value || '-'}</td>
                              <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200 text-xs truncate max-w-[150px]" title={log.new_value}>{log.new_value || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date & Time</th>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Action</th>
                          <th className="px-6 py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Delta Qty</th>
                          <th className="px-6 py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">New Stock Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                        {(!stockHistory || stockHistory.length === 0) ? (
                          <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic text-xs">No stock history available.</td></tr>
                        ) : (
                          stockHistory.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                              <td className="px-6 py-3 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                              <td className="px-6 py-3 capitalize font-semibold text-slate-700 dark:text-slate-300 text-xs">{log.change_type.replace('_', ' ')}</td>
                              <td className={`px-6 py-3 text-right font-bold text-xs ${log.change_amount > 0 ? 'text-emerald-500' : log.change_amount < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                              </td>
                              <td className="px-6 py-3 text-right font-black text-slate-900 dark:text-white text-xs">{log.new_stock}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            </div>
             ) : (
          <>
          {/* Mobile Bottom Sticky Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 z-45 flex gap-3 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            {product.stock > 0 ? (
              <>
                <button
                  onClick={handleAddToCart}
                  disabled={isPreviewMode}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-250 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {language === 'hi' ? 'कार्ट में जोड़ें' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isPreviewMode}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center cursor-pointer disabled:bg-slate-250 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                >
                  {language === 'hi' ? 'अभी खरीदें' : 'Buy Now'}
                </button>
              </>
            ) : (
              <button
                onClick={handleOpenRequestBuyModal}
                disabled={isPreviewMode}
                className="flex-1 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border-none"
              >
                {language === 'hi' ? 'खरीदने का अनुरोध' : 'Request To Buy'}
              </button>
            )}
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium py-3 border-b border-slate-100 dark:border-slate-900 mb-6">
            <span className="cursor-pointer hover:text-[#D4A75F] transition-colors" onClick={() => navigate('/')}>{language === 'hi' ? 'होम' : 'Home'}</span>
            <ChevronRight className="h-3 w-3 mx-1 text-slate-400" />
            <span className="cursor-pointer hover:text-[#D4A75F] capitalize transition-colors" onClick={() => navigate(`/?category=${encodeURIComponent(product.category)}`)}>{translateCategory(product.category)}</span>
            <ChevronRight className="h-3 w-3 mx-1 text-slate-400" />
            <span className="text-[#D4A75F] font-bold truncate max-w-[200px] md:max-w-xs">{language === 'hi' ? (product.name_hi || product.name) : (product.name_en || product.name)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-start w-full">
            {/* LEFT COLUMN: Gallery & Trust Section */}
            <div className="col-span-1 md:col-span-6 lg:col-span-5 space-y-6 w-full">
              {/* Product Gallery Container */}
              <div className="flex flex-col gap-3 md:gap-4 select-none w-full product-gallery-section">
                {/* Main Large Image Card with Zoom */}
                <div className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 md:p-5 relative group z-30 flex items-center justify-center">
                  <div 
                    className="relative w-full h-[480px] flex items-center justify-center overflow-hidden rounded-xl md:cursor-zoom-in"
                    onClick={(e) => {
                      if (window.matchMedia('(max-width: 767px)').matches) return;
                      e.stopPropagation();
                      setIsPreviewOpen(true);
                      setIsAutoSlidePaused(true);
                    }}
                    onMouseMove={handleZoomMouseMove}
                    onMouseEnter={() => setIsZooming(true)}
                    onMouseLeave={handleZoomMouseLeave}
                  >
                    <LuxuryImage
                      src={activeImage || imagesList[0]}
                      alt={product.name}
                      className="no-zoom w-full h-auto object-contain transition-transform duration-300 ease-out md:group-hover:scale-105 origin-[var(--zoom-x,50%)_var(--zoom-y,50%)]"
                      fetchPriority="high"
                      width="600"
                      height="600"
                    />
                  </div>

                  {/* Side Zoom Window (Only visible on medium viewports and above) */}
                  {isZooming && (
                    <div 
                      className="absolute left-[103%] top-0 w-[120%] h-full min-w-[320px] max-w-[500px] bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-40 hidden md:block pointer-events-none"
                      style={{
                        backgroundImage: `url(${activeImage || imagesList[0]})`,
                        backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                        backgroundSize: '220%',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  )}
                </div>

                {/* Horizontal Thumbnail Gallery (Visible on both Desktop and Mobile for all products) */}
                {imagesList && imagesList.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto py-1 px-1 no-scrollbar w-full justify-start md:justify-center select-none">
                    {imagesList.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImage(img);
                          setPreviewImageIndex(idx);
                          setIsAutoSlidePaused(true);
                        }}
                        className={`w-16 h-16 lg:w-20 lg:h-20 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                          (activeImage || imagesList[0]) === img
                            ? 'border-[#D4A75F] ring-2 ring-[#D4A75F]/20 shadow-md scale-105'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-700'
                        }`}
                      >
                        <LuxuryImage src={img} alt={`${product.name} - Thumbnail ${idx + 1}`} className="w-full h-full object-cover" width="80" height="80" fetchPriority="low" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MIDDLE SECTION: Product Details, Ratings, Variants */}
            <div className="col-span-1 md:col-span-6 lg:col-span-4 space-y-5 w-full">
              {/* Brand & Category */}
              <div className="flex items-center gap-2 text-[10px] text-slate-455 dark:text-slate-400 font-bold uppercase tracking-wider">
                <span className="text-[#D4A75F]">{translateCategory(product.category)}</span>
                <span>•</span>
                <span>{language === 'hi' ? 'ब्रांड' : 'Brand'}: {product.brand || (language === 'hi' ? 'SSJewellery सिग्नेचर' : 'SSJewellery Signature')}</span>
              </div>

              {/* Product Name */}
              <h1 className="text-xl sm:text-2xl font-black text-[#D4A75F] leading-tight">
                {language === 'hi' ? (product.name_hi || product.name) : (product.name_en || product.name)}
              </h1>

              {/* Ratings & reviews summary */}
              <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center text-amber-500 gap-1 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded">
                  <span>{product.rating || '4.5'}</span>
                  <Star className="h-3 w-3 fill-amber-500" />
                </div>
                <span>|</span>
                <span className="hover:text-[#D4A75F] cursor-pointer transition-colors" onClick={() => scrollToSection('tabs-section')}>
                  {product.reviews?.length || 0} {language === 'hi' ? 'समीक्षाएं' : 'reviews'}
                </span>

              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

              {/* Price Section */}
              <div className="py-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-white price-amount">
                    ₹{discountedPrice.toLocaleString('en-IN')}
                  </span>
                  {product.discount > 0 && (
                    <>
                      <span className="text-base text-slate-400 line-through font-medium">
                        {language === 'hi' ? 'एम.आर.पी' : 'M.R.P'}: <span className="price-amount">₹{product.price.toLocaleString('en-IN')}</span>
                      </span>
                      <span className="text-xs font-black text-rose-500 bg-rose-500/10 dark:bg-rose-500/20 px-2 py-0.5 rounded">
                        {product.discount}% {language === 'hi' ? 'छूट' : 'OFF'}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{language === 'hi' ? 'सभी करों सहित' : 'Inclusive of all taxes'}</p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-xs font-bold ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {product.stock > 0 
                    ? (language === 'hi' ? `स्टॉक में है (केवल ${product.stock} बचे हैं)` : `In Stock (Only ${product.stock} left)`)
                    : (language === 'hi' ? 'आउट ऑफ स्टॉक' : 'Out of stock')}
                </span>
              </div>

              {/* Variants Block based on Category */}
              <div className="space-y-4 pt-2">
                {Object.entries(getGroupedVariants()).map(([attrName, attrValues]) => {
                  const isColor = attrName.toLowerCase().includes('color');
                  const colorMap = {
                    'Carbon Gray': '#4B5563',
                    'Sapphire Blue': '#2563EB',
                    'Forest Green': '#059669',
                    'Rose Gold': '#FDA4AF',
                    'Phantom Black': '#111827',
                    'Black': '#000000',
                    'Navy Blue': '#1E3A8A',
                    'Olive Green': '#374151',
                    'Burgundy': '#800020',
                    'White': '#FFFFFF',
                    'Charcoal Grey': '#374151'
                  };
                  const getColorCode = (col) => colorMap[col] || col;

                  return (
                    <div key={attrName} className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        {language === 'hi' ? `${translateText(attrName)} चुनें` : `Select ${attrName}`}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {attrValues.map((val) => {
                          const isSelected = selectedVariants[attrName] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                setSelectedVariants(prev => ({ ...prev, [attrName]: val }));
                                // Sync legacy states for compatibility
                                if (attrName === 'Color') setSelectedColor(val);
                                if (attrName === 'RAM') setSelectedRam(val);
                                if (attrName === 'Storage') setSelectedSize(val);
                                if (attrName === 'Size') setSelectedSize(val);
                                if (attrName === 'Weight') setSelectedWeight(val);
                                if (attrName === 'Pack Size') setSelectedPackSize(val);
                                if (attrName === 'Format') setSelectedFormat(val);
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-555/10 text-emerald-600 dark:text-emerald-400 font-extrabold ring-1 ring-emerald-500/20'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {isColor && (
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700" 
                                  style={{ backgroundColor: getColorCode(val) }}
                                />
                              )}
                              <span>{translateText(val)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-4" />

              {/* Highlights */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{translateText('Product Highlights')}</h3>
                <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500 mt-0.5 shrink-0" />
                    <span>{translateText('100% Genuine and authentic quality product sourced directly.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500 mt-0.5 shrink-0" />
                    <span>{translateText('Eligible for Free Delivery and cash on delivery payments.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500 mt-0.5 shrink-0" />
                    <span>{translateText('Top rated customer support and easy hassle-free return options.')}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* RIGHT SECTION: Purchase Sidebar, Seller, Offers */}
            <div className="col-span-1 md:col-span-12 lg:col-span-3 space-y-6 lg:sticky lg:top-24 h-fit w-full">
              {/* Buy Panel (No heavy outdated cards - clean modern border) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/50 space-y-5">
                {/* Quantity Selector & Wishlist */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider block">{language === 'hi' ? 'मात्रा' : 'Quantity'}</span>
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden h-9 w-28">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(prev => prev - 1)}
                        className="flex-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all h-full cursor-pointer disabled:opacity-50 bg-transparent border-none"
                      >
                        -
                      </button>
                      <span className="px-2 font-extrabold text-sm text-slate-800 dark:text-slate-200 w-8 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= (product.stock || 10)}
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="flex-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all h-full cursor-pointer disabled:opacity-50 bg-transparent border-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleWishlistToggle}
                    disabled={isPreviewMode}
                    className={`mt-4 px-3 py-2 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold h-9 disabled:cursor-not-allowed disabled:opacity-70 ${
                      isProductInWishlist
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-500'
                        : 'border-slate-200 dark:border-slate-750 hover:border-rose-450 dark:hover:border-rose-600 text-slate-455 hover:text-rose-500 bg-transparent'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isProductInWishlist ? 'fill-current text-rose-500' : ''}`} />
                    <span>{isProductInWishlist ? (language === 'hi' ? 'विशलिस्ट में है' : 'Wishlisted') : (language === 'hi' ? 'विशलिस्ट' : 'Wishlist')}</span>
                  </button>
                </div>

                {/* Desktop Action Buttons */}
                <div className="space-y-2.5 hidden md:block">
                  {product.stock > 0 ? (
                    <>
                      <button
                        onClick={handleAddToCart}
                        disabled={isPreviewMode}
                        className="w-full bg-[#D4A75F] hover:opacity-90 active:scale-98 text-white font-black py-3 rounded-xl transition-all duration-200 shadow-sm shadow-[#D4A75F]/10 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-sm border-none animate-pulse-slow"
                      >
                        <ShoppingCart className="h-4.5 w-4.5" />
                        {language === 'hi' ? 'कार्ट में जोड़ें' : 'Add To Cart'}
                      </button>
                      <button
                        onClick={handleBuyNow}
                        disabled={isPreviewMode}
                        className="w-full bg-[#0d1b2a] hover:bg-[#0d1b2a]/90 active:scale-98 border border-[#D4A75F] text-[#D4A75F] font-black py-3 rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-sm"
                      >
                        {language === 'hi' ? 'अभी खरीदें' : 'Buy Now'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleOpenRequestBuyModal}
                      disabled={isPreviewMode}
                      className="w-full bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-black py-3 rounded-xl transition-all duration-200 shadow-sm shadow-rose-500/10 flex items-center justify-center gap-2 cursor-pointer text-sm border-none"
                    >
                      {language === 'hi' ? 'खरीदने का अनुरोध' : 'Request To Buy'}
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 my-3" />

                {/* Seller Info */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{translateText('Seller Information')}</span>
                  <p className="font-bold text-slate-880 dark:text-slate-200">{product.seller || translateText('SSJewellery Retail Partner')}</p>
                  <p className="text-[10px] text-slate-455 dark:text-slate-400">{translateText('4.8★ Seller Rating • 99% positive feedback')}</p>
                </div>
              </div>

              {/* Product Specifications & Trust Section */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs px-2 space-y-4">
                
                {/* 1. Product Keys & Values - Jewellery Attributes */}
                <div className="py-2.5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {language === 'hi' ? 'उत्पाद विवरण' : 'Product Details'}
                  </span>
                  <div className="space-y-0">
                    {/* From Specifications (admin-entered key:value pairs) */}
                    {getLocalizedSpecifications().length > 0
                      ? getLocalizedSpecifications().map((spec, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                            <span className="text-slate-400 dark:text-slate-500 font-semibold capitalize">{spec.key}</span>
                            <span className="font-bold text-[#D4A75F] text-right">{spec.value}</span>
                          </div>
                        ))
                      : /* Fallback: show variant attributes + category as key-value */
                        (() => {
                          const { metal, karats } = getJewelleryAttributes();
                          return [
                            product.category && { key: language === 'hi' ? 'श्रेणी' : 'Category', value: translateCategory(product.category) },
                            product.brand    && { key: language === 'hi' ? 'ब्रांड' : 'Brand',    value: product.brand },
                            ...Object.entries(getGroupedVariants()).map(([attr, vals]) => ({
                              key: attr,
                              value: vals.join(', ')
                            })),
                            metal   && { key: language === 'hi' ? 'धातु' : 'Metal',   value: metal },
                            karats  && { key: language === 'hi' ? 'शुद्धता / कैरेट' : 'Purity / Karats', value: karats },
                            { key: language === 'hi' ? 'उपलब्धता' : 'Availability', value: product.stock > 0 ? (language === 'hi' ? `${product.stock} स्टॉक में` : `${product.stock} in Stock`) : (language === 'hi' ? 'स्टॉक खत्म' : 'Out of Stock') },
                            { key: language === 'hi' ? 'प्रमाणन' : 'Certification', value: 'BIS Hallmarked' },
                          ].filter(Boolean);
                        })().map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                            <span className="text-slate-400 dark:text-slate-500 font-semibold capitalize">{item.key}</span>
                            <span className="font-bold text-[#D4A75F] text-right">{item.value}</span>
                          </div>
                        ))
                    }
                  </div>
                </div>


              </div>
            </div>
          </div>

          {/* Product Detail Tabs */}
          <div id="tabs-section" className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800/80 mt-10 w-full">
            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
              {[
                { id: 'description', label: language === 'hi' ? 'विवरण' : 'Description' },
                { id: 'specifications', label: language === 'hi' ? 'विनिर्देश' : 'Specifications' },
                { id: 'reviews', label: language === 'hi' ? `समीक्षाएं (${product.reviews?.length || 0})` : `Reviews (${product.reviews?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-6 text-sm font-bold border-b-2 -mb-px transition-all cursor-pointer whitespace-nowrap bg-transparent ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Description Tab Content */}
            {activeTab === 'description' && (
              <div className="space-y-4 animate-in fade-in duration-200 w-full">
                <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed max-w-4xl">
                  {language === 'hi' ? (product.description_hi || product.description) : (product.description_en || product.description)}
                </p>
                {getLocalizedFeatures().length > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 w-full">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      {language === 'hi' ? 'मुख्य विशेषताएं और हाइलाइट्स' : 'Key Features & Highlights'}
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-650 dark:text-slate-350">
                      {getLocalizedFeatures().map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Specifications Tab Content */}
            {activeTab === 'specifications' && (
              <div className="animate-in fade-in duration-200 max-w-4xl w-full">
                {getLocalizedSpecifications().length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {getLocalizedSpecifications().map((spec, idx) => (
                      <div key={idx} className="grid grid-cols-3 py-3 gap-4 text-xs sm:text-sm">
                        <span className="font-bold text-slate-400 capitalize">{spec.key}</span>
                        <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-300">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">{language === 'hi' ? 'कोई तकनीकी विनिर्देश प्रदान नहीं किया गया।' : 'No technical specifications provided.'}</p>
                )}
              </div>
            )}

            {/* Reviews Tab Content */}
            {activeTab === 'reviews' && (
              <div className="animate-in fade-in duration-200 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2 uppercase tracking-wider text-slate-400">
                      <MessageSquare className="h-4 w-4 text-emerald-500" />
                      {language === 'hi' ? 'ग्राहक प्रतिक्रिया' : 'Customer Feedback'}
                    </h3>
                    {submittingReview ? (
                      <ReviewsSkeleton />
                    ) : (!product.reviews || product.reviews.length === 0) ? (
                      <p className="text-slate-400 text-xs italic py-2">{language === 'hi' ? 'अभी तक कोई समीक्षा नहीं है। अपना अनुभव साझा करने वाले पहले व्यक्ति बनें!' : 'No reviews yet. Be the first to share your experience!'}</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
                        {product.reviews.map((rev, index) => (
                          <div key={rev._id || index} className="pt-3 first:pt-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-xs text-slate-800 dark:text-slate-100 break-words whitespace-normal">{rev.user_name}</p>
                                <div className="flex text-amber-400 mt-0.5">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star key={idx} className={`h-3 w-3 ${idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-amber-200 dark:text-amber-300'}`} />
                                  ))}
                                </div>
                              </div>
                              <span className="text-[9px] text-slate-455 dark:text-slate-500">
                                {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : (language === 'hi' ? 'हाल ही में' : 'Recently')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-650 dark:text-slate-300 mt-1 pl-0.5 leading-relaxed">{rev.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    {/* Write Review Form */}
                    <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 bg-white dark:bg-slate-900/50">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">{language === 'hi' ? 'एक समीक्षा लिखें' : 'Write a Review'}</h3>
                      {user ? (
                        <form onSubmit={handleReviewSubmit} className="space-y-3">
                          {reviewMessage && (
                            <p className="text-[10px] text-emerald-600 bg-emerald-500/10 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900 font-bold">{reviewMessage}</p>
                          )}
                          {reviewErr && (
                            <p className="text-[10px] text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-200 dark:border-red-900">{reviewErr}</p>
                          )}
                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'hi' ? 'स्टार रेटिंग' : 'Star Rating'}</span>
                            <div className="flex text-amber-400 gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setRating(star)} className="hover:scale-110 transition-transform cursor-pointer bg-transparent border-none">
                                  <Star className={`h-4.5 w-4.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-amber-300 dark:text-amber-300'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'hi' ? 'लिखित समीक्षा' : 'Written Review'}</span>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="3" placeholder={language === 'hi' ? "उत्पाद की गुणवत्ता के बारे में अपना अनुभव साझा करें..." : "Share your experience about product quality..."} className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-880 dark:text-slate-100" />
                          </div>
                          <button type="submit" disabled={isPreviewMode || submittingReview} className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 transition-all cursor-pointer border-none disabled:cursor-not-allowed">
                            <Send className="h-3.5 w-3.5" />
                            <span>{submittingReview ? (language === 'hi' ? 'सबमिट किया जा रहा है...' : 'Submitting...') : (language === 'hi' ? 'समीक्षा सबमिट करें' : 'Submit Review')}</span>
                          </button>
                        </form>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-slate-400 text-[10px] mb-3">{language === 'hi' ? 'कृपया अपनी स्टार रेटिंग और प्रतिक्रिया सबमिट करने के लिए लॉग इन करें।' : 'Please log in to submit your star rating and feedback.'}</p>
                          <button type="button" onClick={() => navigate('/login')} className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 cursor-pointer">{language === 'hi' ? 'लॉगिन पर जाएं' : 'Go to Login'}</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Related Products */}
          <div id="related-section" className="scroll-mt-28 space-y-4 pt-10 border-t border-slate-100 dark:border-slate-800/80 mt-10 w-full">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{language === 'hi' ? 'संबंधित उत्पाद' : 'Related Products'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {relatedProducts.map((item) => (
                <RelatedProductCard key={item._id} item={item} />
              ))}
            </div>
          </div>

          {/* Section 5: Recently Viewed Products */}
          {recentlyViewed.length > 0 && (
            <div id="recently-viewed-section" className="scroll-mt-28 space-y-4 pt-10 border-t border-slate-100 dark:border-slate-800/80 mt-10 w-full">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{language === 'hi' ? 'हाल ही में देखे गए उत्पाद' : 'Recently Viewed Products'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
                {recentlyViewed.map((item) => (
                  <RelatedProductCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}
          </>
        )}


      {/* Full-Screen Image Gallery Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-6 w-6 rotate-180" />
          </button>

          <div className="max-w-4xl w-full px-4 flex flex-col items-center gap-4">
            <div className="relative w-full aspect-square md:aspect-video bg-black rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl">
              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={() => setPreviewImageIndex(prev => (prev - 1 + imagesList.length) % imagesList.length)}
                className="absolute left-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer z-10"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <LuxuryImage
                src={imagesList[previewImageIndex]}
                alt={`${product.name} - Full Preview ${previewImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                fetchPriority="low"
                width="1200"
                height="800"
              />
              <button
                type="button"
                onClick={() => setPreviewImageIndex(prev => (prev + 1) % imagesList.length)}
                className="absolute right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer z-10"
              >
                <ArrowLeft className="h-6 w-6 rotate-180" />
              </button>
            </div>

            {/* Thumbnails list inside full screen gallery */}
            <div className="flex gap-2 overflow-x-auto py-2 w-full justify-center scrollbar-none">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPreviewImageIndex(idx)}
                  className={`w-12 h-12 rounded-lg border overflow-hidden flex-shrink-0 transition-all ${
                    previewImageIndex === idx
                      ? 'border-[#D4A75F] ring-2 ring-[#D4A75F]/50 shadow-md scale-110'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <LuxuryImage src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" fetchPriority="low" width="80" height="80" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Request To Buy Modal */}
      {showRequestBuyModal && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full relative overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
            {!requestBuySuccess ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <div className="w-10 h-10 bg-[#D4A75F]/10 text-[#D4A75F] rounded-xl flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {language === 'hi' ? 'खरीदने का अनुरोध' : 'Request To Buy'}
                    </h3>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400">
                      {language === 'hi' ? 'आउट-ऑफ़-स्टॉक उत्पाद ऑर्डर अनुरोध' : 'Out-of-stock product order request'}
                    </p>
                  </div>
                </div>

                {/* Product Summary section */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/50 p-4 rounded-2xl mb-4 border border-slate-200/60 dark:border-slate-800/80 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start overflow-hidden">
                  {product.images && product.images.length > 0 && (
                    <div className="w-[140px] h-[140px] flex-shrink-0 overflow-hidden rounded-xl border-2 border-[#D4A75F]/35 shadow-sm">
                      <LuxuryImage 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        fetchPriority="low"
                        width="140"
                        height="140"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 w-full overflow-hidden flex flex-col gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#D4A75F]/10 text-[#cda058] dark:text-[#E2B973] uppercase tracking-wider mb-1.5 break-words">
                        {translateText(product.category)}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white break-words whitespace-pre-wrap leading-snug">
                      {language === 'hi' ? (product.name_hi || product.name) : (product.name_en || product.name)}
                    </h4>
                    
                    {/* Clean column layout for product details */}
                    <div className="flex flex-col gap-1.5 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 overflow-hidden">
                      {isJewelry ? (
                        <>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Metal')}:</span>
                            <span className="text-slate-700 dark:text-slate-350 break-words">{translateText(modalMetal)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Purity')}:</span>
                            <span className="text-slate-700 dark:text-slate-350 break-words">{modalPurity}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Gemstone')}:</span>
                            <span className="text-slate-700 dark:text-slate-350 break-words">{translateText(modalGemstone)}</span>
                          </div>
                          {isRing && modalRingSize && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Ring Size')}:</span>
                              <span className="text-slate-700 dark:text-slate-350 break-words">{modalRingSize}</span>
                            </div>
                          )}
                          {isNecklace && modalNecklaceLength && modalNecklaceLength !== 'None' && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Necklace Length')}:</span>
                              <span className="text-slate-700 dark:text-slate-350 break-words">{modalNecklaceLength}</span>
                            </div>
                          )}
                          {isBracelet && modalBraceletSize && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Bracelet Size')}:</span>
                              <span className="text-slate-700 dark:text-slate-350 break-words">{modalBraceletSize}</span>
                            </div>
                          )}
                          {isBangle && modalBangleSize && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Bangle Size')}:</span>
                              <span className="text-slate-700 dark:text-slate-350 break-words">{modalBangleSize}</span>
                            </div>
                          )}
                          {isChain && modalChainLength && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Chain Length')}:</span>
                              <span className="text-slate-700 dark:text-slate-350 break-words">{modalChainLength}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {getCategoryType(product.category) === 'electronics' && (
                            <>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Storage')}:</span>
                                <span className="text-slate-700 dark:text-slate-350 break-words">{modalStorage}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('RAM')}:</span>
                                <span className="text-slate-700 dark:text-slate-350 break-words">{modalRam}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Color')}:</span>
                                <span className="text-slate-700 dark:text-slate-350 break-words">{translateText(modalColor)}</span>
                              </div>
                            </>
                          )}
                          {getCategoryType(product.category) === 'grocery' && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Weight')}:</span>
                              <span className="text-slate-700 dark:text-slate-350 break-words">{translateText(modalWeight)}</span>
                            </div>
                          )}
                          {getCategoryType(product.category) === 'fashion' && (
                            <>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Size')}:</span>
                                <span className="text-slate-700 dark:text-slate-350 break-words">{modalSize}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Color')}:</span>
                                <span className="text-slate-700 dark:text-slate-350 break-words">{translateText(modalColor)}</span>
                              </div>
                            </>
                          )}
                          {getCategoryType(product.category) === 'books' && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 dark:text-slate-500 font-bold">{translateText('Format')}:</span>
                              <span className="text-slate-700 dark:text-slate-350 break-words">{translateText(modalFormat)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Context */}
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between">
                  <span>{language === 'hi' ? 'अनुरोधकर्ता' : 'Requesting as'}: <strong className="text-slate-700 dark:text-slate-300">{user?.name || user?.full_name}</strong></span>
                  <span>{user?.email}</span>
                </div>

                {/* Category specific layout */}
                {(() => {
                  if (isJewelry) {
                    return (
                      <div className="space-y-4">
                        {/* Quantity Required */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                            {language === 'hi' ? 'आवश्यक मात्रा' : 'Quantity Required'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={modalQty}
                            onChange={(e) => setModalQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#D4A75F] focus:ring-1 focus:ring-[#D4A75F]/20 transition-all"
                          />
                        </div>

                        {/* Location / City */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                            {language === 'hi' ? 'स्थान / शहर *' : 'Location / City *'}
                          </label>
                          <input
                            type="text"
                            value={modalCity}
                            onChange={(e) => setModalCity(e.target.value)}
                            placeholder={language === 'hi' ? 'उदा. उदयपुर' : 'e.g. Udaipur'}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#D4A75F] focus:ring-1 focus:ring-[#D4A75F]/20 transition-all"
                          />
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                            {language === 'hi' ? 'उदाहरण: जयपुर, उदयपुर, दिल्ली, मुंबई, अहमदाबाद' : 'Examples: Jaipur, Udaipur, Delhi, Mumbai, Ahmedabad'}
                          </div>
                        </div>

                        {/* Product-specific size (if applicable) */}
                        {isRing && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                              {language === 'hi' ? 'अंगूठी का आकार' : 'Ring Size'}
                            </label>
                            <select
                              value={modalRingSize}
                              onChange={(e) => setModalRingSize(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#D4A75F] focus:ring-1 focus:ring-[#D4A75F]/20 transition-all cursor-pointer"
                            >
                              {[5, 6, 7, 8, 9, 10, 11, 12].map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {isNecklace && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                              {language === 'hi' ? 'हार की लंबाई (वैकल्पिक)' : 'Necklace Length (Optional)'}
                            </label>
                            <select
                              value={modalNecklaceLength}
                              onChange={(e) => setModalNecklaceLength(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#D4A75F] focus:ring-1 focus:ring-[#D4A75F]/20 transition-all cursor-pointer"
                            >
                              <option value="None">{language === 'hi' ? 'चुनें (वैकल्पिक)' : 'Select length (Optional)'}</option>
                              <option value="16 inches">16 inches (Choker style)</option>
                              <option value="18 inches">18 inches (Standard)</option>
                              <option value="20 inches">20 inches</option>
                              <option value="22 inches">22 inches</option>
                              <option value="24 inches">24 inches</option>
                            </select>
                          </div>
                        )}

                        {isBracelet && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                              {language === 'hi' ? 'कंगन का आकार' : 'Bracelet Size'}
                            </label>
                            <select
                              value={modalBraceletSize}
                              onChange={(e) => setModalBraceletSize(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#D4A75F] focus:ring-1 focus:ring-[#D4A75F]/20 transition-all cursor-pointer"
                            >
                              {['6.0 inches', '6.5 inches', '7.0 inches', '7.5 inches', '8.0 inches'].map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {isBangle && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                              {language === 'hi' ? 'चूड़ी का आकार' : 'Bangle Size'}
                            </label>
                            <select
                              value={modalBangleSize}
                              onChange={(e) => setModalBangleSize(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#D4A75F] focus:ring-1 focus:ring-[#D4A75F]/20 transition-all cursor-pointer"
                            >
                              {['2.2', '2.4', '2.6', '2.8', '3.0'].map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {isChain && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                              {language === 'hi' ? 'चेन की लंबाई' : 'Chain Length'}
                            </label>
                            <select
                              value={modalChainLength}
                              onChange={(e) => setModalChainLength(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#D4A75F] focus:ring-1 focus:ring-[#D4A75F]/20 transition-all cursor-pointer"
                            >
                              {['16 inches', '18 inches', '20 inches', '22 inches', '24 inches'].map(len => (
                                <option key={len} value={len}>{len}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {isBridal && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                              {language === 'hi' ? 'विशेष आवश्यकताएं (वैकल्पिक)' : 'Special Requirements (Optional)'}
                            </label>
                            <textarea
                              value={modalSpecialReqs}
                              onChange={(e) => setModalSpecialReqs(e.target.value)}
                              rows="3"
                              placeholder={language === 'hi' ? 'उदा. मिलान मांग टीका या विशिष्ट डिजाइन अनुकूलन...' : 'e.g. Matching Maang Tikka or specific design customizations...'}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#D4A75F] focus:ring-1 focus:ring-[#D4A75F]/20 transition-all"
                            />
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Fallback for non-jewelry items
                    return (
                      <div className="space-y-4">
                        {/* Quantity Required */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                            {language === 'hi' ? 'आवश्यक मात्रा' : 'Quantity Required'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={modalQty}
                            onChange={(e) => setModalQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                          />
                        </div>

                        {/* Location / City */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                            {language === 'hi' ? 'स्थान / शहर *' : 'Location / City *'}
                          </label>
                          <input
                            type="text"
                            value={modalCity}
                            onChange={(e) => setModalCity(e.target.value)}
                            placeholder={language === 'hi' ? 'उदा. उदयपुर' : 'e.g. Udaipur'}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                          />
                        </div>

                        {getCategoryType(product.category) === 'electronics' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{language === 'hi' ? 'स्टोरेज' : 'Storage'}</label>
                                <select
                                  value={modalStorage}
                                  onChange={(e) => setModalStorage(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                >
                                  <option value="128GB">128GB</option>
                                  <option value="256GB">256GB</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{language === 'hi' ? 'रैम' : 'RAM'}</label>
                                <select
                                  value={modalRam}
                                  onChange={(e) => setModalRam(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                >
                                  <option value="8GB">8GB</option>
                                  <option value="16GB">16GB</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{language === 'hi' ? 'रंग' : 'Color'}</label>
                              <select
                                value={modalColor}
                                onChange={(e) => setModalColor(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                              >
                                <option value="Carbon Gray">{translateText('Carbon Gray')}</option>
                                <option value="Blue">{translateText('Blue')}</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {getCategoryType(product.category) === 'grocery' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{language === 'hi' ? 'वजन' : 'Weight'}</label>
                            <select
                              value={modalWeight}
                              onChange={(e) => setModalWeight(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                            >
                              <option value="500g">{translateText('500g')}</option>
                              <option value="1kg">{translateText('1kg')}</option>
                              <option value="5kg">{translateText('5kg')}</option>
                            </select>
                          </div>
                        )}

                        {getCategoryType(product.category) === 'fashion' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{language === 'hi' ? 'आकार' : 'Size'}</label>
                              <select
                                value={modalSize}
                                onChange={(e) => setModalSize(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                              >
                                <option value="XS">XS</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{language === 'hi' ? 'रंग' : 'Color'}</label>
                              <select
                                value={modalColor}
                                onChange={(e) => setModalColor(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                              >
                                <option value="Black">{translateText('Black')}</option>
                                <option value="White">{translateText('White')}</option>
                                <option value="Blue">{translateText('Blue')}</option>
                                <option value="Red">{translateText('Red')}</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {getCategoryType(product.category) === 'books' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{language === 'hi' ? 'प्रारूप' : 'Format'}</label>
                            <select
                              value={modalFormat}
                              onChange={(e) => setModalFormat(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                            >
                              <option value="Paperback">{translateText('Paperback')}</option>
                              <option value="Hardcover">{translateText('Hardcover')}</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  }
                })()}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowRequestBuyModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-bold py-2.5 rounded-xl text-xs border-none cursor-pointer transition-colors"
                  >
                    {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirmRequestBuy}
                    disabled={requestBuyLoading}
                    className="flex-1 bg-gradient-to-r from-[#D4A75F] to-[#C0924B] hover:brightness-105 text-white font-bold py-2.5 rounded-xl text-xs border-none cursor-pointer disabled:from-slate-400 disabled:to-slate-500 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#D4A75F]/20"
                  >
                    {requestBuyLoading ? (language === 'hi' ? 'सबमिट किया जा रहा है...' : 'Submitting...') : (language === 'hi' ? 'अनुरोध सबमिट करें' : 'Submit Request')}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/10">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{language === 'hi' ? 'अनुरोध सबमिट हो गया!' : 'Request Submitted!'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {language === 'hi' ? (
                    <>आपका <strong>{product.name_hi || product.name}</strong> (मात्रा: {modalQty}) के लिए खरीद अनुरोध पंजीकृत कर लिया गया है। हमारी एडमिन टीम को सूचित कर दिया गया है।</>
                  ) : (
                    <>Your buy request for <strong>{product.name_en || product.name}</strong> (Qty: {modalQty}) has been registered. Our admin team has been notified.</>
                  )}
                </p>
                <button
                  onClick={() => setShowRequestBuyModal(false)}
                  className="w-full bg-[#D4A75F] hover:bg-[#C0924B] text-white font-bold py-2.5 rounded-xl text-xs border-none cursor-pointer shadow-md shadow-[#D4A75F]/20 transition-colors"
                >
                  {language === 'hi' ? 'बहुत बढ़िया, धन्यवाद!' : 'Great, thanks!'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoomed Image Modal Overlay */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setZoomedImage(null);
              setZoomedTitle('');
            }}
            className="fixed inset-0 bg-black/95 z-[999] flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
          >
            {/* Modal Header */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <span className="text-white text-xs font-bold tracking-wider uppercase bg-black/40 px-3 py-1.5 rounded-full border border-white/10">{zoomedTitle}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomedImage(null);
                  setZoomedTitle('');
                }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer border-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedImage}
                alt={zoomedTitle}
                className="max-w-full max-h-[80vh] md:max-h-[85vh] object-contain rounded-xl shadow-2xl bg-white border border-white/5"
              />
            </motion.div>
            
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-4">
              Tap anywhere to close • Pinch to zoom on your mobile screen
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  </div>
  );
};
