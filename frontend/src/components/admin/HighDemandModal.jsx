import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, X } from 'lucide-react';

export const HighDemandModal = ({ isOpen, onClose, isCurrentlyOn, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.6)] transform transition-all animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header Icon */}
        <div className="flex items-center gap-4 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
            isCurrentlyOn
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          }`}>
            {isCurrentlyOn ? <ShieldCheck className="h-7 w-7 animate-bounce-slow" /> : <TrendingUp className="h-7 w-7 animate-pulse" />}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isCurrentlyOn ? 'Disable High Demand Mode?' : 'Enable High Demand Mode?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isCurrentlyOn ? 'Restore standard website access' : 'Pause customer website interaction'}
            </p>
          </div>
        </div>

        {/* Impact Message Body */}
        {!isCurrentlyOn ? (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-950 dark:text-rose-200 font-semibold leading-relaxed space-y-1">
                <p>High Demand Mode will temporarily pause customer access to the website.</p>
                <p>Customers will only see the High Demand screen.</p>
                <p>No browsing or interaction will be available until disabled.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl mb-6 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 dark:text-indigo-300 font-medium leading-relaxed">
              Disabling High Demand Mode will immediately restore full customer access to the website.
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-md active:scale-98 transition-all flex items-center gap-2 ${
              isCurrentlyOn
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isCurrentlyOn ? 'Disable' : 'Enable'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
