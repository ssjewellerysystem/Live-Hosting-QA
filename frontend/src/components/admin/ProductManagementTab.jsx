import React, { useState } from 'react';
import { Edit2, Package, ShoppingBag, BarChart3, Trash2, X, RefreshCw, Plus } from 'lucide-react';

export const ProductManagementTab = ({
  products,
  formatPrice,
  setEditingProduct,
  setEditProductImages,
  initEditImages,
  setIsEditImagesOpen,
  handleOpenStockModal,
  handleOpenOrdersModal,
  handleOpenAnalyticsModal,
  handleDeleteProduct,
  setIsAddModalOpen,
  setIsAddImagesOpen
}) => {
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      if (handleDeleteProduct) {
        await handleDeleteProduct(productToDelete._id || productToDelete.id);
      }
      setProductToDelete(null);
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product. Please try again.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-5 sm:mb-6 gap-3">
        <div className="flex flex-col items-start min-w-0">
          <h3 className="text-sm sm:text-base font-extrabold whitespace-nowrap text-slate-800 dark:text-slate-100">
            Catalog Products
          </h3>
          <span className="mt-1 px-2.5 py-0.5 text-[10px] sm:text-xs bg-[#D4A75F] text-[#111827] rounded-full font-bold shadow-sm inline-block">
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </span>
        </div>
        {setIsAddModalOpen && (
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              if (setIsAddImagesOpen) setIsAddImagesOpen(false);
            }}
            className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] sm:text-xs font-bold shadow flex items-center justify-center gap-1 sm:gap-1.5 transition-all flex-shrink-0 min-h-[40px] active:scale-95"
          >
            <Plus className="h-3.5 sm:h-4 w-3.5 sm:w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Add Product</span>
          </button>
        )}
      </div>
        
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {products.map(p => {
          const discountedPrice = Math.round(p.price - (p.price * (p.discount / 100)));
          
          // Audit date formatting helper
          const formatAudit = (dateStr) => {
            if (!dateStr) return "N/A";
            try {
              const d = new Date(dateStr);
              return d.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
            } catch(e) {
              return dateStr;
            }
          };

          return (
            <div key={p._id || p.id} className="w-full border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative h-auto">
              <div>
                {/* Delete Product Button - Fixed at Top Right Corner */}
                <button
                  type="button"
                  onClick={() => setProductToDelete(p)}
                  title="Delete Product"
                  className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-md shadow-red-500/20 hover:scale-105 transition-all duration-200 cursor-pointer flex-shrink-0 z-30"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>

                {/* Header Row: Image, Category & Title */}
                <div className="flex items-start gap-3 pr-10 mb-3.5">
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">{p.category}</span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 break-words line-clamp-2" title={p.name}>{p.name}</h4>
                  </div>
                </div>

                {/* Price / Discount History */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800/80 p-3 rounded-xl text-xs space-y-1 mb-3.5 w-full">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-slate-400 font-medium flex-shrink-0">Pricing:</span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {p.discount > 0 ? (
                        <>
                          <span className="text-slate-455 dark:text-slate-505 line-through price-amount text-xs">₹{formatPrice(p.price)}</span>
                          <span className="text-slate-400">↓</span>
                          <span className="text-slate-900 dark:text-slate-100 font-extrabold text-sm price-amount">₹{formatPrice(discountedPrice)}</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-955/40 dark:text-rose-455 rounded whitespace-nowrap">{p.discount}% OFF</span>
                        </>
                      ) : (
                        <span className="text-slate-900 dark:text-slate-100 font-extrabold text-sm price-amount">₹{formatPrice(p.price)}</span>
                      )}
                    </div>
                  </div>
                  {p.discount > 0 && p.discount_applied_at && (
                    <div className="text-[9px] text-slate-400 flex justify-between border-t border-slate-100 dark:border-slate-850/50 pt-1.5 mt-1.5">
                      <span>Applied On:</span>
                      <span className="font-semibold">{formatAudit(p.discount_applied_at)}</span>
                    </div>
                  )}
                </div>

                {/* Stock Display */}
                <div className="flex justify-between items-center mb-3.5 w-full">
                  <span className="text-xs text-slate-400 font-medium">Stock Status:</span>
                  <span className={`stock-badge-container ${
                    p.stock === 0 
                      ? 'stock-badge-out-of-stock' 
                      : p.stock < 10 
                        ? 'stock-badge-low-stock' 
                        : 'stock-badge-in-stock'
                  }`}>
                    {p.stock === 0 ? "Out Of Stock" : p.stock < 10 ? `Low Stock: ${p.stock} Units` : `Stock: ${p.stock} Units`}
                  </span>
                </div>

                {/* Audit Logs */}
                <div className="border-t border-slate-100 dark:border-slate-855/60 pt-3 pb-2 text-[10px] text-slate-400 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>Created:</span>
                    <span className="font-semibold text-slate-550 dark:text-slate-455">{formatAudit(p.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Modified:</span>
                    <span className="font-semibold text-slate-550 dark:text-slate-455">{formatAudit(p.updated_at || p.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-850/60">
                <button
                  onClick={() => {
                    setEditingProduct({ ...p, image_url: p.images?.[0] || '' });
                    setEditProductImages(initEditImages(p));
                    setIsEditImagesOpen(false);
                  }}
                  className="py-2 px-2 text-[10px] sm:text-[11px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Edit2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">Edit</span>
                </button>
                <button
                  onClick={() => handleOpenStockModal(p)}
                  className="py-2 px-2 text-[10px] sm:text-[11px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-455 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Package className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">Stock</span>
                </button>
                <button
                  onClick={() => handleOpenOrdersModal(p)}
                  className="py-2 px-2 text-[10px] sm:text-[11px] font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-650 dark:text-purple-400 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <ShoppingBag className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">Orders</span>
                </button>
                <button
                  onClick={() => handleOpenAnalyticsModal(p)}
                  className="py-2 px-2 text-[10px] sm:text-[11px] font-bold border border-[#D4A75F]/35 dark:border-[#D4A75F] bg-[#D4A75F]/8 dark:bg-[rgba(212,167,95,0.12)] text-[#9A7232] dark:text-[#D4A75F] hover:bg-[#D4A75F] hover:text-white dark:hover:bg-[#D4A75F] dark:hover:text-white dark:hover:border-transparent hover:translate-y-[-2px] shadow-[0_4px_12px_rgba(212,167,95,0.08)] dark:shadow-[0_4px_12px_rgba(212,167,95,0.20)] rounded-xl transition-all duration-[250ms] ease-in-out text-center flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <BarChart3 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">Sales</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DELETE PRODUCT CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setProductToDelete(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Product?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Are you sure you want to permanently delete this product?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 flex items-center gap-3">
              <img
                src={productToDelete.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                alt={productToDelete.name}
                className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{productToDelete.name}</h4>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{productToDelete.category}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isDeletingProduct ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
