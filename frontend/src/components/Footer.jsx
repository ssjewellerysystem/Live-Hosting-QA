import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, Globe, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useTranslation } from '../hooks/useTranslation';

const IconMap = {
  Phone: Phone,
  Mail: Mail,
  MapPin: MapPin,
  Globe: Globe,
  MessageSquare: MessageSquare
};

export const Footer = () => {
  const { user, language } = useContext(AuthContext);
  const { triggerAuthModal } = useContext(CartContext);
  const { t, localize } = useTranslation();
  const navigate = useNavigate();

  const [supportLinks, setSupportLinks] = useState([
    { id: 1, title: "+91 98765 43210", title_hi: "+91 98765 43210", url: "tel:+919876543210", icon: "Phone" },
    { id: 2, title: "support@SSJewellery.com", title_hi: "support@SSJewellery.com", url: "mailto:support@SSJewellery.com", icon: "Mail" },
    { id: 3, title: "Connaught Place, New Delhi, India", title_hi: "कनॉट प्लेस, नई दिल्ली, भारत", url: "https://maps.google.com/?q=Connaught+Place,+New+Delhi,+India", icon: "MapPin" }
  ]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/support/links`);
        if (res.data && res.data.length > 0) {
          setSupportLinks(res.data.filter(link => link.is_active));
        }
      } catch (err) {
        console.error("Failed to fetch footer support links:", err);
      }
    };
    fetchLinks();
  }, []);

  return (
    <footer className="bg-[#05051F] text-[#FFFFFF] border-t border-[#D4A75F]/30">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-serif font-bold tracking-widest text-[#D4A75F] uppercase">
                SSJewellery
              </span>
            </Link>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">
              {t('footer.about_desc')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold text-[#D4A75F] uppercase tracking-wider mb-4">{t('footer.quick_links')}</h3>
            <ul className="space-y-3 text-sm flex flex-col items-start">
              <li>
                <Link to="/" className="text-[#F5F5F5] hover:text-[#D4A75F] transition-colors">{t('common.home')}</Link>
              </li>
              <li>
                <Link to="/support" className="text-[#F5F5F5] hover:text-[#D4A75F] transition-colors">{t('footer.help_support')}</Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (!user) {
                      triggerAuthModal(language === 'hi' ? 'उत्पादों को कार्ट में जोड़ने के लिए कृपया लॉगिन करें।' : 'Please login to add products to your cart.', '/cart');
                    } else {
                      navigate('/cart');
                    }
                  }}
                  className="text-[#F5F5F5] hover:text-[#D4A75F] transition-colors text-left bg-transparent border-none cursor-pointer p-0"
                >
                  {t('common.cart')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (!user) {
                      triggerAuthModal(language === 'hi' ? 'कृपया अपने ऑर्डर देखने के लिए लॉगिन करें।' : 'Please login to view your orders.', '/orders');
                    } else {
                      navigate('/orders');
                    }
                  }}
                  className="text-[#F5F5F5] hover:text-[#D4A75F] transition-colors text-left bg-transparent border-none cursor-pointer p-0"
                >
                  {t('navbar.my_orders')}
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-base font-semibold text-[#D4A75F] uppercase tracking-wider mb-4">{t('common.categories')}</h3>
            <ul className="space-y-3 text-sm flex flex-col items-start">
              <li><Link to="/?category=Necklaces" className="text-[#F5F5F5] hover:text-[#D4A75F] transition-colors">{t('common.electronics')}</Link></li>
              <li><Link to="/?category=Rings" className="text-[#F5F5F5] hover:text-[#D4A75F] transition-colors">{t('common.fashion')}</Link></li>
              <li><Link to="/?category=Earrings" className="text-[#F5F5F5] hover:text-[#D4A75F] transition-colors">{t('common.grocery')}</Link></li>
              <li><Link to="/?category=Bracelets" className="text-[#F5F5F5] hover:text-[#D4A75F] transition-colors">{t('common.books')}</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-base font-semibold text-[#D4A75F] uppercase tracking-wider mb-4">{t('footer.contact_us')}</h3>
            <ul className="space-y-3 text-sm flex flex-col items-start">
              {supportLinks.map(link => {
                const IconComponent = IconMap[link.icon] || Phone;
                let displayTitle = localize(link, 'title');
                let displayUrl = link.url;
                if (displayTitle === "support@SSJewellery.com") {
                  displayTitle = "support@SSJewellery.com";
                  displayUrl = "mailto:support@SSJewellery.com";
                }
                return (
                  <li key={link.id || link._id}>
                    <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-[#F5F5F5] hover:text-[#D4A75F] transition-colors">
                      <IconComponent className="h-4.5 w-4.5 text-[#D4A75F] flex-shrink-0" />
                      <span>{displayTitle}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

        </div>

        <div className="mt-12 border-t border-slate-800/80 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#E5E7EB]">
          <p className="font-medium">{t('footer.copyright')}</p>
          <p className="flex items-center mt-4 md:mt-0 font-medium">
            Made with <Heart className="h-3.5 w-3.5 text-[#D4A75F] mx-1 fill-current" /> for jewellery lovers.
          </p>
        </div>
      </div>
    </footer>
  );
};
