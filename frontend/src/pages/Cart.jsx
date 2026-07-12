import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, ShieldCheck } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { useTranslation } from '../hooks/useTranslation';
import { formatPrice } from '../utils/priceFormatter';
import { LuxuryImage } from '../components/LuxuryImage';

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartCount, cartTotal } = useContext(CartContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Simulated delivery charge logic
  const shippingFee = cartTotal > 1000 || cartTotal === 0 ? 0 : 79;
  const gstTax = Math.round(cartTotal * 0.05); // 5% GST
  const grandTotal = Math.round(cartTotal + shippingFee + gstTax);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 min-h-screen pb-16 font-sans">
      <div className="max-w-[97%] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8">
          {t('cart_page.shopping_cart')} ({cartCount} {cartCount === 1 ? t('cart_page.item') : t('cart_page.items')})
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl max-w-xl mx-auto shadow-sm p-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingCart className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold mt-6 text-slate-850 dark:text-slate-105">{t('cart_page.empty_title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-md mx-auto">
              {t('cart_page.empty_desc')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 mt-8 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('cart_page.back_shopping')}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cart List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const finalItemPrice = Math.round(item.price - (item.price * (item.discount / 100)));
                return (
                  <div
                    key={item.product_id}
                    className="flex flex-col sm:flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Item Image */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex-shrink-0">
                      <LuxuryImage src={item.image} alt={item.name} className="w-full h-full object-cover" fetchpriority="low" width="96" height="96" />
                    </div>

                    {/* Specifications */}
                    <div className="flex-grow text-center sm:text-left">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 price-amount">
                          ₹{formatPrice(finalItemPrice)}
                        </span>
                        {item.discount > 0 && (
                           <span className="text-xs text-slate-400 line-through price-amount">
                            ₹{formatPrice(item.price)}
                          </span>
                        )}
                        {item.discount > 0 && (
                          <span className="text-[10px] text-red-500 font-bold bg-red-100 dark:bg-red-950/20 px-1.5 py-0.5 rounded">
                            {item.discount}% {t('product_card.off')}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-405 mt-1">
                        {item.stock > 0 ? t('common.in_stock') : t('common.out_of_stock')}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center bg-slate-50 dark:bg-slate-850 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="p-1 hover:text-emerald-500 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-3 text-sm font-bold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1 hover:text-emerald-500 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/30 rounded-xl transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}

              {/* Back to Shopping button */}
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-sm font-bold text-emerald-500 hover:underline pt-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('cart_page.continue_shopping')}</span>
              </Link>
            </div>

            {/* Price Summary Card */}
            <div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3">
                  {t('cart_page.price_details')}
                </h3>
                
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>{t('cart_page.subtotal')}</span>
                    <span className="font-semibold text-slate-850 dark:text-slate-100 price-amount">₹{formatPrice(Math.round(cartTotal))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('cart_page.gst')}</span>
                    <span className="font-semibold text-slate-850 dark:text-slate-100 price-amount">₹{formatPrice(gstTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('cart_page.delivery_charges')}</span>
                    <span className={`font-semibold ${shippingFee === 0 ? 'text-emerald-500' : 'text-slate-850 dark:text-slate-100'}`}>
                      {shippingFee === 0 ? t('cart_page.free') : <span className="price-amount">₹{formatPrice(shippingFee)}</span>}
                    </span>
                  </div>
                </div>

                {shippingFee > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl text-[11px] font-bold">
                    {t('cart_page.unlock_free', { amount: formatPrice(Math.round(1000 - cartTotal)) })}
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-805 pt-4 flex justify-between items-baseline">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-base">{t('cart_page.total_amount')}</span>
                  <span className="font-black text-2xl text-slate-900 dark:text-slate-50 price-amount">₹{formatPrice(grandTotal)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all"
                >
                  {t('cart_page.proceed_checkout')}
                </button>

                <div className="flex justify-center items-center gap-1.5 text-[11px] text-slate-405">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>{t('cart_page.secure_checkout')}</span>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
