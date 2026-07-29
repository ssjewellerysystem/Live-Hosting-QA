import React, { useState, useEffect } from 'react';
import { Truck, X, ExternalLink, AlertCircle } from 'lucide-react';

export const TrackingInfoModal = ({
  isOpen,
  onClose,
  onSubmit,
  orderId,
  initialTrackingUrl = '',
  initialTrackingId = '',
  isEditing = false,
  loading = false
}) => {
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl);
  const [trackingId, setTrackingId] = useState(initialTrackingId);
  const [error, setError] = useState('');

  useEffect(() => {
    setTrackingUrl(initialTrackingUrl || '');
    setTrackingId(initialTrackingId || '');
    setError('');
  }, [initialTrackingUrl, initialTrackingId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedUrl = trackingUrl.trim();
    const trimmedId = trackingId.trim();

    if (!trimmedUrl) {
      setError('Tracking URL is mandatory. Please enter a valid courier tracking link.');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setError('Tracking URL must start with http:// or https:// (e.g. https://www.delhivery.com/track?awb=123456789)');
      return;
    }

    if (!trimmedId) {
      setError('Tracking ID is mandatory. Please enter a valid tracking AWB / Consignment number.');
      return;
    }

    onSubmit({
      tracking_url: trimmedUrl,
      tracking_id: trimmedId
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#5B1E7A]/10 text-[#5B1E7A] dark:bg-[#D4A75F]/20 dark:text-[#D4A75F] rounded-2xl border border-[#5B1E7A]/20 dark:border-[#D4A75F]/30">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Shipment Tracking Details' : 'Enter Shipment Tracking Information'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Order ID: <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">{orderId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-rose-500 cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors bg-transparent border-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-3.5 rounded-2xl text-xs flex items-start space-x-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isEditing 
                ? 'Updating tracking details will allow the customer to trace their package using the new link and ID.'
                : 'Both Tracking URL and Tracking ID are mandatory before marking this order as Out for Delivery.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tracking URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tracking URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://www.delhivery.com/track?awb=123456789"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#5B1E7A] dark:focus:border-[#D4A75F] transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Example: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">https://track.bluedart.com/123456789</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">https://www.delhivery.com/track?awb=123456789</code>
            </p>
          </div>

          {/* Tracking ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tracking ID / AWB <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AWB123456789IN or DTDC987654321"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-[#5B1E7A] dark:focus:border-[#D4A75F] transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Example: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">AWB123456789IN</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">DTDC987654321</code>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border-none cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#5B1E7A] hover:bg-[#D4A75F] text-white font-bold rounded-xl text-xs border-none cursor-pointer transition-all shadow-md shadow-[#5B1E7A]/10 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span>Save & Continue</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
