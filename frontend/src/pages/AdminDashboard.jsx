import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart3, Plus, Edit2, Trash2, CheckCircle2, ShieldAlert,
  ArrowUpRight, Users, ShoppingBag, Package, MessageSquare, AlertCircle, Upload, Eye, X,
  AlertTriangle, Check, RefreshCw, Calendar, DollarSign, Clock, MapPin, Lock, Unlock, Shield, Search, Image, Bell, Mail
} from 'lucide-react';
import { AuthContext, API_BASE_URL, SERVER_BASE_URL } from '../context/AuthContext';
import { formatPrice } from '../utils/priceFormatter';
import { translateCategory } from '../utils/categoryTranslations';

const AnalyticsTab = lazy(() => import('../components/admin/AnalyticsTab').then(m => ({ default: m.AnalyticsTab })));
const ProductManagementTab = lazy(() => import('../components/admin/ProductManagementTab').then(m => ({ default: m.ProductManagementTab })));
const OrderManagementTab = lazy(() => import('../components/admin/OrderManagementTab').then(m => ({ default: m.OrderManagementTab })));
const UserManagementTab = lazy(() => import('../components/admin/UserManagementTab').then(m => ({ default: m.UserManagementTab })));
const SupportTicketsTab = lazy(() => import('../components/admin/SupportTicketsTab').then(m => ({ default: m.SupportTicketsTab })));

const TabLoadingFallback = () => (
  <div className="w-full min-h-[300px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-[#D4A75F] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs text-slate-400 font-medium">Loading panel...</p>
    </div>
  </div>
);

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

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useContext(AuthContext);

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse activeTab from URL search query parameter
  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      if (tab === 'stats') return 'products';
      return tab;
    }
    return 'products';
  };

  // Authorization Check
  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/login?redirect=admin');
    }
  }, [user, isAdmin, navigate]);

  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  
  const handleTabChange = (tabName) => {
    navigate(`/admin?tab=${tabName}`);
  };

  useEffect(() => {
    const tab = getTabFromUrl();
    setActiveTab(tab);
  }, [location.search]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    total_sales: 0,
    products_active: 0
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Users Details tab state variables
  const [activeProductSubTab, setActiveProductSubTab] = useState('all');
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [statusModalNewBlockedState, setStatusModalNewBlockedState] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [viewingOrderItems, setViewingOrderItems] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [notifSearch, setNotifSearch] = useState('');
  const [notifFilter, setNotifFilter] = useState('all');
  const [notifTypeFilter, setNotifTypeFilter] = useState('all');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const INITIAL_IMAGE_SLOTS = [
    { slot: 'Main Image *', url: '', required: true, key: 'main' },
    { slot: 'Front View', url: '', required: false, key: 'front' },
    { slot: 'Back View', url: '', required: false, key: 'back' },
    { slot: 'Side View', url: '', required: false, key: 'side' },
    { slot: 'Zoom View', url: '', required: false, key: 'zoom' }
  ];

  const initEditImages = (product) => {
    const currentImages = product.images || [];
    const initialSlots = [
      { slot: 'Main Image *', url: currentImages[0] || '', required: true, key: 'main' },
      { slot: 'Front View', url: currentImages[1] || '', required: false, key: 'front' },
      { slot: 'Back View', url: currentImages[2] || '', required: false, key: 'back' },
      { slot: 'Side View', url: currentImages[3] || '', required: false, key: 'side' },
      { slot: 'Zoom View', url: currentImages[4] || '', required: false, key: 'zoom' }
    ];
    
    // Add additional slots up to the length of currentImages if > 5
    for (let i = 5; i < currentImages.length; i++) {
      initialSlots.push({
        slot: `Additional Image ${i - 4}`,
        url: currentImages[i] || '',
        required: false,
        key: `additional_${i}_${Date.now()}`
      });
    }
    
    return initialSlots;
  };

  // Add Product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Rings',
    price: '',
    discount: 0,
    stock: '',
    description: '',
    name_translations: { en: '', hi: '' },
    description_translations: { en: '', hi: '' },
    features_en: '',
    features_hi: '',
    specifications_en: '',
    specifications_hi: '',
    show_on_homepage: false
  });
  const [newProductImages, setNewProductImages] = useState(INITIAL_IMAGE_SLOTS);
  const [uploadingSlots, setUploadingSlots] = useState({});
  const [formLang, setFormLang] = useState('en'); // en, hi

  // Edit Product Modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductImages, setEditProductImages] = useState([]);
  const [editFormLang, setEditFormLang] = useState('en');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddImagesOpen, setIsAddImagesOpen] = useState(false);
  const [isEditImagesOpen, setIsEditImagesOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState({});

  // Quick Action States
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [stockAdjustmentAction, setStockAdjustmentAction] = useState('set');
  const [stockAdjustmentValue, setStockAdjustmentValue] = useState('');
  const [productStockHistory, setProductStockHistory] = useState([]);
  
  // Buy Requests States
  const [buyRequests, setBuyRequests] = useState([]);
  const [editingBuyRequest, setEditingBuyRequest] = useState(null);
  const [buyRequestNote, setBuyRequestNote] = useState('');
  const [expectedAvailability, setExpectedAvailability] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [selectedOrdersProduct, setSelectedOrdersProduct] = useState(null);
  const [productOrdersList, setProductOrdersList] = useState([]);
  
  const [selectedAnalyticsProduct, setSelectedAnalyticsProduct] = useState(null);
  const [productAnalyticsData, setProductAnalyticsData] = useState(null);
  
  const [overviewAnalytics, setOverviewAnalytics] = useState(null);

  const [modalTracking, setModalTracking] = useState({
    status: '',
    delivery_date: '',
    carrier: '',
    tracking_id: '',
    message: ''
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    if (selectedOrder) {
      setModalTracking({
        status: selectedOrder.status || 'Pending',
        delivery_date: selectedOrder.delivery_date || '',
        carrier: selectedOrder.carrier || '',
        tracking_id: selectedOrder.tracking_id || '',
        message: ''
      });
    }
  }, [selectedOrder]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/stats`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch admin stats. Check authorization.");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/products?admin_view=true`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/orders/all`);
      // Sort orders by date descending
      const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/support/all`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user account permanently?")) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`);
      alert("User account deleted successfully.");
      
      const currentSelectedId = selectedUserDetails?.id || selectedUserDetails?._id;
      if (currentSelectedId && String(currentSelectedId) === String(userId)) {
        setSelectedUserDetails(null);
      }

      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const fetchUserDetails = async (userId) => {
    setUserDetailsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedUserDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const handleOpenStatusModal = (userObj, targetBlockedState) => {
    setStatusModalUser(userObj);
    setStatusModalNewBlockedState(targetBlockedState);
    setStatusReason('');
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async (e) => {
    if (e) e.preventDefault();
    if (!statusReason.trim()) {
      alert("Please provide a reason for the status change.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/admin/users/${statusModalUser.id || statusModalUser._id}/status`, {
        is_blocked: statusModalNewBlockedState,
        reason: statusReason
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      alert(res.data.message || "User status successfully updated.");
      setStatusModalOpen(false);
      setStatusReason('');
      
      const currentId = selectedUserDetails?.id || selectedUserDetails?._id;
      const targetId = statusModalUser.id || statusModalUser._id;
      if (selectedUserDetails && String(currentId) === String(targetId)) {
        fetchUserDetails(targetId);
      }
      
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      console.error("Failed to update user status:", err);
      alert(err.response?.data?.message || "Failed to update user status.");
    }
  };

  const handleToggleBlockUser = (userId, currentBlocked) => {
    const userObj = users.find(u => (u.id || u._id) === userId) || { id: userId, _id: userId, name: 'User' };
    handleOpenStatusModal(userObj, !currentBlocked);
  };

  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    if (typeof addr === 'string') return addr;
    const parts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  const renderNotificationsTab = () => {
    const validNotifs = notifications.filter(n => ['SUPPORT_TICKET', 'BUY_REQUEST', 'LOW_STOCK'].includes(n.type));

    // Filter
    const filteredNotifs = validNotifs.filter(n => {
      const matchesSearch = 
        (n.title || '').toLowerCase().includes(notifSearch.toLowerCase()) ||
        (n.description || '').toLowerCase().includes(notifSearch.toLowerCase());
      
      const matchesStatus = 
        notifFilter === 'all' || 
        n.status === notifFilter;

      const matchesType = 
        notifTypeFilter === 'all' || 
        n.type === notifTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    // List of unique types for filter dropdown
    const notifTypes = ['all', ...new Set(validNotifs.map(n => n.type).filter(Boolean))];

    return (
      <div className="space-y-6">
        {/* Controls Row */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={notifSearch}
                onChange={(e) => setNotifSearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Status Filter */}
            <select
              value={notifFilter}
              onChange={(e) => setNotifFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            {/* Type Filter */}
            <select
              value={notifTypeFilter}
              onChange={(e) => setNotifTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Notification Types</option>
              {notifTypes.filter(t => t !== 'all').map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5 w-full xl:w-auto justify-end">
            <button
              onClick={handleMarkAllNotifAsRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Check className="h-4 w-4 text-emerald-500" />
              <span>Mark All Read</span>
            </button>
            <button
              onClick={handleClearReadNotif}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-555 hover:bg-rose-600 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Read</span>
            </button>
          </div>
        </div>

        {/* Notifications Grid / List */}
        {filteredNotifs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4 opacity-45" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">No notifications found</h4>
            <p className="text-xs text-slate-400 dark:text-slate-505 mt-1">Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Showing {filteredNotifs.length} of {validNotifs.length} notifications
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredNotifs.map((n) => {
                const isUnread = n.status === 'unread';
                const getStyles = (type) => {
                  switch (type) {
                    case 'SUPPORT_TICKET':
                      return {
                        bg: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20',
                        icon: <MessageSquare className="h-5 w-5" />
                      };
                    case 'BUY_REQUEST':
                      return {
                        bg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20',
                        icon: <ShoppingBag className="h-5 w-5" />
                      };
                    case 'LOW_STOCK':
                      return {
                        bg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20',
                        icon: <AlertTriangle className="h-5 w-5" />
                      };
                    default:
                      return {
                        bg: 'bg-slate-500/10 text-slate-500 dark:bg-slate-500/20',
                        icon: <Bell className="h-5 w-5" />
                      };
                  }
                };
                const styles = getStyles(n.type);
                const handleCardClick = () => {
                  if (n.type === 'SUPPORT_TICKET') {
                    handleTabChange('support');
                  } else if (n.type === 'BUY_REQUEST') {
                    handleTabChange('notifications');
                  } else if (n.type === 'LOW_STOCK') {
                    handleTabChange('products');
                  }
                };
                return (
                  <div
                    key={n.id}
                    onClick={handleCardClick}
                    className={`p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-colors cursor-pointer ${
                      isUnread ? 'bg-emerald-50/10 dark:bg-emerald-950/2' : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                    }`}
                  >
                    <div className="flex gap-4 items-start min-w-0 flex-1">
                      <div className={`p-3 rounded-2xl flex-shrink-0 ${styles.bg}`}>
                        {styles.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${styles.bg}`}>
                            {n.type}
                          </span>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <h4 className={`text-sm font-bold mt-1.5 ${isUnread ? 'text-slate-850 dark:text-slate-100 font-extrabold' : 'text-slate-650 dark:text-slate-350'}`}>
                          {n.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed whitespace-pre-line">
                          {n.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {n.created_at ? new Date(n.created_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                      {isUnread ? (
                        <button
                          onClick={() => handleMarkNotifAsRead(n.id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Mark as Read</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 font-bold rounded-xl text-xs border border-slate-200/50 dark:border-slate-700/50">
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Read</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleOrderTrackingUpdate = async (orderId, trackingData) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: trackingData.status,
        message: trackingData.message,
        delivery_date: trackingData.delivery_date,
        carrier: trackingData.carrier,
        tracking_id: trackingData.tracking_id
      });
      alert("Order shipment details updated successfully!");
      fetchOrders();
      setSelectedOrder(prev => ({
        ...prev,
        status: trackingData.status,
        delivery_date: trackingData.delivery_date,
        carrier: trackingData.carrier,
        tracking_id: trackingData.tracking_id,
        tracking_history: [
          ...(prev.tracking_history || []),
          {
            status: trackingData.status,
            message: trackingData.message || `Order status updated to ${trackingData.status}`,
            updated_at: new Date().toISOString()
          }
        ]
      }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update tracking details.");
    }
  };

  const handleManageReturn = async (orderId, approve, adminMessage = '') => {
    try {
      const status = approve ? 'Approved' : 'Rejected';
      await axios.put(`${API_BASE_URL}/admin/orders/${orderId}/return`, {
        status,
        message: adminMessage
      });
      alert(`Return request was ${status.toLowerCase()} successfully.`);
      fetchOrders();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update return request.");
    }
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.stock < 10);
  };

  const getReturnRequests = () => {
    return orders.filter(o => o.return_request && o.return_request.status === 'Requested');
  };

  const getCategoryData = () => {
    const categories = ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Bangles', 'Bridal Collection'];
    return categories.map(cat => {
      const filtered = products.filter(p => p.category === cat);
      const count = filtered.length;
      const value = filtered.reduce((sum, p) => sum + (p.price * p.stock), 0);
      return { category: cat, count, value };
    });
  };

  const getOrderStatusData = () => {
    const statuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    const counts = {};
    statuses.forEach(s => counts[s] = 0);
    orders.forEach(o => {
      const status = o.status || 'Pending';
      if (counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts[status] = (counts[status] || 0) + 1;
      }
    });
    return statuses.map(s => ({ status: s, count: counts[s] || 0 }));
  };

  const fetchOverviewAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/admin/analytics/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setOverviewAnalytics(res.data);
    } catch (err) {
      console.error("Failed to fetch overview analytics:", err);
    }
  };

  const handleOpenStockModal = async (product) => {
    setSelectedStockProduct(product);
    setStockAdjustmentValue('');
    setStockAdjustmentAction('set');
    setProductStockHistory([]);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/products/${product._id}/stock-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setProductStockHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch product stock history:", err);
    }
  };

  const handleOpenOrdersModal = async (product) => {
    setSelectedOrdersProduct(product);
    setProductOrdersList([]);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/products/${product._id}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setProductOrdersList(data);
      }
    } catch (err) {
      console.error("Failed to fetch product orders:", err);
    }
  };

  const handleOpenAnalyticsModal = async (product) => {
    setSelectedAnalyticsProduct(product);
    setProductAnalyticsData(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/analytics/product/${product._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setProductAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch product analytics:", err);
    }
  };

  const handleUpdateProductOrderStatus = async (dbOrderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders/${dbOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok) {
        if (selectedOrdersProduct) {
          handleOpenOrdersModal(selectedOrdersProduct);
        }
        fetchOrders();
      } else {
        alert(data.message || "Failed to update order status");
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleAdjustStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStockProduct || !stockAdjustmentValue) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/products/${selectedStockProduct._id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: stockAdjustmentAction,
          value: parseInt(stockAdjustmentValue)
        })
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(products.map(p => p._id === selectedStockProduct._id ? data.product : p));
        setSelectedStockProduct(null);
        fetchOverviewAnalytics();
      } else {
        alert(data.message || "Failed to adjust stock");
      }
    } catch (err) {
      console.error("Failed to adjust stock:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkNotifAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllNotifAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/admin/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleClearReadNotif = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/notifications/clear-read`);
      setNotifications(prev => prev.filter(n => n.status !== 'read'));
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
    }
  };

  const fetchBuyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/admin/buy-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBuyRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch buy requests:", err);
    }
  };

  const handleOpenProceedConfirmation = () => {
    if (!expectedAvailability || !expectedDelivery) {
      alert("Both Expected Product Availability Date and Expected Delivery Date are required.");
      return;
    }
    const todayStr = getTodayDateString();
    if (expectedAvailability < todayStr) {
      alert("Expected Availability Date must be today or a future date.");
      return;
    }
    if (expectedDelivery < todayStr) {
      alert("Expected Delivery Date must be today or a future date.");
      return;
    }
    if (expectedDelivery < expectedAvailability) {
      alert("Expected delivery date must be on or after availability date.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleProceedBuyRequest = async (reqId, sendEmailOption) => {
    try {
      const token = localStorage.getItem('token');
      const isPending = editingBuyRequest.status === 'Pending';
      const payload = {
        status: isPending ? 'Confirmed' : editingBuyRequest.status,
        expected_delivery_date: expectedDelivery,
        expected_availability_date: expectedAvailability,
        admin_note: buyRequestNote,
        send_email: sendEmailOption === 'Send'
      };
      
      const res = await axios.put(`${API_BASE_URL}/admin/buy-requests/${reqId}/status`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.data.success) {
        alert("Buy request successfully updated.");
        setShowConfirmModal(false);
        setEditingBuyRequest(null);
        setBuyRequestNote('');
        setExpectedAvailability('');
        setExpectedDelivery('');
        fetchBuyRequests();
        fetchAuditLogs();
      } else {
        alert(res.data.message || "Failed to update buy request.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Failed to update buy request.");
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    await fetchStats();
    await fetchProducts();
    await fetchOrders();
    await fetchMessages();
    await fetchUsers();
    await fetchOverviewAnalytics();
    await fetchAuditLogs();
    await fetchNotifications();
    await fetchBuyRequests();
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  // Image Upload helper for specific slot
  const handleSlotImageUpload = async (e, index, mode = 'create') => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingSlots(prev => ({ ...prev, [index]: true }));
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(`${API_BASE_URL}/products/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      let finalUrl = res.data.url;
      if (finalUrl.startsWith('/static/')) {
        finalUrl = `${SERVER_BASE_URL}${finalUrl}`;
      }

      if (mode === 'create') {
        setNewProductImages(prev => {
          const next = [...prev];
          next[index] = { ...next[index], url: finalUrl };
          return next;
        });
      } else {
        setEditProductImages(prev => {
          const next = [...prev];
          next[index] = { ...next[index], url: finalUrl };
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Check server upload folder permissions.");
    } finally {
      setUploadingSlots(prev => ({ ...prev, [index]: false }));
    }
  };

  const renderImageManager = (imagesState, setImagesState, mode) => {
    const addAdditionalSlot = () => {
      if (imagesState.length >= 10) {
        alert("Maximum 10 images allowed.");
        return;
      }
      const additionalCount = imagesState.filter(s => s.slot.startsWith('Additional')).length + 1;
      setImagesState([
        ...imagesState,
        {
          slot: `Additional Image ${additionalCount}`,
          url: '',
          required: false,
          key: `additional_${Date.now()}_${additionalCount}`
        }
      ]);
    };

    const removeSlot = (index) => {
      if (index < 5) {
        setImagesState(prev => {
          const next = [...prev];
          next[index] = { ...next[index], url: '' };
          return next;
        });
      } else {
        setImagesState(prev => prev.filter((_, i) => i !== index));
      }
    };

    const updateSlotUrl = (index, url) => {
      setImagesState(prev => {
        const next = [...prev];
        next[index] = { ...next[index], url };
        return next;
      });
    };

    const swapSlots = (index1, index2) => {
      if (index1 === 0 || index2 === 0) return;
      setImagesState(prev => {
        const next = [...prev];
        const tempUrl = next[index1].url;
        next[index1].url = next[index2].url;
        next[index2].url = tempUrl;
        return next;
      });
    };

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-semibold text-slate-400">Product Images (1-10)</label>
          {imagesState.length < 10 && (
            <button
              type="button"
              onClick={addAdditionalSlot}
              className="text-[10px] font-black text-emerald-500 hover:text-emerald-605 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add Additional Image</span>
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {imagesState.map((slotItem, index) => {
            const hasUrl = slotItem.url !== '';
            const isUploading = uploadingSlots[index];
            
            return (
              <div key={slotItem.key || index} className="p-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 flex-grow min-w-0">
                  <div className="h-10 w-10 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {hasUrl ? (
                      <img src={slotItem.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-slate-350" />
                    )}
                  </div>

                  <div className="flex-grow min-w-0 space-y-1">
                    <span className="font-bold text-[10px] text-slate-400 block truncate">{slotItem.slot}</span>
                    <input
                      type="text"
                      placeholder="Image URL or upload file"
                      value={slotItem.url}
                      onChange={(e) => updateSlotUrl(index, e.target.value)}
                      className="w-full px-2 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg focus:outline-none text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <label className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-lg cursor-pointer flex items-center justify-center shadow-sm">
                    {isUploading ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border border-t-transparent border-slate-500" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSlotImageUpload(e, index, mode)}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>

                  {hasUrl && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 bg-transparent rounded-lg"
                      title="Remove Image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {index > 0 && (
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => swapSlots(index, index - 1)}
                        disabled={index === 1}
                        className={`text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 text-[10px]`}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => swapSlots(index, index + 1)}
                        disabled={index === imagesState.length - 1}
                        className={`text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 text-[10px]`}
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Add Product Submit
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert("Please provide Name, Price, and Stock level.");
      return;
    }

    const imagesArray = newProductImages.map(item => item.url).filter(url => url !== '');
    if (imagesArray.length === 0) {
      alert("Main Image * is required.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/products`, {
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        discount: parseInt(newProduct.discount) || 0,
        stock: parseInt(newProduct.stock),
        description: newProduct.description,
        images: imagesArray,
        name_translations: newProduct.name_translations,
        description_translations: newProduct.description_translations,
        features_en: newProduct.features_en || '',
        features_hi: newProduct.features_hi || '',
        specifications_en: newProduct.specifications_en || '',
        specifications_hi: newProduct.specifications_hi || '',
        show_on_homepage: newProduct.show_on_homepage
      });

      // Close modal and show success toast immediately (non-blocking)
      setIsAddModalOpen(false);
      setIsAddImagesOpen(false);
      showToast("Product added successfully", "success");

      setNewProduct({
        name: '',
        category: 'Rings',
        price: '',
        discount: 0,
        stock: '',
        description: '',
        name_translations: { en: '', hi: '' },
        description_translations: { en: '', hi: '' },
        features_en: '',
        features_hi: '',
        specifications_en: '',
        specifications_hi: '',
        show_on_homepage: false
      });
      setNewProductImages(INITIAL_IMAGE_SLOTS);
      setFormLang('en');
      fetchProducts();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create product.");
    }
  };

  // Edit Product Submit
  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    const imagesArray = editProductImages.map(item => item.url).filter(url => url !== '');
    if (imagesArray.length === 0) {
      alert("Main Image * is required.");
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/products/${editingProduct._id}`, {
        name: editingProduct.name,
        category: editingProduct.category,
        price: parseFloat(editingProduct.price),
        discount: parseInt(editingProduct.discount) || 0,
        stock: parseInt(editingProduct.stock),
        description: editingProduct.description,
        images: imagesArray,
        name_translations: editingProduct.name_translations,
        description_translations: editingProduct.description_translations,
        features_en: editingProduct.features_en || '',
        features_hi: editingProduct.features_hi || '',
        specifications_en: editingProduct.specifications_en || '',
        specifications_hi: editingProduct.specifications_hi || '',
        show_on_homepage: editingProduct.show_on_homepage
      });

      alert("Product updated successfully!");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to update product details.");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`);
      fetchProducts();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product.");
    }
  };

  // Update Order Status
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: newStatus
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to update order status.");
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-lg">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold mt-4">Access Denied</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Administrator privileges are required to access the SSJewellery Admin Dashboard.
        </p>
        <button
          onClick={() => navigate('/login?redirect=admin')}
          className="mt-6 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Admin Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen pb-16 font-sans">
      <div className="max-w-[97%] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-baseline border-b border-slate-200 dark:border-slate-800 pb-5 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Manage catalog products, handle orders, and check live service metrics.</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="mt-4 sm:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-transparent dark:bg-[#1E1E1E] dark:border-[#D4A75F] text-slate-700 dark:text-[#D4A75F] dark:hover:bg-[#2A2A2A] rounded-[12px] dark:shadow-[0_4px_12px_rgba(212,167,95,0.25)] text-xs font-bold transition-all"
          >
            Refresh Data
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-semibold">Aggregating database statistics...</p>
          </div>
        ) : (
          <>
            {/* Quick Metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {/* Sales Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Sales</span>
                  <span className="text-2xl font-black block mt-1 price-amount">₹{formatPrice(stats.total_sales ?? 0)}</span>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>

              {/* Orders Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Orders</span>
                  <span className="text-2xl font-black block mt-1">{stats.total_orders}</span>
                </div>
                <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-500">
                  <ShoppingBag className="h-6 w-6" />
                </div>
              </div>

              {/* Products Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Products Active</span>
                  <span className="text-2xl font-black block mt-1">{stats.products_active ?? 0}</span>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500">
                  <Package className="h-6 w-6" />
                </div>
              </div>

              {/* Users Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Registered Users</span>
                  <span className="text-2xl font-black block mt-1">{stats.total_users}</span>
                </div>
                <div className="bg-rose-500/10 p-3 rounded-xl text-rose-500">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Dashboard Tabs navigation */}
            <div className="flex flex-wrap gap-1 md:space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px mb-8">
              <button
                onClick={() => handleTabChange('overview')}
                className={`pb-3 px-3 md:px-4 text-xs md:text-sm border-b-2 transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => handleTabChange('products')}
                className={`pb-3 px-3 md:px-4 text-xs md:text-sm border-b-2 transition-all ${
                  activeTab === 'products'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => handleTabChange('orders')}
                className={`pb-3 px-3 md:px-4 text-xs md:text-sm border-b-2 transition-all ${
                  activeTab === 'orders'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => handleTabChange('buy-requests')}
                className={`pb-3 px-3 md:px-4 text-xs md:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'buy-requests'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                <span>Buy Requests</span>
                {buyRequests.some(r => r.status === 'Pending') && (
                  <span className="bg-rose-550 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full animate-pulse">
                    {buyRequests.filter(r => r.status === 'Pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('users')}
                className={`pb-3 px-3 md:px-4 text-xs md:text-sm border-b-2 transition-all ${
                  activeTab === 'users'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => handleTabChange('support')}
                className={`pb-3 px-3 md:px-4 text-xs md:text-sm border-b-2 transition-all ${
                  activeTab === 'support'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => handleTabChange('audit')}
                className={`pb-3 px-3 md:px-4 text-xs md:text-sm border-b-2 transition-all ${
                  activeTab === 'audit'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Audit Trail
              </button>
              <button
                onClick={() => handleTabChange('notifications')}
                className={`pb-3 px-3 md:px-4 text-xs md:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'notifications'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                <span>Notifications</span>
                {notifications.some(n => n.status === 'unread') && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            <Suspense fallback={<TabLoadingFallback />}>
              {activeTab === 'overview' && (
                <AnalyticsTab
                  loadDashboardData={loadDashboardData}
                  getCategoryData={getCategoryData}
                  formatPrice={formatPrice}
                  getOrderStatusData={getOrderStatusData}
                  orders={orders}
                  overviewAnalytics={overviewAnalytics}
                  SERVER_BASE_URL={SERVER_BASE_URL}
                  getLowStockProducts={getLowStockProducts}
                  handleTabChange={handleTabChange}
                  setEditingProduct={setEditingProduct}
                  setEditProductImages={setEditProductImages}
                  initEditImages={initEditImages}
                  setIsEditImagesOpen={setIsEditImagesOpen}
                  getReturnRequests={getReturnRequests}
                  returnNotes={returnNotes}
                  setReturnNotes={setReturnNotes}
                  handleManageReturn={handleManageReturn}
                />
              )}

              {activeTab === 'products' && (
                <ProductManagementTab
                  products={products}
                  formatPrice={formatPrice}
                  setEditingProduct={setEditingProduct}
                  setEditProductImages={setEditProductImages}
                  initEditImages={initEditImages}
                  setIsEditImagesOpen={setIsEditImagesOpen}
                  handleOpenStockModal={handleOpenStockModal}
                  handleOpenOrdersModal={handleOpenOrdersModal}
                  handleOpenAnalyticsModal={handleOpenAnalyticsModal}
                />
              )}

              {(activeTab === 'orders' || activeTab === 'buy-requests') && (
                <OrderManagementTab
                  activeTab={activeTab}
                  orders={orders}
                  formatTimestamp={formatTimestamp}
                  formatPrice={formatPrice}
                  handleOrderStatusUpdate={handleOrderStatusUpdate}
                  setSelectedOrder={setSelectedOrder}
                  buyRequests={buyRequests}
                  fetchBuyRequests={fetchBuyRequests}
                  editingBuyRequest={editingBuyRequest}
                  setEditingBuyRequest={setEditingBuyRequest}
                  buyRequestNote={buyRequestNote}
                  setBuyRequestNote={setBuyRequestNote}
                  expectedAvailability={expectedAvailability}
                  setExpectedAvailability={setExpectedAvailability}
                  expectedDelivery={expectedDelivery}
                  setExpectedDelivery={setExpectedDelivery}
                  showConfirmModal={showConfirmModal}
                  setShowConfirmModal={setShowConfirmModal}
                  handleOpenProceedConfirmation={handleOpenProceedConfirmation}
                  handleProceedBuyRequest={handleProceedBuyRequest}
                  products={products}
                  getTodayDateString={getTodayDateString}
                />
              )}

              {activeTab === 'users' && (
                <UserManagementTab
                  users={users}
                  userSearchQuery={userSearchQuery}
                  setUserSearchQuery={setUserSearchQuery}
                  selectedUserDetails={selectedUserDetails}
                  setSelectedUserDetails={setSelectedUserDetails}
                  fetchUserDetails={fetchUserDetails}
                  formatAddress={formatAddress}
                  formatPrice={formatPrice}
                  formatTimestamp={formatTimestamp}
                  setViewingOrderItems={setViewingOrderItems}
                  handleOpenStatusModal={handleOpenStatusModal}
                />
              )}

              {activeTab === 'support' && (
                <SupportTicketsTab
                  messages={messages}
                  fetchMessages={fetchMessages}
                />
              )}
            </Suspense>

            {/* TAB CONTENT: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-emerald-500" />
                  <span>Product Audit Trail Logs ({auditLogs.length})</span>
                </h3>

                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                      <th className="py-2.5">Date & Time (IST)</th>
                      <th className="py-2.5">Product</th>
                      <th className="py-2.5">Admin ID</th>
                      <th className="py-2.5">Action Type</th>
                      <th className="py-2.5">Field Changed</th>
                      <th className="py-2.5 text-right">Old Value</th>
                      <th className="py-2.5 text-right">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="py-3.5 text-slate-500 admin-timestamp-text">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : "N/A"}
                        </td>
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100">
                          {log.product_name}
                        </td>
                        <td className="py-3.5 text-slate-500 font-mono">
                          {log.admin_id || "N/A"}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.action_type?.includes("Creation")
                              ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                              : log.action_type?.includes("Delete")
                              ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                              : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-500">
                          {log.field_name || "N/A"}
                        </td>
                        <td className="py-3.5 text-right text-rose-500 max-w-[150px] truncate" title={log.old_value}>
                          {log.old_value || "N/A"}
                        </td>
                        <td className="py-3.5 text-right text-emerald-500 max-w-[150px] truncate" title={log.new_value}>
                          {log.new_value || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* TAB CONTENT: NOTIFICATION CENTER */}
            {activeTab === 'notifications' && (
              renderNotificationsTab()
            )}
          </>
        )}
        {/* EDIT PRODUCT MODAL OVERLAY */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">Edit Catalog Product</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  {['en', 'hi'].map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setEditFormLang(lang)}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${
                        editFormLang === lang 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleEditProductSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* ROW 1: Name, Category, Stock Level, Price, Discount */}
                <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
                  {/* Product Title */}
                  <div className="col-span-2 md:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Title</label>
                    {editFormLang === 'en' ? (
                      <input
                        type="text"
                        required
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        placeholder="Product Name"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        required
                        value={editingProduct.name_translations?.[editFormLang] || ''}
                        onChange={(e) => setEditingProduct({ 
                          ...editingProduct, 
                          name_translations: { ...editingProduct.name_translations, [editFormLang]: e.target.value } 
                        })}
                        placeholder="उत्पाद का नाम"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    )}
                  </div>

                  {/* Category */}
                  <div className="col-span-2 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-850 dark:text-slate-100"
                    >
                      <option value="Rings">{translateCategory("Rings", editFormLang)}</option>
                      <option value="Necklaces">{translateCategory("Necklaces", editFormLang)}</option>
                      <option value="Earrings">{translateCategory("Earrings", editFormLang)}</option>
                      <option value="Bracelets">{translateCategory("Bracelets", editFormLang)}</option>
                      <option value="Bridal Collection">{translateCategory("Bridal Collection", editFormLang)}</option>
                    </select>
                  </div>

                  {/* Stock Level */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Level</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Price */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Discount */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={editingProduct.discount}
                      onChange={(e) => setEditingProduct({ ...editingProduct, discount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Homepage Visibility */}
                <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="edit_show_on_homepage"
                    checked={editingProduct.show_on_homepage || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, show_on_homepage: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="edit_show_on_homepage" className="block text-xs font-bold text-slate-700 dark:text-slate-250 cursor-pointer select-none">
                      Homepage Visibility
                    </label>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Show this product on the homepage grid and featured collections.
                    </span>
                  </div>
                </div>

                {/* ROW 2: Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  {editFormLang === 'en' ? (
                    <textarea
                      required
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      placeholder="Description"
                      rows="2"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    ></textarea>
                  ) : (
                    <textarea
                      required
                      value={editingProduct.description_translations?.[editFormLang] || ''}
                      onChange={(e) => setEditingProduct({ 
                        ...editingProduct, 
                        description_translations: { ...editingProduct.description_translations, [editFormLang]: e.target.value } 
                      })}
                      placeholder="उत्पाद विवरण"
                      rows="2"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    ></textarea>
                  )}
                </div>

                {/* ROW 3: Key Features & Technical Specifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Features</label>
                      <span className="text-[9px] text-slate-400">One feature per line</span>
                    </div>
                    {editFormLang === 'en' ? (
                      <textarea
                        value={editingProduct.features_en || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, features_en: e.target.value })}
                        placeholder="Features (English)"
                        rows="3"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                      />
                    ) : (
                      <textarea
                        value={editingProduct.features_hi || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, features_hi: e.target.value })}
                        placeholder="मुख्य विशेषताएं (Hindi)"
                        rows="3"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technical Specifications</label>
                      <span className="text-[9px] text-slate-400">Format: Key: Value (one per line)</span>
                    </div>
                    {editFormLang === 'en' ? (
                      <textarea
                        value={editingProduct.specifications_en || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, specifications_en: e.target.value })}
                        placeholder="Specifications (English)"
                        rows="3"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                      />
                    ) : (
                      <textarea
                        value={editingProduct.specifications_hi || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, specifications_hi: e.target.value })}
                        placeholder="तकनीकी विशिष्टता (Hindi)"
                        rows="3"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                      />
                    )}
                  </div>
                </div>

                {/* ROW 4: Accordion Images Section */}
                <div className="border border-slate-250 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-955/20">
                  <button
                    type="button"
                    onClick={() => setIsEditImagesOpen(!isEditImagesOpen)}
                    className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-250 dark:border-slate-800 font-bold hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-emerald-500" />
                      <span>Manage Product Images</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {isEditImagesOpen ? "Collapse ▴" : "Expand ▾"}
                    </span>
                  </button>
                  {isEditImagesOpen && (
                    <div className="p-4 bg-white dark:bg-slate-900">
                      {renderImageManager(editProductImages, setEditProductImages, 'edit')}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Bottom Action Bar */}
              <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-150 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-850 dark:border-slate-750 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 rounded-xl font-bold transition-all text-xs shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all text-xs shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL OVERLAY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">Add New Product</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  {['en', 'hi'].map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setFormLang(lang)}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${
                        formLang === lang 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleAddProductSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* ROW 1: Name, Category, Stock Level, Price, Discount */}
                <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
                  {/* Product Title */}
                  <div className="col-span-2 md:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Title</label>
                    {formLang === 'en' ? (
                      <input
                        type="text"
                        required
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Product Name"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        required
                        value={newProduct.name_translations?.hi || ''}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          name_translations: { ...newProduct.name_translations, hi: e.target.value } 
                        })}
                        placeholder="उत्पाद का नाम"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    )}
                  </div>

                  {/* Category */}
                  <div className="col-span-2 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-850 dark:text-slate-100"
                    >
                      <option value="Rings">{translateCategory("Rings", formLang)}</option>
                      <option value="Necklaces">{translateCategory("Necklaces", formLang)}</option>
                      <option value="Earrings">{translateCategory("Earrings", formLang)}</option>
                      <option value="Bracelets">{translateCategory("Bracelets", formLang)}</option>
                      <option value="Bridal Collection">{translateCategory("Bridal Collection", formLang)}</option>
                    </select>
                  </div>

                  {/* Stock Level */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Level</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Price */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Discount */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={newProduct.discount}
                      onChange={(e) => setNewProduct({ ...newProduct, discount: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Homepage Visibility */}
                <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="add_show_on_homepage"
                    checked={newProduct.show_on_homepage || false}
                    onChange={(e) => setNewProduct({ ...newProduct, show_on_homepage: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="add_show_on_homepage" className="block text-xs font-bold text-slate-700 dark:text-slate-250 cursor-pointer select-none">
                      Homepage Visibility
                    </label>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Show this product on the homepage grid and featured collections.
                    </span>
                  </div>
                </div>

                {/* ROW 2: Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  {formLang === 'en' ? (
                    <textarea
                      required
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Enter english product description..."
                      rows="2"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    ></textarea>
                  ) : (
                    <textarea
                      required
                      value={newProduct.description_translations?.hi || ''}
                      onChange={(e) => setNewProduct({ 
                        ...newProduct, 
                        description_translations: { ...newProduct.description_translations, hi: e.target.value } 
                      })}
                      placeholder="हिंदी विवरण दर्ज करें..."
                      rows="2"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    ></textarea>
                  )}
                </div>

                {/* ROW 3: Key Features & Technical Specifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Features</label>
                      <span className="text-[9px] text-slate-400">One feature per line</span>
                    </div>
                    {formLang === 'en' ? (
                      <textarea
                        value={newProduct.features_en}
                        onChange={(e) => setNewProduct({ ...newProduct, features_en: e.target.value })}
                        placeholder="Feature 1&#10;Feature 2"
                        rows="3"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                      />
                    ) : (
                      <textarea
                        value={newProduct.features_hi}
                        onChange={(e) => setNewProduct({ ...newProduct, features_hi: e.target.value })}
                        placeholder="सुविधा 1&#10;सुविधा 2"
                        rows="3"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technical Specifications</label>
                      <span className="text-[9px] text-slate-400">Format: Key: Value (one per line)</span>
                    </div>
                    {formLang === 'en' ? (
                      <textarea
                        value={newProduct.specifications_en}
                        onChange={(e) => setNewProduct({ ...newProduct, specifications_en: e.target.value })}
                        placeholder="Weight: 1kg&#10;Color: Silver"
                        rows="3"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                      />
                    ) : (
                      <textarea
                        value={newProduct.specifications_hi}
                        onChange={(e) => setNewProduct({ ...newProduct, specifications_hi: e.target.value })}
                        placeholder="वजन: 1kg&#10;रंग: चांदी"
                        rows="3"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                      />
                    )}
                  </div>
                </div>

                {/* ROW 4: Accordion Images Section */}
                <div className="border border-slate-250 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-955/20">
                  <button
                    type="button"
                    onClick={() => setIsAddImagesOpen(!isAddImagesOpen)}
                    className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-250 dark:border-slate-800 font-bold hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-emerald-500" />
                      <span>Manage Product Images</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {isAddImagesOpen ? "Collapse ▴" : "Expand ▾"}
                    </span>
                  </button>
                  {isAddImagesOpen && (
                    <div className="p-4 bg-white dark:bg-slate-900">
                      {renderImageManager(newProductImages, setNewProductImages, 'create')}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Bottom Action Bar */}
              <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-150 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-850 dark:border-slate-750 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 rounded-xl font-bold transition-all text-xs shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all text-xs shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL OVERLAY */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 mb-6 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-emerald-500" />
              <span>Order Details - #{selectedOrder.order_id}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-655 dark:text-slate-350">
              {/* Customer and Shipping Details */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200/60 dark:border-slate-800 pb-2">Customer & Shipping Information</h4>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Name</span>
                  <span className="text-slate-855 dark:text-slate-100 font-semibold">{selectedOrder.shipping_address?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</span>
                  <span className="text-slate-855 dark:text-slate-100 font-mono font-semibold">{selectedOrder.shipping_address?.phone || selectedOrder.shipping_address?.mobile || "N/A"}</span>
                </div>
                {selectedOrder.shipping_address?.alternate_mobile_number && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alternate Mobile Number</span>
                    <span className="text-slate-855 dark:text-slate-100 font-mono font-semibold">{selectedOrder.shipping_address.alternate_mobile_number}</span>
                  </div>
                )}
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Email</span>
                  <span className="text-slate-855 dark:text-slate-100">{selectedOrder.user_email || "Not Available"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shipping Address</span>
                  <span className="text-slate-855 dark:text-slate-100 leading-relaxed block">
                    {selectedOrder.shipping_address?.address || selectedOrder.shipping_address?.street || "N/A"}<br />
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.pincode}
                  </span>
                </div>
              </div>

              {/* Order Status & Info */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200/60 dark:border-slate-800 pb-2">Order Meta Details</h4>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Date</span>
                  <span className="text-slate-855 dark:text-slate-100 font-semibold">
                    {formatTimestamp(selectedOrder.created_at)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Arrival</span>
                  <span className="text-emerald-500 dark:text-white font-semibold">
                    {selectedOrder.delivery_date || "Pending Dispatch"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border text-emerald-500 dark:text-white bg-emerald-500/10 border-emerald-500/20 inline-block mt-1">
                    Paid (Simulated Online/COD)
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment Status</span>
                  <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm inline-block mt-1 ${
                    (selectedOrder.status || '').toLowerCase() === 'pending'
                      ? 'status-badge-pending'
                      : (selectedOrder.status || '').toLowerCase() === 'processing' || (selectedOrder.status || '').toLowerCase() === 'confirmed' || (selectedOrder.status || '').toLowerCase() === 'packed'
                      ? 'bg-[#3B82F6] text-white border-[#2563EB]'
                      : (selectedOrder.status || '').toLowerCase() === 'shipped' || (selectedOrder.status || '').toLowerCase() === 'dispatched'
                      ? 'bg-[#06B6D4] text-white border-[#0891B2]'
                      : (selectedOrder.status || '').toLowerCase() === 'out for delivery'
                      ? 'bg-[#8B5CF6] text-white border-[#7C3AED]'
                      : (selectedOrder.status || '').toLowerCase() === 'delivered'
                      ? 'status-badge-success'
                      : (selectedOrder.status || '').toLowerCase() === 'cancelled'
                      ? 'bg-[#EF4444] text-white border-[#DC2626]'
                      : 'bg-[#6B7280] text-white border-[#4B5563]'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Ordered Items */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-2 mb-3">
                Ordered Items ({selectedOrder.items?.length || 0})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100/60 dark:border-slate-850/40 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-855 dark:text-slate-100 block max-w-[250px] truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400">Qty: {item.quantity} × <span className="price-amount">₹{formatPrice(item.price)}</span></span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-855 dark:text-slate-100 price-amount">₹{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fulfillment & Live Order Tracking updates */}
            <div className="mt-6 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-4 text-xs">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-850">
                <RefreshCw className="h-4 w-4 text-emerald-500 animate-spin-slow" />
                <span>Update Shipment & Tracking Timeline</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Fulfillment Status</label>
                  <select
                    value={modalTracking.status}
                    onChange={(e) => setModalTracking({ ...modalTracking, status: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl focus:outline-none text-slate-850 dark:text-slate-100 font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Estimated Delivery Date</label>
                  <input
                    type="text"
                    placeholder="e.g. May 28, 2026"
                    value={modalTracking.delivery_date}
                    onChange={(e) => setModalTracking({ ...modalTracking, delivery_date: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl focus:outline-none text-slate-850 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Courier Carrier</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhivery, DHL"
                    value={modalTracking.carrier}
                    onChange={(e) => setModalTracking({ ...modalTracking, carrier: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl focus:outline-none text-slate-850 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Shipment Tracking ID</label>
                  <input
                    type="text"
                    placeholder="e.g. IN782947239"
                    value={modalTracking.tracking_id}
                    onChange={(e) => setModalTracking({ ...modalTracking, tracking_id: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl focus:outline-none text-slate-850 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Custom Timeline Message (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Parcel has left Bangalore warehouse"
                    value={modalTracking.message}
                    onChange={(e) => setModalTracking({ ...modalTracking, message: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl focus:outline-none text-slate-850 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleOrderTrackingUpdate(selectedOrder._id || selectedOrder.id, modalTracking)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Update Tracking & Notify User</span>
                </button>
              </div>
            </div>

            {/* Total Amount Summary */}
            <div className="mt-6 pt-4 border-t border-slate-150 dark:border-slate-855 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grand Total</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-50 price-amount">₹{formatPrice(selectedOrder.total_amount)}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {selectedStockProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setSelectedStockProduct(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              <span>Adjust Inventory Stock</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">{selectedStockProduct.name}</p>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-850 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Current Stock</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1 block">
                  {selectedStockProduct.stock} Units
                </span>
              </div>
              <span className={`stock-badge-container ${
                selectedStockProduct.stock === 0 
                  ? 'stock-badge-out-of-stock' 
                  : selectedStockProduct.stock < 10 
                    ? 'stock-badge-low-stock' 
                    : 'stock-badge-in-stock'
              }`}>
                {selectedStockProduct.stock === 0 ? "OUT OF STOCK" : selectedStockProduct.stock < 10 ? "LOW STOCK" : "IN STOCK"}
              </span>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Adjustment Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {['increase', 'decrease', 'set'].map(act => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setStockAdjustmentAction(act)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border capitalize transition-all ${
                        stockAdjustmentAction === act
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {act === 'set' ? 'Set Exact' : act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Stock Amount</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder={stockAdjustmentAction === 'set' ? 'Enter exact new stock quantity' : 'Enter amount to adjust by'}
                  value={stockAdjustmentValue}
                  onChange={(e) => setStockAdjustmentValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow"
              >
                Save Stock Adjustment
              </button>
            </form>

            {/* Stock Change Logs List */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Stock Change History Log</h4>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-[11px]">
                {productStockHistory.length === 0 ? (
                  <p className="text-slate-400 italic text-[10px]">No historical changes logged for this product.</p>
                ) : (
                  productStockHistory.map((h, i) => (
                    <div key={i} className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-850 flex justify-between items-center">
                      <div>
                        <span className="font-extrabold capitalize text-slate-700 dark:text-slate-300 mr-2">{h.change_type}</span>
                        <span className="text-slate-455">({h.old_stock} → {h.new_stock})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(h.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ORDERS MODAL */}
      {selectedOrdersProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setSelectedOrdersProduct(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-indigo-500" />
              <span>Linked Customer Orders</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">{selectedOrdersProduct.name}</p>

            <div className="overflow-y-auto flex-grow pr-1">
              {productOrdersList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium text-xs">
                  No orders contain this product yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                      <th className="py-2.5">Order ID</th>
                      <th className="py-2.5">Customer Name</th>
                      <th className="py-2.5">Quantity</th>
                      <th className="py-2.5">Payment</th>
                      <th className="py-2.5">Order Status</th>
                      <th className="py-2.5 text-right">Edit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {productOrdersList.map(o => (
                      <tr key={o.order_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-350">{o.order_id}</td>
                        <td className="py-3 text-slate-800 dark:text-slate-200">{o.customer_name}</td>
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-100">{o.quantity_ordered} Units</td>
                        <td className="py-3 text-slate-550">{o.payment_method}</td>
                        <td className="py-3">
                          <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm ${
                            (o.order_status || '').toLowerCase() === 'pending'
                              ? 'status-badge-pending'
                              : (o.order_status || '').toLowerCase() === 'processing' || (o.order_status || '').toLowerCase() === 'confirmed' || (o.order_status || '').toLowerCase() === 'packed'
                              ? 'bg-[#3B82F6] text-white border-[#2563EB]'
                              : (o.order_status || '').toLowerCase() === 'shipped' || (o.order_status || '').toLowerCase() === 'dispatched'
                              ? 'bg-[#06B6D4] text-white border-[#0891B2]'
                              : (o.order_status || '').toLowerCase() === 'out for delivery'
                              ? 'bg-[#8B5CF6] text-white border-[#7C3AED]'
                              : (o.order_status || '').toLowerCase() === 'delivered'
                              ? 'status-badge-success'
                              : (o.order_status || '').toLowerCase() === 'cancelled'
                              ? 'bg-[#EF4444] text-white border-[#DC2626]'
                              : 'bg-[#6B7280] text-white border-[#4B5563]'
                          }`}>
                            {o.order_status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <select
                            value={o.order_status}
                            onChange={(e) => handleUpdateProductOrderStatus(o.db_order_id, e.target.value)}
                            className="text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 px-2 py-1 rounded-lg focus:outline-none text-slate-850 dark:text-slate-100"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT SALES ANALYTICS MODAL */}
      {selectedAnalyticsProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setSelectedAnalyticsProduct(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              <span>Product Sales & Performance Analytics</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">{selectedAnalyticsProduct.name}</p>

            {productAnalyticsData ? (
              <div className="space-y-6 overflow-y-auto flex-grow pr-1">
                {/* Stats Cards Row */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Today Sales', val: productAnalyticsData.sales_stats.daily_sales },
                    { label: 'Weekly Sales', val: productAnalyticsData.sales_stats.weekly_sales },
                    { label: 'Monthly Sales', val: productAnalyticsData.sales_stats.monthly_sales },
                    { label: 'Total Volume', val: productAnalyticsData.sales_stats.total_sales }
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 dark:bg-slate-950 border border-slate-105 dark:border-slate-850 p-3 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 block">{item.val} Units</span>
                    </div>
                  ))}
                </div>

                {/* Chart Image */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-3xl flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-slate-500 mb-2">Live Matplotlib Chart Report</span>
                  <img 
                    src={`${SERVER_BASE_URL}${productAnalyticsData.chart_url}`}
                    alt="Sales Trend Chart" 
                    className="max-h-[280px] w-auto object-contain rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center py-12 text-slate-400 text-xs">
                Generating live Pandas & Matplotlib reports...
              </div>
            )}
          </div>
        </div>
      )}

      {/* USER STATUS UPDATE MODAL */}
      {statusModalOpen && statusModalUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative flex flex-col">
            <button 
              onClick={() => setStatusModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <ShieldAlert className={`h-5 w-5 ${statusModalNewBlockedState ? 'text-rose-500' : 'text-emerald-500'}`} />
              <span>{statusModalNewBlockedState ? 'Block User Account' : 'Unblock User Account'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to {statusModalNewBlockedState ? 'block' : 'unblock'} the account for <strong>{statusModalUser.name}</strong> ({statusModalUser.email})?
            </p>
            <form onSubmit={handleConfirmStatusChange} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reason for Status Change</label>
                <textarea
                  required
                  rows="3"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={`Enter reason for ${statusModalNewBlockedState ? 'blocking' : 'unblocking'}...`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 rounded-xl font-bold transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-white rounded-xl font-bold transition-all text-xs ${
                    statusModalNewBlockedState ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/50 dark:border-slate-600/50 transition-all duration-300 transform translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-emerald-500/20 p-1.5 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

    </div>
    </div>

  );
};
