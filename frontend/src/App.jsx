import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LiveChat } from './components/LiveChat';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LanguageSelectionModal } from './components/LanguageSelectionModal';

import { Home } from './pages/Home';
import { GlobalVideoFooter } from './components/GlobalVideoFooter';

// Lazy load other pages for route-based code splitting
const ProductDetails = React.lazy(() => import('./pages/ProductDetails').then(m => ({ default: m.ProductDetails })));
const Cart = React.lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Checkout = React.lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const MyOrders = React.lazy(() => import('./pages/MyOrders').then(m => ({ default: m.MyOrders })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Support = React.lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));
const SupportCenter = React.lazy(() => import('./pages/SupportCenter').then(m => ({ default: m.SupportCenter })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminControl = React.lazy(() => import('./pages/AdminControl').then(m => ({ default: m.AdminControl })));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));

// Loading UI Fallback
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-slate-50/50 dark:bg-slate-950/50">
    <div className="relative flex flex-col items-center">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#D4A75F] animate-spin" />
      <p className="text-[10px] tracking-[0.2em] uppercase text-[#D4A75F] mt-4 font-semibold animate-pulse">
        Loading...
      </p>
    </div>
  </div>
);


// Luxurious page transition wrapper
const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
};

function App() {
  const location = useLocation();
  const [appLoading, setAppLoading] = React.useState(true);
  const [zoomedImage, setZoomedImage] = React.useState(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to top on every route change (but not query param/search updates)
  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);

  // Global Image Click-to-Zoom Listener (desktop only — disabled on mobile)
  React.useEffect(() => {
    const handleImageClick = (e) => {
      if (window.matchMedia('(max-width: 767px)').matches) return;

      const img = e.target.closest('img');
      if (!img) return;

      // Filter out small interface images, icons, logos, etc.
      if (
        img.src.includes('logo.svg') ||
        img.src.includes('avatar') ||
        img.src.includes('flag') ||
        img.src.includes('cat_') ||
        img.classList.contains('no-zoom') ||
        img.closest('.no-zoom') ||
        img.closest('.category-item-link') ||
        img.closest('.live-chat-container') ||
        img.closest('.navbar-brand-logo') ||
        img.closest('.language-modal-ref') ||
        img.closest('.notification-container-ref') ||
        img.closest('.product-grid') ||
        img.closest('.product-gallery-section') ||
        img.offsetWidth < 60 ||
        img.offsetHeight < 60
      ) {
        return;
      }

      // Intercept and open in lightbox zoom modal
      e.preventDefault();
      e.stopPropagation();
      setZoomedImage(img.src);
    };

    window.addEventListener('click', handleImageClick, { capture: true });
    return () => window.removeEventListener('click', handleImageClick, { capture: true });
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* Magnifying glass hover hint on product/gallery graphics (desktop only) */
        @media (min-width: 768px) {
          img:not(.no-zoom):not([src*="logo.svg"]):not([src*="avatar"]):not([src*="flag"]):not([src*="cat_"]) {
            cursor: zoom-in;
            transition: filter 0.25s ease;
          }
          img:not(.no-zoom):not([src*="logo.svg"]):not([src*="avatar"]):not([src*="flag"]):not([src*="cat_"]):hover {
            filter: brightness(1.04);
          }
        }
        /* Exclude interface elements from custom cursor */
        .navbar img, 
        .live-chat-container img, 
        button img,
        .no-zoom img,
        .no-zoom {
          cursor: default !important;
        }
        /* Ensure links/pointer elements with no-zoom show pointer cursor */
        a.no-zoom img,
        a.no-zoom,
        a .no-zoom img,
        a .no-zoom,
        .cursor-pointer img,
        .cursor-pointer {
          cursor: pointer !important;
        }
      `}} />
      <AnimatePresence>
        {appLoading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950"
          >
            <div className="relative flex flex-col items-center max-w-[280px] w-full text-center">
              {/* Logo / Brand name */}
              <div className="w-20 h-20 mb-6 relative luxury-gold-shimmer rounded-2xl overflow-hidden flex items-center justify-center p-3 shadow-md bg-white border border-slate-100">
                <img src="/logo.svg" alt="SSJewellery" className="w-full h-full object-contain animate-pulse" />
              </div>
              <h2 className="text-[#3F1D5A] dark:text-[#EFE7DB] font-serif text-2xl tracking-widest font-extrabold uppercase animate-pulse">
                SS<span className="text-[#D4A75F] font-light font-sans">Jewellery</span>
              </h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#D4A75F] mt-2 font-semibold">
                Crafting Elegance
              </p>
              
              {/* Gold Shimmer Progress Bar */}
              <div className="w-full h-[3px] bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden mt-8 relative">
                <div className="absolute top-0 bottom-0 left-0 bg-[#D4A75F] w-[50%] animate-shimmer-bar rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Navigation bar */}
        <Navbar />

      {/* Language Preference Selection Modal */}
      <LanguageSelectionModal />

      {/* Main page content area */}
      <main className="flex-grow pt-20">
        <AnimatePresence mode="wait">
          <React.Suspense fallback={<LoadingFallback />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/product/:id" element={<PageWrapper><ProductDetails /></PageWrapper>} />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <PageWrapper><Cart /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <PageWrapper><Checkout /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <PageWrapper><MyOrders /></PageWrapper>
                </ProtectedRoute>
              } />
               <Route path="/profile" element={
                <ProtectedRoute userOnly={true}>
                  <PageWrapper><Profile /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
              <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
              <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
              <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
              <Route path="/support" element={<PageWrapper><Support /></PageWrapper>} />
              <Route path="/support-center" element={
                <ProtectedRoute>
                  <PageWrapper><SupportCenter /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <PageWrapper><AdminDashboard /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/admin-control" element={
                <ProtectedRoute adminOnly={true}>
                  <PageWrapper><AdminControl /></PageWrapper>
                </ProtectedRoute>
              } />
            </Routes>
          </React.Suspense>
        </AnimatePresence>
      </main>

      {/* Grid footer links panel - ONLY visible on Profile page */}
      {location.pathname === '/profile' && <Footer />}

      {/* Global Video Footer - Only shown on user side, hidden on admin side */}
      {!location.pathname.startsWith('/admin') && <GlobalVideoFooter />}

      {/* Interactive chatbot bubble widget */}
      <LiveChat />

      {/* Global Image Lightbox Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-zoom-out select-none"
            onClick={() => setZoomedImage(null)}
          >
            {/* Close Button Hint */}
            <div className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-md border border-white/15">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>

            {/* Glowing gold border background ornament */}
            <div className="absolute inset-0 border-[12px] md:border-[20px] border-[#D4A75F]/10 pointer-events-none" />

            {/* Zoomed Image Card */}
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative max-w-[92%] max-h-[85%] rounded-2xl overflow-hidden border border-[#D4A75F]/35 bg-slate-950 shadow-[0_30px_100px_rgba(212,167,95,0.22)] flex items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedImage}
                alt="Zoomed preview"
                className="max-w-full max-h-[78vh] object-contain rounded-xl select-none cursor-zoom-out"
                onClick={() => setZoomedImage(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

export default App;

