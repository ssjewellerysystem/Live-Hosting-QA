import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Truck, ShieldCheck, Mail, Key, ShoppingBag, CheckCircle, ArrowRight, ArrowLeft, ShieldAlert, X, Plus, Edit2, Trash2, MapPin, Check, Home, Briefcase } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { formatPrice } from '../utils/priceFormatter';

export const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkoutLogin, updateUser, token } = useContext(AuthContext);
  const { cart, cartTotal, clearCart } = useContext(CartContext);
  const { t } = useTranslation();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment/OTP, 3: Success Receipt
  
  const queryParams = new URLSearchParams(location.search);
  const buyRequestId = queryParams.get('buy_request_id');
  const isBuyRequestCheckout = !!buyRequestId;
  const [buyRequestData, setBuyRequestData] = useState(null);
  const [buyRequestLoading, setBuyRequestLoading] = useState(false);
  
  // Address states for logged-in user
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    house_number: '',
    building_name: '',
    street: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    address_type: 'Home',
    is_default: false,
    alternate_mobile_number: '',
    country: 'India'
  });

  // Shipping details state (including guest variables)
  const [shippingDetails, setShippingDetails] = useState({
    name: user?.name || '',
    phone: user?.mobile || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    house_number: '',
    building_name: '',
    street: '',
    area: '',
    landmark: '',
    address_type: 'Home',
    alternate_mobile_number: '',
    country: 'India'
  });

  // Helper function to format street part of the address
  const getStreetPart = (addr) => {
    if (!addr) return '';
    const parts = [];
    if (addr.house_number) parts.push(`House No. ${addr.house_number}`);
    if (addr.building_name) parts.push(addr.building_name);
    if (addr.street) parts.push(addr.street);
    if (addr.landmark) {
      const lm = addr.landmark.trim();
      if (lm.toLowerCase().startsWith('near')) {
        parts.push(lm);
      } else {
        parts.push(`Near ${lm}`);
      }
    }
    if (addr.area) parts.push(addr.area);
    return parts.filter(Boolean).join(', ');
  };

  // Helper function to format full preview of the address
  const formatAddressPreview = (addr) => {
    if (!addr) return '';
    const parts = [];
    const fields = [
      addr.house_number,
      addr.building_name,
      addr.street,
      addr.area,
      addr.landmark,
      addr.city,
      addr.state,
      addr.country
    ];
    
    fields.forEach(field => {
      if (field !== undefined && field !== null) {
        const val = String(field).trim();
        if (val) {
          if (!parts.includes(val)) {
            parts.push(val);
          }
        }
      }
    });

    const base = parts.join(', ');
    const pin = addr.pincode ? String(addr.pincode).trim() : '';
    return pin ? `${base} - ${pin}` : base;
  };


  const scrollToAddress = () => {
    const section = document.getElementById("address-section");
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Fetch addresses if logged in
  const fetchAddresses = async () => {
    if (user) {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/addresses`);
        const fetched = res.data.addresses || [];
        setAddresses(fetched);
        
        // Select default or first address if none selected yet
        const def = fetched.find(a => a.is_default);
        if (def) {
          setSelectedAddressId(def.id);
        } else if (fetched.length > 0) {
          setSelectedAddressId(fetched[0].id);
        } else {
          // If no address exists: focus/open the Add Address form
          setShowAddressForm(true);
          setTimeout(scrollToAddress, 100);
        }
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
      }
    }
  };

  // Sync profile details on mount/user change
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/profile`);
          const latestUser = res.data.user;
          if (latestUser) {
            setShippingDetails(prev => ({
              ...prev,
              name: latestUser.name || '',
              phone: latestUser.mobile || '',
              email: latestUser.email || ''
            }));
          }
        } catch (err) {
          console.error("Failed to fetch user profile details:", err);
          setShippingDetails(prev => ({
            ...prev,
            name: user.name || '',
            phone: user.mobile || '',
            email: user.email || ''
          }));
        }
      }
    };
    fetchProfile();
    fetchAddresses();
  }, [user]);

  // Redirect to login if user is not logged in for buy request checkout
  useEffect(() => {
    if (buyRequestId && !user) {
      navigate('/login?redirect=' + encodeURIComponent('checkout?buy_request_id=' + buyRequestId));
    }
  }, [buyRequestId, user, navigate]);

  // Fetch buy request details if buy_request_id is present
  useEffect(() => {
    if (buyRequestId && token) {
      setBuyRequestLoading(true);
      axios.get(`${API_BASE_URL}/auth/buy-requests/${buyRequestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setBuyRequestData(res.data);
      })
      .catch(err => {
        console.error("Failed to fetch buy request details:", err);
        setError("Failed to load buy request details.");
      })
      .finally(() => {
        setBuyRequestLoading(false);
      });
    }
  }, [buyRequestId, token]);

  // Sync shipping details when selectedAddressId or addresses change
  useEffect(() => {
    if (user && addresses.length > 0 && selectedAddressId) {
      const active = addresses.find(a => a.id === selectedAddressId);
      if (active) {
        const streetPart = getStreetPart(active);
        setShippingDetails(prev => ({
          ...prev,
          address: streetPart,
          city: active.city || '',
          state: active.state || '',
          pincode: active.pincode || '',
          house_number: active.house_number || '',
          building_name: active.building_name || '',
          street: active.street || '',
          area: active.area || '',
          landmark: active.landmark || '',
          address_type: active.address_type || 'Home',
          alternate_mobile_number: active.alternate_mobile_number || '',
          country: active.country || 'India'
        }));
      }
    }
  }, [selectedAddressId, addresses, user]);

  // Handle guest fields and keep address synced
  const handleGuestInputChange = (field, value) => {
    if (field === 'pincode') {
      value = value.replace(/[^0-9]/g, '').slice(0, 6);
    }
    setShippingDetails(prev => {
      const updated = { ...prev, [field]: value };
      const streetPart = getStreetPart(updated);
      updated.address = streetPart;
      return updated;
    });
  };

  const [validationError, setValidationError] = useState('');
  
  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleGuestPhoneChange = (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 10);
    setShippingDetails(prev => ({ ...prev, phone: cleanVal }));
  };

  const handleAlternateMobileChange = (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 10);
    setAddressForm(prev => ({ ...prev, alternate_mobile_number: cleanVal }));
    if (!cleanVal) {
      setValidationError('');
    } else if (cleanVal.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
    } else {
      setValidationError('');
    }
  };

  // Manage addresses operations
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setError('');
    setValidationError('');
    
    if (
      !addressForm.house_number?.trim() ||
      !addressForm.street?.trim() ||
      !addressForm.area?.trim() ||
      !addressForm.landmark?.trim() ||
      !addressForm.city?.trim() ||
      !addressForm.state?.trim() ||
      !addressForm.pincode?.trim() ||
      addressForm.pincode.replace(/[^0-9]/g, '').length !== 6 ||
      !addressForm.country?.trim()
    ) {
      setError(addressForm.pincode?.replace(/[^0-9]/g, '').length !== 6 ? "Please enter a valid 6-digit PIN Code." : t('checkout_page.validation_error', { defaultValue: 'Please fill in all required fields.' }));
      return;
    }

    if (addressForm.alternate_mobile_number) {
      if (addressForm.alternate_mobile_number.length !== 10) {
        const errMsg = 'Please enter a valid 10-digit mobile number.';
        setValidationError(errMsg);
        setError(errMsg);
        return;
      }
    }

    try {
      if (editingAddressId) {
        // Edit existing
        await axios.put(`${API_BASE_URL}/auth/addresses/${editingAddressId}`, addressForm);
        // If set as default, update default in database
        if (addressForm.is_default) {
          await axios.put(`${API_BASE_URL}/auth/addresses/${editingAddressId}/default`);
        }
      } else {
        // Add new
        const res = await axios.post(`${API_BASE_URL}/auth/addresses`, addressForm);
        const newAddr = res.data.address;
        if (addressForm.is_default && newAddr) {
          await axios.put(`${API_BASE_URL}/auth/addresses/${newAddr.id}/default`);
        }
      }
      
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressForm({
        house_number: '',
        building_name: '',
        street: '',
        area: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        address_type: 'Home',
        is_default: false,
        alternate_mobile_number: '',
        country: 'India'
      });
      setValidationError('');
      await fetchAddresses();
    } catch (err) {
      console.error("Failed to save address:", err);
      setError(err.response?.data?.message || "Failed to save address details.");
    }
  };

  const handleEditAddressClick = (addr) => {
    setAddressForm({
      house_number: addr.house_number || '',
      building_name: addr.building_name || '',
      street: addr.street || '',
      area: addr.area || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      address_type: addr.address_type || 'Home',
      is_default: addr.is_default || false,
      alternate_mobile_number: addr.alternate_mobile_number || '',
      country: addr.country || 'India'
    });
    setValidationError('');
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/auth/addresses/${id}`);
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
      await fetchAddresses();
    } catch (err) {
      console.error("Failed to delete address:", err);
      setError("Failed to delete address.");
    }
  };

  const handleSetDefaultAddress = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.put(`${API_BASE_URL}/auth/addresses/${id}/default`);
      await fetchAddresses();
    } catch (err) {
      console.error("Failed to set default address:", err);
      setError("Failed to set default address.");
    }
  };

  // Payment selection state
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD or OnlineCard
  
  // Card payment simulator states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  
  const [placingOrder, setPlacingOrder] = useState(false);
  
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  // Terms and conditions state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  // Lock step 2 if terms are not accepted
  useEffect(() => {
    if (step === 2 && !termsAccepted) {
      setStep(1);
    }
  }, [step, termsAccepted]);



  // Handle OTP countdown timer
  useEffect(() => {
    let timer;
    if (showOtpVerification && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpVerification, otpCountdown]);

  // Handle Pay Click with card validation
  const handlePayClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (paymentMethod === 'Card') {
      if (!cardName.trim()) {
        setError('Cardholder Name is required.');
        return;
      }
      const rawCard = cardNumber.replace(/\s/g, '');
      if (rawCard.length !== 16) {
        setError('Please enter a valid 16-digit Card Number.');
        return;
      }
      if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
        setError('Please enter a valid Expiry Date (MM/YY).');
        return;
      }
      if (cardCvv.length !== 3) {
        setError('Please enter a valid 3-digit CVV.');
        return;
      }
      setError('');
      setShowOtpVerification(true);
      setOtpCountdown(59);
    } else {
      // COD directly places order
      handlePlaceOrder();
    }
  };

  // Verify OTP and proceed to finalize order
  const handleVerifyOtp = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (otpValue === '123456') {
      setOtpError('');
      setShowOtpVerification(false);
      handlePlaceOrder();
    } else {
      setOtpError('Invalid OTP. Please use testing code 123456.');
    }
  };

  const isAddressSelectionValid = () => {
    if (user) {
      if (addresses.length === 0 || !selectedAddressId || showAddressForm) {
        return false;
      }
      const activeAddress = addresses.find(a => a.id === selectedAddressId);
      if (!activeAddress) return false;
      
      const house = activeAddress.house_number || activeAddress.house;
      const street = activeAddress.street || activeAddress.address;
      
      return !!(
        shippingDetails.name?.trim() &&
        shippingDetails.phone?.trim() &&
        house?.trim() &&
        street?.trim() &&
        activeAddress.area?.trim() &&
        activeAddress.city?.trim() &&
        activeAddress.state?.trim() &&
        activeAddress.pincode?.trim() &&
        activeAddress.pincode.replace(/[^0-9]/g, '').length === 6 &&
        (activeAddress.country || 'India')?.trim()
      );
    } else {
      // Guest checks
      return !!(
        shippingDetails.name?.trim() &&
        shippingDetails.phone?.trim() &&
        shippingDetails.phone.replace(/\D/g, '').length === 10 &&
        shippingDetails.email?.trim() &&
        isEmailValid(shippingDetails.email) &&
        shippingDetails.house_number?.trim() &&
        shippingDetails.street?.trim() &&
        shippingDetails.area?.trim() &&
        shippingDetails.landmark?.trim() &&
        shippingDetails.city?.trim() &&
        shippingDetails.state?.trim() &&
        shippingDetails.pincode?.trim() &&
        shippingDetails.pincode.replace(/[^0-9]/g, '').length === 6 &&
        shippingDetails.country?.trim()
      );
    }
  };

  // Form validations
  const handleNextStep = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (user) {
      if (addresses.length === 0) {
        setError("Please add and select a complete delivery address before continuing.");
        setShowAddressForm(true);
        setTimeout(scrollToAddress, 100);
        return;
      }
      if (!selectedAddressId) {
        setError("Please add and select a complete delivery address before continuing.");
        return;
      }
      const activeAddress = addresses.find(a => a.id === selectedAddressId);
      if (!activeAddress) {
        setError("Please add and select a complete delivery address before continuing.");
        return;
      }
      
      const house = activeAddress.house_number || activeAddress.house;
      const street = activeAddress.street || activeAddress.address;
      const country = activeAddress.country || 'India';

      if (
        !shippingDetails.name?.trim() ||
        !shippingDetails.phone?.trim() ||
        !house?.trim() ||
        !street?.trim() ||
        !activeAddress.area?.trim() ||
        !activeAddress.city?.trim() ||
        !activeAddress.state?.trim() ||
        !activeAddress.pincode?.trim() ||
        !country?.trim()
      ) {
        setError("Please add and select a complete delivery address before continuing.");
        return;
      }
      
      if (showAddressForm) {
        setError(t('checkout_page.save_address_first', { defaultValue: 'Please save your address details first.' }));
        return;
      }
    } else {
      // Validate guest fields
      if (
        !shippingDetails.name?.trim() ||
        !shippingDetails.phone?.trim() ||
        !shippingDetails.email?.trim() ||
        !shippingDetails.house_number?.trim() ||
        !shippingDetails.street?.trim() ||
        !shippingDetails.area?.trim() ||
        !shippingDetails.landmark?.trim() ||
        !shippingDetails.city?.trim() ||
        !shippingDetails.state?.trim() ||
        !shippingDetails.pincode?.trim() ||
        !shippingDetails.country?.trim()
      ) {
        setError("Please add and select a complete delivery address before continuing.");
        return;
      }
      if (shippingDetails.phone.replace(/\D/g, '').length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!isEmailValid(shippingDetails.email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }
    setError('');
    setShowTermsModal(true);
  };

  const handlePlaceOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!termsAccepted) {
      setError(t('checkout_page.agree_warning'));
      return;
    }
    setPlacingOrder(true);
    setError('');

    let tokenToUse = localStorage.getItem('bb_token') || token;

    try {
      // 1. Formatted items for API format (already computed dynamically)
      const formattedItems = checkoutItems;
      const finalAmount = grandTotal;

      // 2. Perform inline login/registration if user is not logged in (only for normal cart checkout)
      if (!user && !isBuyRequestCheckout) {
        const loginSuccess = await checkoutLogin(shippingDetails);
        if (!loginSuccess) {
          throw new Error("Failed to auto-register user session. Please check details.");
        }
        tokenToUse = localStorage.getItem('bb_token');
      }

      // 3. Place order
      const payload = {
        shipping_address: shippingDetails,
        items: formattedItems,
        total_amount: finalAmount,
        terms_accepted: termsAccepted
      };

      if (isBuyRequestCheckout) {
        payload.buy_request_id = buyRequestId;
        payload.selected_address_id = selectedAddressId;
      }

      const orderRes = await axios.post(
        `${API_BASE_URL}/orders`, 
        payload,
        {
          headers: tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {}
        }
      );

      setSuccessOrder(orderRes.data.order);
      if (user) {
        updateUser({
          address: {
            street: shippingDetails.address,
            city: shippingDetails.city,
            state: shippingDetails.state,
            pincode: shippingDetails.pincode
          }
        });
      }
      
      if (!isBuyRequestCheckout) {
        clearCart(); // Flush frontend state
      }
      setStep(3);  // Go to receipt screen
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to finalize order. Check details or stock availability.");
      
      // If payment / order placement fails for a buy request, notify the backend to reset status to 'Awaiting Payment'
      if (isBuyRequestCheckout) {
        axios.put(`${API_BASE_URL}/auth/buy-requests/${buyRequestId}/payment-failed`, {}, {
          headers: tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {}
        }).catch(e => console.error("Failed to mark payment as failed:", e));
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  // Dynamic checkout items and totals
  let checkoutItems = [];
  let checkoutTotal = 0;
  
  if (isBuyRequestCheckout) {
    if (buyRequestData) {
      const { buy_request, product } = buyRequestData;
      if (buy_request && product) {
        const discountedPrice = Math.round(product.price - (product.price * ((product.discount || 0) / 100)));
        checkoutItems = [{
          product_id: product.id,
          name: product.name,
          price: discountedPrice,
          quantity: buy_request.quantity,
          image: product.image || (product.images && product.images[0])
        }];
        checkoutTotal = discountedPrice * buy_request.quantity;
      }
    }
  } else {
    checkoutItems = cart.map(item => ({
      product_id: item.product_id,
      name: item.name,
      price: Math.round(item.price - (item.price * (item.discount / 100))),
      quantity: item.quantity,
      image: item.image
    }));
    checkoutTotal = cartTotal;
  }

  // Pricing calculations
  const shippingFee = checkoutTotal > 1000 ? 0 : 79;
  const gstTax = Math.round(checkoutTotal * 0.05);
  const grandTotal = Math.round(checkoutTotal + shippingFee + gstTax);

  if (isBuyRequestCheckout && buyRequestLoading && step !== 3) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-955 min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
        <p className="text-slate-450 mt-4 text-xs font-bold">Loading buy request details...</p>
      </div>
    );
  }

  if (isBuyRequestCheckout && !buyRequestData && step !== 3) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold mt-4">Invalid Buy Request</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Could not load the requested buy request details.
        </p>
        <button
          onClick={() => navigate('/orders?tab=buy-requests')}
          className="mt-6 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Buy Requests
        </button>
      </div>
    );
  }

  if (!isBuyRequestCheckout && cart.length === 0 && step !== 3) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm">
        <ShoppingBag className="h-12 w-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold mt-4">{t('checkout_page.empty_checkout')}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          {t('checkout_page.empty_checkout_desc')}
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          {t('checkout_page.view_storefront')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 min-h-screen pb-16 font-sans">
      <div className="max-w-[97%] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Checkout Header Wizard Tracker */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-8">
          <div className="flex items-center space-x-1.5">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-850'
            }`}>1</span>
            <span className={`text-xs sm:text-sm font-semibold ${step === 1 ? 'text-slate-850 dark:text-slate-50 font-bold' : 'text-slate-400'}`}>{t('checkout_page.shipping')}</span>
          </div>
          <span className="h-[1px] w-8 sm:w-16 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center space-x-1.5">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-850'
            }`}>2</span>
            <span className={`text-xs sm:text-sm font-semibold ${step === 2 ? 'text-slate-850 dark:text-slate-50 font-bold' : 'text-slate-400'}`}>{t('checkout_page.payment')}</span>
          </div>
          <span className="h-[1px] w-8 sm:w-16 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center space-x-1.5">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-855'
            }`}>3</span>
            <span className={`text-xs sm:text-sm font-semibold ${step === 3 ? 'text-slate-850 dark:text-slate-50 font-bold' : 'text-slate-400'}`}>{t('checkout_page.receipt')}</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 text-red-650 dark:text-red-400 p-4 rounded-2xl text-xs sm:text-sm mb-6 max-w-4xl mx-auto">
            {error}
          </div>
        )}

        {/* STEP 1: SHIPPING FORM */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Details (Read-only) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 text-left">
                <h2 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <span>{t('checkout_page.profile_details', { defaultValue: 'Customer Profile' })}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t('checkout_page.full_name')}</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={shippingDetails.name}
                      className="w-full px-4 py-3 text-sm border rounded-xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-75 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t('checkout_page.phone_number')}</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={shippingDetails.phone}
                      className="w-full px-4 py-3 text-sm border rounded-xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-75 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t('checkout_page.email_address')}</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={shippingDetails.email}
                      className="w-full px-4 py-3 text-sm border rounded-xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-75 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address Section */}
              {user ? (
                <div id="address-section" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 text-left">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Truck className="h-5 w-5 text-emerald-500" />
                      <span>{t('checkout_page.delivery_address', { defaultValue: 'Select Delivery Address' })}</span>
                    </h2>
                    {!showAddressForm && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressForm({
                            house_number: '',
                            building_name: '',
                            street: '',
                            area: '',
                            landmark: '',
                            city: '',
                            state: '',
                            pincode: '',
                            address_type: 'Home',
                            is_default: false,
                            alternate_mobile_number: '',
                            country: 'India'
                          });
                          setEditingAddressId(null);
                          setShowAddressForm(true);
                        }}
                        className={`flex items-center gap-1 text-xs font-bold transition-all px-3 py-1.5 rounded-xl ${
                          addresses.length === 0
                            ? 'bg-emerald-500 text-white animate-pulse shadow-md'
                            : 'text-emerald-500 hover:text-emerald-600'
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add New Address</span>
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Address Form */}
                  {showAddressForm ? (
                    <form onSubmit={handleSaveAddress} className="space-y-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {editingAddressId ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">House / Flat / Ward Number *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.house_number}
                            onChange={(e) => setAddressForm({...addressForm, house_number: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. House No. 15"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Building Name (Optional)</label>
                          <input
                            type="text"
                            value={addressForm.building_name}
                            onChange={(e) => setAddressForm({...addressForm, building_name: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. Green Residency"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Street / Road Name *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. MG Road"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Area / Locality *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.area}
                            onChange={(e) => setAddressForm({...addressForm, area: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. Vaishali Nagar"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Landmark *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.landmark}
                            onChange={(e) => setAddressForm({...addressForm, landmark: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. Near Hanuman Temple"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Pincode *</label>
                          <input
                            type="text"
                            required
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={addressForm.pincode}
                            onChange={(e) => {
                              const numericVal = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                              setAddressForm({...addressForm, pincode: numericVal});
                            }}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-850 dark:text-slate-105"
                            placeholder="e.g. 302021"
                          />
                          {addressForm.pincode && addressForm.pincode.length !== 6 && (
                            <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                              Please enter a valid 6-digit PIN Code.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            {t('checkout_page.primary_mobile') || 'Primary Mobile Number (Account Mobile)'}
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={user?.mobile || ''}
                            className="w-full px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-not-allowed text-slate-500 dark:text-slate-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            {t('checkout_page.alternate_mobile') || 'Alternate Mobile Number (Optional)'}
                          </label>
                          <input
                            type="text"
                            value={addressForm.alternate_mobile_number || ''}
                            onChange={(e) => handleAlternateMobileChange(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A75F]/50 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. 9829276750"
                          />
                          {addressForm.alternate_mobile_number && (
                            <div className="mt-1">
                              {addressForm.alternate_mobile_number.length < 10 ? (
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">City *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. Jaipur"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">State *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. Rajasthan"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Country *</label>
                          <input
                            type="text"
                            required
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. India"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Address Type *</label>
                          <select
                            value={addressForm.address_type}
                            onChange={(e) => setAddressForm({...addressForm, address_type: e.target.value})}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-105 font-medium"
                          >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id="form-is-default"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})}
                          className="h-4 w-4 accent-emerald-500 rounded cursor-pointer"
                        />
                        <label htmlFor="form-is-default" className="text-xs text-slate-600 dark:text-slate-350 select-none cursor-pointer">
                          Make this my default delivery address
                        </label>
                      </div>

                      {/* Live Formatted Address Preview inside form */}
                      <div className="bg-slate-100 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-450 block mb-1">Live Address Preview:</span>
                        <p className="text-slate-700 dark:text-slate-300 italic font-medium break-words">
                          {formatAddressPreview(addressForm) || 'Start typing to see preview...'}
                        </p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddressId(null);
                          }}
                          className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-750 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={addressForm.pincode?.length !== 6 || !!(addressForm.alternate_mobile_number && addressForm.alternate_mobile_number.length !== 10)}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save Address
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Saved Addresses list */}
                      {addresses.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850">
                          <p className="text-sm text-slate-400">No saved addresses found. Please add a new delivery address.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map(addr => {
                            const isSelected = selectedAddressId === addr.id;
                            return (
                              <div
                                key={addr.id}
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all relative flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                              >
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-1.5 flex-wrap">
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                        addr.address_type === 'Home'
                                          ? 'bg-blue-105 dark:bg-blue-900/35 text-blue-600 dark:text-blue-400'
                                          : addr.address_type === 'Work'
                                          ? 'bg-amber-105 dark:bg-amber-900/35 text-amber-600 dark:text-amber-400'
                                          : 'bg-purple-105 dark:bg-purple-900/35 text-purple-600 dark:text-purple-400'
                                      }`}>
                                        {addr.address_type === 'Home' && <Home className="h-2.5 w-2.5" />}
                                        {addr.address_type === 'Work' && <Briefcase className="h-2.5 w-2.5" />}
                                        {addr.address_type === 'Other' && <MapPin className="h-2.5 w-2.5" />}
                                        {addr.address_type}
                                      </span>
                                      
                                      {addr.is_default && (
                                        <span className="text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/35 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    
                                    {isSelected && (
                                      <span className="bg-emerald-500 text-white rounded-full p-0.5">
                                        <Check className="h-3 w-3" />
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs text-slate-650 dark:text-slate-300 font-medium leading-relaxed space-y-1 mt-3">
                                    <p className="font-bold text-slate-800 dark:text-slate-100">
                                      {addr.building_name ? `${addr.house_number}, ${addr.building_name}` : addr.house_number}
                                    </p>
                                    <p>{addr.street}</p>
                                    <p>{addr.area}</p>
                                    {addr.landmark && <p className="text-slate-400 dark:text-slate-450 text-[11px]">Landmark: {addr.landmark}</p>}
                                    <p>{addr.city}, {addr.state} - {addr.pincode}, {addr.country || 'India'}</p>
                                    {addr.alternate_mobile_number && (
                                      <p className="text-slate-455 dark:text-slate-500 text-[10px] mt-1 font-semibold font-mono">Alt Mobile: {addr.alternate_mobile_number}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditAddressClick(addr);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-805 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteAddress(addr.id, e)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-805 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  {!addr.is_default && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                                      className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 transition-colors"
                                    >
                                      Set as Default
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Selected Address Preview string */}
                      {selectedAddressId && addresses.length > 0 && (
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-left space-y-1">
                          <span className="text-xs font-bold text-emerald-500 block">Delivery Address Preview:</span>
                          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium italic break-words">
                            {formatAddressPreview(addresses.find(a => a.id === selectedAddressId))}
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={!isAddressSelectionValid()}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>{t('checkout_page.continue_payment')}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Guest Checkout Address Form */
                <form id="address-section" onSubmit={handleNextStep} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 text-left">
                  <h2 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-emerald-500" />
                    <span>{t('checkout_page.shipping_details')}</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">{t('checkout_page.full_name')} *</label>
                      <input
                        type="text"
                        required
                        value={shippingDetails.name}
                        onChange={(e) => setShippingDetails({...shippingDetails, name: e.target.value})}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">{t('checkout_page.phone_number')} *</label>
                      <input
                        type="tel"
                        required
                        value={shippingDetails.phone}
                        onChange={(e) => handleGuestPhoneChange(e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                      />
                      <div className="mt-1">
                        {shippingDetails.phone.length < 10 ? (
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
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t('checkout_page.email_address')} *</label>
                    <input
                      type="email"
                      required
                      value={shippingDetails.email}
                      onChange={(e) => setShippingDetails({...shippingDetails, email: e.target.value})}
                      className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                    />
                    {shippingDetails.email && !isEmailValid(shippingDetails.email) && (
                      <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                        Please enter a valid email address.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">House / Flat / Ward Number *</label>
                      <input
                        type="text"
                        required
                        value={shippingDetails.house_number || ''}
                        onChange={(e) => handleGuestInputChange('house_number', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                        placeholder="e.g. House No. 15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Building Name (Optional)</label>
                      <input
                        type="text"
                        value={shippingDetails.building_name || ''}
                        onChange={(e) => handleGuestInputChange('building_name', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                        placeholder="e.g. Green Residency"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Street / Road Name *</label>
                      <input
                        type="text"
                        required
                        value={shippingDetails.street || ''}
                        onChange={(e) => handleGuestInputChange('street', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                        placeholder="e.g. MG Road"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Area / Locality *</label>
                      <input
                        type="text"
                        required
                        value={shippingDetails.area || ''}
                        onChange={(e) => handleGuestInputChange('area', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                        placeholder="e.g. Vaishali Nagar"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Landmark *</label>
                      <input
                        type="text"
                        required
                        value={shippingDetails.landmark || ''}
                        onChange={(e) => handleGuestInputChange('landmark', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                        placeholder="e.g. Near Hanuman Temple"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={shippingDetails.pincode || ''}
                        onChange={(e) => handleGuestInputChange('pincode', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                        placeholder="e.g. 302021"
                      />
                      {shippingDetails.pincode && shippingDetails.pincode.length !== 6 && (
                        <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                          Please enter a valid 6-digit PIN Code.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={shippingDetails.city}
                        onChange={(e) => handleGuestInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={shippingDetails.state}
                        onChange={(e) => handleGuestInputChange('state', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Country *</label>
                      <input
                        type="text"
                        required
                        value={shippingDetails.country}
                        onChange={(e) => handleGuestInputChange('country', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                        placeholder="e.g. India"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Address Type *</label>
                      <select
                        value={shippingDetails.address_type}
                        onChange={(e) => handleGuestInputChange('address_type', e.target.value)}
                        className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-105 font-medium"
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Formatted Address Preview for guest */}
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-left space-y-1">
                    <span className="text-xs font-bold text-emerald-500 block">Delivery Address Preview:</span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium italic break-words">
                      {formatAddressPreview(shippingDetails) || 'Start typing address to see preview...'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!isAddressSelectionValid()}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{t('checkout_page.continue_payment')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Cart Preview sidepanel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 h-fit shadow-sm space-y-4">
              <h3 className="text-base font-bold border-b border-slate-100 dark:border-slate-800 pb-2">{t('checkout_page.order_summary')}</h3>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850 pr-1">
                {checkoutItems.map(item => (
                  <div key={item.product_id} className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 flex-grow">
                      {item.name} <span className="text-slate-455">x{item.quantity}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-50 flex-shrink-0 price-amount">
                      ₹{formatPrice(Math.round(item.price * item.quantity))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t('checkout_page.subtotal')}</span>
                  <span className="price-amount">₹{formatPrice(Math.round(checkoutTotal))}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('checkout_page.gst')}</span>
                  <span className="price-amount">₹{formatPrice(gstTax)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('checkout_page.shipping_fee')}</span>
                  <span>{shippingFee === 0 ? t('cart_page.free') : <span className="price-amount">₹{formatPrice(shippingFee)}</span>}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-100 dark:border-slate-805">
                  <span>{t('checkout_page.total_amount')}</span>
                  <span className="price-amount">₹{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT & OTP VERIFICATION */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Payment Methods */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                  <span>{t('checkout_page.choose_payment')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'COD' 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-350'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-1 accent-emerald-500"
                    />
                    <div>
                      <span className="block font-bold text-sm">{t('checkout_page.cod')}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">{t('checkout_page.cod_desc')}</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'Card' 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-350'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'Card'}
                      onChange={() => setPaymentMethod('Card')}
                      className="mt-1 accent-emerald-500"
                    />
                    <div>
                      <span className="block font-bold text-sm">{t('checkout_page.card')}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">{t('checkout_page.card_desc')}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card Details form block */}
              {paymentMethod === 'Card' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Card Details</span>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Card Number</label>
                      <input
                        type="text"
                        maxLength="19"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(val);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-mono tracking-wider"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Expiry Date</label>
                        <input
                          type="text"
                          maxLength="5"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 2) {
                              val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                            }
                            setCardExpiry(val);
                          }}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength="3"
                          placeholder="***"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setTermsAccepted(false);
                    setCheckboxChecked(false);
                    setStep(1);
                  }}
                  className="btn-secondary-white flex-1 py-3 rounded-xl text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('checkout_page.edit_address')}</span>
                </button>

                <button
                  onClick={handlePayClick}
                  disabled={placingOrder}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>
                    {placingOrder 
                      ? t('checkout_page.placing_order') 
                      : (paymentMethod === 'Card' ? 'Pay & Verify OTP' : t('checkout_page.place_order'))
                    }
                  </span>
                  <CheckCircle className="h-4 w-4" />
                </button>
              </div>

            </div>

            {/* Price details right side */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 h-fit shadow-sm space-y-4">
              <h3 className="text-base font-bold border-b border-slate-100 dark:border-slate-800 pb-2">{t('checkout_page.billing_details')}</h3>
              <div className="text-xs space-y-3">
                <div className="flex justify-between text-slate-400">
                  <span>{t('checkout_page.subtotal')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 price-amount">₹{formatPrice(Math.round(checkoutTotal))}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('checkout_page.gst')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 price-amount">₹{formatPrice(gstTax)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('checkout_page.shipping_cost')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{shippingFee === 0 ? t('cart_page.free') : <span className="price-amount">₹{formatPrice(shippingFee)}</span>}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-100 dark:border-slate-805">
                  <span>{t('checkout_page.total_amount')}</span>
                  <span className="text-base text-emerald-500 font-extrabold price-amount">₹{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS RECEIPT SCREEN */}
        {step === 3 && successOrder && (
          <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-805 rounded-3xl p-8 text-center shadow-lg">
            <div className="bg-green-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-green-500">
              <CheckCircle className="h-12 w-12" />
            </div>
            
            <h2 className="text-2xl font-black mt-6 tracking-tight">{t('checkout_page.order_success')}</h2>
            <p className="text-xs text-slate-450 mt-1">{t('checkout_page.thank_you')}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-950 font-mono font-bold text-sm tracking-wider rounded border dark:border-slate-800 text-slate-800 dark:text-slate-100">
              {successOrder.order_id}
            </span>

            <div className="mt-8 border-t border-b border-slate-100 dark:border-slate-800 py-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('checkout_page.status')}</span>
                <span className="font-bold text-slate-800 dark:text-white">{t('orders.status_pending', { defaultValue: 'Pending' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('checkout_page.total_paid')}</span>
                <span className="font-bold text-slate-855 dark:text-slate-55 price-amount">₹{formatPrice(successOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('checkout_page.est_delivery')}</span>
                <span className="font-bold text-slate-850 dark:text-slate-55">{t('checkout_page.delivery_days')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('checkout_page.shipping_address')}</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300 text-right max-w-[200px] truncate">
                  {successOrder.shipping_address.address}, {successOrder.shipping_address.city}
                </span>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => navigate('/')}
                className="btn-secondary-white flex-1 py-3 rounded-xl text-xs transition-colors"
              >
                {t('cart_page.continue_shopping')}
              </button>
              
              <button
                onClick={() => navigate('/orders')}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                {t('orders_page.track_orders', { defaultValue: 'Track Orders' })}
              </button>
            </div>
          </div>
        )}

        {/* Terms & Conditions Modal Overlay */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col">
              <button
                onClick={() => {
                  setShowTermsModal(false);
                  setCheckboxChecked(false);
                }}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 rounded-full hover:bg-slate-105 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-black text-slate-855 dark:text-slate-100 mb-2 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <span>{t('checkout_page.agreement_title')}</span>
              </h3>

              <div className="overflow-y-auto my-4 pr-1 text-slate-655 dark:text-slate-350 text-xs leading-relaxed space-y-3 max-h-[50vh]">
                <p className="font-semibold text-slate-500 dark:text-slate-405">
                  {t('checkout_page.agreement_subtitle')}
                </p>
                <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <div className="flex gap-2.5">
                    <span className="font-bold text-emerald-500">1.</span>
                    <p className="text-slate-600 dark:text-slate-300">{t('checkout_page.agreement_step1')}</p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="font-bold text-emerald-500">2.</span>
                    <p className="text-slate-600 dark:text-slate-300">{t('checkout_page.agreement_step2')}</p>
                  </div>
                  <div className="flex gap-2.5 border-t border-slate-205 dark:border-slate-800 pt-2">
                    <span className="font-bold text-emerald-500">3.</span>
                    <p className="text-slate-600 dark:text-slate-300">{t('checkout_page.agreement_step3')}</p>
                  </div>
                  <div className="flex gap-2.5 border-t border-slate-205 dark:border-slate-800 pt-2">
                    <span className="font-bold text-emerald-500">4.</span>
                    <p className="text-slate-600 dark:text-slate-300">{t('checkout_page.agreement_step4')}</p>
                  </div>
                  <div className="flex gap-2.5 border-t border-slate-205 dark:border-slate-800 pt-2">
                    <span className="font-bold text-emerald-500">5.</span>
                    <p className="text-slate-600 dark:text-slate-300">{t('checkout_page.agreement_step5')}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 py-3 border-t border-slate-100 dark:border-slate-850">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={checkboxChecked}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 accent-emerald-500 border-slate-350 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="terms-checkbox" className="text-sm text-slate-600 dark:text-slate-300 font-medium select-none cursor-pointer">
                  {t('checkout_page.agree_checkbox')}
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-855">
                <button
                  type="button"
                  onClick={() => {
                    setShowTermsModal(false);
                    setCheckboxChecked(false);
                  }}
                  className="btn-secondary-white flex-1 py-2.5 rounded-xl transition-all text-xs"
                >
                  {t('checkout_page.cancel')}
                </button>
                <button
                  type="button"
                  disabled={!checkboxChecked}
                  onClick={() => {
                    setTermsAccepted(true);
                    setStep(2);
                    setShowTermsModal(false);
                  }}
                  className={`flex-1 py-2.5 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 ${
                    checkboxChecked 
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-md cursor-pointer' 
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span>{t('checkout_page.continue_payment')}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Verification Modal */}
        {showOtpVerification && (
          <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl flex items-center justify-center">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">OTP Verification</h3>
                  <p className="text-[10px] text-slate-400">Secure 3D payment verification</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  An OTP has been sent to your mobile number: <span className="font-bold text-slate-800 dark:text-slate-200">******{shippingDetails.phone ? shippingDetails.phone.slice(-4) : 'XXXX'}</span>.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>For testing, please enter OTP: <strong>123456</strong></span>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="******"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-widest text-lg font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100"
                    />
                    {otpError && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1.5">{otpError}</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400">
                    {otpCountdown > 0 ? (
                      <span>Resend OTP in <strong className="text-slate-600 dark:text-slate-350">{otpCountdown}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCountdown(59);
                          setOtpError('');
                          setOtpValue('');
                        }}
                        className="text-emerald-500 hover:text-emerald-600 font-bold bg-transparent border-none cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpVerification(false);
                        setOtpValue('');
                        setOtpError('');
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-355 font-bold py-2.5 rounded-xl text-xs border-none cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={otpValue.length !== 6}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs border-none cursor-pointer disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
                    >
                      <span>Verify & Pay</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
