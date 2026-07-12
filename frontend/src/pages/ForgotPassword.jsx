import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Key, ShieldCheck, ArrowLeft, CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter Email/Mobile, 2 = Verify OTP

  // 6-digit OTP array
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState('');
  const [otpMode, setOtpMode] = useState('');

  // Auto-focus first OTP input on step 2 load
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        const firstInput = document.getElementById('otp-input-0');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }, [step]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!emailOrMobile.trim()) {
      setError("Please enter your registered email or mobile number.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: emailOrMobile.trim()
      });
      setSuccessMessage(response.data.message || "OTP sent successfully!");
      setStep(2);
      // Store email/mobile temporarily for verify and resend
      sessionStorage.setItem('reset_pending_email', response.data.email || emailOrMobile.trim());
      if (response.data.otp) {
        setDevOtp(response.data.otp);
      }
      if (response.data.otp_mode) {
        setOtpMode(response.data.otp_mode);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Account not found. Please register first.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    // Allow single digits only
    if (/^[0-9]$/.test(value) || value === '') {
      const newDigits = [...otpDigits];
      newDigits[index] = value;
      setOtpDigits(newDigits);

      // Auto-focus next input field if digit entered
      if (value !== '' && index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index] === '' && index > 0) {
        // Focus previous input if currently empty
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        // Clear current value
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    const otpCode = otpDigits.join('');
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    const pendingEmail = sessionStorage.getItem('reset_pending_email');
    if (!pendingEmail) {
      setError("Session expired. Please request a new verification code.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-reset-otp`, {
        email: pendingEmail,
        otp: otpCode
      });
      
      setSuccessMessage(response.data.message || "OTP verified successfully!");
      // Mark as verified for /reset-password protection
      sessionStorage.setItem('otp_verified', 'true');
      sessionStorage.setItem('reset_email', pendingEmail);
      sessionStorage.removeItem('reset_pending_email');

      // Navigate to reset password page after 1.5 seconds
      setTimeout(() => {
        navigate('/reset-password');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccessMessage('');
    const pendingEmail = sessionStorage.getItem('reset_pending_email');
    if (!pendingEmail) {
      setError("Session expired. Please request a new verification code.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/resend-reset-otp`, {
        email: pendingEmail
      });
      setSuccessMessage(response.data.message || "OTP code resent successfully!");
      // Reset input fields
      setOtpDigits(['', '', '', '', '', '']);
      if (response.data.otp) {
        setDevOtp(response.data.otp);
      }
      if (response.data.otp_mode) {
        setOtpMode(response.data.otp_mode);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden bg-gradient-to-tr from-emerald-50 via-emerald-100/40 to-teal-50 dark:from-slate-950 dark:via-slate-900/60 dark:to-emerald-950/20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-300/30 dark:bg-emerald-800/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-300/20 dark:bg-teal-800/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '12s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-900/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Shape decoration elements */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute top-16 left-12 w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-lg pointer-events-none hidden md:block"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute bottom-20 right-16 w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 shadow-lg pointer-events-none hidden md:block"
      />

      {/* Glassmorphic Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center space-x-2.5 mb-3">
            <div className="p-1 bg-[#D4A75F]/10 dark:bg-[#D4A75F]/15 rounded-2xl border border-[#D4A75F]/20">
              <img src="/logo-monogram.png" className="h-8 w-8 object-contain rounded-xl" alt="SSJewellery Monogram" />
            </div>
            <span className="font-great-vibes text-2xl text-[#D4A75F] select-none">SS Jewellery</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            {step === 1 ? 'Forgot Password' : 'Verify Security OTP'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {step === 1 
              ? 'Enter your registered email or mobile number to receive a temporary 6-digit OTP code.' 
              : 'Please enter the 6-digit verification code sent to your registered email address.'}
          </p>
        </div>

        {/* Error Alert Box */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 p-3 rounded-2xl text-xs font-medium mb-5 text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert Box */}
        <AnimatePresence mode="wait">
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl text-xs font-medium mb-5 text-center"
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms Container */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="forgot-step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter email or mobile number"
                    value={emailOrMobile}
                    onChange={(e) => setEmailOrMobile(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-base bg-white/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-base font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Sending OTP...' : 'Send Reset OTP'}</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline gap-1 bg-transparent"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="forgot-step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >
              <div className="text-center">
                <h3 className="text-sm font-bold flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-350">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <span>Enter Verification Code</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-455 mt-1 leading-normal">
                  OTP was sent to your registered address. Please fill in the 6 digit code below.
                </p>
              </div>

              {/* 6-digit input structure [ _ _ _ _ _ _ ] */}
              <div className="flex justify-center gap-2 sm:gap-3 my-6">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-11 h-12 text-center text-lg font-bold bg-white/70 dark:bg-slate-800/55 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
                  />
                ))}
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

              <div className="flex gap-4 mt-5">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl text-base font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border border-slate-250 dark:border-slate-700 disabled:opacity-50"
                >
                  <span>{loading ? 'Sending...' : 'Resend OTP'}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-base font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
                  <CheckCircle className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="text-center mt-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline gap-1 bg-transparent cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Change Email / Mobile</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
