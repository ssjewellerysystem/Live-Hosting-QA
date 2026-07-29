import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { formatPrice } from '../utils/priceFormatter';
import { API_BASE_URL } from '../context/AuthContext';

const getGoldRateUrl = () => {
  const baseUrl = API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/gold-rate` : `${API_BASE_URL}/api/gold-rate`;
  return `${baseUrl}?_t=${Date.now()}`;
};

export const GoldCalculator = () => {
  const { t } = useTranslation();
  const [weight, setWeight] = useState(10);           // always stored in GRAMS
  const [weightUnit, setWeightUnit] = useState('g');   // 'g' | 'kg'
  const [selectedPurity, setSelectedPurity] = useState('22k');
  const [metalType, setMetalType] = useState('gold'); // 'gold' | 'silver'

  // ── Real API rates state ────────────────────────────────────────────────────
  const [apiRates, setApiRates] = useState(null);   // null = not loaded yet
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [silverRate, setSilverRate] = useState(null);

  const fetchRates = useCallback(async () => {
    try {
      setRatesLoading(true);
      setRatesError(false);
      const res = await fetch(getGoldRateUrl());
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      if (json.success && json.data) {
        const { gold, silver, updated_at } = json.data;
        const g24 = gold['24k_per_gram'] || 0;
        const g22 = gold['22k_per_gram'] || 0;
        setApiRates({
          '24k': Math.round(g24),
          '22k': Math.round(g22),
          '18k': Math.round(g24 * 0.75),
          '14k': Math.round(g24 * 0.585)
        });
        setSilverRate(silver['per_gram'] || null);
        setUpdatedAt(updated_at || '');
      } else {
        throw new Error('Invalid data');
      }
    } catch {
      setRatesError(true);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const currentPrices = useMemo(() => {
    if (apiRates) return apiRates;
    return { '24k': 0, '22k': 0, '18k': 0, '14k': 0 };
  }, [apiRates]);

  const activePricePerGram = useMemo(() => {
    if (metalType === 'silver') return silverRate || 0;
    return currentPrices[selectedPurity] || 0;
  }, [metalType, silverRate, currentPrices, selectedPurity]);

  const calculations = useMemo(() => {
    const pricePerGram = activePricePerGram;
    const metalCost = pricePerGram * weight;
    const grandTotal = metalCost;
    return {
      pricePerGram,
      metalCost: Math.round(metalCost),
      grandTotal: Math.round(grandTotal)
    };
  }, [weight, activePricePerGram]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="px-4 py-10 mx-auto max-w-7xl sm:px-6 lg:px-8"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/95 border border-[#D4A75F]/15 rounded-3xl p-6 sm:p-10 shadow-xl">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D4A75F]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#3F1D5A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid items-start grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Header & Inputs (Col 7) */}
          <div className="space-y-6 lg:col-span-7">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-[#D4A75F] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {t('calculator.live_indicator')}
              </div>

              {/* Metal Toggle */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setMetalType('gold')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold border transition-all cursor-pointer ${metalType === 'gold'
                      ? 'bg-gradient-to-r from-[#D4A75F] to-[#BF934B] text-white border-transparent shadow-lg shadow-amber-500/20'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-amber-500/40 hover:text-amber-400'
                    }`}
                >
                  <span className="text-base">🥇</span> {t('calculator.gold_tab')}
                </button>
                <button
                  onClick={() => setMetalType('silver')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold border transition-all cursor-pointer ${metalType === 'silver'
                      ? 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-900 border-transparent shadow-lg shadow-slate-400/20'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-400/40 hover:text-slate-300'
                    }`}
                >
                  <span className="text-base">🥈</span> {t('calculator.silver_tab')}
                </button>
              </div>

              <h2 className="text-xl sm:text-3xl font-bold font-serif text-[#EFE7DB] tracking-wide">
                {metalType === 'silver' ? t('calculator.silver_title') : t('calculator.gold_title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                {metalType === 'silver' ? t('calculator.silver_subtitle') : t('calculator.gold_subtitle')}
              </p>
            </div>

            {/* Purity Grid — only for gold */}
            {metalType === 'gold' && (
              <div className="space-y-2.5">
                <label className="block text-xs font-bold tracking-wide uppercase calculator-section-label">
                  {t('calculator.purity_label')}
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {Object.keys(currentPrices).map((purity) => (
                    <button
                      key={purity}
                      onClick={() => setSelectedPurity(purity)}
                      className={`py-3 px-1 rounded-xl text-xs sm:text-sm font-extrabold transition-all border cursor-pointer ${selectedPurity === purity
                          ? 'bg-gradient-to-r from-[#D4A75F] to-[#BF934B] text-white border-transparent shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                      {purity.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Weight Input Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold tracking-wide uppercase calculator-section-label">
                  {t('calculator.weight_label')}
                </label>
                {/* Unit Toggle */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={weightUnit === 'kg' ? +(weight / 1000).toFixed(3) : weight}
                    min={weightUnit === 'kg' ? 0.001 : 1}
                    max={weightUnit === 'kg' ? 1 : 1000}
                    step={weightUnit === 'kg' ? 0.001 : 1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (weightUnit === 'kg') {
                        setWeight(Math.round(Math.max(0.001, Math.min(1, val)) * 1000));
                      } else {
                        setWeight(Math.max(1, Math.min(1000, Math.round(val))));
                      }
                    }}
                    className="w-24 text-center py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-sm text-[#D4A75F] font-bold focus:outline-none focus:border-[#D4A75F]/40"
                  />
                  {/* g / kg pill toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-slate-800">
                    {['g', 'kg'].map((u) => (
                      <button
                        key={u}
                        onClick={() => setWeightUnit(u)}
                        className={`px-3 py-1 text-xs font-extrabold transition-all cursor-pointer ${weightUnit === u
                            ? 'bg-[#D4A75F] text-slate-900'
                            : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="relative pt-1">
                <input
                  type="range"
                  min={weightUnit === 'kg' ? 1 : 1}
                  max={weightUnit === 'kg' ? 1000 : 1000}
                  step={1}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#D4A75F]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1.5">
                  {weightUnit === 'kg' ? (
                    <><span>0.001kg</span><span>0.25kg</span><span>0.5kg</span><span>1kg</span></>
                  ) : (
                    <><span>1g</span><span>250g</span><span>500g</span><span>1000g</span></>
                  )}
                </div>
              </div>

              {/* Weight summary chip */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {weight >= 1000 ? `${(weight / 1000).toFixed(3)} kg` : `${weight} g`}
                </span>
                <span>=</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {weight >= 1000 ? `${weight} g` : `${(weight / 1000).toFixed(3)} kg`}
                </span>
              </div>
            </div>

            {/* Rate Card — real API data */}
            <div className="space-y-2">
              {/* Error Banner */}
              {ratesError && (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {t('calculator.error_load_rates')}</span>
                  <button onClick={fetchRates} className="flex items-center gap-1 text-red-300 hover:text-white transition-colors cursor-pointer">
                    <RefreshCw className="w-3 h-3" /> {t('calculator.retry_btn')}
                  </button>
                </div>
              )}

              {/* Gold Rate Row */}
              <div className="flex items-center justify-between p-4 border bg-slate-900/50 border-slate-800/80 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-[#D4A75F]">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">{t('calculator.todays_gold_rate')}</span>
                    <span className="text-sm font-extrabold text-[#EFE7DB]">{t('calculator.gold_rate_region', { purity: selectedPurity.toUpperCase() })}</span>
                  </div>
                </div>
                <motion.div
                  key={calculations.pricePerGram}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-right"
                >
                  {ratesLoading ? (
                    <div className="h-6 w-24 bg-slate-800 rounded animate-pulse" />
                  ) : (
                    <>
                      <span className="text-lg font-black text-[#D4A75F]">₹{formatPrice(calculations.pricePerGram)}</span>
                      <span className="text-[10px] text-slate-500 font-bold block">{t('calculator.per_gram')}</span>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Silver Rate Row — only show in gold mode as reference */}
              {silverRate !== null && metalType === 'gold' && (
                <div className="flex items-center justify-between px-4 py-3 border bg-slate-900/30 border-slate-800/50 rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-slate-700/40 text-slate-300">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">{t('calculator.silver_rate_region')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-200">₹{formatPrice(silverRate)}</span>
                    <span className="text-[10px] text-slate-500 block">{t('calculator.per_gram')}</span>
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {updatedAt && (
                <p className="text-[10px] text-slate-600 text-right px-1">
                  {t('calculator.last_updated')} {updatedAt}
                </p>
              )}
            </div>
          </div>

          {/* Price Summary Panel (Col 5) */}
          <div className="h-full lg:col-span-5">
            <div className="flex flex-col justify-between h-full p-6 space-y-6 border bg-slate-900/70 border-slate-800 rounded-2xl">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-1.5 calculator-section-label">
                  <Info className="h-4 w-4 text-[#D4A75F]" />
                  {t('calculator.calculation_summary')}
                </h3>

                <div className="mt-4 space-y-3.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>{t('calculator.metal_cost')} ({weight >= 1000 ? `${(weight / 1000).toFixed(3)}kg` : `${weight}g`})</span>
                    <span className="font-semibold text-slate-200">₹{formatPrice(calculations.metalCost)}</span>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-4 space-y-4 border-t border-slate-800">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-200">{t('calculator.estimated_total')}</span>
                  <motion.span
                    key={calculations.grandTotal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-2xl sm:text-3xl font-black tracking-tight price-amount ${metalType === 'silver' ? 'text-slate-300' : 'text-[#D4A75F]'
                      }`}
                  >
                    ₹{formatPrice(calculations.grandTotal)}
                  </motion.span>
                </div>

                <p className="text-[10px] leading-relaxed text-slate-500 italic mt-2">
                  {t('calculator.helper_note')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
