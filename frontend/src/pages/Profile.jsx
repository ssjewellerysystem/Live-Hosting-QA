import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  User, Settings, Mail, Phone, MapPin, Key, LogOut, Package, ShoppingBag, 
  Heart, Bookmark, ChevronDown, ChevronUp, Download, Clock, Check, X, ShieldAlert,
  Globe
} from 'lucide-react';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useTranslation } from '../hooks/useTranslation';
import { formatPrice } from '../utils/priceFormatter';

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

export const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, token, logout, savePreferredLanguage } = useContext(AuthContext);
  const { 
    wishlist, removeFromWishlist, addToCart,
    savedForLater, moveToCartItem, removeFromSavedForLater 
  } = useContext(CartContext);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=profile');
    } else if (user.is_admin) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Profile states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [state, setState] = useState(user?.address?.state || '');
  const [pincode, setPincode] = useState(user?.address?.pincode || '');
  const [alternateMobile, setAlternateMobile] = useState(user?.address?.alternate_mobile_number || '');
  const [validationError, setValidationError] = useState('');
  const [profileMobileError, setProfileMobileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Language preference states
  const [prefLang, setPrefLang] = useState(user?.preferred_language || language || 'en');
  const [langLoading, setLangLoading] = useState(false);
  const [langMessage, setLangMessage] = useState('');
  const [langError, setLangError] = useState('');

  // Orders states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  // Buy Requests states
  const [buyRequests, setBuyRequests] = useState([]);
  const [buyRequestsLoading, setBuyRequestsLoading] = useState(false);
  const [buyRequestsError, setBuyRequestsError] = useState('');

  // Sync profile state when user updates
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileMobile(user.mobile || '');
      setStreet(user.address?.street || '');
      setCity(user.address?.city || '');
      setState(user.address?.state || '');
      setPincode(user.address?.pincode || '');
      setAlternateMobile(user.address?.alternate_mobile_number || '');
      setPrefLang(user.preferred_language || language || 'en');
      // validate
      if (user.mobile && user.mobile.length === 10) {
        setProfileMobileError('');
      } else {
        setProfileMobileError('Please enter a valid 10-digit mobile number.');
      }
      if (user.address?.alternate_mobile_number && user.address.alternate_mobile_number.length === 10) {
        setValidationError('');
      } else if (user.address?.alternate_mobile_number) {
        setValidationError('Please enter a valid 10-digit mobile number.');
      } else {
        setValidationError('');
      }
    }
  }, [user, language]);

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
      setOrdersError("Failed to fetch order history.");
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

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchBuyRequests();
    }
  }, [user, token]);

  const handleProfileMobileChange = (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 10);
    setProfileMobile(cleanVal);
    if (cleanVal.length < 10) {
      setProfileMobileError('Please enter a valid 10-digit mobile number.');
    } else {
      setProfileMobileError('');
    }
  };

  const handleAlternateMobileChange = (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 10);
    setAlternateMobile(cleanVal);
    if (!cleanVal) {
      setValidationError('');
    } else if (cleanVal.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
    } else {
      setValidationError('');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (profileMobileError || validationError) {
      setProfileError(profileMobileError || validationError);
      return;
    }
    if (!profileMobile || profileMobile.length !== 10) {
      setProfileError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (alternateMobile && alternateMobile.length !== 10) {
      setProfileError("Please enter a valid 10-digit alternate mobile number.");
      return;
    }
    if (isPincodeInvalid) {
      setProfileError("Please enter a valid 6-digit PIN Code.");
      return;
    }
    setProfileLoading(true);
    setProfileMessage('');
    setProfileError('');
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, {
        name: profileName,
        email: profileEmail,
        mobile: profileMobile,
        address: { street, city, state, pincode, alternate_mobile_number: alternateMobile }
      });
      updateUser(response.data.user);
      setProfileMessage("Profile and settings updated successfully!");
    } catch (err) {
      console.error(err);
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage('');
    setPasswordError('');
    try {
      await axios.put(`${API_BASE_URL}/auth/password`, { current_password: currentPassword, new_password: newPassword });
      setPasswordMessage("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveLanguagePreference = async (e) => {
    e.preventDefault();
    setLangLoading(true);
    setLangMessage('');
    setLangError('');
    try {
      await savePreferredLanguage(prefLang);
      setLangMessage(language === 'hi' ? "भाषा प्राथमिकता सफलतापूर्वक सहेजी गई!" : "Language preference saved successfully!");
    } catch (err) {
      console.error(err);
      setLangError(err.response?.data?.message || err.message || "Failed to update language preference.");
    } finally {
      setLangLoading(false);
    }
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

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

  const isAddressEmpty = !street?.trim() && !city?.trim() && !state?.trim() && !pincode?.trim();
  const isPincodeInvalid = isAddressEmpty ? false : pincode?.trim().length !== 6;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4A75F]"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen font-sans transition-colors duration-300">
      <div className="max-w-[97%] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {/* Profile Welcome Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-32 w-32 bg-[#D4A75F]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-[#D4A75F] text-white flex items-center justify-center text-xl font-bold uppercase rounded-2xl shadow-md">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {language === 'hi' ? `नमस्ते, ${user.name}` : `Namaste, ${user.name}`}
              </h1>
              <p className="text-xs text-slate-450">
                {user.email} • {user.mobile}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-4 md:mt-0">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl text-center min-w-[90px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{orders.length}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl text-center min-w-[90px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wishlist</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{wishlist.length}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('navbar.sign_out') || 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE: Forms & Settings (7 Columns) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Personal Info & Account Settings */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <Settings className="h-5 w-5 text-[#D4A75F]" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Account Settings & Personal Info</h3>
              </div>
              
              {profileMessage && (
                <div className="bg-[#D4A75F]/10 border border-[#D4A75F]/20 text-[#D4A75F] p-4 rounded-xl text-xs font-semibold mb-4 text-center">
                  {profileMessage}
                </div>
              )}
              {profileError && (
                <div className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 text-red-650 dark:text-red-400 p-4 rounded-xl text-xs font-semibold mb-4 text-center">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-455 uppercase mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-455 uppercase mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={profileMobile}
                      onChange={(e) => handleProfileMobileChange(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-800 dark:text-white"
                    />
                    <div className="mt-1">
                      {profileMobile.length < 10 ? (
                        <p className="text-[11px] text-[#EF4444] font-semibold">
                          Please enter a valid 10-digit mobile number.
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#22C55E] font-semibold flex items-center gap-1">
                          ✓ Valid Mobile Number
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-455 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-800 dark:text-white"
                  />
                  {(!profileEmail || !isEmailValid(profileEmail)) && (
                    <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                      Please enter a valid email address.
                    </p>
                  )}
                </div>

                {/* 2. Address Management */}
                <div className="border-t border-slate-100 dark:border-slate-850 pt-4">
                  <p className="font-bold text-[#D4A75F] text-xs mb-3 uppercase tracking-wider">Address Management</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-455 mb-1">Street Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Flat 104, Block B, Green Apartments"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-455 mb-1">Alternate Mobile (Optional)</label>
                      <input
                        type="text"
                        value={alternateMobile || ''}
                        onChange={(e) => handleAlternateMobileChange(e.target.value)}
                        className={`w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border ${
                          validationError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-[#D4A75F]'
                        } rounded-xl focus:outline-none focus:ring-1 text-slate-800 dark:text-white`}
                        placeholder="e.g. 9829276750"
                      />
                      {alternateMobile && (
                        <div className="mt-1">
                          {alternateMobile.length < 10 ? (
                            <p className="text-[11px] text-[#EF4444] font-semibold">
                              Please enter a valid 10-digit mobile number.
                            </p>
                          ) : (
                            <p className="text-[11px] text-[#22C55E] font-semibold flex items-center gap-1">
                              ✓ Valid Mobile Number
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-455 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="Bengaluru"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-455 mb-1">State</label>
                        <input
                          type="text"
                          placeholder="Karnataka"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-455 mb-1">Pincode</label>
                        <input
                          type="text"
                          placeholder="560001"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                          className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-800 dark:text-white"
                        />
                        {pincode && pincode.length !== 6 && (
                          <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                            Please enter a valid 6-digit PIN Code.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading || !profileName.trim() || !isEmailValid(profileEmail) || profileMobile.length !== 10 || (alternateMobile && alternateMobile.length !== 10) || isPincodeInvalid}
                  className="px-6 py-2.5 bg-[#3F1D5A] hover:bg-[#D4A75F] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileLoading ? 'Saving...' : 'Update Settings & Address'}
                </button>
              </form>
            </div>

            {/* 3. Security Settings (Change Password) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <Key className="h-5 w-5 text-[#D4A75F]" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Security Settings</h3>
              </div>
              
              {passwordMessage && (
                <div className="bg-[#D4A75F]/10 border border-[#D4A75F]/20 text-[#D4A75F] p-4 rounded-xl text-xs font-semibold mb-4 text-center">
                  {passwordMessage}
                </div>
              )}
              {passwordError && (
                <div className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 text-red-650 dark:text-red-400 p-4 rounded-xl text-xs font-semibold mb-4 text-center">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-455 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-808 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-455 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A75F] text-slate-808 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2.5 bg-[#3F1D5A] hover:bg-[#D4A75F] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* 4. Language Preferences */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <Globe className="h-5 w-5 text-[#D4A75F]" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Language Preferences</h3>
              </div>
              
              {langMessage && (
                <div className="bg-[#D4A75F]/10 border border-[#D4A75F]/20 text-[#D4A75F] p-4 rounded-xl text-xs font-semibold mb-4 text-center">
                  {langMessage}
                </div>
              )}
              {langError && (
                <div className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 text-red-655 dark:text-red-400 p-4 rounded-xl text-xs font-semibold mb-4 text-center">
                  {langError}
                </div>
              )}

              <form onSubmit={handleSaveLanguagePreference} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-455 mb-3 uppercase tracking-wider">
                    Preferred Language
                  </label>
                  
                  <div className="flex flex-col space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="prefLang"
                        value="en"
                        checked={prefLang === 'en'}
                        onChange={() => setPrefLang('en')}
                        className="h-4 w-4 text-[#3F1D5A] focus:ring-[#D4A75F] border-slate-300 dark:border-slate-700"
                      />
                      <span>English</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="prefLang"
                        value="hi"
                        checked={prefLang === 'hi'}
                        onChange={() => setPrefLang('hi')}
                        className="h-4 w-4 text-[#3F1D5A] focus:ring-[#D4A75F] border-slate-300 dark:border-slate-700"
                      />
                      <span>Hindi</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={langLoading}
                  className="px-6 py-2.5 bg-[#3F1D5A] hover:bg-[#D4A75F] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer mt-4"
                >
                  {langLoading ? 'Saving...' : 'Save Language Preference'}
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT SIDE: My Orders, Wishlist, Buy Requests (5 Columns) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* 4. My Orders Accordion Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex items-center space-x-2.5">
                  <Package className="h-5 w-5 text-[#D4A75F]" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">My Orders Status</h3>
                </div>
                <Link to="/orders" className="text-xs font-bold text-[#D4A75F] hover:underline">View All</Link>
              </div>

              {ordersLoading ? (
                <div className="py-4 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-[#D4A75F] mx-auto"></div>
                </div>
              ) : ordersError ? (
                <p className="text-xs text-rose-500">{ordersError}</p>
              ) : orders.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Package className="h-8 w-8 mx-auto opacity-30 mb-2" />
                  <p className="text-xs font-semibold">No orders placed yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {orders.slice(0, 5).map((order) => {
                    const isExpanded = !!expandedOrders[order.order_id];
                    return (
                      <div key={order.order_id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400">ID: {order.order_id.substring(0, 12)}...</p>
                            <p className="text-xs font-extrabold text-[#3F1D5A] dark:text-slate-205 mt-0.5 price-amount">₹{formatPrice(order.total_amount)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${getStatusStyle(order.status)}`}>
                              {order.status}
                            </span>
                            <button
                              onClick={() => toggleExpandOrder(order.order_id)}
                              className="text-slate-450 hover:text-slate-700 p-0.5 rounded"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/60 space-y-2 text-xs">
                            <p className="text-[10px] font-semibold text-slate-400"><Clock className="inline h-3 w-3 mr-1" /> Placed on: {formatTimestamp(order.created_at)}</p>
                            
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="py-1.5 flex justify-between">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name} x{item.quantity}</span>
                                  <span className="font-extrabold text-slate-900 dark:text-white price-amount">₹{formatPrice(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => handleDownloadInvoice(order)}
                              className="w-full flex items-center justify-center space-x-1 py-1.5 bg-[#3F1D5A]/10 hover:bg-[#3F1D5A]/15 text-[#3F1D5A] dark:bg-[#D4A75F]/10 dark:text-[#D4A75F] dark:hover:bg-[#D4A75F]/15 rounded-lg text-[10px] font-black transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download Invoice</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Custom Buy Requests Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex items-center space-x-2.5">
                  <ShoppingBag className="h-5 w-5 text-[#D4A75F]" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Custom Buy Requests</h3>
                </div>
                <Link to="/orders?tab=buy-requests" className="text-xs font-bold text-[#D4A75F] hover:underline">View All</Link>
              </div>

              {buyRequestsLoading ? (
                <div className="py-4 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-[#D4A75F] mx-auto"></div>
                </div>
              ) : buyRequestsError ? (
                <p className="text-xs text-rose-500">{buyRequestsError}</p>
              ) : buyRequests.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <ShoppingBag className="h-8 w-8 mx-auto opacity-30 mb-2" />
                  <p className="text-xs font-semibold">No custom requests yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {buyRequests.slice(0, 5).map((req) => (
                    <div key={req.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-white">{req.product_name || "Custom Jewellery"}</p>
                          <p className="text-[10px] text-slate-450">Category: {req.category || 'N/A'}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                          req.status === 'Approved' || req.status === 'Available' ? 'bg-[#D4A75F]/10 text-[#D4A75F]' :
                          req.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      {/* Request Specs */}
                      <div className="text-[10px] text-slate-500 grid grid-cols-2 gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-100 dark:border-slate-850">
                        {req.specifications && Object.entries(req.specifications).map(([k, v]) => (
                          <div key={k} className="truncate"><span className="font-bold capitalize">{k}:</span> {String(v)}</div>
                        ))}
                        <div><span className="font-bold">Qty:</span> {req.quantity}</div>
                        <div className="secondary-text"><span className="font-bold">City:</span> {req.city || 'N/A'}</div>
                      </div>

                      {/* Respond Actions */}
                      {(req.status === 'Approved' || req.status === 'Available') && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespondBuyRequest(req.id, 'Confirm')}
                            className="flex-1 py-1 px-2.5 bg-[#D4A75F] hover:bg-[#BF934B] text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                          >
                            Accept & Checkout
                          </button>
                          <button
                            onClick={() => handleRespondBuyRequest(req.id, 'Reject')}
                            className="py-1 px-2.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 rounded-lg text-[10px] transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Wishlist Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex items-center space-x-2.5">
                  <Heart className="h-5 w-5 text-rose-500 fill-current" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">My Wishlist</h3>
                </div>
                <Link to="/orders?tab=wishlist" className="text-xs font-bold text-[#D4A75F] hover:underline">View All</Link>
              </div>

              {wishlist.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Heart className="h-8 w-8 mx-auto opacity-30 mb-2" />
                  <p className="text-xs font-semibold">Your wishlist is empty.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {wishlist.slice(0, 5).map((item) => (
                    <div key={item.product_id || item.id} className="flex gap-3 items-center border border-slate-100 dark:border-slate-850 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                      <img
                        src={item.image_url || "/placeholder.jpg"}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200/60 dark:border-slate-850"
                        onError={(e) => { e.target.src = "/placeholder.jpg"; }}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                        <p className="text-[10px] font-extrabold text-[#D4A75F] mt-0.5 price-amount">₹{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            addToCart(item, 1);
                            removeFromWishlist(item.product_id || item.id);
                          }}
                          className="px-2 py-1 bg-[#3F1D5A] hover:bg-[#D4A75F] text-white text-[9px] font-black rounded-lg transition-all cursor-pointer"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => removeFromWishlist(item.product_id || item.id)}
                          className="p-1 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
