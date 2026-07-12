import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Phone, MapPin, Sparkles, UserPlus, Key, ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const searchParams = new URLSearchParams(location.search);
  const redirectDest = searchParams.get('redirect') || '/';

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      navigate(redirectDest);
    }
  }, [user, navigate, redirectDest]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [otpMode, setOtpMode] = useState('');

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    mobile: false
  });

  const handleBlur = (e) => {
    const { name } = e.target;
    if (['name', 'email', 'password', 'mobile'].includes(name)) {
      setTouched((prev) => ({
        ...prev,
        [name]: true
      }));
    }
  };

  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'mobile') {
      value = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'pincode') {
      value = value.replace(/[^0-9]/g, '').slice(0, 6);
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    
    // Set all fields to touched to expose errors
    setTouched({
      name: true,
      email: true,
      password: true,
      mobile: true
    });

    const isNameInvalid = !formData.name.trim();
    const isMobileInvalid = formData.mobile.length !== 10;
    const isEmailInvalidValue = !formData.email || !isEmailValid(formData.email);
    const isPasswordInvalid = !formData.password;

    if (isNameInvalid || isMobileInvalid || isEmailInvalidValue || isPasswordInvalid) {
      setError("Please fill in all the required fields correctly.");
      return;
    }

    if (isPincodeInvalid) {
      setError("Please enter a valid 6-digit PIN Code.");
      return;
    }

    setLoading(true);
    setError('');

    const address = {
      street: formData.street,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile,
        address: address
      });
      setOtpSent(true);
      if (response.data.otp) {
        setDevOtp(response.data.otp);
      }
      if (response.data.otp_mode) {
        setOtpMode(response.data.otp_mode);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate security OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/resend-otp`, {
        email: formData.email
      });
      if (response.data.otp) {
        setDevOtp(response.data.otp);
      }
      if (response.data.otp_mode) {
        setOtpMode(response.data.otp_mode);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to resend verification OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setError("Please enter the 6-digit OTP code sent to your email address.");
      return;
    }

    setVerifyingOtp(true);
    setError('');

    try {
      // Verify OTP (which also registers/creates the user in the backend)
      await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email: formData.email,
        otp: otpCode
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/login?redirect=${encodeURIComponent(redirectDest)}`);
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "OTP verification failed. Try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const isAddressEmpty = !formData.street.trim() && !formData.city.trim() && !formData.state.trim() && !formData.pincode.trim();
  const isPincodeInvalid = isAddressEmpty ? false : formData.pincode.length !== 6;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl w-full space-y-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-8 rounded-3xl shadow-lg relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 h-32 w-32 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 bg-indigo-500/10 rounded-full blur-2xl" />

        <div className="text-center relative flex flex-col items-center">
          <div className="p-1 bg-[#D4A75F]/10 dark:bg-[#D4A75F]/15 rounded-2xl border border-[#D4A75F]/20 w-fit mx-auto mb-3">
            <img src="/logo-monogram.png" className="h-10 w-10 object-contain rounded-xl" alt="SSJewellery Monogram" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Create Account
          </h2>
          <p className="mt-1.5 text-xs text-slate-450">
            Register below to start purchasing premium products on SSJewellery.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-650 dark:text-red-450 p-3.5 rounded-2xl text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-650 dark:text-emerald-450 p-3.5 rounded-2xl text-xs text-center font-bold">
            Account created successfully! Redirecting you to login...
          </div>
        )}

        {!otpSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp} noValidate>
            <div className="space-y-4">
              
              {/* Primary Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-850 dark:text-slate-100"
                    />
                  </div>
                  {touched.name && !formData.name.trim() && (
                    <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                      Full Name is required.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-850 dark:text-slate-100"
                    />
                  </div>
                  <div className="mt-1">
                    {formData.mobile.length === 10 ? (
                      <p className="text-[11px] text-[#22C55E] font-semibold flex items-center gap-1">
                        ✓ Valid Mobile Number
                      </p>
                    ) : (
                      touched.mobile && formData.mobile.length < 10 && (
                        <p className="text-[11px] text-[#EF4444] font-semibold">
                          Please enter a valid 10-digit mobile number.
                        </p>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-850 dark:text-slate-100"
                  />
                </div>
                {touched.email && (!formData.email || !isEmailValid(formData.email)) && (
                  <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-850 dark:text-slate-100"
                  />
                </div>
                {touched.password && !formData.password && (
                  <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                    Password is required.
                  </p>
                )}
              </div>

              {/* Address fields title */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-350 mb-3">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <span>Address Details (Optional)</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                      placeholder="Apartment/Flat, Street name"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                      />
                      {formData.pincode && formData.pincode.length !== 6 && (
                        <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                          Please enter a valid 6-digit PIN Code.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading || success || isPincodeInvalid}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyAndRegister}>
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-350">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span>Confirm Registration OTP Security</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                To complete the registration, we require a verification OTP code sent to your email address <strong className="text-slate-800 dark:text-white">({formData.email})</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-pulse" />
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="py-2.5 px-4 text-xs text-emerald-500 hover:underline bg-transparent cursor-pointer font-bold"
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>

              {otpMode === 'development' && devOtp && (
                <div className="mt-4 p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-center shadow-sm backdrop-blur-sm">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-300/30 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Development Mode OTP
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-350">
                    Development OTP: <strong className="text-amber-700 dark:text-amber-400 text-base tracking-widest font-black ml-1 select-all">{devOtp}</strong>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="btn-secondary-white flex-1 py-3 rounded-xl text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Edit Details</span>
                </button>

                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{verifyingOtp ? 'Verifying...' : 'Verify & Register'}</span>
                  <CheckCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="text-center text-xs mt-6 text-slate-400">
          <span>Already have an account? </span>
          <Link
            to={`/login?redirect=${encodeURIComponent(redirectDest)}`}
            className="text-emerald-500 font-bold hover:underline"
          >
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};
