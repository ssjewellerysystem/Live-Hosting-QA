import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  CreditCard, Search, RefreshCw, AlertCircle, CheckCircle, 
  Clock, XCircle, ArrowUpRight, DollarSign, ChevronLeft, ChevronRight, 
  ExternalLink, Eye, Info, Calendar, User, ShoppingBag, X, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api';

export const AdminPaymentManagement = ({ onNavigateToOrder, onNavigateToCustomer }) => {
  // Analytics state
  const [analytics, setAnalytics] = useState({
    total_payments: 0,
    today_payments: 0,
    successful_payments: 0,
    pending_payments: 0,
    failed_payments: 0,
    refunded_payments: 0,
    total_revenue: 0,
    monthly_revenue: 0,
    today_revenue: 0,
    average_order_value: 0
  });

  // Table state
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total_count: 0, total_pages: 1 });

  // Filter & Search state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('latest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Transaction for Slide-Over Drawer
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [txDetails, setTxDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Auth Header helper
  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/payments/analytics`, {
        headers: getAuthHeader()
      });
      if (res.data && res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error("Error fetching payment analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Fetch Payments Table Data
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search.trim(),
        status: statusFilter,
        gateway: 'all',
        environment: 'all',
        sort,
        start_date: startDate,
        end_date: endDate
      };

      const res = await axios.get(`${API_BASE_URL}/admin/payments`, {
        headers: getAuthHeader(),
        params
      });

      if (res.data && res.data.success) {
        setPayments(res.data.items || []);
        setPagination(res.data.pagination || { total_count: 0, total_pages: 1 });
      }
    } catch (err) {
      console.error("Error fetching payments list:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sort, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Open Details Drawer
  const handleOpenDetails = async (id) => {
    setSelectedTxId(id);
    setDetailsLoading(true);
    setTxDetails(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/payments/${id}`, {
        headers: getAuthHeader()
      });
      if (res.data && res.data.success) {
        setTxDetails(res.data.transaction);
      }
    } catch (err) {
      console.error("Error fetching payment details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Process Refund
  const handleProcessRefund = async () => {
    if (!selectedTxId) return;
    try {
      setRefundProcessing(true);
      const res = await axios.post(`${API_BASE_URL}/admin/payments/${selectedTxId}/refund`, {
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason
      }, { headers: getAuthHeader() });

      if (res.data && res.data.success) {
        setFeedbackMsg({ type: 'success', text: res.data.message || 'Refund processed successfully!' });
        setRefundModalOpen(false);
        handleOpenDetails(selectedTxId);
        fetchAnalytics();
        fetchPayments();
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Refund processing failed';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setRefundProcessing(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const st = String(status || '').toLowerCase();
    if (['captured', 'successful', 'completed', 'paid', 'success'].includes(st)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
          <CheckCircle className="w-3.5 h-3.5" /> Success
        </span>
      );
    }
    if (['pending', 'processing', 'authorized', 'created'].includes(st)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
          <Clock className="w-3.5 h-3.5 animate-spin" /> Pending
        </span>
      );
    }
    if (['refunded'].includes(st)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
          <RefreshCw className="w-3.5 h-3.5" /> Refunded
        </span>
      );
    }
    if (['cancelled', 'canceled'].includes(st)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
        <XCircle className="w-3.5 h-3.5" /> Failed
      </span>
    );
  };

  return (
    <div className="w-full space-y-6 text-slate-800 dark:text-slate-100 font-sans">

      {/* Feedback Banner */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200' 
                : 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-[#3F1D5A]/10 dark:border-[#D4A75F]/30 text-[#3F1D5A] dark:text-[#D4A75F]">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-wide">
              Payment Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor transaction auditing, revenue metrics, and refund operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchAnalytics(); fetchPayments(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 border border-[#3F1D5A]/20 dark:border-[#D4A75F]/30 text-[#3F1D5A] dark:text-[#D4A75F] transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              ₹{analytics.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Lifetime captured revenue</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Revenue</span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-[#D4A75F] border border-amber-200 dark:border-[#D4A75F]/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-[#3F1D5A] dark:text-[#D4A75F]">
              ₹{analytics.monthly_revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Current month earnings</p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Order Value</span>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              ₹{analytics.average_order_value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Average per paid order</p>
          </div>
        </div>

        {/* Total Payments Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Payments</span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#3F1D5A] dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              {analytics.total_payments}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Today: {analytics.today_payments} transactions</p>
          </div>
        </div>

        {/* Successful Payments */}
        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Success</span>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-white">{analytics.successful_payments}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {analytics.total_payments > 0 ? Math.round((analytics.successful_payments / analytics.total_payments) * 100) : 0}% success
            </span>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-white">{analytics.pending_payments}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400">Processing</span>
          </div>
        </div>

        {/* Failed Payments */}
        <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Failed</span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-white">{analytics.failed_payments}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400">Declined</span>
          </div>
        </div>

        {/* Refunded Payments */}
        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Refunded</span>
            <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-white">{analytics.refunded_payments}</span>
            <span className="text-xs text-purple-600 dark:text-purple-400">Reversed</span>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Tx ID, Order ID, Customer Name or Email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#3F1D5A] dark:focus:border-[#D4A75F] focus:ring-1 focus:ring-[#3F1D5A] dark:focus:ring-[#D4A75F] transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#3F1D5A] dark:focus:border-[#D4A75F] focus:ring-1 focus:ring-[#3F1D5A] dark:focus:ring-[#D4A75F] transition-all"
          >
            <option value="all">All Payment Statuses</option>
            <option value="captured">Success (Captured)</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>

        </div>

        {/* Advanced Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_amount">Highest Amount</option>
              <option value="lowest_amount">Lowest Amount</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Gateway / Method</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Time</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#3F1D5A] dark:text-[#D4A75F] mb-2" />
                    Loading transactions data...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                payments.map((tx) => (
                  <tr key={tx.id} className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-800/40 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-900 dark:text-white font-medium">
                      {tx.transaction_id}
                    </td>
                    <td className="py-3.5 px-4">
                      {tx.order_id ? (
                        <button
                          onClick={() => onNavigateToOrder && onNavigateToOrder(tx.order_id)}
                          className="font-mono text-[#3F1D5A] dark:text-[#D4A75F] font-semibold hover:underline flex items-center gap-1"
                        >
                          {tx.order_id} <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{tx.customer_name || 'Guest User'}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{tx.customer_email || 'No Email'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="capitalize font-semibold text-slate-800 dark:text-slate-200">{tx.payment_gateway || 'Razorpay'}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{tx.payment_method || 'Online'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      ₹{tx.amount ? tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(tx.payment_status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN') : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenDetails(tx.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-[#3F1D5A] hover:text-white dark:bg-purple-950/40 dark:hover:bg-[#D4A75F] dark:hover:text-slate-950 text-[#3F1D5A] dark:text-[#D4A75F] font-semibold text-[11px] border border-[#3F1D5A]/15 dark:border-[#D4A75F]/30 transition-all flex items-center gap-1.5 mx-auto shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{payments.length}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{pagination.total_count}</span> transactions
          </div>
          
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
              Page {page} of {pagination.total_pages || 1}
            </span>
            <button
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Over Drawer for Payment Details Inspection */}
      <AnimatePresence>
        {selectedTxId && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTxId(null)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#0F0817] border-l border-slate-200 dark:border-[#D4A75F]/30 h-full shadow-2xl overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200 z-10"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">Payment Details</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    ID: {txDetails?.transaction_id || `TXN-${selectedTxId}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTxId(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {detailsLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#3F1D5A] dark:text-[#D4A75F] mb-3" />
                  Loading detailed transaction breakdown...
                </div>
              ) : txDetails ? (
                <div className="space-y-6 text-xs">
                  
                  {/* Status Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1B0B26] border border-slate-200/80 dark:border-[#D4A75F]/20 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Payment Status</div>
                      <div className="mt-1">{renderStatusBadge(txDetails.payment_status)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Gateway</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-white capitalize">{txDetails.payment_gateway || 'Razorpay'}</div>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#1B0B26]/60 border border-slate-200/80 dark:border-[#D4A75F]/15 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#3F1D5A] dark:text-[#D4A75F]" /> Customer Information
                      </span>
                      {txDetails.customer_id && onNavigateToCustomer && (
                        <button
                          onClick={() => { setSelectedTxId(null); onNavigateToCustomer(txDetails.customer_id); }}
                          className="text-[#3F1D5A] dark:text-[#D4A75F] hover:underline flex items-center gap-1 font-medium"
                        >
                          View Customer <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div><span className="text-slate-500 dark:text-slate-400">Name:</span> {txDetails.customer_summary?.name || txDetails.customer_name || 'N/A'}</div>
                      <div><span className="text-slate-500 dark:text-slate-400">Email:</span> {txDetails.customer_summary?.email || txDetails.customer_email || 'N/A'}</div>
                      <div><span className="text-slate-500 dark:text-slate-400">Phone:</span> {txDetails.customer_summary?.phone || 'N/A'}</div>
                      <div><span className="text-slate-500 dark:text-slate-400">Customer ID:</span> {txDetails.customer_id || 'Guest'}</div>
                    </div>
                  </div>

                  {/* Order Information Card */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#1B0B26]/60 border border-slate-200/80 dark:border-[#D4A75F]/15 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-[#3F1D5A] dark:text-[#D4A75F]" /> Order Information
                      </span>
                      {txDetails.order_id && onNavigateToOrder && (
                        <button
                          onClick={() => { setSelectedTxId(null); onNavigateToOrder(txDetails.order_id); }}
                          className="text-[#3F1D5A] dark:text-[#D4A75F] hover:underline flex items-center gap-1 font-medium"
                        >
                          View Order <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div><span className="text-slate-500 dark:text-slate-400">Order ID:</span> <span className="font-mono font-semibold text-slate-900 dark:text-white">{txDetails.order_id || 'N/A'}</span></div>
                      <div><span className="text-slate-500 dark:text-slate-400">Total Amount:</span> ₹{txDetails.amount?.toLocaleString('en-IN')}</div>
                      <div><span className="text-slate-500 dark:text-slate-400">Currency:</span> {txDetails.currency || 'INR'}</div>
                      <div><span className="text-slate-500 dark:text-slate-400">Order Status:</span> {txDetails.order_summary?.order_status || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Gateway & Method Breakdown */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#1B0B26]/60 border border-slate-200/80 dark:border-[#D4A75F]/15 space-y-3">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                      <Shield className="w-4 h-4 text-[#3F1D5A] dark:text-[#D4A75F]" /> Gateway & Method Info
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div><span className="text-slate-500 dark:text-slate-400">Gateway:</span> <span className="capitalize font-semibold text-slate-900 dark:text-white">Razorpay</span></div>
                      <div><span className="text-slate-500 dark:text-slate-400">Method:</span> <span className="capitalize font-semibold text-slate-900 dark:text-white">{txDetails.payment_method || 'Online'}</span></div>
                      <div className="col-span-2"><span className="text-slate-500 dark:text-slate-400">Gateway Order ID:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{txDetails.gateway_order_id || 'N/A'}</span></div>
                      <div className="col-span-2"><span className="text-slate-500 dark:text-slate-400">Gateway Payment ID:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{txDetails.gateway_payment_id || 'N/A'}</span></div>
                    </div>
                  </div>

                  {/* Failure Reason if present */}
                  {txDetails.failure_reason && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                        <AlertCircle className="w-4 h-4" /> Failure Reason
                      </div>
                      <p className="text-xs">{txDetails.failure_reason}</p>
                    </div>
                  )}

                  {/* Transaction Timeline */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#1B0B26]/60 border border-slate-200/80 dark:border-[#D4A75F]/15 space-y-3">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                      <Clock className="w-4 h-4 text-[#3F1D5A] dark:text-[#D4A75F]" /> Transaction Timeline
                    </span>
                    <div className="space-y-3 pl-2 border-l border-slate-200 dark:border-[#D4A75F]/20">
                      {txDetails.timeline?.map((evt, idx) => (
                        <div key={idx} className="relative pl-4">
                          <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-[#3F1D5A] dark:bg-[#D4A75F]" />
                          <div className="font-semibold text-slate-900 dark:text-white">{evt.title}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{evt.timestamp ? new Date(evt.timestamp).toLocaleString('en-IN') : 'N/A'}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{evt.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gateway Raw JSON Viewer */}
                  {txDetails.gateway_response && Object.keys(txDetails.gateway_response).length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-900 dark:bg-[#0A0512] border border-slate-800 text-slate-100 space-y-2">
                      <span className="font-bold text-slate-300 text-xs">Gateway Response (JSON Payload)</span>
                      <pre className="p-3 rounded-lg bg-slate-950 text-[11px] font-mono text-emerald-400 overflow-x-auto border border-emerald-500/20">
                        {JSON.stringify(txDetails.gateway_response, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Actions / Refund Trigger */}
                  {['captured', 'successful', 'completed'].includes(String(txDetails.payment_status).toLowerCase()) && (
                    <div className="pt-2">
                      <button
                        onClick={() => setRefundModalOpen(true)}
                        className="w-full py-2.5 rounded-xl bg-[#3F1D5A] hover:bg-[#2b143d] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <RefreshCw className="w-4 h-4 text-[#D4A75F]" /> Issue Full or Partial Refund
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center text-rose-500">Failed to load details</div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Refund Action Modal */}
      <AnimatePresence>
        {refundModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRefundModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1B0B26] border border-slate-200 dark:border-[#D4A75F]/30 rounded-2xl p-6 space-y-4 shadow-2xl z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#3F1D5A] dark:text-[#D4A75F]" /> Issue Payment Refund
                </h3>
                <button onClick={() => setRefundModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Refund Amount (₹)</label>
                  <input
                    type="number"
                    placeholder={`Max ₹${txDetails ? (txDetails.amount - txDetails.refunded_amount) : 0}`}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0512] border border-slate-200 dark:border-[#D4A75F]/30 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Reason for Refund</label>
                  <textarea
                    rows="3"
                    placeholder="Customer requested cancellation / damaged goods..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0512] border border-slate-200 dark:border-[#D4A75F]/30 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  disabled={refundProcessing}
                  onClick={handleProcessRefund}
                  className="px-4 py-2 rounded-xl bg-[#3F1D5A] hover:bg-[#2b143d] text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {refundProcessing ? 'Processing Refund...' : 'Confirm Refund'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
