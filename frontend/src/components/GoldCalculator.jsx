import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, HelpCircle, TrendingUp, Info } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { formatPrice } from '../utils/priceFormatter';

export const GoldCalculator = () => {
  const { language } = useTranslation();
  const [weight, setWeight] = useState(10);
  const [selectedPurity, setSelectedPurity] = useState('22k');
  const [priceOffset, setPriceOffset] = useState(0);

  // Simulated live fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceOffset((prev) => prev + (Math.random() - 0.5) * 4);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Base prices per gram (INR)
  const basePrices = {
    '24k': 7350,
    '22k': 6740,
    '18k': 5510,
    '14k': 4290
  };

  const currentPrices = useMemo(() => {
    return {
      '24k': Math.round(basePrices['24k'] + priceOffset),
      '22k': Math.round(basePrices['22k'] + priceOffset * 0.92),
      '18k': Math.round(basePrices['18k'] + priceOffset * 0.75),
      '14k': Math.round(basePrices['14k'] + priceOffset * 0.58)
    };
  }, [priceOffset]);

  const calculations = useMemo(() => {
    const pricePerGram = currentPrices[selectedPurity];
    const metalCost = pricePerGram * weight;
    const makingCharges = metalCost * 0.12; // 12% standard making charge
    const gst = (metalCost + makingCharges) * 0.03; // 3% GST
    const grandTotal = metalCost + makingCharges + gst;

    return {
      pricePerGram,
      metalCost: Math.round(metalCost),
      makingCharges: Math.round(makingCharges),
      gst: Math.round(gst),
      grandTotal: Math.round(grandTotal)
    };
  }, [weight, selectedPurity, currentPrices]);

  // Translation helpers
  const text = {
    en: {
      title: "Live Gold Price & Karat Calculator",
      subtitle: "Plan your purchase with estimated live market metal rates",
      goldPrice: "Live Gold Rate (per gram)",
      weightLabel: "Jewelry Metal Weight",
      purityLabel: "Select Gold Purity",
      calculationSummary: "Estimated Price Breakdown",
      metalCost: "Metal Cost",
      makingCharges: "Making Charges (12%)",
      gst: "GST & Taxes (3%)",
      totalPrice: "Estimated Grand Total",
      helperNote: "Please Note: Final price may vary based on specific design complexity, certification, and actual store transaction rates.",
      liveIndicator: "LIVE UPDATING"
    },
    hi: {
      title: "लाइव गोल्ड रेट और कैरेट कैलकुलेटर",
      subtitle: "लाइव बाजार की अनुमानित धातु दरों के साथ अपनी खरीदारी की योजना बनाएं",
      goldPrice: "लाइव सोने की दर (प्रति ग्राम)",
      weightLabel: "आभूषण धातु का वजन",
      purityLabel: "सोने की शुद्धता चुनें",
      calculationSummary: "अनुमानित मूल्य विवरण",
      metalCost: "धातु की लागत",
      makingCharges: "मेकिंग चार्जेस (12%)",
      gst: "जीएसटी और कर (3%)",
      totalPrice: "अनुमानित कुल मूल्य",
      helperNote: "कृपया ध्यान दें: अंतिम मूल्य विशिष्ट डिजाइन जटिलता, प्रमाणन और वास्तविक स्टोर दर के आधार पर भिन्न हो सकता है।",
      liveIndicator: "लाइव अपडेट"
    }
  }[language === 'hi' ? 'hi' : 'en'];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/95 border border-[#D4A75F]/15 rounded-3xl p-6 sm:p-10 shadow-xl">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D4A75F]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#3F1D5A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Header & Inputs (Col 7) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-[#D4A75F] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {text.liveIndicator}
              </div>
              <h2 className="text-xl sm:text-3xl font-bold font-serif text-[#EFE7DB] tracking-wide">
                {text.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                {text.subtitle}
              </p>
            </div>

            {/* Purity Grid */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wide">
                {text.purityLabel}
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {Object.keys(basePrices).map((purity) => (
                  <button
                    key={purity}
                    onClick={() => setSelectedPurity(purity)}
                    className={`py-3 px-1 rounded-xl text-xs sm:text-sm font-extrabold transition-all border cursor-pointer ${
                      selectedPurity === purity
                        ? 'bg-gradient-to-r from-[#D4A75F] to-[#BF934B] text-white border-transparent shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {purity.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight Input Box */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-bold text-white uppercase tracking-wide">
                  {text.weightLabel}
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Math.max(1, Math.min(250, Number(e.target.value))))}
                    className="w-20 text-center py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-sm text-[#D4A75F] font-bold focus:outline-none focus:border-[#D4A75F]/40"
                  />
                  <span className="text-xs font-bold text-slate-400">grams</span>
                </div>
              </div>

              {/* Slider */}
              <div className="relative pt-1">
                <input
                  type="range"
                  min="1"
                  max="150"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#D4A75F]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1.5">
                  <span>1g</span>
                  <span>50g</span>
                  <span>100g</span>
                  <span>150g+</span>
                </div>
              </div>
            </div>

            {/* Live rates display */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-[#D4A75F]">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">{text.goldPrice}</span>
                  <span className="text-sm font-extrabold text-[#EFE7DB]">{selectedPurity.toUpperCase()} Gold</span>
                </div>
              </div>
              <motion.div 
                key={calculations.pricePerGram}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-right"
              >
                <span className="text-lg font-black text-[#D4A75F]">₹{formatPrice(calculations.pricePerGram)}</span>
                <span className="text-[10px] text-green-400 font-bold block">
                  <TrendingUp className="inline h-3 w-3 mr-0.5" /> +0.14%
                </span>
              </motion.div>
            </div>
          </div>

          {/* Price Summary Panel (Col 5) */}
          <div className="lg:col-span-5 h-full">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col h-full justify-between space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-[#D4A75F]" />
                  {text.calculationSummary}
                </h3>

                <div className="mt-4 space-y-3.5 text-xs text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>{text.metalCost} ({weight}g)</span>
                    <span className="font-semibold text-slate-200">₹{formatPrice(calculations.metalCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{text.makingCharges}</span>
                    <span className="font-semibold text-slate-200">₹{formatPrice(calculations.makingCharges)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{text.gst}</span>
                    <span className="font-semibold text-slate-200">₹{formatPrice(calculations.gst)}</span>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-200">{text.totalPrice}</span>
                  <motion.span 
                    key={calculations.grandTotal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-2xl sm:text-3xl font-black text-[#D4A75F] tracking-tight price-amount"
                  >
                    ₹{formatPrice(calculations.grandTotal)}
                  </motion.span>
                </div>

                <p className="text-[10px] leading-relaxed text-slate-500 italic mt-2">
                  {text.helperNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
