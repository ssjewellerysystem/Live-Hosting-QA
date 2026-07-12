import React from 'react';
import { Eye, RefreshCw, ShoppingBag, Mail, X } from 'lucide-react';

export const OrderManagementTab = ({
  activeTab,
  orders,
  formatTimestamp,
  formatPrice,
  handleOrderStatusUpdate,
  setSelectedOrder,
  buyRequests,
  fetchBuyRequests,
  editingBuyRequest,
  setEditingBuyRequest,
  buyRequestNote,
  setBuyRequestNote,
  expectedAvailability,
  setExpectedAvailability,
  expectedDelivery,
  setExpectedDelivery,
  showConfirmModal,
  setShowConfirmModal,
  handleOpenProceedConfirmation,
  handleProceedBuyRequest,
  products,
  getTodayDateString
}) => {
  if (activeTab === 'orders') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
        <h3 className="text-base font-bold mb-4">Customer Orders list ({orders.length})</h3>

        <table className="w-full text-left text-xs min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
              <th className="py-2.5">Order ID</th>
              <th className="py-2.5">Date</th>
              <th className="py-2.5">Total Amount</th>
              <th className="py-2.5">Customer / Address</th>
              <th className="py-2.5">Status</th>
              <th className="py-2.5">Update Status</th>
              <th className="py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
            {orders.map(o => (
              <tr key={o._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                <td className="py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">{o.order_id}</td>
                <td className="py-3.5 text-slate-550 admin-datetime-text">{formatTimestamp(o.created_at)}</td>
                <td className="py-3.5 font-bold text-slate-850 dark:text-slate-100 price-amount">₹{formatPrice(o.total_amount)}</td>
                <td className="py-3.5 max-w-[200px] truncate text-slate-555" title={o.shipping_address?.address}>
                  {o.shipping_address?.name} - {o.shipping_address?.address}, {o.shipping_address?.city}
                </td>
                <td className="py-3.5">
                  <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm whitespace-nowrap ${
                    (o.status || '').toLowerCase() === 'pending'
                      ? 'status-badge-pending'
                      : (o.status || '').toLowerCase() === 'processing' || (o.status || '').toLowerCase() === 'confirmed' || (o.status || '').toLowerCase() === 'packed'
                      ? 'bg-[#3B82F6] text-white border-[#2563EB]'
                      : (o.status || '').toLowerCase() === 'shipped' || (o.status || '').toLowerCase() === 'dispatched'
                      ? 'bg-[#06B6D4] text-white border-[#0891B2]'
                      : (o.status || '').toLowerCase() === 'out for delivery'
                      ? 'bg-[#8B5CF6] text-white border-[#7C3AED]'
                      : (o.status || '').toLowerCase() === 'delivered'
                      ? 'status-badge-success'
                      : (o.status || '').toLowerCase() === 'cancelled'
                      ? 'bg-[#EF4444] text-white border-[#DC2626]'
                      : 'bg-[#6B7280] text-white border-[#4B5563]'
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="py-3.5">
                  <select
                    value={o.status}
                    onChange={(e) => handleOrderStatusUpdate(o._id, e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 px-2 py-1 rounded-lg focus:outline-none text-slate-850 dark:text-slate-100"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
                <td className="py-3.5 text-right">
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-[#D4A75F]/10 dark:hover:bg-[#D4A75F]/15 dark:text-[#D4A75F] rounded-lg transition-colors font-bold"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Details</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'buy-requests') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6 gap-3">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 section-icon green-premium" />
              <span>User Buy Requests ({buyRequests.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Approve, reject, or track requests for out-of-stock items</p>
          </div>
          <button 
            onClick={fetchBuyRequests}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-705 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer border-none"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </button>
        </div>

        {editingBuyRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Eye className="h-5 w-5 text-[#5B1E7A]" />
                    <span>Buy Request Details</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Request ID: #{editingBuyRequest.id} &bull; Received on {editingBuyRequest.created_date} {editingBuyRequest.created_time}</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingBuyRequest(null);
                    setBuyRequestNote('');
                    setExpectedAvailability('');
                    setExpectedDelivery('');
                  }}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors bg-transparent border-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Product Info & Image (md:col-span-5) */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Product Image */}
                    <div className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-center min-h-[220px]">
                      {(() => {
                        const prod = products.find(p => String(p.id) === String(editingBuyRequest.product_id));
                        const imgUrl = prod?.images?.[0] || '';
                        return imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt={editingBuyRequest.product_name} 
                            className="max-h-[200px] w-full object-contain rounded-xl"
                          />
                        ) : (
                          <div className="text-slate-350 dark:text-slate-650 flex flex-col items-center gap-2">
                            <ShoppingBag className="h-10 w-10" />
                            <span className="text-[10px]">No image available</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Product Specifications Card */}
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-105 dark:border-slate-855 p-4.5 rounded-2xl space-y-3 text-xs">
                      <h4 className="font-extrabold text-[#5B1E7A] dark:text-[#D4A75F] text-[11px] uppercase tracking-wider mb-1">Product Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Name</span>
                          <span className="font-bold text-slate-805 dark:text-slate-205 text-right max-w-[150px] truncate" title={editingBuyRequest.product_name}>{editingBuyRequest.product_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Product ID</span>
                          <span className="font-bold font-mono text-slate-808 dark:text-slate-202">#{editingBuyRequest.product_id}</span>
                        </div>
                        {(() => {
                          const prod = products.find(p => String(p.id) === String(editingBuyRequest.product_id));
                          if (!prod) return null;
                          
                          const getAttr = (key) => {
                            if (prod.variants && Array.isArray(prod.variants)) {
                              const v = prod.variants.find(x => (x.attribute_name || '').toLowerCase() === key.toLowerCase());
                              if (v && v.attribute_value) return v.attribute_value;
                            }
                            const specsText = prod.specifications_en || prod.specifications || '';
                            if (specsText) {
                              const lines = specsText.split('\n');
                              for (let line of lines) {
                                const idx = line.indexOf(':');
                                if (idx !== -1) {
                                  const k = line.slice(0, idx).trim().toLowerCase();
                                  const v = line.slice(idx + 1).trim();
                                  if (k === key.toLowerCase()) return v;
                                }
                              }
                            }
                            const n = (prod.name || '').toLowerCase();
                            const d = (prod.description || '').toLowerCase();
                            if (key.toLowerCase() === 'metal') {
                              if (n.includes('white gold') || d.includes('white gold')) return 'White Gold';
                              if (n.includes('rose gold') || d.includes('rose gold')) return 'Rose Gold';
                              if (n.includes('platinum') || d.includes('platinum')) return 'Platinum';
                              return 'Yellow Gold';
                            }
                            if (key.toLowerCase() === 'purity') {
                              if (n.includes('18k') || d.includes('18k')) return '18K';
                              if (n.includes('22k') || d.includes('22k')) return '22K';
                              if (n.includes('24k') || d.includes('24k')) return '24K';
                              return '22K';
                            }
                            if (key.toLowerCase() === 'gemstone') {
                              if (n.includes('diamond') || d.includes('diamond')) return 'Diamond';
                              if (n.includes('ruby') || d.includes('ruby')) return 'Ruby';
                              if (n.includes('emerald') || d.includes('emerald')) return 'Emerald';
                              if (n.includes('sapphire') || d.includes('sapphire')) return 'Sapphire';
                              if (n.includes('pearl') || d.includes('pearl')) return 'Pearl';
                              return 'None';
                            }
                            return 'N/A';
                          };

                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Category</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{prod.category || 'Jewellery'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Metal</span>
                                <span className="font-bold text-slate-805 dark:text-slate-205">{getAttr('metal')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Purity</span>
                                <span className="font-bold text-slate-805 dark:text-slate-205">{getAttr('purity')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Gemstone</span>
                                <span className="font-bold text-slate-805 dark:text-slate-205">{getAttr('gemstone')}</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-200/40 dark:border-slate-800 pt-2 mt-2">
                                <span className="text-slate-400">Current Stock</span>
                                <span className={`font-black ${prod.stock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{prod.stock} units</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Product Status</span>
                                <span className="font-bold capitalize text-slate-805 dark:text-slate-205">{prod.status || 'active'}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Customer Info, Request Info, Editable Inputs (md:col-span-7) */}
                  <div className="md:col-span-7 space-y-5">
                    {/* Customer Details Card */}
                    <div className="bg-slate-50 dark:bg-slate-955 border border-slate-105 dark:border-slate-850 p-4.5 rounded-2xl space-y-3 text-xs">
                      <h4 className="font-extrabold text-[#5B1E7A] dark:text-[#D4A75F] text-[11px] uppercase tracking-wider mb-1">Customer Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Name</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{editingBuyRequest.user_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Email</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{editingBuyRequest.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Mobile Number</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{editingBuyRequest.mobile || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">City & State</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{[editingBuyRequest.city, editingBuyRequest.state].filter(Boolean).join(', ') || 'N/A'}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 block mb-0.5">Full Address</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 break-words">{editingBuyRequest.address || 'No address specified.'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Request Details & Notes */}
                    <div className="bg-slate-50 dark:bg-slate-955 border border-slate-105 dark:border-slate-850 p-4.5 rounded-2xl space-y-3 text-xs">
                      <h4 className="font-extrabold text-[#5B1E7A] dark:text-[#D4A75F] text-[11px] uppercase tracking-wider mb-1">Request & Notes</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Requested Quantity</span>
                          <span className="font-black text-slate-800 dark:text-slate-200 text-sm">{editingBuyRequest.quantity} units</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Current Status</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{editingBuyRequest.status}</span>
                        </div>
                        {editingBuyRequest.selected_variant && (
                          <div className="col-span-2">
                            <span className="text-slate-400 block mb-0.5">Selected Variant</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[10px]">{(() => {
                              try {
                                const v = typeof editingBuyRequest.selected_variant === 'string' ? JSON.parse(editingBuyRequest.selected_variant) : editingBuyRequest.selected_variant;
                                return Object.entries(v).map(([k, val]) => `${k}: ${val}`).join(' | ');
                              } catch(e) {
                                return String(editingBuyRequest.selected_variant);
                              }
                            })()}</span>
                          </div>
                        )}
                        {editingBuyRequest.customer_notes && (
                          <div className="col-span-2 border-t border-slate-200/40 dark:border-slate-805 pt-2">
                            <span className="text-slate-455 block mb-0.5">Customer Message / Note</span>
                            <p className="text-slate-700 dark:text-slate-350 italic">{editingBuyRequest.customer_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expected Details / Inputs */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850 p-4.5 rounded-2xl space-y-3.5 text-xs">
                      <h4 className="font-extrabold text-[#5B1E7A] dark:text-[#D4A75F] text-[11px] uppercase tracking-wider mb-1">Expected Availability & Delivery</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block font-bold text-slate-500 mb-1">Expected Availability Date <span className="text-rose-500">*</span></label>
                          <input
                            type="date"
                            value={expectedAvailability}
                            min={getTodayDateString()}
                            onChange={(e) => setExpectedAvailability(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#5B1E7A] dark:focus:border-[#D4A75F] transition-all"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-500 mb-1">Expected Delivery Date <span className="text-rose-500">*</span></label>
                          <input
                            type="date"
                            value={expectedDelivery}
                            min={getTodayDateString()}
                            onChange={(e) => setExpectedDelivery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#5B1E7A] dark:focus:border-[#D4A75F] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Admin Notes / Customer Update message</label>
                        <textarea
                          rows="3"
                          placeholder="e.g. The design will be restocked by next week. We will notify you to proceed with payment."
                          value={buyRequestNote}
                          onChange={(e) => setBuyRequestNote(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-medium text-slate-855 dark:text-slate-200 outline-none focus:border-[#5B1E7A] dark:focus:border-[#D4A75F] transition-all resize-none"
                        />
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                {/* Left Side: Status Info */}
                <div className="text-[10px] text-slate-400 font-semibold">
                  {editingBuyRequest.status === 'Pending' ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-505 animate-ping"></span>
                      Awaiting confirmation
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span>✔</span> Processed (Status: {editingBuyRequest.status})
                    </span>
                  )}
                </div>

                {/* Right Side Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingBuyRequest(null);
                      setBuyRequestNote('');
                      setExpectedAvailability('');
                      setExpectedDelivery('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-855 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border-none cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOpenProceedConfirmation}
                    className="px-5 py-2.5 bg-[#5B1E7A] hover:bg-[#D4A75F] text-white font-bold rounded-xl text-xs border-none cursor-pointer transition-all shadow-md shadow-[#5B1E7A]/10"
                  >
                    Proceed
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in scale-in duration-200">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">Send confirmation to customer?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Would you like to send an automated confirmation email to the customer with these expected availability and delivery dates?
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer border-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProceedBuyRequest(editingBuyRequest.id, 'Send')}
                  className="flex-1 py-2.5 bg-[#5B1E7A] hover:bg-[#D4A75F] text-white font-bold rounded-xl text-xs cursor-pointer border-none shadow-md shadow-[#5B1E7A]/10 transition-all"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {buyRequests.length === 0 ? (
          <div className="text-center py-12 text-slate-550">
            <p className="text-sm">No user buy requests submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 pr-2">ID</th>
                  <th className="pb-3 pr-2">User Details</th>
                  <th className="pb-3 pr-2">Product Details</th>
                  <th className="pb-3 pr-2">Qty & Specs</th>
                  <th className="pb-3 pr-2">Date</th>
                  <th className="pb-3 pr-2">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buyRequests.map((req) => {
                  let variantStr = 'N/A';
                  if (req.selected_variant) {
                    try {
                      const vObj = typeof req.selected_variant === 'string' ? JSON.parse(req.selected_variant) : req.selected_variant;
                      variantStr = Object.entries(vObj).map(([k, v]) => `${k}: ${v}`).join(' | ');
                    } catch (e) {
                      variantStr = String(req.selected_variant);
                    }
                  }

                  return (
                    <tr key={req.id} className="border-b border-slate-100 dark:border-slate-855 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 pr-2 font-mono font-bold">#{req.id}</td>
                      <td className="py-3.5 pr-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{req.user_name || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400">{req.email}</p>
                        <p className="text-[10px] text-slate-400">{req.mobile || 'No Mobile'}</p>
                        {req.city && (
                          <p className="text-[10px] text-emerald-600 mt-0.5 secondary-text">City: {req.city}</p>
                        )}
                      </td>
                      <td className="py-3.5 pr-2 max-w-[200px] truncate">
                        <p className="font-bold text-slate-805 dark:text-slate-200 truncate" title={req.product_name}>{req.product_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">PID: #{req.product_id}</p>
                      </td>
                      <td className="py-3.5 pr-2">
                        <p className="font-bold text-slate-805 dark:text-slate-200">Qty: {req.quantity}</p>
                        <p className="text-[10px] text-slate-450 truncate" title={variantStr}>{variantStr}</p>
                      </td>
                      <td className="py-3.5 pr-2 text-slate-500">
                        <p>{req.created_date}</p>
                        <p className="text-[10px]">{req.created_time}</p>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm whitespace-nowrap ${
                          (req.status || '').toLowerCase() === 'pending'
                            ? 'bg-[#F59E0B] text-white border-[#D97706]'
                            : (req.status || '').toLowerCase() === 'approved' || (req.status || '').toLowerCase() === 'available'
                            ? 'bg-[#22C55E] text-white border-[#16A34A]'
                            : (req.status || '').toLowerCase() === 'rejected'
                            ? 'bg-[#EF4444] text-white border-[#DC2626]'
                            : (req.status || '').toLowerCase() === 'confirmed' || (req.status || '').toLowerCase() === 'order preparation'
                            ? 'bg-[#3B82F6] text-white border-[#2563EB]'
                            : 'bg-[#6B7280] text-white border-[#4B5563]'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => {
                            setEditingBuyRequest(req);
                            setBuyRequestNote(req.admin_note || '');
                            setExpectedAvailability(req.expected_availability_date || '');
                            setExpectedDelivery(req.expected_delivery_date || '');
                          }}
                          className="px-3 py-1.5 bg-[#5B1E7A] hover:bg-[#D4A75F] text-white font-bold rounded-lg border-none cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1.5 inline-flex"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return null;
};
