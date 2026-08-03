import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Phone, Sparkles, UserPlus, Key, ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { isAllowedEmailDomain, ALLOWED_EMAIL_DOMAIN_ERROR, normalizeEmail } from '../utils/emailValidator';

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
    mobile: ''
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

    if (!isAllowedEmailDomain(formData.email)) {
      setError(ALLOWED_EMAIL_DOMAIN_ERROR);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
        name: formData.name,
        email: normalizeEmail(formData.email),
        password: formData.password,
        mobile: formData.mobile
      });
      setOtpSent(true);
      const devOtpCode = response.data.dev_otp || response.data.otp;
      if (devOtpCode) {
        setDevOtp(devOtpCode);
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
        email: normalizeEmail(formData.email)
      });
      const devOtpCode = response.data.dev_otp || response.data.otp;
      if (devOtpCode) {
        setDevOtp(devOtpCode);
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
        email: normalizeEmail(formData.email),
        otp: otpCode
      });

      setDevOtp('');
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
                {touched.email && formData.email && isEmailValid(formData.email) && !isAllowedEmailDomain(formData.email) && (
                  <p className="mt-1 text-[11px] text-[#EF4444] font-semibold">
                    {ALLOWED_EMAIL_DOMAIN_ERROR}
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

            </div>

            <button
              type="submit"
              disabled={loading || success}
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

              {devOtp && (
                <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border-2 border-dashed border-amber-300 dark:border-amber-700/50 rounded-2xl text-center shadow-md backdrop-blur-sm mb-4">
                  <div className="text-xs font-black tracking-wider text-amber-700 dark:text-amber-400 uppercase mb-1">
                    DEV MODE ONLY
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
                    Generated Registration OTP
                  </div>
                  <div className="text-3xl font-black tracking-widest text-amber-600 dark:text-amber-400 my-1 select-all">
                    {devOtp}
                  </div>
                  <div className="text-[11px] font-semibold italic text-slate-500 dark:text-slate-400 mt-1">
                    (Email sending disabled)
                  </div>
                </div>
              )}

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

              <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setDevOtp(''); }}
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
