import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, ShoppingCart, Heart, ClipboardList, Sun, Moon, LogIn, LogOut, Shield, Menu, X, User, Globe, Settings, Bell, Check, Trash2, Clock, AlertTriangle, DollarSign, MessageSquare, Home, Sparkles, Info, Mail, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useTranslation } from '../hooks/useTranslation';
import axios from 'axios';

export const Navbar = () => {
  const { user, logout, isAdmin, language, changeLanguage, updateUser } = useContext(AuthContext);
  const { cartCount, wishlistCount, triggerAuthModal } = useContext(CartContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll state to trigger premium blur/height transition
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-container-ref')) {
        setNotificationsOpen(false);
      }
      if (!event.target.closest('.profile-container-ref')) {
        setProfileDropdownOpen(false);
      }
      if (!event.target.closest('.lang-container-ref')) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside, { capture: true });
    document.addEventListener('touchstart', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('click', handleClickOutside, { capture: true });
      document.removeEventListener('touchstart', handleClickOutside, { capture: true });
    };
  }, []);

  // Search query & category state
  const [searchVal, setSearchVal] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileContactOpen, setMobileContactOpen] = useState(false);

  // Sync searchVal from URL params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchVal(params.get('search') || '');
  }, [location.search]);

  // Dark/Light Mode Theme Management
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Notifications API Integration
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const endpoint = isAdmin ? `${API_BASE_URL}/admin/notifications` : `${API_BASE_URL}/auth/notifications`;
      const res = await axios.get(endpoint);
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, isAdmin]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      if (isAdmin) {
        await axios.put(`${API_BASE_URL}/admin/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
      } else {
        await axios.put(`${API_BASE_URL}/auth/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        if (user) {
          const updatedNotifs = (user.notifications || []).map(n => n.id === id ? { ...n, read: true } : n);
          updateUser({ notifications: updatedNotifs });
        }
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (isAdmin) {
        await axios.put(`${API_BASE_URL}/admin/notifications/read-all`);
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      } else {
        await axios.put(`${API_BASE_URL}/auth/notifications/read-all`);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (user) {
          const updatedNotifs = (user.notifications || []).map(n => ({ ...n, read: true }));
          updateUser({ notifications: updatedNotifs });
        }
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleClearRead = async () => {
    try {
      if (isAdmin) {
        await axios.delete(`${API_BASE_URL}/admin/notifications/clear-read`);
        setNotifications(prev => prev.filter(n => n.status !== 'read'));
      } else {
        await axios.delete(`${API_BASE_URL}/auth/notifications/clear-read`);
        setNotifications(prev => prev.filter(n => !n.read));
        if (user) {
          const updatedNotifs = (user.notifications || []).filter(n => !n.read);
          updateUser({ notifications: updatedNotifs });
        }
      }
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  };

  const displayedNotifications = isAdmin
    ? notifications.filter(n => ['SUPPORT_TICKET', 'BUY_REQUEST', 'LOW_STOCK'].includes(n.type))
    : notifications;

  const unreadCount = isAdmin
    ? displayedNotifications.filter(n => n.status === 'unread').length
    : displayedNotifications.filter(n => !n.read).length;

  // Automatically mark all notifications as read when the user opens the dropdown
  useEffect(() => {
    if (notificationsOpen && unreadCount > 0) {
      handleMarkAllAsRead();
    }
  }, [notificationsOpen, unreadCount]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/?search=${encodeURIComponent(searchVal)}`);
    } else {
      navigate('/');
    }
    setMobileMenuOpen(false);
  };

  const handleCategorySelect = (cat) => {
    setShowCategoryMenu(false);
    setMobileMenuOpen(false);
    if (cat === 'All') {
      navigate('/');
    } else {
      navigate(`/?category=${cat}`);
    }
  };

  const categories = [
    { code: 'All', label: t('common.all') },
    { code: 'Necklaces', label: t('common.electronics') },
    { code: 'Rings', label: t('common.fashion') },
    { code: 'Earrings', label: t('common.grocery') },
    { code: 'Bracelets', label: t('common.books') },
    { code: 'Bangles', label: t('common.bangles') },
    { code: 'Bridal Collection', label: t('common.bridal') }
  ];

  return (
    <>
      {/* Desktop/Web view navbar */}
      <nav className={`hidden lg:block fixed top-0 left-0 right-0 w-full z-45 transition-all duration-500 border-b ${
        isScrolled
          ? 'navbar-glass-scrolled shadow-md'
          : 'bg-white dark:bg-slate-950 border-[#F2E8D9]/60 dark:border-slate-850 shadow-sm'
      }`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between gap-4 transition-all duration-500 ${isScrolled ? 'h-16' : 'h-20'}`}>

            {/* LEFT SECTION: Logo + SSJewellery Brand Name */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 lg:flex-1 lg:justify-start">
              {/* Hamburger Menu (Mobile/Tablet Only) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors lg:hidden cursor-pointer"
                title="Toggle Mobile Menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {/* SSJewellery Logo and Brand Name Identity */}
              <Link to="/" className="flex items-center gap-[14px] flex-shrink-0 brand-typography-wrapper select-none group no-underline">
                <img
                  src="/logo.svg"
                  alt="SSJewellery Logo"
                  className="h-[46px] md:h-[56px] lg:h-[65px] w-auto object-contain flex-shrink-0"
                />
                <div className="flex items-baseline whitespace-nowrap">
                  <span className="font-great-vibes text-xl sm:text-2xl md:text-3xl text-[#3F1D5A] dark:text-[#EFE7DB] relative pb-1 transition-colors duration-300 select-none">
                    SS
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#D4A75F]"></span>
                  </span>
                  <span className="font-great-vibes text-xl sm:text-2xl md:text-3xl text-[#3F1D5A] dark:text-[#EFE7DB] ml-2 relative pb-1 transition-colors duration-300 select-none">
                    Jewellery
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#D4A75F]"></span>
                  </span>
                </div>
              </Link>
            </div>

            {/* CENTER SECTION: Search Bar (Desktop only) */}
            <div className="hidden lg:flex justify-center w-full max-w-[500px] lg:max-w-[700px] relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  placeholder={t('common.search_placeholder')}
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full pl-5 pr-12 py-3 text-sm bg-[#FAFAFA] dark:bg-slate-800/80 border border-[#F2E8D9] dark:border-slate-700 rounded-full focus:outline-none focus:ring-1 focus:ring-[#D4A75F] focus:border-[#D4A75F] text-[#1F1F1F] dark:text-slate-100 placeholder-slate-400 transition-all shadow-sm hover:border-[#D4A75F]/60"
                />
                <button type="submit" className="absolute right-4 top-3.5 text-[#3F1D5A] dark:text-[#D4A75F] hover:text-[#D4A75F] dark:hover:text-[#BF934B] transition-colors cursor-pointer bg-transparent border-none">
                  <Search className="h-4.5 w-4.5" />
                </button>
              </form>
            </div>

            {/* DESKTOP RIGHT SECTION: Visible only on lg screens and up */}
            <div className="hidden lg:flex items-center gap-1.5 sm:gap-2.5 md:gap-3.5 lg:gap-4 flex-shrink-0 lg:flex-1 lg:justify-end">
              {/* Language Selector */}
              <div className="relative lang-container-ref">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1 p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold uppercase"
                  title="Change Language"
                >
                  <Globe className="h-4.5 w-4.5 text-[#3F1D5A] dark:text-[#D4A75F]" />
                  <span className="hidden sm:inline">{language.toUpperCase()}</span>
                </button>
                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 border border-[#F2E8D9] dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 origin-top-right overflow-hidden"
                      >
                        {[
                          { code: 'en', label: 'English (EN)' },
                          { code: 'hi', label: 'Hindi (HI)' }
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              changeLanguage(lang.code);
                              setLangDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${language === lang.code
                                ? 'text-[#3F1D5A] dark:text-[#D4A75F] bg-[#FAFAFA] dark:bg-slate-800 font-bold'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications Bell */}
              {user && (
                <div className="relative notification-container-ref">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={t('navbar.notifications')}
                  >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 bg-[#D4A75F] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-[#F2E8D9] dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden origin-top-right"
                          >
                            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-[#F2E8D9]/50 dark:border-slate-800/80 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-850 dark:text-slate-100 uppercase tracking-wide">{t('navbar.notifications')}</span>
                              {unreadCount > 0 && (
                                <span className="bg-[#D4A75F] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 text-[10px] font-extrabold">
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-[#D4A75F] hover:underline cursor-pointer bg-transparent border-none"
                                title={t('navbar.mark_all_read')}
                              >
                                {t('navbar.mark_all_read')}
                              </button>
                              <span className="text-slate-300 dark:text-slate-700">|</span>
                              <button
                                onClick={handleClearRead}
                                className="text-slate-500 hover:text-rose-500 dark:text-slate-400 hover:underline cursor-pointer bg-transparent border-none"
                                title={t('navbar.clear_read')}
                              >
                                {t('navbar.clear_read')}
                              </button>
                            </div>
                          </div>

                          <div className="max-h-85 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                            {displayedNotifications.length === 0 ? (
                              <div className="py-8 text-center text-slate-400 dark:text-slate-550">
                                <Bell className="h-8 w-8 mx-auto opacity-30 mb-2 animate-bounce" />
                                <p className="text-xs font-semibold">{t('navbar.no_notifications')}</p>
                              </div>
                            ) : (
                              displayedNotifications.map((n) => {
                                const isUnread = isAdmin ? n.status === 'unread' : !n.read;
                                const getNotificationStyles = (notif) => {
                                  if (isAdmin) {
                                    switch (notif.type) {
                                      case 'SUPPORT_TICKET':
                                        return {
                                          bg: 'bg-indigo-555/10 text-indigo-500 dark:bg-indigo-500/20',
                                          icon: <MessageSquare className="h-4 w-4" />
                                        };
                                      case 'BUY_REQUEST':
                                        return {
                                          bg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20',
                                          icon: <ShoppingBag className="h-4 w-4" />
                                        };
                                      case 'LOW_STOCK':
                                        return {
                                          bg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20',
                                          icon: <AlertTriangle className="h-4 w-4" />
                                        };
                                      default:
                                        return {
                                          bg: 'bg-slate-500/10 text-slate-500 dark:bg-slate-500/20',
                                          icon: <Bell className="h-4 w-4" />
                                        };
                                    }
                                  } else {
                                    const title = (notif.title || '').toLowerCase();
                                    const msg = (notif.message || '').toLowerCase();

                                    if (title.includes('support') || title.includes('ticket') || title.includes('reply') || msg.includes('support') || msg.includes('ticket')) {
                                      return {
                                        bg: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20',
                                        icon: <MessageSquare className="h-4 w-4" />
                                      };
                                    }
                                    if (title.includes('buy request') || title.includes('request to buy') || msg.includes('buy request') || msg.includes('request to buy') || title.includes('request status')) {
                                      return {
                                        bg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20',
                                        icon: <ShoppingBag className="h-4 w-4" />
                                      };
                                    }
                                    if (title.includes('order') || msg.includes('order')) {
                                      return {
                                        bg: 'bg-[#D4A75F]/10 text-[#D4A75F] dark:bg-[#D4A75F]/20',
                                        icon: <ShoppingCart className="h-4 w-4" />
                                      };
                                    }
                                    return {
                                      bg: 'bg-slate-500/10 text-slate-500 dark:bg-slate-500/20',
                                      icon: <Bell className="h-4 w-4" />
                                    };
                                  }
                                };
                                const styles = getNotificationStyles(n);
                                const handleNotificationClick = () => {
                                  setNotificationsOpen(false);
                                  if (isAdmin) {
                                      if (n.type === 'SUPPORT_TICKET') {
                                        navigate('/admin?tab=support');
                                      } else if (n.type === 'BUY_REQUEST') {
                                        navigate('/admin?tab=notifications');
                                      } else if (n.type === 'LOW_STOCK') {
                                        navigate('/admin?tab=products');
                                      }
                                  } else {
                                    const title = (n.title || '').toLowerCase();
                                    const msg = (n.message || '').toLowerCase();

                                    if (!n.read) {
                                      handleMarkAsRead(n.id);
                                    }

                                    if (title.includes('support') || title.includes('ticket') || title.includes('reply') || msg.includes('support') || msg.includes('ticket')) {
                                      navigate('/support-center');
                                    } else if (title.includes('buy request') || title.includes('request to buy') || msg.includes('buy request') || msg.includes('request to buy') || title.includes('request status')) {
                                      navigate('/orders?tab=buy-requests');
                                    } else {
                                      navigate('/orders?tab=orders');
                                    }
                                  }
                                };
                                return (
                                  <div
                                    key={n.id}
                                    onClick={handleNotificationClick}
                                    className={`p-3.5 flex gap-3 items-start transition-colors cursor-pointer text-left ${isUnread ? 'bg-[#D4A75F]/5 dark:bg-[#D4A75F]/5 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                                      }`}
                                  >
                                    <div className={`p-2 rounded-xl flex-shrink-0 ${styles.bg}`}>
                                      {styles.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-baseline gap-1.5">
                                        <p className={`text-xs font-bold truncate ${isUnread ? 'text-slate-850 dark:text-slate-105' : 'text-slate-500 dark:text-slate-450'}`}>
                                          {n.title}
                                        </p>
                                        <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-555 flex-shrink-0 flex items-center gap-0.5">
                                          <Clock className="h-2.5 w-2.5" />
                                          {formatTimeAgo(n.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                        {n.description || n.message}
                                      </p>

                                      <div className="flex justify-between items-center mt-2.5">
                                        <div />
                                        <div>
                                          {isUnread ? (
                                            <button
                                              onClick={(e) => handleMarkAsRead(n.id, e)}
                                              className="text-[9px] font-extrabold text-white bg-[#D4A75F] hover:bg-[#BF934B] px-2 py-0.5 rounded-lg transition-colors cursor-pointer border-none"
                                            >
                                              Mark as read
                                            </button>
                                          ) : (
                                            <span className="text-[9px] font-extrabold text-[#D4A75F] flex items-center gap-0.5 bg-[#D4A75F]/10 dark:bg-[#D4A75F]/15 px-1.5 py-0.5 rounded-lg">
                                              <Check className="h-3 w-3" />
                                              <span>Read</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {isAdmin && (
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/50 dark:border-slate-800/80 text-center">
                              <button
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  navigate('/admin?tab=notifications');
                                }}
                                className="text-xs font-bold text-[#D4A75F] hover:underline cursor-pointer block w-full py-1 border-none bg-transparent"
                              >
                                View all notifications
                              </button>
                            </div>
                          )}
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle Light/Dark Mode"
              >
                {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Wishlist Icon */}
              {!isAdmin && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!user) {
                      triggerAuthModal(language === 'hi' ? 'कृपया अपनी विशलिस्ट देखने के लिए लॉगिन करें।' : 'Please login to access your wishlist.', '/orders?tab=wishlist');
                    } else {
                      navigate('/orders?tab=wishlist');
                    }
                  }}
                  className="relative p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={t('common.wishlist')}
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <motion.span
                      key={`wishlist-${wishlistCount}`}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [0.6, 1.25, 1], opacity: 1 }}
                      transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 12 }}
                      className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[#D4A75F] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-cart-bounce"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </button>
              )}

              {/* Cart Icon */}
              {!isAdmin && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!user) {
                      triggerAuthModal(language === 'hi' ? 'उत्पादों को कार्ट में जोड़ने के लिए कृपया लॉगिन करें।' : 'Please login to add products to your cart.', '/cart');
                    } else {
                      navigate('/cart');
                    }
                  }}
                  className="relative p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={t('common.cart')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <motion.span
                      key={`cart-${cartCount}`}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [0.6, 1.25, 1], opacity: 1 }}
                      transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 12 }}
                      className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[#D4A75F] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-cart-bounce"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </button>
              )}

              {/* My Orders Button */}
              {!isAdmin && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!user) {
                      triggerAuthModal(language === 'hi' ? 'कृपया अपने ऑर्डर देखने के लिए लॉगिन करें।' : 'Please login to view your orders.', '/orders');
                    } else {
                      navigate('/orders');
                    }
                  }}
                  className="p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors flex items-center space-x-1 cursor-pointer"
                  title={t('navbar.my_orders')}
                >
                  <ClipboardList className="h-5 w-5" />
                  <span className="text-xs font-semibold hidden lg:inline">{t('navbar.my_orders')}</span>
                </button>
              )}

              {/* User Profile / Login Dropdown */}
              {user ? (
                <div className="relative profile-container-ref">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-1.5 p-1.5 rounded-xl border border-[#F2E8D9] dark:border-slate-700 bg-[#FAFAFA] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    <div className="h-6 w-6 rounded-full bg-[#D4A75F] text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-[#3F1D5A] dark:text-slate-200 hidden sm:block max-w-[80px] truncate">
                      {language === 'hi' ? `${t('common.namaste')}, ${user.name}` : user.name}
                    </span>
                  </button>

                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#121826] border border-[#F2E8D9] dark:border-[rgba(212,167,95,0.25)] rounded-2xl shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-2 z-50 origin-top-right overflow-hidden"
                        >
                          <div className="px-4 py-2 border-b border-slate-105 dark:border-[rgba(212,167,95,0.15)]">
                            <p className="text-xs text-slate-400">{language === 'hi' ? 'पंजीकृत ईमेल' : 'Signed in as'}</p>
                            <p className="text-sm font-bold text-[#1F1F1F] dark:text-white truncate">{user.email}</p>
                          </div>

                          {isAdmin ? (
                            <Link
                              to="/admin"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2.5 text-sm text-[#3F1D5A] dark:text-white hover:bg-slate-55 dark:hover:bg-[rgba(212,167,95,0.12)] dark:hover:text-[#D4A75F] transition-all duration-200"
                            >
                              <Shield className="h-4 w-4 opacity-75 text-[#3F1D5A] dark:text-[#D4A75F]" />
                              <span>Admin Panel</span>
                            </Link>
                          ) : (
                            <>
                              <Link
                                to="/profile"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center space-x-2 px-4 py-2.5 text-sm text-[#1F1F1F] dark:text-white hover:bg-slate-55 dark:hover:bg-[rgba(212,167,95,0.12)] dark:hover:text-[#D4A75F] transition-all duration-200"
                              >
                                <User className="h-4 w-4 opacity-75 text-[#3F1D5A] dark:text-[#D4A75F]" />
                                <span>{language === 'hi' ? 'मेरी प्रोफ़ाइल' : 'My Profile'}</span>
                              </Link>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              logout();
                              navigate('/');
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-500 hover:bg-[#FAFAFA] dark:text-white dark:hover:bg-[rgba(212,167,95,0.12)] dark:hover:text-[#D4A75F] transition-all duration-200 text-left cursor-pointer bg-transparent border-none"
                          >
                            <LogOut className="h-4 w-4 text-red-500 dark:text-[#D4A75F]" />
                            <span>{t('navbar.sign_out')}</span>
                          </button>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-1 py-2 px-4 bg-[#D4A75F] hover:bg-[#BF934B] text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('common.sign_in')}</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile/Tablet view navbar */}
      <nav className="block lg:hidden fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-[95%] pointer-events-none">
        <div 
          className={`w-full pointer-events-auto transition-all duration-500 rounded-2xl mobile-navbar-mockup ${
            location.pathname === '/'
              ? (isScrolled ? 'navbar-glass-3d-scrolled' : 'navbar-glass-3d')
              : 'navbar-glass-3d-scrolled'
          }`}
        >
          <div className="px-3 sm:px-6">
            <div className="flex items-center justify-between gap-2 sm:gap-4 h-16 md:h-20 flex-nowrap">

              {/* LEFT SECTION: Logo + Brand Name */}
              <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0 flex-nowrap">
                {/* Mobile Menu Toggle Button */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-1.5 sm:p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer lg:hidden"
                  title="Menu"
                >
                  <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </button>
                <Link to="/" className="flex items-center gap-1.5 sm:gap-[14px] flex-shrink-0 brand-typography-wrapper select-none group no-underline flex-nowrap">
                  <img 
                    src="/logo.svg" 
                    alt="SSJewellery Logo" 
                    className="h-[38px] sm:h-[48px] lg:h-[65px] w-auto object-contain flex-shrink-0"
                  />
                  <div className="hidden sm:flex items-center whitespace-nowrap">
                    <span className="font-cinzel text-sm sm:text-xl md:text-2xl font-bold tracking-[1px] sm:tracking-[2px] text-[#3F1D5A] dark:text-[#EFE7DB] transition-colors duration-300">
                      SS
                    </span>
                    <span className="font-great-vibes text-base sm:text-2xl md:text-3xl text-[#3F1D5A] dark:text-[#EFE7DB] ml-1 relative transition-colors duration-300 select-none">
                      Jewellery
                      <span className="absolute bottom-0.5 left-0 w-full h-[1.5px] bg-[#D4A75F]"></span>
                    </span>
                  </div>
                </Link>
              </div>

              {/* CENTER SECTION: Search Bar (Desktop and Mobile) */}
              <div className="flex justify-center flex-1 max-w-[190px] sm:max-w-[280px] md:max-w-[400px] lg:max-w-[550px] relative mx-1 sm:mx-2">
                <form onSubmit={handleSearchSubmit} className="w-full relative">
                  <input
                    type="text"
                    placeholder={t('common.search_placeholder')}
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    className="w-full pl-3 sm:pl-5 pr-8 sm:pr-12 py-1.5 sm:py-3 text-[10px] sm:text-sm bg-[#FAFAFA] dark:bg-slate-800/80 border border-[#F2E8D9] dark:border-slate-700 rounded-full focus:outline-none focus:ring-1 focus:ring-[#D4A75F] focus:border-[#D4A75F] text-[#1F1F1F] dark:text-slate-100 placeholder-slate-400 transition-all shadow-sm hover:border-[#D4A75F]/60"
                  />
                  <button type="submit" className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 text-[#3F1D5A] dark:text-[#D4A75F] hover:text-[#D4A75F] dark:hover:text-[#BF934B] transition-colors cursor-pointer bg-transparent border-none">
                    <Search className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
                  </button>
                </form>
              </div>

              {/* RIGHT SECTION: Icons & User controls */}
              <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0 flex-nowrap">
                {/* Language Selector (Desktop Only) */}
                <div className="relative hidden lg:block">
                  <button
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="flex items-center gap-0.5 p-1.5 sm:p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer text-[10px] sm:text-xs font-bold uppercase"
                    title="Change Language"
                  >
                    <Globe className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-[#3F1D5A] dark:text-[#D4A75F]" />
                    <span className="hidden sm:inline">{language.toUpperCase()}</span>
                  </button>
                  <AnimatePresence>
                    {langDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setLangDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute right-0 mt-2 w-32 sm:w-36 bg-white dark:bg-slate-800 border border-[#F2E8D9] dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 origin-top-right overflow-hidden"
                        >
                          {[
                            { code: 'en', label: 'English (EN)' },
                            { code: 'hi', label: 'Hindi (HI)' }
                          ].map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                changeLanguage(lang.code);
                                setLangDropdownOpen(false);
                              }}
                              className={`block w-full text-left px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${language === lang.code
                                  ? 'text-[#3F1D5A] dark:text-[#D4A75F] bg-[#FAFAFA] dark:bg-slate-800 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notifications Bell (Desktop Only) */}
                {user && (
                  <div className="relative hidden lg:block notification-container-ref">
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={t('navbar.notifications')}
                    >
                      <Bell className="h-4.5 w-4.5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 bg-[#D4A75F] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {notificationsOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-[#F2E8D9] dark:border-slate-850 rounded-2xl shadow-xl z-50 overflow-hidden origin-top-right"
                          >
                            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-[#F2E8D9]/50 dark:border-slate-800/80 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-850 dark:text-slate-100 uppercase tracking-wide">{t('navbar.notifications')}</span>
                                {unreadCount > 0 && (
                                  <span className="bg-[#D4A75F] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 text-[10px] font-extrabold">
                                <button onClick={handleMarkAllAsRead} className="text-[#D4A75F] hover:underline cursor-pointer bg-transparent border-none">
                                  {t('navbar.mark_all_read')}
                                </button>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <button onClick={handleClearRead} className="text-slate-500 hover:text-rose-500 dark:text-slate-400 hover:underline cursor-pointer bg-transparent border-none">
                                  {t('navbar.clear_read')}
                                </button>
                              </div>
                            </div>

                            <div className="max-h-85 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                              {displayedNotifications.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 dark:text-slate-555">
                                  <Bell className="h-8 w-8 mx-auto opacity-30 mb-2 animate-bounce" />
                                  <p className="text-xs font-semibold">{t('navbar.no_notifications')}</p>
                                </div>
                              ) : (
                                displayedNotifications.map((n) => {
                                  const isUnread = isAdmin ? n.status === 'unread' : !n.read;
                                  const styles = n.type === 'SUPPORT_TICKET' ? { bg: 'bg-indigo-500/10 text-indigo-500', icon: <MessageSquare className="h-4 w-4" /> } : { bg: 'bg-slate-500/10 text-slate-500', icon: <Bell className="h-4 w-4" /> };
                                  return (
                                    <div key={n.id} className={`p-3.5 flex gap-3 items-start transition-colors cursor-pointer text-left ${isUnread ? 'bg-[#D4A75F]/5 font-semibold' : 'hover:bg-slate-50'}`}>
                                      <div className={`p-2 rounded-xl flex-shrink-0 ${styles.bg}`}>{styles.icon}</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline gap-1.5">
                                          <p className="text-xs font-bold truncate">{n.title}</p>
                                          <span className="text-[9px] text-slate-450 flex-shrink-0 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{formatTimeAgo(n.created_at)}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.description || n.message}</p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Theme Toggle (Desktop Only) */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="p-1.5 sm:p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer hidden lg:block"
                >
                  {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>

                {/* Notifications Bell (Mobile) */}
                {user && (
                  <div className="static notification-container-ref">
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative p-1.5 sm:p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={t('navbar.notifications')}
                    >
                      <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-[#D4A75F] text-white text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {notificationsOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute right-4 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-[#F2E8D9] dark:border-slate-850 rounded-2xl shadow-xl z-50 overflow-hidden origin-top-right"
                          >
                            <div className="px-3 py-2.5 bg-white dark:bg-slate-900 border-b border-[#F2E8D9]/50 dark:border-slate-800/80 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[10px] sm:text-xs text-slate-850 dark:text-slate-100 uppercase tracking-wide">{t('navbar.notifications')}</span>
                                {unreadCount > 0 && (
                                  <span className="bg-[#D4A75F] text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 text-[9px] sm:text-[10px] font-extrabold">
                                <button onClick={handleMarkAllAsRead} className="text-[#D4A75F] hover:underline cursor-pointer bg-transparent border-none">
                                  {t('navbar.mark_all_read')}
                                </button>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <button onClick={handleClearRead} className="text-slate-500 hover:text-rose-500 dark:text-slate-400 hover:underline cursor-pointer bg-transparent border-none">
                                  {t('navbar.clear_read')}
                                </button>
                              </div>
                            </div>

                            <div className="max-h-64 sm:max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                              {displayedNotifications.length === 0 ? (
                                <div className="py-6 text-center text-slate-400 dark:text-slate-555">
                                  <Bell className="h-6 w-6 mx-auto opacity-30 mb-1.5 animate-bounce" />
                                  <p className="text-[10px] sm:text-xs font-semibold">{t('navbar.no_notifications')}</p>
                                </div>
                              ) : (
                                displayedNotifications.map((n) => {
                                  const isUnread = isAdmin ? n.status === 'unread' : !n.read;
                                  const getNotificationStyles = (notif) => {
                                    if (isAdmin) {
                                      switch (notif.type) {
                                        case 'SUPPORT_TICKET':
                                          return {
                                            bg: 'bg-indigo-555/10 text-indigo-500 dark:bg-indigo-500/20',
                                            icon: <MessageSquare className="h-3.5 w-3.5" />
                                          };
                                        case 'BUY_REQUEST':
                                          return {
                                            bg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20',
                                            icon: <ShoppingBag className="h-3.5 w-3.5" />
                                          };
                                        case 'LOW_STOCK':
                                          return {
                                            bg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20',
                                            icon: <AlertTriangle className="h-3.5 w-3.5" />
                                          };
                                        default:
                                          return {
                                            bg: 'bg-slate-500/10 text-slate-500 dark:bg-slate-500/20',
                                            icon: <Bell className="h-3.5 w-3.5" />
                                          };
                                      }
                                    } else {
                                      const title = (notif.title || '').toLowerCase();
                                      const msg = (notif.message || '').toLowerCase();

                                      if (title.includes('support') || title.includes('ticket') || title.includes('reply') || msg.includes('support') || msg.includes('ticket')) {
                                        return {
                                          bg: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20',
                                          icon: <MessageSquare className="h-3.5 w-3.5" />
                                        };
                                      }
                                      if (title.includes('buy request') || title.includes('request to buy') || msg.includes('buy request') || msg.includes('request to buy') || title.includes('request status')) {
                                        return {
                                          bg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20',
                                          icon: <ShoppingBag className="h-3.5 w-3.5" />
                                        };
                                      }
                                      if (title.includes('order') || msg.includes('order')) {
                                        return {
                                          bg: 'bg-[#D4A75F]/10 text-[#D4A75F] dark:bg-[#D4A75F]/20',
                                          icon: <ShoppingCart className="h-3.5 w-3.5" />
                                        };
                                      }
                                      return {
                                        bg: 'bg-slate-500/10 text-slate-500 dark:bg-slate-500/20',
                                        icon: <Bell className="h-3.5 w-3.5" />
                                      };
                                    }
                                  };
                                  const styles = getNotificationStyles(n);
                                  const handleNotificationClick = () => {
                                    setNotificationsOpen(false);
                                    if (isAdmin) {
                                        if (n.type === 'SUPPORT_TICKET') {
                                          navigate('/admin?tab=support');
                                        } else if (n.type === 'BUY_REQUEST') {
                                          navigate('/admin?tab=notifications');
                                        } else if (n.type === 'LOW_STOCK') {
                                          navigate('/admin?tab=products');
                                        }
                                    } else {
                                      const title = (n.title || '').toLowerCase();
                                      const msg = (n.message || '').toLowerCase();

                                      if (!n.read) {
                                        handleMarkAsRead(n.id);
                                      }

                                      if (title.includes('support') || title.includes('ticket') || title.includes('reply') || msg.includes('support') || msg.includes('ticket')) {
                                        navigate('/support-center');
                                      } else if (title.includes('buy request') || title.includes('request to buy') || msg.includes('buy request') || msg.includes('request to buy') || title.includes('request status')) {
                                        navigate('/orders?tab=buy-requests');
                                      } else {
                                        navigate('/orders?tab=orders');
                                      }
                                    }
                                  };
                                  return (
                                    <div
                                      key={n.id}
                                      onClick={handleNotificationClick}
                                      className={`p-2.5 flex gap-2 items-start transition-colors cursor-pointer text-left ${isUnread ? 'bg-[#D4A75F]/5 dark:bg-[#D4A75F]/5 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                                        }`}
                                    >
                                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${styles.bg}`}>
                                        {styles.icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline gap-1">
                                          <p className={`text-[11px] font-bold truncate ${isUnread ? 'text-slate-850 dark:text-slate-105' : 'text-slate-550 dark:text-slate-450'}`}>{n.title}</p>
                                          <span className="text-[8px] font-semibold text-slate-450 dark:text-slate-555 flex-shrink-0 flex items-center gap-0.5"><Clock className="h-2 w-2" />{formatTimeAgo(n.created_at)}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.description || n.message}</p>
                                        <div className="flex justify-between items-center mt-2">
                                          <div />
                                          <div>
                                            {isUnread ? (
                                              <button onClick={(e) => handleMarkAsRead(n.id, e)} className="text-[8px] font-extrabold text-white bg-[#D4A75F] hover:bg-[#BF934B] px-1.5 py-0.5 rounded transition-colors cursor-pointer border-none">Mark as read</button>
                                            ) : (
                                              <span className="text-[8px] font-extrabold text-[#D4A75F] flex items-center gap-0.5 bg-[#D4A75F]/10 dark:bg-[#D4A75F]/15 px-1 py-0.5 rounded"><Check className="h-2.5 w-2.5" /><span>Read</span></span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {isAdmin && (
                              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/50 dark:border-slate-800/80 text-center">
                                <button
                                  onClick={() => {
                                    setNotificationsOpen(false);
                                    navigate('/admin?tab=notifications');
                                  }}
                                  className="text-[10px] font-bold text-[#D4A75F] hover:underline cursor-pointer block w-full py-1 border-none bg-transparent"
                                >
                                  View all notifications
                                </button>
                              </div>
                            )}
                          </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Wishlist (Desktop only on mobile - shown in profile dropdown on xs) */}
                {!isAdmin && (
                  <button
                    onClick={() => navigate('/orders?tab=wishlist')}
                    className="relative p-1.5 sm:p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:block"
                  >
                    <Heart className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    {wishlistCount > 0 && <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-[#D4A75F] text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center">{wishlistCount}</span>}
                  </button>
                )}

                {/* Cart (Desktop only on mobile - shown in profile dropdown on xs) */}
                {!isAdmin && (
                  <button
                    onClick={() => navigate('/cart')}
                    className="relative p-1.5 sm:p-2 rounded-xl text-[#3F1D5A] dark:text-[#EFE7DB] hover:bg-[#FAFAFA] dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:block"
                  >
                    <ShoppingCart className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-[#D4A75F] text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
                  </button>
                )}

                {/* Profile / Sign In (Desktop & Mobile) */}
                {user ? (
                  <div className="relative profile-container-ref">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center space-x-1.5 p-1 rounded-xl border border-[rgba(212,167,95,0.35)] bg-[#0d1b2a] cursor-pointer hover:bg-[#162236] transition-colors"
                    >
                      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-[#D4A75F] text-white flex items-center justify-center text-[11px] sm:text-xs font-bold uppercase shadow-md">{user.name.charAt(0)}</div>
                      <span className="text-xs font-bold text-white hidden sm:block">{user.name}</span>
                    </button>
                    <AnimatePresence>
                      {profileDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-56 bg-[#0d1b2a] border border-[rgba(212,167,95,0.30)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] py-2 z-50 origin-top-right overflow-hidden"
                          >
                            <div className="px-4 py-2.5 border-b border-[rgba(212,167,95,0.18)]">
                              <p className="text-[10px] text-[#D4A75F] font-bold uppercase tracking-wider">{language === 'hi' ? 'पंजीकृत ईमेल' : 'Signed in as'}</p>
                              <p className="text-sm font-bold text-white truncate mt-0.5">{user.email}</p>
                            </div>

                            {/* Cart & Wishlist quick links - mobile only */}
                            {!isAdmin && (
                              <div className="flex gap-1 px-3 py-2 border-b border-[rgba(212,167,95,0.15)] sm:hidden">
                                <button
                                  onClick={() => { setProfileDropdownOpen(false); navigate('/orders?tab=wishlist'); }}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[rgba(212,167,95,0.10)] hover:bg-[rgba(212,167,95,0.20)] text-[#D4A75F] text-xs font-bold transition-all"
                                >
                                  <Heart className="h-3.5 w-3.5" />
                                  Wishlist
                                  {wishlistCount > 0 && <span className="bg-[#D4A75F] text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{wishlistCount}</span>}
                                </button>
                                <button
                                  onClick={() => { setProfileDropdownOpen(false); navigate('/cart'); }}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[rgba(212,167,95,0.10)] hover:bg-[rgba(212,167,95,0.20)] text-[#D4A75F] text-xs font-bold transition-all"
                                >
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                  Cart
                                  {cartCount > 0 && <span className="bg-[#D4A75F] text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{cartCount}</span>}
                                </button>
                              </div>
                            )}

                            {isAdmin ? (
                              <Link
                                to="/admin"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-[rgba(212,167,95,0.12)] hover:text-[#D4A75F] transition-all duration-200"
                              >
                                <Shield className="h-4 w-4 opacity-75 text-[#D4A75F]" />
                                <span>Admin Panel</span>
                              </Link>
                            ) : (
                              <>
                                <Link
                                  to="/profile"
                                  onClick={() => setProfileDropdownOpen(false)}
                                  className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-[rgba(212,167,95,0.12)] hover:text-[#D4A75F] transition-all duration-200"
                                >
                                  <User className="h-4 w-4 opacity-75 text-[#D4A75F]" />
                                  <span>{language === 'hi' ? 'मेरी प्रोफ़ाइल' : 'My Profile'}</span>
                                </Link>

                                <Link
                                  to="/orders"
                                  onClick={() => setProfileDropdownOpen(false)}
                                  className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-[rgba(212,167,95,0.12)] hover:text-[#D4A75F] transition-all duration-200"
                                >
                                  <ClipboardList className="h-4 w-4 opacity-75 text-[#D4A75F]" />
                                  <span>{language === 'hi' ? 'मेरे ऑर्डर' : 'My Orders'}</span>
                                </Link>
                              </>
                            )}

                            <button
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                logout();
                                navigate('/');
                              }}
                              className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-400 hover:bg-[rgba(239,68,68,0.10)] hover:text-red-300 transition-all duration-200 text-left cursor-pointer bg-transparent border-none mt-1 border-t border-[rgba(212,167,95,0.12)]"
                            >
                              <LogOut className="h-4 w-4 text-red-400" />
                              <span>{t('navbar.sign_out')}</span>
                            </button>
                          </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link 
                    to="/login" 
                    className="flex items-center space-x-1 py-1.5 px-2.5 sm:py-2 sm:px-4 bg-[#D4A75F] hover:bg-[#BF934B] text-white rounded-full text-[9px] sm:text-xs font-bold shadow-md hover:shadow-lg transition-all flex-shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>{t('common.sign_in')}</span>
                  </Link>
                )}
              </div>

            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: -320, right: 0 }}
              dragElastic={{ left: 0.2, right: 0 }}
              dragDirectionLock
              onDragEnd={(_, info) => {
                if (info.offset.x < -80 || info.velocity.x < -400) {
                  setMobileMenuOpen(false);
                }
              }}
              className="fixed inset-y-0 left-0 w-[300px] bg-[#0B1220] text-slate-100 z-50 shadow-2xl flex flex-col p-6 overflow-y-auto lg:hidden select-none"
            >
              {/* Swipe hint strip */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-16 rounded-l-full bg-[rgba(212,167,95,0.35)]" />
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-2 select-none">
                  <img src="/logo.svg" alt="SS Logo" className="h-9 w-auto object-contain" />
                  <div className="flex items-center">
                    <span className="font-cinzel text-base font-bold text-white">SS</span>
                    <span className="font-great-vibes text-lg text-white ml-1">Jewellery</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-350 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-grow flex flex-col divide-y divide-slate-800/60">
                
                {/* Profile Prompt / Status */}
                {user ? (
                  <div className="py-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#D4A75F] text-white flex items-center justify-center text-sm font-bold uppercase select-none">
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <Link 
                        to="/admin-control" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 rounded-xl text-xs font-bold transition-all no-underline"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>

                    {/* Language & Theme toggles */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-full">
                        <button
                          onClick={() => changeLanguage('en')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            language === 'en' ? 'bg-[#3F1D5A] text-white' : 'text-slate-450 hover:text-white bg-transparent border-none'
                          }`}
                        >
                          EN
                        </button>
                        <button
                          onClick={() => changeLanguage('hi')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            language === 'hi' ? 'bg-[#3F1D5A] text-white' : 'text-slate-455 hover:text-white bg-transparent border-none'
                          }`}
                        >
                          HI
                        </button>
                      </div>
                      <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                        title="Toggle Theme"
                      >
                        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-5 space-y-3">
                    <p className="text-xs text-slate-400 font-medium">Log in to view special offers & orders</p>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#3F1D5A] hover:bg-[#2E1442] text-white rounded-xl text-sm font-bold shadow-md transition-all no-underline"
                    >
                      <LogIn className="h-4.5 w-4.5" />
                      <span>Sign In</span>
                    </Link>

                    {/* Language & Theme toggles */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-full">
                        <button
                          onClick={() => changeLanguage('en')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            language === 'en' ? 'bg-[#3F1D5A] text-white' : 'text-slate-450 hover:text-white bg-transparent border-none'
                          }`}
                        >
                          EN
                        </button>
                        <button
                          onClick={() => changeLanguage('hi')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            language === 'hi' ? 'bg-[#3F1D5A] text-white' : 'text-slate-455 hover:text-white bg-transparent border-none'
                          }`}
                        >
                          HI
                        </button>
                      </div>
                      <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                        title="Toggle Theme"
                      >
                        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* NAVIGATION */}
                <div className="py-5 space-y-3.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Navigation</span>
                  <Link 
                    to="/" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-sm font-semibold text-slate-350 hover:text-white transition-colors no-underline"
                  >
                    <Home className="h-4.5 w-4.5 text-[#D4A75F]" />
                    <span>Home</span>
                  </Link>
                  <Link 
                    to="/support-center" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 text-sm font-semibold text-slate-355 hover:text-white transition-colors no-underline"
                  >
                    <MessageSquare className="h-4.5 w-4.5 text-[#D4A75F]" />
                    <span>Support</span>
                  </Link>
                </div>

                {/* COLLECTIONS */}
                <div className="py-5 space-y-3.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Collections</span>
                  <button 
                    onClick={() => handleCategorySelect('Bridal Collection')} 
                    className="flex items-center gap-3 text-sm font-semibold text-slate-350 hover:text-white transition-colors bg-transparent border-none cursor-pointer w-full text-left"
                  >
                    <Sparkles className="h-4.5 w-4.5 text-[#D4A75F]" />
                    <span>Bridal Collection</span>
                  </button>
                  <button 
                    onClick={() => handleCategorySelect('Rings')} 
                    className="flex items-center gap-3 text-sm font-semibold text-slate-350 hover:text-white transition-colors bg-transparent border-none cursor-pointer w-full text-left"
                  >
                    <Sparkles className="h-4.5 w-4.5 text-[#D4A75F]" />
                    <span>Solitaire Rings</span>
                  </button>
                </div>

                {/* CATEGORIES */}
                <div className="py-5 space-y-3.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Categories</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Necklaces', code: 'Necklaces' },
                      { name: 'Rings', code: 'Rings' },
                      { name: 'Earrings', code: 'Earrings' },
                      { name: 'Bracelets', code: 'Bracelets' },
                      { name: 'Bangles', code: 'Bangles' },
                      { name: 'Bridal Collection', code: 'Bridal Collection' }
                    ].map((cat, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCategorySelect(cat.code)}
                        className="py-2 px-2 text-[11px] font-semibold text-slate-300 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-lg transition-all cursor-pointer text-center truncate"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collapsible Sections: About & Contact */}
                <div className="py-2">
                  {/* About Us dropdown */}
                  <div className="py-1">
                    <button
                      onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                      className="flex items-center justify-between w-full text-slate-350 hover:text-white transition-colors text-sm font-semibold bg-transparent border-none cursor-pointer py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Info className="h-4.5 w-4.5 text-[#D4A75F]" />
                        <span>About Us</span>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${mobileAboutOpen ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {mobileAboutOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-7.5 mt-1 space-y-2 text-xs text-slate-400 leading-relaxed text-left"
                        >
                          <p>SS Jewellery represents the pinnacle of handcrafted Indian heritage jewellery. Our legacy spans generations of fine craftsmanship and absolute purity.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Contact Us dropdown */}
                  <div className="py-1">
                    <button
                      onClick={() => setMobileContactOpen(!mobileContactOpen)}
                      className="flex items-center justify-between w-full text-slate-350 hover:text-white transition-colors text-sm font-semibold bg-transparent border-none cursor-pointer py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-4.5 w-4.5 text-[#D4A75F]" />
                        <span>Contact Us</span>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${mobileContactOpen ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {mobileContactOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-7.5 mt-1 space-y-2 text-xs text-slate-400 text-left"
                        >
                          <p>Email: care@ssjewellery.com</p>
                          <p>Phone: +91 98765 43210</p>
                          <p>Address: SS House, Sector 5, Mumbai</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>



              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
