import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LanguageSelectionModal = () => {
  const { user, savePreferredLanguage } = useContext(AuthContext);
  const [selected, setSelected] = useState('en');
  const [loading, setLoading] = useState(false);

  // Show popup only when preferred_language is NULL and user is a Customer
  const role = user?.role || (user?.is_admin ? 'admin' : 'customer');
  if (!user || user.preferred_language || role !== 'customer') {
    return null;
  }

  const handleContinue = async () => {
    setLoading(true);
    try {
      await savePreferredLanguage(selected);
    } catch (err) {
      console.error("Failed to select language preference:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md bg-[#F8F3EA] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
        >
          {/* Decorative ambient gradients */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4A75F]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#3F1D5A]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-[#D4A75F]/10 border border-[#D4A75F]/20 text-[#D4A75F] rounded-2xl mb-4">
              <Globe className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              Choose Your Preferred Language
            </h2>
            <h3 className="text-lg font-bold text-[#D4A75F] mt-1">
              अपनी पसंदीदा भाषा चुनें
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Please select your base language. This will automatically load SSJewellery in your preferred language.
              <br />
              कृपया अपनी मूल भाषा चुनें। इससे SSJewellery आपकी पसंदीदा भाषा में लोड हो जाएगा।
            </p>
          </div>

          {/* Language Selection Grid */}
          <div className="space-y-3 mb-8">
            {/* English Selection Card */}
            <button
              type="button"
              id="lang-option-en"
              onClick={() => setSelected('en')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer ${
                selected === 'en'
                  ? 'border-[#D4A75F] bg-[#D4A75F]/10 dark:bg-[#D4A75F]/20 shadow-md ring-2 ring-[#D4A75F]/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <span className="text-2xl select-none" role="img" aria-label="UK Flag">🇬🇧</span>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">English</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">View website in English</p>
                </div>
              </div>
              <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                selected === 'en'
                  ? 'border-[#D4A75F] bg-[#D4A75F] text-white'
                  : 'border-slate-300 dark:border-slate-650'
              }`}>
                {selected === 'en' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </button>

            {/* Hindi Selection Card */}
            <button
              type="button"
              id="lang-option-hi"
              onClick={() => setSelected('hi')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer ${
                selected === 'hi'
                  ? 'border-[#D4A75F] bg-[#D4A75F]/10 dark:bg-[#D4A75F]/20 shadow-md ring-2 ring-[#D4A75F]/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <span className="text-2xl select-none" role="img" aria-label="India Flag">🇮🇳</span>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">हिन्दी (Hindi)</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">हिंदी में वेबसाइट देखें</p>
                </div>
              </div>
              <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                selected === 'hi'
                  ? 'border-[#D4A75F] bg-[#D4A75F] text-white'
                  : 'border-slate-300 dark:border-slate-650'
              }`}>
                {selected === 'hi' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* Continue Button */}
          <button
            type="button"
            id="lang-continue-btn"
            disabled={loading}
            onClick={handleContinue}
            className="w-full py-3.5 bg-gradient-to-r from-[#3F1D5A] to-[#D4A75F] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer border-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Continue / जारी रखें</span>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
