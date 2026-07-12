import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, Calendar, MapPin, Truck, ChevronDown, ChevronUp, AlertCircle, 
  ShoppingBag, FileText, Heart, Bookmark, User, Key, Bell, RotateCcw, 
  CheckCircle, ArrowRight, ShieldAlert, Check, XCircle
} from 'lucide-react';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useTranslation } from '../hooks/useTranslation';
import { formatPrice } from '../utils/priceFormatter';
import { LuxuryImage } from '../components/LuxuryImage';

const formatTimestamp = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
};

export const MyOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useContext(AuthContext);
  const { 
    wishlist, removeFromWishlist, addToCart,
    savedForLater, moveToCartItem, removeFromSavedForLater 
  } = useContext(CartContext);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=orders');
    }
  }, [user, navigate]);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wishlist' | 'saved' | 'buy-requests'

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'profile') {
      navigate('/profile');
    } else if (tab && ['orders', 'wishlist', 'saved', 'buy-requests'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search, navigate]);
  
  // Orders states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [trackingOrder, setTrackingOrder] = useState(null); // Holds order object being tracked
  const [returnOrder, setReturnOrder] = useState(null); // Holds order object for return submission
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnMessage, setReturnMessage] = useState('');

  // Buy Requests states
  const [buyRequests, setBuyRequests] = useState([]);
  const [buyRequestsLoading, setBuyRequestsLoading] = useState(false);
  const [buyRequestsError, setBuyRequestsError] = useState('');

  // Fetch orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      const sorted = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sorted);
    } catch (err) {
      console.error(err);
      setOrdersError(t('my_orders.failed_fetch_orders'));
    } finally {
      setOrdersLoading(false);
    }
  };



  // Fetch buy requests
  const fetchBuyRequests = async () => {
    if (!token) return;
    setBuyRequestsLoading(true);
    setBuyRequestsError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/auth/buy-requests`, config);
      setBuyRequests(response.data);
    } catch (err) {
      console.error(err);
      setBuyRequestsError("Failed to fetch buy requests.");
    } finally {
      setBuyRequestsLoading(false);
    }
  };

  const handleRespondBuyRequest = async (reqId, action) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/buy-requests/${reqId}/respond`, { action }, config);
      if (response.data.success) {
        if (action === 'Confirm') {
          navigate(`/checkout?buy_request_id=${reqId}`);
        } else {
          alert(response.data.message || "Response updated successfully.");
          fetchBuyRequests();
        }
      } else {
        alert(response.data.message || "Failed to update response.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Failed to submit response.");
    }
  };

  const handleBuyRequestCheckout = async (buyRequest) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${buyRequest.product_id}`);
      const product = response.data;
      if (product) {
        addToCart(product, buyRequest.quantity);
        navigate('/cart');
      } else {
        alert("Product not found.");
      }
    } catch (err) {
      console.error("Error preparing checkout for buy request:", err);
      alert("Failed to fetch product details for checkout.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchBuyRequests();
    }
  }, [user, token]);

  // Toggle order details expansion
  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Handle return request submission
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnReason.trim()) return;
    setReturnLoading(true);
    setReturnMessage('');
    try {
      await axios.post(`${API_BASE_URL}/orders/${returnOrder._id}/return`, { reason: returnReason });
      setReturnMessage("Return request submitted successfully!");
      setReturnReason('');
      fetchOrders(); // Refresh order details to update status
      setTimeout(() => {
        setReturnOrder(null);
        setReturnMessage('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setReturnMessage(err.response?.data?.message || "Failed to submit return request.");
    } finally {
      setReturnLoading(false);
    }
  };





  // Status Styling Helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return 'text-[#D4A75F] bg-[#D4A75F]/10 dark:text-[#D4A75F] dark:bg-[#D4A75F]/30 border-[#D4A75F]/20 dark:border-[#D4A75F]/45';
      case 'Out for Delivery':
        return 'text-sky-600 bg-sky-100 dark:text-sky-400 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900';
      case 'Shipped':
      case 'Dispatched':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900';
      case 'Packed':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900';
      case 'Confirmed':
        return 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900';
      case 'Cancelled':
        return 'text-red-650 bg-red-100 dark:text-red-400 dark:bg-red-950/30 border-red-200 dark:border-red-900';
      case 'Pending':
      default:
        return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900';
    }
  };

  // Download Invoice PDF layout simulation
  const handleDownloadInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker enabled. Please allow pop-ups to view invoice.');
      return;
    }
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 13px;">${item.name}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">₹${formatPrice(item.price)}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; font-weight: bold;">₹${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Invoice - ${order.order_id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3F1D5A; padding-bottom: 20px; }
            .details { display: flex; justify-content: space-between; margin: 30px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f8fafc; padding: 12px 10px; border-bottom: 2px solid #cbd5e1; }
            .totals { font-size: 18px; font-weight: bold; color: #3F1D5A; border-top: 2px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <h1 style="color: #3F1D5A; margin: 0;">SSJewellery Invoice</h1>
                <p>Order Reference: ${order.order_id}</p>
              </div>
              <div style="text-align: right;">
                <p><strong>SSJewellery Ltd.</strong></p>
                <p>support@SSJewellery.com</p>
              </div>
            </div>
            <div class="details">
              <div>
                <h4>Shipping Address</h4>
                <p><strong>${order.shipping_address.name}</strong></p>
                <p>${order.shipping_address.address}</p>
                <p>${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}</p>
                <p>Phone: ${order.shipping_address.phone}</p>
                ${order.shipping_address.alternate_mobile_number ? `<p>Alt Phone: ${order.shipping_address.alternate_mobile_number}</p>` : ''}
              </div>
              <div style="text-align: right;">
                <h4>Invoice Info</h4>
                <p>Date: ${formatTimestamp(order.created_at)}</p>
                <p>Status: ${order.status}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="totals">
              <div>Payment Mode: COD</div>
              <div>Amount Due: ₹${formatPrice(order.total_amount)}</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getTimelineSteps = (status) => {
    const list = ["Pending", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"];
    const statusIndex = list.indexOf(status);
    return list.map((step, idx) => {
      return {
        name: step,
        completed: statusIndex >= idx && status !== "Cancelled",
        active: statusIndex === idx && status !== "Cancelled"
      };
    });
  };



  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen font-sans pb-12 transition-colors duration-300">
      <div className="max-w-[97%] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Profile Summary Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-32 w-32 bg-[#D4A75F]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center space-x-4">
            <div className="bg-[#D4A75F]/10 text-[#D4A75F] dark:text-[#D4A75F] p-4 rounded-2xl border border-[#D4A75F]/20">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {t('my_orders.namaste_shopper', { name: user?.name || 'Shopper' })}
              </h1>
              <p className="text-xs text-slate-450">
                {user?.mobile} • {t('my_orders.registered_member')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-4 md:mt-0">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('my_orders.total_orders')}</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{orders.length}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('my_orders.wishlist_items')}</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{wishlist.length}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('my_orders.saved_items')}</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{savedForLater.length}</p>
            </div>
          </div>
        </div>

        {/* Outer Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* TAB SIDEBAR */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#D4A75F] text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50'
              }`}
            >
              <Package className="h-4.5 w-4.5" />
              <span>{t('my_orders.my_orders_status')}</span>
            </button>

            <button
              onClick={() => setActiveTab('buy-requests')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'buy-requests'
                  ? 'bg-[#D4A75F] text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShoppingBag className="h-4.5 w-4.5" />
                <span>{t('my_orders.buy_requests')}</span>
              </div>
              {buyRequests.filter(r => r.status === 'Approved' || r.status === 'Available').length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full animate-bounce">
                  {buyRequests.filter(r => r.status === 'Approved' || r.status === 'Available').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'wishlist'
                  ? 'bg-[#D4A75F] text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Heart className="h-4.5 w-4.5" />
                <span>{t('my_orders.my_wishlist')}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'wishlist' ? 'bg-[#D4A75F] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {wishlist.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'saved'
                  ? 'bg-[#D4A75F] text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Bookmark className="h-4.5 w-4.5" />
                <span>{t('my_orders.saved_for_later')}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'saved' ? 'bg-[#D4A75F] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {savedForLater.length}
              </span>
            </button>




          </div>

          {/* MAIN WORKSPACE PANEL */}
          <div className="lg:col-span-3">

            {/* TAB: MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{t('my_orders.order_history')}</h3>
                
                {ordersLoading && (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800/40">
                          <div className="space-y-2">
                            <div className="skeleton-premium h-3 w-28 rounded" />
                            <div className="skeleton-premium h-4 w-36 rounded" />
                          </div>
                          <div className="skeleton-premium h-6 w-20 rounded-full" />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="skeleton-premium h-16 w-16 rounded-xl flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="skeleton-premium h-4 w-1/2 rounded" />
                            <div className="skeleton-premium h-3 w-1/4 rounded" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="skeleton-premium h-5 w-24 rounded" />
                          <div className="skeleton-premium h-8 w-20 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {ordersError && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-6 rounded-2xl text-center">
                    <p className="text-red-500 font-bold">{ordersError}</p>
                    <button onClick={fetchOrders} className="mt-3 px-4 py-2 bg-[#3F1D5A] text-white rounded-xl text-xs font-bold">{language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</button>
                  </div>
                )}

                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8">
                    <Package className="h-12 w-12 text-slate-300 mx-auto" />
                    <h4 className="text-base font-bold mt-4">{t('my_orders.no_orders_found')}</h4>
                    <p className="text-xs text-slate-450 mt-1">{t('my_orders.check_back_purchase')}</p>
                    <button onClick={() => navigate('/')} className="mt-5 px-5 py-2 bg-[#3F1D5A] text-white rounded-xl text-xs font-bold shadow-sm">{t('my_orders.shop_catalog')}</button>
                  </div>
                )}

                {!ordersLoading && !ordersError && orders.length > 0 && (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const isExpanded = !!expandedOrders[order._id];
                      return (
                        <div key={order._id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* Order card heading */}
                          <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-850">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-bold text-slate-400">{language === 'hi' ? 'आईडी:' : 'ID:'}</span>
                                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border dark:border-slate-800">
                                  {order.order_id}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {t('my_orders.placed_on')} {formatTimestamp(order.created_at)}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="text-right sm:mr-4">
                                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{t('my_orders.subtotal')}</p>
                                 <p className="text-sm font-extrabold text-slate-855 dark:text-white price-amount">₹{formatPrice(order.total_amount)}</p>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(order.status)}`}>
                                {t(`my_orders.status.${order.status}`)}
                              </span>
                            </div>
                          </div>

                          {/* Quick details */}
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex -space-x-3 overflow-hidden py-1">
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="h-9 w-9 rounded-lg overflow-hidden border border-white dark:border-slate-900 bg-slate-50">
                                    <LuxuryImage src={item.image} alt="" className="h-full w-full object-cover" />
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    +{order.items.length - 3}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate max-w-xs pl-2">
                                {order.items.map(item => item.name).join(', ')}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setTrackingOrder(order)}
                                className="px-3 py-1.5 bg-[#D4A75F]/10 dark:bg-[#D4A75F]/20 text-[#D4A75F] dark:text-[#D4A75F] border border-[#D4A75F]/10 dark:border-[#D4A75F]/45 text-xs font-bold rounded-xl hover:bg-[#D4A75F]/20 transition-colors"
                              >
                                {t('my_orders.live_track')}
                              </button>
                              <button
                                onClick={() => toggleExpand(order._id)}
                                className="p-1.5 text-slate-400 hover:text-[#D4A75F] rounded-xl"
                              >
                                {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="p-4 bg-slate-50/40 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-850 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-850 text-xs">
                                <div>
                                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">{t('my_orders.billed_shipping')}</p>
                                  <div className="text-slate-655 dark:text-slate-350">
                                    <p className="font-bold text-slate-800 dark:text-white">{order.shipping_address?.name}</p>
                                    <p>{order.shipping_address?.address}</p>
                                    <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
                                    <p className="mt-1">{language === 'hi' ? 'फोन' : 'Phone'}: {order.shipping_address?.phone}</p>
                                    {order.shipping_address?.alternate_mobile_number && (
                                      <p className="mt-0.5">{language === 'hi' ? 'वैकल्पिक फोन' : 'Alt Phone'}: {order.shipping_address.alternate_mobile_number}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="sm:text-right">
                                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">{t('my_orders.invoice_returns')}</p>
                                  <div className="flex flex-col items-start sm:items-end space-y-2 mt-1">
                                    <button 
                                      onClick={() => handleDownloadInvoice(order)}
                                      className="inline-flex items-center space-x-1.5 text-[#D4A75F] hover:underline font-bold"
                                    >
                                      <FileText className="h-4 w-4" />
                                      <span>{t('my_orders.download_invoice')}</span>
                                    </button>

                                    {/* Return policy checks */}
                                    {order.status === 'Delivered' && (
                                      <>
                                        {!order.return_request ? (
                                          <button
                                            onClick={() => setReturnOrder(order)}
                                            className="inline-flex items-center space-x-1.5 text-amber-600 hover:underline font-bold"
                                          >
                                            <RotateCcw className="h-4 w-4" />
                                            <span>{t('my_orders.request_return_refund')}</span>
                                          </button>
                                        ) : (
                                          <div className="text-left sm:text-right">
                                            <p className="text-[10px] font-bold text-slate-400">{t('my_orders.return_request_status')}</p>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black mt-1 ${
                                              order.return_request.status === 'Approved' ? 'bg-[#D4A75F]/10 text-[#D4A75F]' :
                                              order.return_request.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                              'bg-amber-100 text-amber-700'
                                            }`}>
                                              {order.return_request.status === 'Pending' ? (language === 'hi' ? 'लंबित' : 'Pending') :
                                               order.return_request.status === 'Approved' ? (language === 'hi' ? 'स्वीकृत' : 'Approved') :
                                               order.return_request.status === 'Rejected' ? (language === 'hi' ? 'अस्वीकृत' : 'Rejected') :
                                               order.return_request.status}
                                            </span>
                                            {order.return_request.admin_comments && (
                                              <p className="text-[10px] italic text-slate-500 mt-1">" {order.return_request.admin_comments} "</p>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">{t('my_orders.items_list')}</p>
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 border border-slate-100 dark:border-slate-855 rounded-xl bg-white dark:bg-slate-900 text-xs">
                                    <div className="flex items-center space-x-3 min-w-0">
                                      <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-slate-950">
                                        <LuxuryImage src={item.image} alt="" className="h-full w-full object-cover" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-400">{t('my_orders.qty')}: {item.quantity} • {t('my_orders.rate')}: <span className="price-amount">₹{formatPrice(item.price)}</span></p>
                                      </div>
                                    </div>
                                    <span className="font-extrabold text-slate-900 dark:text-white price-amount">₹{formatPrice(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: BUY REQUESTS */}
            {activeTab === 'buy-requests' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('my_orders.buy_requests')}</h3>
                    <p className="text-xs text-slate-500">{language === 'hi' ? 'अपनी आउट-ऑफ-स्टॉक उत्पाद खरीद अनुरोधों को ट्रैक और प्रबंधित करें' : 'Track and manage your out-of-stock product buy requests'}</p>
                  </div>
                  <button 
                    onClick={fetchBuyRequests}
                    disabled={buyRequestsLoading}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                  >
                    {language === 'hi' ? 'ताज़ा करें' : 'Refresh'}
                  </button>
                </div>

                {buyRequestsLoading && buyRequests.length === 0 ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800/40">
                          <div className="space-y-2">
                            <div className="skeleton-premium h-3.5 w-24 rounded" />
                            <div className="skeleton-premium h-4 w-40 rounded" />
                          </div>
                          <div className="skeleton-premium h-6 w-16 rounded-full" />
                        </div>
                        <div className="space-y-2">
                          <div className="skeleton-premium h-3 w-1/2 rounded" />
                          <div className="skeleton-premium h-3.5 w-1/3 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : buyRequests.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{language === 'hi' ? 'कोई खरीद अनुरोध नहीं' : 'No Buy Requests'}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto text-center">
                      {language === 'hi' ? 'जब कोई उत्पाद आउट ऑफ स्टॉक हो, तो अनुरोध सबमिट करने के लिए उसके विवरण पृष्ठ पर "खरीदने का अनुरोध करें" पर क्लिक करें।' : 'When a product is out of stock, click "Request To Buy" on its details page to submit a request.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {buyRequests.map((req) => {
                      const isApproved = req.status === 'Approved';
                      const isAvailable = req.status === 'Available';
                      const hasDetails = ['Approved', 'Confirmed', 'Order Preparation', 'Available', 'Awaiting Payment', 'Converted To Order'].includes(req.status);
                      
                      // Status Badge configuration
                      let badgeClass = '';
                      let statusText = req.status;
                      if (req.status === 'Pending') {
                        badgeClass = 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30';
                        statusText = language === 'hi' ? 'लंबित' : 'Pending';
                      } else if (req.status === 'Approved') {
                        badgeClass = 'bg-[#D4A75F]/10 text-[#D4A75F] border-[#D4A75F]/20 dark:bg-[#D4A75F]/20 dark:text-[#D4A75F] dark:border-[#D4A75F]/45/30 animate-pulse';
                        statusText = language === 'hi' ? 'स्वीकृत - पुष्टि आवश्यक' : 'Approved - Confirmation Required';
                      } else if (req.status === 'Awaiting Payment') {
                        badgeClass = 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30 animate-pulse';
                        statusText = language === 'hi' ? 'भुगतान लंबित' : 'Payment Pending';
                      } else if (req.status === 'Converted To Order') {
                        badgeClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
                        statusText = language === 'hi' ? 'ऑर्डर में परिवर्तित ✔' : 'Converted To Order ✔';
                      } else if (req.status === 'Rejected') {
                        badgeClass = 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
                        statusText = language === 'hi' ? 'अस्वीकृत' : 'Rejected';
                      } else if (req.status === 'Confirmed') {
                        badgeClass = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30';
                        statusText = language === 'hi' ? 'उत्पाद की प्रतीक्षा' : 'Waiting for Product';
                      } else if (req.status === 'Order Preparation') {
                        badgeClass = 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-405 dark:border-indigo-900/30';
                        statusText = language === 'hi' ? 'ऑर्डर की तैयारी...' : 'Order Preparation...';
                      } else if (req.status === 'Available') {
                        badgeClass = 'bg-[#3F1D5A] text-white border-[#D4A75F] dark:bg-[#D4A75F] dark:border-[#D4A75F]/80 animate-pulse';
                        statusText = language === 'hi' ? 'खरीद के लिए उपलब्ध!' : 'Available for Purchase!';
                      } else if (req.status === 'Purchased') {
                        badgeClass = 'bg-slate-100 text-slate-700 border-slate-205 dark:bg-slate-800 dark:text-slate-405 dark:border-slate-700';
                        statusText = language === 'hi' ? 'खरीदा गया ✔' : 'Purchased ✔';
                      } else {
                        badgeClass = 'bg-slate-105 text-slate-750 border-slate-205 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-750';
                      }

                      // Parse selected variant details
                      let variantStr = '';
                      if (req.selected_variant) {
                        try {
                          const vObj = typeof req.selected_variant === 'string' ? JSON.parse(req.selected_variant) : req.selected_variant;
                          variantStr = Object.entries(vObj).map(([k, v]) => `${k}: ${v}`).join(' | ');
                        } catch (e) {
                          variantStr = String(req.selected_variant);
                        }
                      }

                      return (
                        <div 
                          key={req.id} 
                          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 text-left"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/50">
                            <div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">{language === 'hi' ? 'अनुरोध' : 'REQUEST'} #{req.id}</span>
                              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-105 mt-0.5">{req.product_name}</h4>
                              {req.status === 'Confirmed' && (
                                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold mt-1 flex items-center gap-1">
                                  <span>✔</span> {language === 'hi' ? 'एडमिन द्वारा पुष्टि की गई' : 'Confirmed by Admin'}
                                </div>
                              )}
                            </div>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border whitespace-nowrap ${badgeClass}`}>
                              {statusText}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-slate-400 block mb-0.5">{language === 'hi' ? 'अनुरोधित मात्रा' : 'Quantity Requested'}</span>
                              <span className="font-bold text-slate-805 dark:text-slate-200">{req.quantity} {language === 'hi' ? 'यूनिट' : 'units'}</span>
                            </div>
                            {req.city && (
                              <div>
                                <span className="text-slate-400 block mb-0.5">{language === 'hi' ? 'स्थान' : 'Location'}</span>
                                <span className="font-bold text-slate-805 dark:text-slate-200 secondary-text">{req.city}</span>
                              </div>
                            )}
                            {variantStr && (
                              <div className="col-span-2">
                                <span className="text-slate-400 block mb-0.5">{language === 'hi' ? 'विशेष विवरण' : 'Specifications'}</span>
                                <span className="font-bold text-slate-805 dark:text-slate-200">{variantStr}</span>
                              </div>
                            )}
                          </div>

                          {/* Approval Details */}
                          {hasDetails && (
                            <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-xl border border-slate-100 dark:border-slate-900 space-y-2 text-xs">
                              {req.expected_delivery_date && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{language === 'hi' ? 'अपेक्षित डिलीवरी तिथि' : 'Expected Delivery Date'}</span>
                                  <span className="font-bold text-slate-805 dark:text-slate-205">{req.expected_delivery_date}</span>
                                </div>
                              )}
                              {req.expected_availability_date && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{language === 'hi' ? 'अपेक्षित उपलब्धता तिथि' : 'Expected Availability Date'}</span>
                                  <span className="font-bold text-slate-805 dark:text-slate-205">{req.expected_availability_date}</span>
                                </div>
                              )}
                              {req.admin_note && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-900/60 mt-1">
                                  <span className="text-slate-400 block mb-0.5">{language === 'hi' ? 'एडमिन संदेश' : 'Admin Message'}</span>
                                  <p className="text-slate-700 dark:text-slate-300 italic font-medium">{req.admin_note}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                            <span className="text-[10px] text-slate-400 font-medium">{language === 'hi' ? 'सबमिट किया गया' : 'Submitted on'} {req.created_date} {language === 'hi' ? 'को' : 'at'} {req.created_time}</span>
                            
                            {/* Action Buttons */}
                            {isApproved && (
                              <div className="flex gap-2.5 w-full sm:w-auto">
                                <button
                                  onClick={() => handleRespondBuyRequest(req.id, 'Cancel')}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border-none cursor-pointer transition-colors"
                                >
                                  {language === 'hi' ? 'अनुरोध रद्द करें' : 'Cancel Request'}
                                </button>
                                <button
                                  onClick={() => handleRespondBuyRequest(req.id, 'Confirm')}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-[#3F1D5A] hover:bg-[#D4A75F] text-white font-bold rounded-xl text-xs border-none cursor-pointer shadow-md shadow-[#D4A75F]/10 transition-colors"
                                >
                                  {language === 'hi' ? 'ऑर्डर की पुष्टि करें' : 'Confirm Order'}
                                </button>
                              </div>
                            )}

                            {req.status === 'Awaiting Payment' && (
                              <div className="flex gap-2.5 w-full sm:w-auto">
                                <button
                                  onClick={() => handleRespondBuyRequest(req.id, 'Cancel')}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border-none cursor-pointer transition-colors"
                                >
                                  {language === 'hi' ? 'अनुरोध रद्द करें' : 'Cancel Request'}
                                </button>
                                <button
                                  onClick={() => navigate(`/checkout?buy_request_id=${req.id}`)}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-[#3F1D5A] hover:bg-[#D4A75F] text-white font-bold rounded-xl text-xs border-none cursor-pointer shadow-md shadow-[#D4A75F]/10 transition-colors animate-pulse"
                                >
                                  {language === 'hi' ? 'भुगतान करें' : 'Pay Now'}
                                </button>
                              </div>
                            )}

                            {req.status === 'Converted To Order' && req.converted_order_id && (
                              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                <span>{language === 'hi' ? 'ऑर्डर आईडी:' : 'Order ID:'} </span>
                                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                  {req.converted_order_id}
                                </span>
                              </div>
                            )}

                            {isAvailable && (
                              <button
                                onClick={() => handleBuyRequestCheckout(req)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-[#3F1D5A] hover:bg-[#D4A75F] text-white font-black rounded-xl text-xs border-none cursor-pointer shadow-lg shadow-[#D4A75F]/10 flex items-center justify-center gap-1.5 transition-all active:scale-97"
                              >
                                <ShoppingBag className="h-4 w-4" />
                                <span>{t('my_orders.checkout_now')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MY WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('my_orders.my_wishlist')}</h3>
                
                {wishlist.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8">
                    <Heart className="h-12 w-12 text-slate-300 mx-auto" />
                    <h4 className="text-base font-bold mt-4">{t('my_orders.wishlist_empty')}</h4>
                    <p className="text-xs text-slate-450 mt-1">{t('my_orders.wishlist_empty_desc')}</p>
                    <button onClick={() => navigate('/')} className="mt-5 px-5 py-2 bg-[#3F1D5A] text-white rounded-xl text-xs font-bold">{t('my_orders.shop_catalog')}</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlist.map((item) => {
                      const finalPrice = item.price - (item.price * ((item.discount || 0) / 100));
                      return (
                        <div key={item._id || item.product_id} className="flex bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl gap-4 hover:shadow-sm transition-shadow">
                          <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                            <LuxuryImage 
                              src={item.images?.[0] || item.image || 'https://via.placeholder.com/150'} 
                              alt={item.name} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-grow min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate hover:text-[#D4A75F]">
                                <Link to={`/product/${item._id || item.product_id}`}>{item.name}</Link>
                              </h4>
                              <div className="flex items-center space-x-1.5 mt-1">
                                <span className="text-xs font-black text-slate-900 dark:text-white price-amount">₹{formatPrice(finalPrice)}</span>
                                {item.discount > 0 && (
                                  <>
                                    <span className="text-[10px] text-slate-400 line-through price-amount">₹{formatPrice(item.price)}</span>
                                    <span className="text-[9px] font-bold text-[#D4A75F] bg-[#D4A75F]/10/50 dark:bg-emerald-950/40 px-1 rounded">{item.discount}% {t('home.off')}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 mt-3">
                              <button
                                onClick={() => {
                                  addToCart(item);
                                  removeFromWishlist(item._id || item.product_id);
                                }}
                                className="flex-grow py-1.5 bg-[#3F1D5A] hover:bg-[#D4A75F] text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
                              >
                                {t('my_orders.move_to_cart')}
                              </button>
                              <button
                                onClick={() => removeFromWishlist(item._id || item.product_id)}
                                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-[10px] transition-colors"
                              >
                                {language === 'hi' ? 'हटाएं' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SAVED FOR LATER */}
            {activeTab === 'saved' && (
              <div className="space-y-6">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('my_orders.saved_for_later')}</h3>
                
                {savedForLater.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8">
                    <Bookmark className="h-12 w-12 text-slate-300 mx-auto" />
                    <h4 className="text-base font-bold mt-4">{t('my_orders.saved_empty')}</h4>
                    <p className="text-xs text-slate-455 mt-1">{t('my_orders.saved_empty_desc')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedForLater.map((item) => (
                      <div key={item.product_id} className="flex bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl gap-4 hover:shadow-sm transition-shadow">
                        <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                          <LuxuryImage 
                            src={item.image || 'https://via.placeholder.com/150'} 
                            alt={item.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-grow min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate hover:text-[#D4A75F]">
                              <Link to={`/product/${item.product_id}`}>{item.name}</Link>
                            </h4>
                            <div className="flex items-center space-x-1.5 mt-1">
                              <span className="text-xs font-black text-slate-900 dark:text-white price-amount">₹{formatPrice(item.price)}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              onClick={() => moveToCartItem(item.product_id)}
                              className="flex-grow py-1.5 bg-[#3F1D5A] hover:bg-[#D4A75F] text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
                            >
                              {t('my_orders.add_back_cart')}
                            </button>
                            <button
                              onClick={() => removeFromSavedForLater(item.product_id)}
                              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-[10px] transition-colors"
                            >
                              {language === 'hi' ? 'हटाएं' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* TRACKING MODAL */}
      {trackingOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Truck className="h-5 w-5 text-[#D4A75F]" />
              <span>{t('my_orders.tracking.title', { id: trackingOrder.order_id })}</span>
            </h3>

            {/* Simulated Delivery Date */}
            <div className="bg-[#D4A75F]/5 border border-[#D4A75F]/10 dark:bg-[#D4A75F]/20 p-4 rounded-2xl mt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">{t('my_orders.tracking.est_delivery_title')}</p>
                <p className="text-sm font-extrabold text-[#D4A75F] dark:text-[#D4A75F] mt-0.5">
                  {trackingOrder.delivery_date || t('my_orders.tracking.est_delivery_default')}
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(trackingOrder.status)}`}>
                {t(`my_orders.status.${trackingOrder.status}`) || trackingOrder.status}
              </span>
            </div>

            {/* LIVE TIMELINE BAR */}
            {trackingOrder.status === 'Cancelled' ? (
              <div className="my-8 text-center p-6 border border-red-200 dark:border-red-955 bg-red-500/5 rounded-2xl flex flex-col items-center">
                <ShieldAlert className="h-10 w-10 text-red-500 mb-2" />
                <h4 className="text-red-500 font-extrabold text-sm">{t('my_orders.tracking.cancelled_title')}</h4>
                <p className="text-xs text-slate-450 mt-1 max-w-md">{t('my_orders.tracking.cancelled_desc')}</p>
              </div>
            ) : (
              <div className="my-8">
                {/* Horizontal progress bar for desktop, vertical stack for mobile */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative gap-6">
                  {/* Connecting Line */}
                  <div className="absolute left-[15px] sm:left-4 sm:right-4 top-4 bottom-4 sm:bottom-auto sm:h-0.5 bg-slate-200 dark:bg-slate-800 -z-10 hidden sm:block" />
                  
                  {getTimelineSteps(trackingOrder.status).map((step, idx) => (
                    <div key={idx} className="flex sm:flex-col items-center text-left sm:text-center relative z-10 gap-3 sm:gap-1.5 flex-1">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        step.active ? 'bg-[#3F1D5A] border-[#D4A75F] text-white ring-4 ring-[#D4A75F]/20' :
                        step.completed ? 'bg-[#3F1D5A] border-[#D4A75F] text-white' :
                        'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-655'
                      }`}>
                        {step.completed ? <CheckCircle className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-slate-350 dark:bg-slate-655" />}
                      </div>
                      
                      <div>
                        <p className={`text-[10px] font-black tracking-tight ${step.active || step.completed ? 'text-slate-850 dark:text-slate-205' : 'text-slate-400 dark:text-slate-600'}`}>
                          {t('my_orders.tracking.steps.' + (step.name === "Out for Delivery" ? "Out_for_Delivery" : step.name))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RECENT UPDATES / TRANSIT LOGS */}
            <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-4">
              <h4 className="font-bold text-xs text-slate-455 uppercase tracking-wider mb-3">{t('my_orders.tracking.logs_title')}</h4>
              
              <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
                {trackingOrder.tracking_history && trackingOrder.tracking_history.length > 0 ? (
                  trackingOrder.tracking_history.slice().reverse().map((log, idx) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 bg-[#3F1D5A] rounded-full mt-1.5" />
                        {idx !== trackingOrder.tracking_history.length - 1 && <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-grow mt-1" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{t(`my_orders.tracking.steps.${log.status.replace(/ /g, '_')}`) || log.status}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{log.message}</p>
                        <p className="text-[9px] text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-450 italic">{t('my_orders.tracking.no_logs')}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setTrackingOrder(null)}
              className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors"
            >
              {t('my_orders.tracking.close_btn')}
            </button>
          </div>
        </div>
      )}

      {/* RETURN REQUEST MODAL */}
      {returnOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              <span>{t('my_orders.return.title', { id: returnOrder.order_id })}</span>
            </h3>

            {returnMessage && (
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-xs font-semibold text-center my-3 text-slate-700 dark:text-slate-250">
                {returnMessage}
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-455 uppercase mb-1.5">{t('my_orders.return.reason_label')}</label>
                <textarea
                  required
                  placeholder={t('my_orders.return.placeholder')}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-808 dark:text-white h-28 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={returnLoading}
                  className="flex-grow py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
                >
                  {returnLoading ? t('my_orders.return.submitting') : t('my_orders.return.submit_btn')}
                </button>
                <button
                  type="button"
                  onClick={() => setReturnOrder(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-655 dark:text-slate-350 rounded-2xl text-xs font-bold transition-colors"
                >
                  {t('my_orders.return.cancel_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
