import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, LogIn, Sparkles, User, Phone, Shield, UserCheck, ShoppingBag, ArrowRight, Mail, Eye, EyeOff, Key, ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userLogin, adminLogin, microsoftLogin, oauthLogin, user, isAdmin } = useContext(AuthContext);

  const [msLoading, setMsLoading] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectDest = searchParams.get('redirect') || '/';

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const oauthToken = queryParams.get('token');
    const oauthUserStr = queryParams.get('user');
    const oauthError = queryParams.get('error');

    if (oauthToken && oauthUserStr) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(oauthUserStr));
        oauthLogin(oauthToken, decodedUser);
        navigate(redirectDest, { replace: true });
      } catch (err) {
        console.error("Error logging in via OAuth callback:", err);
        setError("OAuth login failed to parse user profile.");
      }
    } else if (oauthError) {
      setError(decodeURIComponent(oauthError));
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, redirectDest, oauthLogin]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token");
      if (accessToken) {
        handleMsCallback(accessToken);
      }
    }
  }, []);

  const handleMsCallback = async (accessToken) => {
    setMsLoading(true);
    setError('');
    // Clear URL hash immediately
    window.history.replaceState(null, null, window.location.pathname);
    try {
      await microsoftLogin(accessToken);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Microsoft authentication failed. Please try again.");
    } finally {
      setMsLoading(false);
    }
  };

  const handleMicrosoftLogin = (e) => {
    e.preventDefault();
    alert("Coming Soon");
  };

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    alert("Coming Soon");
  };

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate(redirectDest);
      }
    }
  }, [user, isAdmin, navigate, redirectDest]);

  // Tab State: 'customer' or 'admin'
  const [activeTab, setActiveTab] = useState('customer');
  
  // Form States
  const [name, setName] = useState(''); // Email / Mobile Number
  const [mobile, setMobile] = useState(''); // Password
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmailOrMobile, setResetEmailOrMobile] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !mobile) {
      setError("Please enter your email/mobile and password.");
      return;
    }

    setLoading(true);
    try {
      await userLogin(name.trim(), mobile);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid email/mobile or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!adminId || !password) {
      setError("Please enter both Admin ID and password.");
      return;
    }
    setLoading(true);
    try {
      const success = await adminLogin(adminId, password);
      if (!success) {
        setError("Invalid Admin credentials. Check configured backend environment config.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during admin sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccessMessage('');
    if (!resetEmailOrMobile) {
      setError("Please enter your registered email or mobile number.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: resetEmailOrMobile.trim()
      });
      setResetSuccessMessage(response.data.message || "OTP sent successfully!");
      setResetStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Account not found. Please register first.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccessMessage('');
    if (!resetOtp || !resetNewPassword || !resetConfirmPassword) {
      setError("Please fill in all the fields.");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email: resetEmailOrMobile.trim(),
        otp: resetOtp.trim(),
        new_password: resetNewPassword
      });
      setResetSuccessMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetStep(1);
        setResetEmailOrMobile('');
        setResetOtp('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        setResetSuccessMessage('');
        setError('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to reset password. Please verify the OTP.");
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

      {/* Glassmorphic Auth Card */}
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
            {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {showForgotPassword 
              ? (resetStep === 1 ? 'Enter your registered credentials to receive a reset OTP.' : 'Set your new password and verify the OTP.')
              : 'Shop smart, manage easily. Access your dashboard or account.'}
          </p>
        </div>

        {msLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 animate-pulse">
              Signing in with Microsoft... Please wait.
            </p>
          </div>
        ) : (
          <>
            {/* Error Alert Box */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 mb-5 shadow-sm"
                >
                  <Shield className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <AnimatePresence mode="wait">
              {showForgotPassword ? (
                resetStep === 1 ? (
                  <motion.form
                    key="forgot-step1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleForgotSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                          Registered Email or Mobile Number
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <input
                            type="text"
                            required
                            placeholder="Enter your email or mobile"
                            value={resetEmailOrMobile}
                            onChange={(e) => setResetEmailOrMobile(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 text-sm bg-white/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 py-3.5 mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <span>{loading ? 'Sending OTP...' : 'Send OTP'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(false); setError(''); }}
                      className="w-full flex items-center justify-center space-x-2 py-3.5 mt-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Login</span>
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="forgot-step2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleResetSubmit}
                    className="space-y-4"
                  >
                    {resetSuccessMessage && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 mb-3">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{resetSuccessMessage}</span>
                      </div>
                    )}

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                          Verification OTP
                        </label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <input
                            type="text"
                            required
                            placeholder="Enter 6-digit OTP"
                            value={resetOtp}
                            onChange={(e) => setResetOtp(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 text-sm bg-white/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <input
                            type="password"
                            required
                            placeholder="Min 6 characters"
                            value={resetNewPassword}
                            onChange={(e) => setResetNewPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 text-sm bg-white/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <input
                            type="password"
                            required
                            placeholder="Re-enter password"
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 text-sm bg-white/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 py-3.5 mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <span>{loading ? 'Resetting Password...' : 'Reset Password'}</span>
                      <CheckCircle className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setResetStep(1); setError(''); setResetSuccessMessage(''); }}
                      className="w-full text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-2 bg-transparent border-0 cursor-pointer"
                    >
                      Back to Step 1
                    </button>
                  </motion.form>
                )
              ) : (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleCustomerSubmit}
                  className="space-y-4"
                >
                  {/* Unified Login Fields */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Email or Mobile Number
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="Enter email or mobile number"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 text-sm bg-white/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="w-full pl-11 pr-11 py-3 text-sm bg-white/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-650 bg-transparent border-0 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Create Account Link */}
            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              <p>
                New to SSJewellery?{' '}
                <Link to="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                  Create Account
                </Link>
              </p>
            </div>

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/70 dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-450 dark:text-slate-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social SSO Login Buttons */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-650 dark:text-slate-200 shadow-sm transition-all opacity-70 cursor-not-allowed"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-650 dark:text-slate-200 shadow-sm transition-all opacity-70 cursor-not-allowed"
              >
                <svg className="h-4 w-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M0 0h11v11H0z"/>
                  <path fill="#81bc06" d="M12 0h11v11H12z"/>
                  <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                  <path fill="#ffba08" d="M12 12h11v11H12z"/>
                </svg>
                <span>Microsoft</span>
              </button>
            </div>
          </>
        )}

      </motion.div>
    </div>
  );
};
