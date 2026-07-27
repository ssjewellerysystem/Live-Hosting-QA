import React from 'react';
import { Wrench, AlertTriangle, ShieldCheck, CheckCircle2, X } from 'lucide-react';

export const MaintenanceModal = ({ isOpen, onClose, isCurrentlyOn, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#D4A75F]/30 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.6)] transform transition-all animate-scale-up">
        
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
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          }`}>
            {isCurrentlyOn ? <ShieldCheck className="h-7 w-7 animate-bounce-slow" /> : <Wrench className="h-7 w-7 animate-pulse" />}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isCurrentlyOn ? 'Disable Maintenance Mode?' : 'Enable Maintenance Mode?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isCurrentlyOn ? 'Restore live store operations & checkout' : 'Temporarily suspend ordering across the site'}
            </p>
          </div>
        </div>

        {/* Impact Message Body */}
        {!isCurrentlyOn ? (
          <div className="space-y-4 mb-6">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-300 font-semibold leading-relaxed">
                While maintenance mode is enabled:
              </p>
            </div>

            <ul className="space-y-2.5 px-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>Customers cannot place orders</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>Request To Buy will be disabled</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>Checkout will be disabled</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>Cart checkout will be blocked</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>Payment APIs will be blocked</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Product browsing remains available</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Admin panel remains fully accessible</span>
              </li>
            </ul>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl mb-6 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-300 font-medium leading-relaxed">
              Disabling maintenance mode will immediately re-enable order placement, checkout flows, payment processing, and request-to-buy actions for all customers.
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
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isCurrentlyOn ? 'Disable Maintenance' : 'Enable Maintenance'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
