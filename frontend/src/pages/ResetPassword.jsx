import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, ShoppingBag, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check if the user has successfully verified the OTP first
    const verified = sessionStorage.getItem('otp_verified') === 'true';
    const email = sessionStorage.getItem('reset_email');

    if (!verified || !email) {
      // Redirect back to forgot password page if direct access attempted
      navigate('/forgot-password');
    } else {
      setIsVerified(true);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all the fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const email = sessionStorage.getItem('reset_email');
    if (!email) {
      setError("Session expired. Please start forgot password flow again.");
      setTimeout(() => navigate('/forgot-password'), 2000);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email: email,
        new_password: newPassword
      });

      setSuccessMessage(response.data.message || "Password reset successfully!");
      
      // Clean up verification session keys
      sessionStorage.removeItem('otp_verified');
      sessionStorage.removeItem('reset_email');

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500 dark:text-slate-400 text-sm font-semibold animate-pulse">
          Verifying security session...
        </div>
      </div>
    );
  }

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
            Reset Password
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Please enter your new security password. Choose a strong combination.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 text-sm bg-white/70 dark:bg-slate-800/55 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-650 bg-transparent border-0 outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 text-sm bg-white/70 dark:bg-slate-800/55 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3.5 mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Updating Password...' : 'Reset Password'}</span>
            <CheckCircle className="h-4 w-4" />
          </button>

          <div className="text-center mt-4">
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-xs font-bold text-slate-550 dark:text-slate-400 hover:underline gap-1 bg-transparent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Verification</span>
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
