import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart3, Plus, Edit2, Trash2, CheckCircle2, ShieldAlert, User,
  ArrowUpRight, Users, ShoppingBag, Package, MessageSquare, AlertCircle, Upload, Eye, X,
  AlertTriangle, Check, RefreshCw, Calendar, DollarSign, Clock, MapPin, Lock, Unlock, Shield, Search, Image,
  Settings, Globe, Link as LinkIcon
} from 'lucide-react';
import { AuthContext, API_BASE_URL, SERVER_BASE_URL } from '../context/AuthContext';
import { formatPrice } from '../utils/priceFormatter';
import { translateCategory } from '../utils/categoryTranslations';

const ACTION_TYPES = [
  "Product Added",
  "Product Updated",
  "Product Deleted",
  "Stock Updated",
  "Price Changed",
  "Category Changed",
  "User Blocked",
  "User Unblocked",
  "Order Updated",
  "Order Cancelled",
  "Support Ticket Updated",
  "Admin Login",
  "Admin Logout"
];

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

export const AdminControl = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useContext(AuthContext);

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
      navigate('/login?redirect=admin-control');
    }
  }, [user, isAdmin, navigate]);

  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  
  const handleTabChange = (tabName) => {
    navigate(`/admin-control?tab=${tabName}`);
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
  
  // Site Configuration states
  const [activeConfigSubTab, setActiveConfigSubTab] = useState('banners');
  const [activeOccasionLang, setActiveOccasionLang] = useState('en');
  const [activeOwnerIdx, setActiveOwnerIdx] = useState(0);

  // Report Automation states
  const [ownerEmail, setOwnerEmail] = useState('');
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Homepage Config states
  const [homepageSettings, setHomepageSettings] = useState({
    owner_image: "/owner.png",
    owner_name: "",
    owner_title: "",
    owner_est: "",
    owner_bio_1: "",
    owner_bio_2: "",
    owner_quote: "",
    video_showcase_url: "",
    luxury_gallery_items: [],
    owner_stats: [
      { label: 'Years of Craft', value: 25, suffix: '+' },
      { label: 'Unique Designs', value: 1200, suffix: '+' },
      { label: 'Happy Clients', value: 8500, suffix: '+' },
      { label: 'Awards Won', value: 18, suffix: '' }
    ],
    owner_badges: ['BIS Hallmark Certified', 'ISO 9001:2015', 'Rajasthan Ratna Awardee', 'GIA Member'],
    occasion_items_en: [],
    occasion_items_hi: [],
    owners_list: []
  });
  const [homepageLoading, setHomepageLoading] = useState(true);
  const [homepageUpdating, setHomepageUpdating] = useState(false);
  const [homepageError, setHomepageError] = useState('');
  const [homepageSuccess, setHomepageSuccess] = useState('');

  // Category config states
  const [adminCategories, setAdminCategories] = useState([]);
  const [adminCategoriesLoading, setAdminCategoriesLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null means create new
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    name_en: '',
    name_hi: '',
    image_url: ''
  });
  const [categoryError, setCategoryError] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const [reportLogs, setReportLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  const [runMonth, setRunMonth] = useState(new Date().getMonth() + 1);
  const [runYear, setRunYear] = useState(new Date().getFullYear());
  const [runLoading, setRunLoading] = useState(false);
  const [runSuccess, setRunSuccess] = useState('');
  const [runError, setRunError] = useState('');
  
  // Carousel Banners states
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    button_text: 'Shop Now',
    button_link: '',
    image_url: '',
    background_style: 'from-slate-900 via-indigo-950 to-slate-900',
    category: '',
    display_order: 1,
    is_active: true
  });
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const [bannerError, setBannerError] = useState(null);
  const [bannerSuccess, setBannerSuccess] = useState(null);

  // FAQ Management states
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [isAddFaqModalOpen, setIsAddFaqModalOpen] = useState(false);
  const [isEditFaqModalOpen, setIsEditFaqModalOpen] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [editingFaq, setEditingFaq] = useState({ id: '', question: '', answer: '' });

  // Support Links states
  const [supportLinks, setSupportLinks] = useState([]);
  const [loadingSupportLinks, setLoadingSupportLinks] = useState(false);
  const [isSupportLinkModalOpen, setIsSupportLinkModalOpen] = useState(false);
  const [supportLinkForm, setSupportLinkForm] = useState({
    title: '',
    url: '',
    icon: 'Phone',
    is_active: true
  });
  const [editingSupportLinkId, setEditingSupportLinkId] = useState(null);
  
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
  
  const [selectedOrdersProduct, setSelectedOrdersProduct] = useState(null);
  const [productOrdersList, setProductOrdersList] = useState([]);
  
  const [selectedAnalyticsProduct, setSelectedAnalyticsProduct] = useState(null);
  const [productAnalyticsData, setProductAnalyticsData] = useState(null);
  
  const [overviewAnalytics, setOverviewAnalytics] = useState(null);

  // General Audit Logs states
  const [generalAuditLogs, setGeneralAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionType, setAuditActionType] = useState("");
  const [auditStatus, setAuditStatus] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPerPage, setAuditPerPage] = useState(10);

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

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/support/faqs`);
      setFaqs(res.data);
    } catch (err) {
      console.error("Failed to fetch FAQs:", err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/support/faqs`, newFaq, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs([...faqs, res.data]);
      setNewFaq({ question: '', answer: '' });
      setIsAddFaqModalOpen(false);
      alert("FAQ added successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add FAQ");
    }
  };

  const handleUpdateFaq = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/support/faqs/${editingFaq.id}`, {
        question: editingFaq.question,
        answer: editingFaq.answer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs(faqs.map(f => f.id === editingFaq.id ? res.data : f));
      setIsEditFaqModalOpen(false);
      alert("FAQ updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update FAQ");
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/support/faqs/${faqId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs(faqs.filter(f => f.id !== faqId));
      alert("FAQ deleted successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete FAQ");
    }
  };

  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/banners/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBanners(response.data || []);
    } catch (err) {
      console.error("Error fetching banners:", err);
    } finally {
      setLoadingBanners(false);
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBannerImage(true);
    setBannerError(null);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/banners/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setBannerForm(prev => ({ ...prev, image_url: response.data.image_url }));
      setBannerSuccess("Image uploaded successfully!");
    } catch (err) {
      console.error("Error uploading banner image:", err);
      setBannerError(err.response?.data?.message || "Failed to upload banner image.");
    } finally {
      setUploadingBannerImage(false);
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const payload = {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        description: bannerForm.description,
        button_text: bannerForm.button_text,
        button_link: bannerForm.button_link,
        image_url: bannerForm.image_url,
        background_style: bannerForm.background_style,
        category: bannerForm.category,
        display_order: parseInt(bannerForm.display_order) || 0,
        is_active: bannerForm.is_active
      };
      
      if (editingBannerId) {
        await axios.put(`${API_BASE_URL}/banners/${editingBannerId}`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBannerSuccess("Banner slide updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/banners`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBannerSuccess("Banner slide created successfully!");
      }
      setIsBannerModalOpen(false);
      setEditingBannerId(null);
      fetchBanners();
    } catch (err) {
      console.error("Error saving banner:", err);
      setBannerError(err.response?.data?.message || "Failed to save banner slide.");
    }
  };

  const startEditBanner = (banner) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      button_text: banner.button_text || 'Shop Now',
      button_link: banner.button_link || '',
      image_url: banner.image_url || '',
      background_style: banner.background_style || 'from-slate-900 via-indigo-950 to-slate-900',
      category: banner.category || '',
      display_order: banner.display_order || 1,
      is_active: banner.is_active !== undefined ? banner.is_active : true
    });
    setIsBannerModalOpen(true);
    setBannerError(null);
    setBannerSuccess(null);
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner slide?")) return;
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/banners/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert("Banner deleted successfully!");
      fetchBanners();
    } catch (err) {
      console.error("Error deleting banner:", err);
      alert(err.response?.data?.message || "Failed to delete banner.");
    }
  };

  const fetchSupportLinks = async () => {
    setLoadingSupportLinks(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/support/links`);
      setSupportLinks(response.data || []);
    } catch (err) {
      console.error("Error fetching support links:", err);
    } finally {
      setLoadingSupportLinks(false);
    }
  };

  const handleSaveSupportLink = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const payload = {
        title: supportLinkForm.title,
        url: supportLinkForm.url,
        icon: supportLinkForm.icon,
        is_active: supportLinkForm.is_active
      };
      
      if (editingSupportLinkId) {
        await axios.put(`${API_BASE_URL}/support/links/${editingSupportLinkId}`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert("Support link updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/support/links`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert("Support link created successfully!");
      }
      setIsSupportLinkModalOpen(false);
      setEditingSupportLinkId(null);
      fetchSupportLinks();
    } catch (err) {
      console.error("Error saving support link:", err);
      alert(err.response?.data?.message || "Failed to save support link.");
    }
  };

  const startEditSupportLink = (link) => {
    setEditingSupportLinkId(link.id);
    setSupportLinkForm({
      title: link.title || '',
      url: link.url || '',
      icon: link.icon || 'Phone',
      is_active: link.is_active !== undefined ? link.is_active : true
    });
    setIsSupportLinkModalOpen(true);
  };

  const handleDeleteSupportLink = async (id) => {
    if (!window.confirm("Are you sure you want to delete this support link?")) return;
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/support/links/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert("Support link deleted successfully!");
      fetchSupportLinks();
    } catch (err) {
      console.error("Error deleting support link:", err);
      alert(err.response?.data?.message || "Failed to delete support link.");
    }
  };

  const fetchReportSettings = async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/admin/report-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOwnerEmail(res.data.owner_email || '');
      setSmtpEmail(res.data.smtp_email || '');
      setSmtpPassword(res.data.smtp_password || '');
    } catch (err) {
      console.error(err);
      setSettingsError(err.response?.data?.message || 'Failed to load report settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchReportLogs = async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/admin/report-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportLogs(res.data || []);
    } catch (err) {
      console.error(err);
      setLogsError(err.response?.data?.message || 'Failed to load execution logs.');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess('');
    setSettingsError('');
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/admin/report-settings`, {
        owner_email: ownerEmail,
        smtp_email: smtpEmail,
        smtp_password: smtpPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettingsSuccess('Settings saved successfully!');
      setTimeout(() => setSettingsSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setSettingsError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleRunReportNow = async () => {
    if (!window.confirm("Are you sure you want to run report generation, email, archive, and cleanup now?")) {
      return;
    }
    setRunLoading(true);
    setRunSuccess('');
    setRunError('');
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/admin/run-report`, {
        month: runMonth,
        year: runYear
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRunSuccess(res.data.message || 'Report automation executed successfully!');
      fetchReportLogs();
    } catch (err) {
      console.error(err);
      setRunError(err.response?.data?.message || 'Report run failed.');
      fetchReportLogs();
    } finally {
      setRunLoading(false);
    }
  };

  const fetchHomepageSettings = async () => {
    setHomepageLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/settings`);
      if (response.data) {
        let galleryItems = [];
        if (response.data.luxury_gallery_items) {
          try {
            galleryItems = JSON.parse(response.data.luxury_gallery_items);
          } catch (e) {
            console.error("Error parsing luxury gallery items:", e);
          }
        }
        let statsItems = [
          { label: 'Years of Craft', value: 25, suffix: '+' },
          { label: 'Unique Designs', value: 1200, suffix: '+' },
          { label: 'Happy Clients', value: 8500, suffix: '+' },
          { label: 'Awards Won', value: 18, suffix: '' }
        ];
        if (response.data.owner_stats) {
          try {
            statsItems = JSON.parse(response.data.owner_stats);
          } catch (e) {
            console.error("Error parsing owner stats:", e);
          }
        }

        let badgesItems = ['BIS Hallmark Certified', 'ISO 9001:2015', 'Rajasthan Ratna Awardee', 'GIA Member'];
        if (response.data.owner_badges) {
          try {
            badgesItems = JSON.parse(response.data.owner_badges);
          } catch (e) {
            console.error("Error parsing owner badges:", e);
          }
        }

        let occasionEn = [];
        if (response.data.occasion_items_en) {
          try {
            occasionEn = JSON.parse(response.data.occasion_items_en);
          } catch (e) {
            console.error("Error parsing occasion items en:", e);
          }
        }

        let occasionHi = [];
        if (response.data.occasion_items_hi) {
          try {
            occasionHi = JSON.parse(response.data.occasion_items_hi);
          } catch (e) {
            console.error("Error parsing occasion items hi:", e);
          }
        }

        let ownersList = [];
        if (response.data.owners_list) {
          try {
            ownersList = JSON.parse(response.data.owners_list);
          } catch (e) {
            console.error("Error parsing owners list:", e);
          }
        }

        setHomepageSettings({
          owner_image: response.data.owner_image || "/owner.png",
          owner_name: response.data.owner_name || "Shri Suresh Soni",
          owner_title: response.data.owner_title || "Founder & Master Craftsman",
          owner_est: response.data.owner_est || "Est. 1999 · Jaipur, India",
          owner_bio_1: response.data.owner_bio_1 || "",
          owner_bio_2: response.data.owner_bio_2 || "",
          owner_quote: response.data.owner_quote || "",
          video_showcase_url: response.data.video_showcase_url || "/golden-stage.mp4",
          luxury_gallery_items: galleryItems,
          owner_stats: statsItems,
          owner_badges: badgesItems,
          occasion_items_en: occasionEn,
          occasion_items_hi: occasionHi,
          owners_list: ownersList
        });
      }
    } catch (err) {
      console.error("Error fetching homepage settings:", err);
      setHomepageError("Failed to fetch homepage settings.");
    } finally {
      setHomepageLoading(false);
    }
  };

  const fetchAdminCategories = async () => {
    setAdminCategoriesLoading(true);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAdminCategories(response.data || []);
    } catch (err) {
      console.error("Error fetching admin categories:", err);
    } finally {
      setAdminCategoriesLoading(false);
    }
  };

  const handleSaveHomepageSettings = async (e) => {
    e.preventDefault();
    setHomepageUpdating(true);
    setHomepageError('');
    setHomepageSuccess('');
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const payload = {
        ...homepageSettings,
        luxury_gallery_items: JSON.stringify(homepageSettings.luxury_gallery_items),
        owner_stats: JSON.stringify(homepageSettings.owner_stats),
        owner_badges: JSON.stringify(homepageSettings.owner_badges),
        occasion_items_en: JSON.stringify(homepageSettings.occasion_items_en),
        occasion_items_hi: JSON.stringify(homepageSettings.occasion_items_hi),
        owners_list: JSON.stringify(homepageSettings.owners_list)
      };
      const response = await axios.post(`${API_BASE_URL}/admin/settings`, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setHomepageSuccess("Homepage settings updated successfully!");
        fetchHomepageSettings();
      } else {
        setHomepageError(response.data.message || "Failed to update settings.");
      }
    } catch (err) {
      console.error("Error saving homepage settings:", err);
      setHomepageError(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setHomepageUpdating(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategorySubmitting(true);
    setCategoryError('');
    setCategorySuccess('');
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      if (editingCategory) {
        await axios.put(`${API_BASE_URL}/admin/categories/${editingCategory.id}`, categoryForm, { headers });
        setCategorySuccess("Category updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/admin/categories`, categoryForm, { headers });
        setCategorySuccess("Category created successfully!");
      }
      setShowCategoryModal(false);
      fetchAdminCategories();
    } catch (err) {
      console.error("Error submitting category form:", err);
      setCategoryError(err.response?.data?.message || "Failed to submit category.");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/admin/categories/${catId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAdminCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      alert(err.response?.data?.message || "Failed to delete category.");
    }
  };

  const handleUploadMediaFile = async (file, targetField, galleryIndex = null) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/products/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data && response.data.url) {
        let uploadedUrl = response.data.url;
        if (uploadedUrl.startsWith('/static/')) {
          uploadedUrl = `${SERVER_BASE_URL}${uploadedUrl}`;
        }
        
        if (galleryIndex !== null) {
          if (targetField === 'occasion_en') {
            const updatedItems = [...homepageSettings.occasion_items_en];
            updatedItems[galleryIndex].image = uploadedUrl;
            setHomepageSettings(prev => ({
              ...prev,
              occasion_items_en: updatedItems
            }));
          } else if (targetField === 'occasion_hi') {
            const updatedItems = [...homepageSettings.occasion_items_hi];
            updatedItems[galleryIndex].image = uploadedUrl;
            setHomepageSettings(prev => ({
              ...prev,
              occasion_items_hi: updatedItems
            }));
          } else {
            const updatedItems = [...homepageSettings.luxury_gallery_items];
            updatedItems[galleryIndex].image = uploadedUrl;
            setHomepageSettings(prev => ({
              ...prev,
              luxury_gallery_items: updatedItems
            }));
          }
        } else if (targetField === 'category') {
          setCategoryForm(prev => ({ ...prev, image_url: uploadedUrl }));
        } else {
          setHomepageSettings(prev => ({
            ...prev,
            [targetField]: uploadedUrl
          }));
        }
      }
    } catch (err) {
      console.error("Error uploading media file:", err);
      alert("Failed to upload media file.");
    }
  };

  const handleUploadOwnerPhoto = async (file, ownerIdx) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/products/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data && response.data.url) {
        let uploadedUrl = response.data.url;
        if (uploadedUrl.startsWith('/static/')) {
          uploadedUrl = `${SERVER_BASE_URL}${uploadedUrl}`;
        }
        const updated = [...(homepageSettings.owners_list || [])];
        if (updated[ownerIdx]) {
          updated[ownerIdx].image = uploadedUrl;
          setHomepageSettings(prev => ({
            ...prev,
            owners_list: updated
          }));
        }
      }
    } catch (err) {
      console.error("Error uploading owner photo:", err);
      alert("Failed to upload photo.");
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'config') {
      if (activeConfigSubTab === 'reports') {
        fetchReportSettings();
        fetchReportLogs();
      } else if (activeConfigSubTab === 'homepage') {
        fetchHomepageSettings();
        fetchAdminCategories();
      }
    }
  }, [isAdmin, activeTab, activeConfigSubTab]);


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

  const renderReportAutomation = () => {
    const monthsList = [
      { value: 1, name: "January" },
      { value: 2, name: "February" },
      { value: 3, name: "March" },
      { value: 4, name: "April" },
      { value: 5, name: "May" },
      { value: 6, name: "June" },
      { value: 7, name: "July" },
      { value: 8, name: "August" },
      { value: 9, name: "September" },
      { value: 10, name: "October" },
      { value: 11, name: "November" },
      { value: 12, name: "December" }
    ];
    
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Owner Configuration (Settings form) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4 text-emerald-500" />
              <span>Owner & Email Configuration</span>
            </h4>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Owner Email Address</label>
                <input 
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="owner@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">SMTP Sender Email (Gmail)</label>
                <input 
                  type="email"
                  value={smtpEmail}
                  onChange={(e) => setSmtpEmail(e.target.value)}
                  className="w-full text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="sender@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">SMTP App Password</label>
                <input 
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="w-full text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="••••••••••••••••"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Use a 16-character App Password generated in Google Account settings.</p>
              </div>

              {settingsSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <Check className="h-4 w-4" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {settingsError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  <AlertCircle className="h-4 w-4" />
                  <span>{settingsError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                {settingsLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* Manual Run Controls */}
          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" />
                <span>Manual Trigger & Testing</span>
              </h4>
              <p className="text-xs text-slate-400 mb-6">
                Trigger reports manually for specific target months. Note: Successful report generation triggers data archiving and clean-up of completed target month records.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Target Month</label>
                  <select 
                    value={runMonth} 
                    onChange={(e) => setRunMonth(parseInt(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    {monthsList.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Target Year</label>
                  <input 
                    type="number"
                    value={runYear}
                    onChange={(e) => setRunYear(parseInt(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="2026"
                  />
                </div>
              </div>

              {runSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 mb-4">
                  <Check className="h-4 w-4" />
                  <span>{runSuccess}</span>
                </div>
              )}

              {runError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <span>{runError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleRunReportNow}
              disabled={runLoading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-4"
            >
              {runLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Executing Automation Flow...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Run Report Automation Now</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Logs Table Section */}
        <div className="border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 bg-white dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" />
              <span>Report Execution & Logging History</span>
            </h4>
            <button 
              onClick={fetchReportLogs}
              className="p-1.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {logsLoading ? (
            <p className="text-slate-400 italic text-xs py-6 text-center">Loading execution logs...</p>
          ) : reportLogs.length === 0 ? (
            <p className="text-slate-400 italic text-xs py-6 text-center">No reports run yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400">
                    <th className="pb-3 font-bold">Month</th>
                    <th className="pb-3 font-bold">Year</th>
                    <th className="pb-3 font-bold">Excel Filename</th>
                    <th className="pb-3 font-bold text-center">Email</th>
                    <th className="pb-3 font-bold text-center">Archive</th>
                    <th className="pb-3 font-bold text-center">Cleanup</th>
                    <th className="pb-3 font-bold text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-600 dark:text-slate-350">
                  {reportLogs.map((log) => {
                    const getBadge = (status) => {
                      if (status === 'Success') {
                        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">Success</span>;
                      } else if (status === 'Failed') {
                        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">Failed</span>;
                      }
                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700">Pending</span>;
                    };
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{log.report_month}</td>
                        <td className="py-3">{log.report_year}</td>
                        <td className="py-3 font-mono text-xs">{log.excel_filename}</td>
                        <td className="py-3 text-center">{getBadge(log.email_status)}</td>
                        <td className="py-3 text-center">{getBadge(log.archive_status)}</td>
                        <td className="py-3 text-center">{getBadge(log.cleanup_status)}</td>
                        <td className="py-3 text-right text-slate-400">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUsersManagement = () => {
    const filteredUsers = users.filter(u => {
      const query = userSearchQuery.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.mobile || '').toLowerCase().includes(query) ||
        (u.id || u._id || '').toString().toLowerCase().includes(query)
      );
    });

    return (
      <div className="space-y-6">
        {/* Search and stats count row */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250">Customer Management Panel</h4>
              <p className="text-xs text-slate-400">Total Registered Users: {users.length}</p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Users Table */}
          <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 GFM-table-header uppercase font-bold">
                  <th className="py-3 px-2">User ID</th>
                  <th className="py-3 px-2">Full Name</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Mobile</th>
                  <th className="py-3 px-2">Address</th>
                  <th className="py-3 px-2">Registered</th>
                  <th className="py-3 px-2">Last Login</th>
                  <th className="py-3 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-450 italic">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr 
                      key={u.id || u._id} 
                      onClick={() => fetchUserDetails(u.id || u._id)}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-850/40 cursor-pointer transition-colors ${
                        String(selectedUserDetails?.id || selectedUserDetails?._id) === String(u.id || u._id)
                          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-l-4 border-l-emerald-500'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-2 font-mono text-[10px] text-slate-450">
                        {(u.id || u._id || '').toString().slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-2 font-bold text-slate-800 dark:text-slate-100">
                        {u.name || "N/A"}
                      </td>
                      <td className="py-3.5 px-2 text-slate-550 dark:text-slate-350">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-slate-550 dark:text-slate-350">
                        {u.mobile || "N/A"}
                      </td>
                      <td className="py-3.5 px-2 text-slate-400 max-w-[120px] truncate" title={formatAddress(u.address)}>
                        {formatAddress(u.address)}
                      </td>
                      <td className="py-3.5 px-2 text-slate-400 admin-datetime-text">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3.5 px-2 text-slate-400 admin-datetime-text">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm ${
                          (u.status || (u.is_blocked ? "Blocked" : "Active")).toLowerCase() === 'active'
                            ? 'status-badge-active'
                            : (u.status || (u.is_blocked ? "Blocked" : "Active")).toLowerCase() === 'inactive'
                            ? 'bg-[#6B7280] text-[#FFFFFF] border-[#4B5563]'
                            : (u.status || (u.is_blocked ? "Blocked" : "Active")).toLowerCase() === 'suspended'
                            ? 'bg-[#EF4444] text-[#FFFFFF] border-[#DC2626]'
                            : (u.status || (u.is_blocked ? "Blocked" : "Active")).toLowerCase() === 'pending verification'
                            ? 'bg-[#F59E0B] text-[#FFFFFF] border-[#D97706]'
                            : 'bg-[#B91C1C] text-[#FFFFFF] border-[#991B1B]'
                        }`}>
                          {u.status || (u.is_blocked ? "Blocked" : "Active")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Right Column: User Detail Panel */}
          <div className="xl:col-span-1 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-6 xl:pt-0 xl:pl-8">
            {selectedUserDetails ? (
              <div className="space-y-6">
                {/* Header info */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 font-black text-lg">
                      {selectedUserDetails.name ? selectedUserDetails.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-850 dark:text-slate-100">
                        {selectedUserDetails.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ID: {selectedUserDetails.id || selectedUserDetails._id}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {selectedUserDetails.email}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUserDetails(null)} 
                    className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Profile Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Joined Date</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {selectedUserDetails.created_at ? new Date(selectedUserDetails.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Role</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-slate-400" />
                      {selectedUserDetails.is_admin ? 'Admin' : 'Customer'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Last Login</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {selectedUserDetails.last_login ? new Date(selectedUserDetails.last_login).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-55 dark:bg-slate-955 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Total Orders</span>
                    <span className="stats-value-highlight flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {selectedUserDetails.total_orders || 0}
                    </span>
                  </div>
                  <div className="bg-slate-55 dark:bg-slate-955 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Total Spent</span>
                    <span className="stats-value-highlight flex items-center gap-1.5 price-amount">
                      <DollarSign className="h-3.5 w-3.5" />
                      ₹{formatPrice(selectedUserDetails.total_spent || 0)}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold block">Delivery Address</span>
                  <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-350">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{formatAddress(selectedUserDetails.address)}</span>
                  </div>
                </div>

                {/* Status Control Button */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Status Control</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenStatusModal(selectedUserDetails, !selectedUserDetails.is_blocked)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold transition-all text-xs border cursor-pointer text-white ${
                        selectedUserDetails.is_blocked 
                          ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600' 
                          : 'bg-rose-500 hover:bg-rose-600 border-rose-600'
                      }`}
                    >
                      {selectedUserDetails.is_blocked ? (
                        <>
                          <Unlock className="h-4 w-4" />
                          <span>Unblock User</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Block User</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status History (Audit Trail) */}
                {selectedUserDetails.audit_logs && selectedUserDetails.audit_logs.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Status Audit Trail</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedUserDetails.audit_logs.map((log, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 text-[10px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm ${
                              (log.status_changed_to || '').toLowerCase() === 'active'
                                ? 'status-badge-active'
                                : (log.status_changed_to || '').toLowerCase() === 'inactive'
                                ? 'bg-[#6B7280] text-[#FFFFFF] border-[#4B5563]'
                                : (log.status_changed_to || '').toLowerCase() === 'suspended'
                                ? 'bg-[#EF4444] text-[#FFFFFF] border-[#DC2626]'
                                : (log.status_changed_to || '').toLowerCase() === 'pending verification'
                                ? 'bg-[#F59E0B] text-[#FFFFFF] border-[#D97706]'
                                : 'bg-[#B91C1C] text-[#FFFFFF] border-[#991B1B]'
                            }`}>
                              {log.status_changed_to}
                            </span>
                            <span className="text-slate-450 font-mono">
                              {log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-350 italic">"{log.reason}"</p>
                          <span className="text-slate-400 block text-[9px] text-right font-mono">By Admin (ID: {log.admin_id})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order History */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Order History ({selectedUserDetails.orders?.length || 0})</h4>
                  {selectedUserDetails.orders && selectedUserDetails.orders.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {selectedUserDetails.orders.map(order => (
                        <div key={order.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="font-mono text-[10px] text-slate-450">{order.order_id}</span>
                            <span className="text-emerald-500 font-black price-amount">₹{formatPrice(order.total_amount)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>{order.created_at ? formatTimestamp(order.created_at) : ''}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="capitalize">{order.payment_status}</span>
                              <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm ${
                                (order.order_status || '').toLowerCase() === 'pending'
                                  ? 'status-badge-pending'
                                  : (order.order_status || '').toLowerCase() === 'processing' || (order.order_status || '').toLowerCase() === 'confirmed' || (order.order_status || '').toLowerCase() === 'packed'
                                  ? 'bg-[#3B82F6] text-white border-[#2563EB]'
                                  : (order.order_status || '').toLowerCase() === 'shipped' || (order.order_status || '').toLowerCase() === 'dispatched'
                                  ? 'bg-[#06B6D4] text-white border-[#0891B2]'
                                  : (order.order_status || '').toLowerCase() === 'out for delivery'
                                  ? 'bg-[#8B5CF6] text-white border-[#7C3AED]'
                                  : (order.order_status || '').toLowerCase() === 'delivered'
                                  ? 'status-badge-success'
                                  : (order.order_status || '').toLowerCase() === 'cancelled'
                                  ? 'bg-[#EF4444] text-white border-[#DC2626]'
                                  : 'bg-[#6B7280] text-white border-[#4B5563]'
                              }`}>
                                {order.order_status}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setViewingOrderItems(order.items)}
                            className="w-full py-1.5 px-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Items</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-450 italic text-[11px] py-2">No orders placed yet.</p>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 h-[300px]">
                <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-500 mb-4 animate-bounce">
                  <Users className="h-8 w-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No User Selected</h4>
                <p className="text-xs text-slate-450 max-w-[200px]">
                  Click on any user in the table to display their full profile, stats, orders, and controls.
                </p>
              </div>
            )}
          </div>
        </div>
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

  const fetchGeneralAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (auditSearch.trim()) params.search = auditSearch;
      if (auditActionType) params.action_type = auditActionType;
      if (auditStatus) params.status = auditStatus;
      
      const res = await axios.get(`${API_BASE_URL}/admin/general-audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: params
      });
      setGeneralAuditLogs(res.data);
      setAuditPage(1); // Reset page on filter/search change
    } catch (err) {
      console.error("Failed to fetch general audit logs:", err);
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

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    await fetchStats();
    await fetchProducts();
    await fetchOrders();
    await fetchMessages();
    await fetchFaqs();
    await fetchUsers();
    await fetchOverviewAnalytics();
    await fetchGeneralAuditLogs();
    await fetchAuditLogs();
    await fetchBanners();
    await fetchSupportLinks();
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === 'overview') {
      fetchGeneralAuditLogs();
    }
  }, [isAdmin, activeTab, auditSearch, auditActionType, auditStatus]);

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

  const renderHomepageSettings = () => {
    if (homepageLoading || adminCategoriesLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl">
          <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
          <p className="text-slate-500 mt-4 text-xs font-bold uppercase tracking-wider">Loading Homepage Settings...</p>
        </div>
      );
    }

    return (
      <div className="space-y-12">
        {/* TOP MESSAGES */}
        {homepageSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl text-sm font-semibold">
            {homepageSuccess}
          </div>
        )}
        {homepageError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-semibold">
            {homepageError}
          </div>
        )}

        {/* SECTION 1: CATEGORY MANAGER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="text-lg font-bold text-slate-850 dark:text-slate-100">Category Management</h4>
              <p className="text-xs text-slate-400">Add, edit translations, and change custom category cover images.</p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', name_en: '', name_hi: '', image_url: '' });
                setCategoryError('');
                setCategorySuccess('');
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="pb-3 pl-2">Cover</th>
                  <th className="pb-3">System Name</th>
                  <th className="pb-3">English Name</th>
                  <th className="pb-3">Hindi Name</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                {adminCategories.map((cat) => (
                  <tr key={cat.id} className="text-sm hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                    <td className="py-3 pl-2">
                      <img
                        src={cat.image_url || "/logo.svg"}
                        alt={cat.name}
                        className="w-10 h-10 object-cover rounded-full border border-slate-200 dark:border-slate-800"
                        onError={(e) => { e.target.src = "/logo.svg"; }}
                      />
                    </td>
                    <td className="py-3 font-semibold text-slate-850 dark:text-slate-200">{cat.name}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{cat.name_en || cat.name}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{cat.name_hi || cat.name}</td>
                    <td className="py-3 text-right pr-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryForm({
                              name: cat.name,
                              name_en: cat.name_en || cat.name,
                              name_hi: cat.name_hi || cat.name,
                              image_url: cat.image_url || ''
                            });
                            setCategoryError('');
                            setCategorySuccess('');
                            setShowCategoryModal(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: FOUNDER / OWNER SHOWCASE */}
        <form onSubmit={handleSaveHomepageSettings} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-850">
            <div>
              <h4 className="text-lg font-bold text-slate-850 dark:text-slate-100">Founder & Heritage Showcase</h4>
              <p className="text-xs text-slate-400">Manage owner's photo, name, credentials, biographies, and quote details.</p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                const newOwner = {
                  id: Date.now(),
                  name: `Owner ${(homepageSettings.owners_list || []).length + 1}`,
                  title: "Title / Role",
                  est: "Est. 2026 · Jaipur, India",
                  bio1: "Biography paragraph 1...",
                  bio2: "Biography paragraph 2...",
                  quote: "Signature quote...",
                  image: "/owner.png",
                  stats: [
                    { label: 'Years of Craft', value: 10, suffix: '+' },
                    { label: 'Unique Designs', value: 100, suffix: '+' },
                    { label: 'Happy Clients', value: 1000, suffix: '+' },
                    { label: 'Awards Won', value: 5, suffix: '' }
                  ],
                  badges: ['BIS Hallmark Certified']
                };
                setHomepageSettings(prev => ({
                  ...prev,
                  owners_list: [...(prev.owners_list || []), newOwner]
                }));
                setActiveOwnerIdx((homepageSettings.owners_list || []).length);
              }}
              className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/25 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Owner</span>
            </button>
          </div>

          {/* Owner Tabs */}
          {(homepageSettings.owners_list || []).length > 0 && (
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
              {(homepageSettings.owners_list || []).map((owner, idx) => (
                <div
                  key={owner.id || idx}
                  onClick={() => setActiveOwnerIdx(idx)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeOwnerIdx === idx
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800'
                      : 'text-slate-400 hover:text-slate-650 border border-transparent'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{owner.name || `Owner ${idx + 1}`}</span>
                  {idx > 0 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete ${owner.name || `Owner ${idx + 1}`}?`)) {
                          const updated = (homepageSettings.owners_list || []).filter((_, i) => i !== idx);
                          setHomepageSettings(prev => ({ ...prev, owners_list: updated }));
                          setActiveOwnerIdx(0);
                        }
                      }}
                      className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {(() => {
            const activeOwner = (homepageSettings.owners_list || [])[activeOwnerIdx] || {
              name: "",
              title: "",
              est: "",
              bio1: "",
              bio2: "",
              quote: "",
              image: "/owner.png",
              stats: [],
              badges: []
            };

            const handleUpdateOwnerField = (field, value) => {
              const updated = [...(homepageSettings.owners_list || [])];
              if (updated[activeOwnerIdx]) {
                updated[activeOwnerIdx] = {
                  ...updated[activeOwnerIdx],
                  [field]: value
                };
                setHomepageSettings(prev => ({
                  ...prev,
                  owners_list: updated
                }));
              }
            };

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Bio Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Owner Name</label>
                      <input
                        type="text"
                        value={activeOwner.name || ''}
                        onChange={(e) => handleUpdateOwnerField('name', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Owner Title</label>
                      <input
                        type="text"
                        value={activeOwner.title || ''}
                        onChange={(e) => handleUpdateOwnerField('title', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Established Tag</label>
                      <input
                        type="text"
                        value={activeOwner.est || ''}
                        onChange={(e) => handleUpdateOwnerField('est', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Biography Paragraph 1</label>
                      <textarea
                        rows={3}
                        value={activeOwner.bio1 || ''}
                        onChange={(e) => handleUpdateOwnerField('bio1', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Biography Paragraph 2</label>
                      <textarea
                        rows={3}
                        value={activeOwner.bio2 || ''}
                        onChange={(e) => handleUpdateOwnerField('bio2', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Owner Signature Quote</label>
                      <textarea
                        rows={3}
                        value={activeOwner.quote || ''}
                        onChange={(e) => handleUpdateOwnerField('quote', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 resize-none font-serif italic"
                      />
                    </div>
                  </div>

                  {/* Right: Owner Image */}
                  <div className="flex flex-col justify-start items-center space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 self-start">Founder Photo</label>
                    <div className="relative group w-64 h-80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center shadow-inner">
                      {activeOwner.image ? (
                        <>
                          <img
                            src={activeOwner.image}
                            alt="Owner Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "/owner.png"; }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <label className="cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                              <Upload className="h-4 w-4" />
                              <span>Change Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadOwnerPhoto(e.target.files[0], activeOwnerIdx);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center p-6 text-slate-400">
                          <Upload className="h-8 w-8 mb-2" />
                          <span className="text-xs font-bold">Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleUploadOwnerPhoto(e.target.files[0], activeOwnerIdx);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">Recommended aspect ratio: 3:4. Format: JPG or PNG.</p>
                          {/* Stats & Badges Editors (Only for first owner) */}
                {activeOwnerIdx === 0 && (
                  <>
                    {/* Stats Editor */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-850">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mb-4 uppercase tracking-wider">Founder Showcase Metrics / Stats (4 Cards)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, statIdx) => {
                          const stat = (activeOwner.stats || [])[statIdx] || { label: '', value: 0, suffix: '' };
                          const handleUpdateStat = (key, val) => {
                            const newStats = Array.from({ length: 4 }).map((_, i) => (activeOwner.stats || [])[i] || { label: '', value: 0, suffix: '' });
                            newStats[statIdx][key] = val;
                            handleUpdateOwnerField('stats', newStats);
                          };

                          return (
                            <div key={statIdx} className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Card {statIdx + 1}</div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-505 mb-1">Value (e.g. 25)</label>
                                <input
                                  type="number"
                                  value={stat.value}
                                  onChange={(e) => handleUpdateStat('value', Number(e.target.value))}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-505 mb-1">Label (e.g. Years of Craft)</label>
                                <input
                                  type="text"
                                  value={stat.label}
                                  onChange={(e) => handleUpdateStat('label', e.target.value)}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-505 mb-1">Suffix (e.g. +)</label>
                                <input
                                  type="text"
                                  value={stat.suffix}
                                  onChange={(e) => handleUpdateStat('suffix', e.target.value)}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Badges / Credentials Editor */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-850">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mb-4 uppercase tracking-wider">Founder Showcase Credentials & Certifications (4 Badges)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, badgeIdx) => {
                          const badge = (activeOwner.badges || [])[badgeIdx] || '';
                          return (
                            <div key={badgeIdx} className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badge {badgeIdx + 1}</div>
                              <input
                                type="text"
                                value={badge}
                                onChange={(e) => {
                                  const newBadges = Array.from({ length: 4 }).map((_, i) => (activeOwner.badges || [])[i] || '');
                                  newBadges[badgeIdx] = e.target.value;
                                  handleUpdateOwnerField('badges', newBadges);
                                }}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}            </div>
                </div>
              </>
            );
          })()}

          <div className="flex justify-end pt-6 mt-8 border-t border-slate-100 dark:border-slate-850">
            <button
              type="submit"
              disabled={homepageUpdating}
              className="flex items-center gap-1.5 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {homepageUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Showcase Settings</span>
            </button>
          </div>
        </form>

        {/* SECTION 3: VIDEO SHOWCASE */}
        <form onSubmit={handleSaveHomepageSettings} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-lg font-bold text-slate-850 dark:text-slate-100">Video Showcase Settings</h4>
            <p className="text-xs text-slate-400">Change the dynamic background video URL or upload a custom video file.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Video File URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={homepageSettings.video_showcase_url}
                  onChange={(e) => setHomepageSettings({ ...homepageSettings, video_showcase_url: e.target.value })}
                  placeholder="/golden-stage.mp4"
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-800">
                  <Upload className="h-4 w-4" />
                  <span>Upload Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadMediaFile(e.target.files[0], 'video_showcase_url');
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {homepageSettings.video_showcase_url && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black max-w-xl border border-slate-200 dark:border-slate-800">
                <video
                  src={homepageSettings.video_showcase_url}
                  controls
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              type="submit"
              disabled={homepageUpdating}
              className="flex items-center gap-1.5 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {homepageUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Video Showcase</span>
            </button>
          </div>
        </form>

        {/* SECTION 4: LUXURY GALLERY CARDS */}
        <form onSubmit={handleSaveHomepageSettings} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-slate-850 dark:text-slate-100">Featured Luxury Gallery Cards</h4>
              <p className="text-xs text-slate-400">Configure the featured 3D parallax cards displayed on the customer home page.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newCard = {
                  id: Date.now(),
                  title: "New Luxury Piece",
                  tag: "Special Edition",
                  image: "/luxury_solitaire_ring.png",
                  description: "Insert item description details here.",
                  link: "/?category=Rings"
                };
                setHomepageSettings(prev => ({
                  ...prev,
                  luxury_gallery_items: [...(prev.luxury_gallery_items || []), newCard]
                }));
              }}
              className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/25 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(homepageSettings.luxury_gallery_items || []).map((card, idx) => (
              <div key={card.id || idx} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-xs font-bold tracking-widest text-[#D4A75F] uppercase">Card #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this card?")) {
                        const updated = (homepageSettings.luxury_gallery_items || []).filter((_, i) => i !== idx);
                        setHomepageSettings(prev => ({ ...prev, luxury_gallery_items: updated }));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-850">
                  {card.image ? (
                    <>
                      <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                        <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <Upload className="h-3 w-3" /> Change
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadMediaFile(e.target.files[0], null, idx);
                            }
                          }}
                        />
                      </label>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center text-slate-400 p-4">
                      <Upload className="h-6 w-6 mb-1" />
                      <span className="text-[10px] font-bold">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadMediaFile(e.target.files[0], null, idx);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Title</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => {
                        const updated = [...homepageSettings.luxury_gallery_items];
                        updated[idx].title = e.target.value;
                        setHomepageSettings({ ...homepageSettings, luxury_gallery_items: updated });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={card.description}
                      onChange={(e) => {
                        const updated = [...homepageSettings.luxury_gallery_items];
                        updated[idx].description = e.target.value;
                        setHomepageSettings({ ...homepageSettings, luxury_gallery_items: updated });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-1">Redirection Link</label>
                    <input
                      type="text"
                      value={card.link || ''}
                      onChange={(e) => {
                        const updated = [...homepageSettings.luxury_gallery_items];
                        updated[idx].link = e.target.value;
                        setHomepageSettings({ ...homepageSettings, luxury_gallery_items: updated });
                      }}
                      placeholder="/?category=Necklaces"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              type="submit"
              disabled={homepageUpdating}
              className="flex items-center gap-1.5 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {homepageUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Luxury Cards</span>
            </button>
          </div>
        </form>

        {/* SECTION 5: SHOP BY COLLECTION */}
        <form onSubmit={handleSaveHomepageSettings} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-slate-850 dark:text-slate-100">Shop by Collection Showcase</h4>
              <p className="text-xs text-slate-400">Configure the collection cards displayed in the "Shop by Collection" horizontal scroll marquee section.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Add Collection Button */}
              <button
                type="button"
                onClick={() => {
                  const newId = Date.now();
                  const newCardEn = {
                    id: newId,
                    title: "New Collection Card",
                    subtitle: "Elegance & Style",
                    image: "/cat_necklaces.png",
                    description: "Enter English description.",
                    tips: ["Tip 1", "Tip 2", "Tip 3"]
                  };
                  const newCardHi = {
                    id: newId,
                    title: "नया कलेक्शन",
                    subtitle: "लालित्य और शैली",
                    image: "/cat_necklaces.png",
                    description: "हिंदी विवरण दर्ज करें।",
                    tips: ["सुझाव 1", "सुझाव 2", "सुझाव 3"]
                  };
                  setHomepageSettings(prev => ({
                    ...prev,
                    occasion_items_en: [...(prev.occasion_items_en || []), newCardEn],
                    occasion_items_hi: [...(prev.occasion_items_hi || []), newCardHi]
                  }));
                }}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/25 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Collection Card</span>
              </button>

              {/* Language Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setActiveOccasionLang('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeOccasionLang === 'en'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  English Collections
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOccasionLang('hi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeOccasionLang === 'hi'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  Hindi Collections
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {((activeOccasionLang === 'en' ? homepageSettings.occasion_items_en : homepageSettings.occasion_items_hi) || []).map((card, idx) => (
              <div key={card.id || idx} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-955/20 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-xs font-black tracking-widest text-[#D4A75F] uppercase">Collection Card #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this collection?")) {
                        const idToDelete = card.id;
                        const updatedEn = (homepageSettings.occasion_items_en || []).filter(item => item.id !== idToDelete);
                        const updatedHi = (homepageSettings.occasion_items_hi || []).filter(item => item.id !== idToDelete);
                        setHomepageSettings(prev => ({
                          ...prev,
                          occasion_items_en: updatedEn,
                          occasion_items_hi: updatedHi
                        }));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-955/20 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card Image */}
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Collection Photo</label>
                    <div className="relative w-full aspect-[9/12] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-850">
                      {card.image ? (
                        <>
                          <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                              <Upload className="h-3 w-3" /> Change
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUploadMediaFile(e.target.files[0], activeOccasionLang === 'en' ? 'occasion_en' : 'occasion_hi', idx);
                                }
                              }}
                            />
                          </label>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center p-4 text-slate-400">
                          <Upload className="h-6 w-6 mb-1" />
                          <span className="text-[10px] font-bold">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                  handleUploadMediaFile(e.target.files[0], activeOccasionLang === 'en' ? 'occasion_en' : 'occasion_hi', idx);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Collection Title</label>
                      <input
                        type="text"
                        value={card.title || ''}
                        onChange={(e) => {
                          const field = activeOccasionLang === 'en' ? 'occasion_items_en' : 'occasion_items_hi';
                          const updated = [...homepageSettings[field]];
                          updated[idx].title = e.target.value;
                          setHomepageSettings({ ...homepageSettings, [field]: updated });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Collection Subtitle</label>
                      <input
                        type="text"
                        value={card.subtitle || ''}
                        onChange={(e) => {
                          const field = activeOccasionLang === 'en' ? 'occasion_items_en' : 'occasion_items_hi';
                          const updated = [...homepageSettings[field]];
                          updated[idx].subtitle = e.target.value;
                          setHomepageSettings({ ...homepageSettings, [field]: updated });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={card.description || ''}
                        onChange={(e) => {
                          const field = activeOccasionLang === 'en' ? 'occasion_items_en' : 'occasion_items_hi';
                          const updated = [...homepageSettings[field]];
                          updated[idx].description = e.target.value;
                          setHomepageSettings({ ...homepageSettings, [field]: updated });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Styling Tips */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Bullet Details (e.g. details shown in popups)</span>
                  <div className="space-y-2">
                    {[0, 1, 2].map((tipIdx) => (
                      <div key={tipIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A75F] flex-shrink-0" />
                        <input
                          type="text"
                          value={card.tips?.[tipIdx] || ''}
                          onChange={(e) => {
                            const field = activeOccasionLang === 'en' ? 'occasion_items_en' : 'occasion_items_hi';
                            const updated = [...homepageSettings[field]];
                            if (!updated[idx].tips) updated[idx].tips = ['', '', ''];
                            updated[idx].tips[tipIdx] = e.target.value;
                            setHomepageSettings({ ...homepageSettings, [field]: updated });
                          }}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              type="submit"
              disabled={homepageUpdating}
              className="flex items-center gap-1.5 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {homepageUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Collections Settings</span>
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-lg">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold mt-4">Access Denied</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Administrator privileges are required to access the SSJewellery Admin Control Page.
        </p>
        <button
          onClick={() => navigate('/login?redirect=admin-control')}
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Management Panel</h1>
            <p className="text-xs text-slate-400 mt-1">Perform product CRUD, modify user status, update orders, and review customer tickets.</p>
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
            <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px mb-8 overflow-x-auto">
              <button
                onClick={() => handleTabChange('products')}
                className={`pb-3 px-4 text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Product Management
              </button>
              <button
                onClick={() => handleTabChange('users')}
                className={`pb-3 px-4 text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => handleTabChange('orders')}
                className={`pb-3 px-4 text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Orders Management
              </button>
              <button
                onClick={() => handleTabChange('support')}
                className={`pb-3 px-4 text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'support'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Support Tickets
              </button>
              <button
                onClick={() => handleTabChange('config')}
                className={`pb-3 px-4 text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'config'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Site Configuration
              </button>
              <button
                onClick={() => handleTabChange('overview')}
                className={`pb-3 px-4 text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-[rgba(212,167,95,0.15)] text-[#D4A75F] border-[#D4A75F] font-semibold'
                    : 'border-transparent text-[#B0B7C3] hover:text-white font-normal'
                }`}
              >
                Analytics
              </button>
            </div>

            {/* TAB CONTENT: OVERVIEW & INSIGHTS */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Upper row: Extra Insight Cards & Refresh */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">eCommerce Health & Status</h4>
                      <p className="text-xs text-slate-400">Live warehouse distribution, fulfillment, return monitoring</p>
                    </div>
                  </div>
                  <button 
                    onClick={loadDashboardData}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 dark:bg-[#1E1E1E] dark:border-[#D4A75F] dark:text-[#D4A75F] dark:hover:bg-[#2A2A2A] rounded-[12px] dark:shadow-[0_4px_12px_rgba(212,167,95,0.25)] transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-slate-500 dark:text-[#D4A75F]" />
                    <span>Sync Real-Time Data</span>
                  </button>
                </div>

                {/* SVG Insights & Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Category Value Distribution SVG Bar Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-500" />
                      <span>Category Stock Value Distribution (Price × Stock)</span>
                    </h3>
                    
                    {/* SVG Graph */}
                    <div className="w-full flex flex-col items-center justify-center min-h-[220px]">
                      {(() => {
                        const catData = getCategoryData();
                        const maxVal = Math.max(...catData.map(c => c.value), 1);
                        const colors = {
                          'Rings': '#D4A75F',
                          'Necklaces': '#3F1D5A',
                          'Earrings': '#5C2E7E',
                          'Bracelets': '#8A5A9E',
                          'Bangles': '#A87BB5',
                          'Bridal Collection': '#E2C391'
                        };
                        return (
                          <div className="w-full">
                            <div className="space-y-4">
                              {catData.map(c => {
                                const percentage = (c.value / maxVal) * 100;
                                return (
                                  <div key={c.category} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                      <span>{c.category} ({c.count} items)</span>
                                      <span className="font-extrabold text-slate-800 dark:text-slate-100 price-amount">₹{formatPrice(c.value)}</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-500" 
                                        style={{ 
                                          width: `${percentage}%`,
                                          backgroundColor: colors[c.category] || '#10b981'
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* SVG Mini Chart representation for aesthetics */}
                            <div className="mt-6 flex justify-around border-t border-slate-100 dark:border-slate-800/50 pt-4">
                              {catData.map(c => (
                                <div key={c.category} className="text-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{c.category}</span>
                                  <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                    {((c.value / (catData.reduce((a, b) => a + b.value, 0) || 1)) * 100).toFixed(0)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Order Status Breakdown Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-emerald-500" />
                      <span>Order Fulfillment Status Breakdown</span>
                    </h3>
                    
                    <div className="w-full flex flex-col items-center justify-center min-h-[220px]">
                      {(() => {
                        const statusData = getOrderStatusData();
                        const totalOrdersCount = orders.length || 1;
                        
                        const colors = {
                          'Pending': '#F59E0B',
                          'Confirmed': '#3B82F6',
                          'Packed': '#3B82F6',
                          'Shipped': '#06B6D4',
                          'Out for Delivery': '#8B5CF6',
                          'Delivered': '#22C55E',
                          'Cancelled': '#EF4444',
                          'Returned': '#6B7280'
                        };
                        
                        return (
                          <div className="w-full">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {statusData.map(s => {
                                const count = s.count;
                                const pct = ((count / totalOrdersCount) * 100).toFixed(0);
                                return (
                                  <div key={s.status} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/40 p-3 rounded-xl flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[s.status] || '#ccc' }} />
                                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 line-clamp-1">{s.status}</span>
                                    </div>
                                    <div className="mt-2 flex items-baseline justify-between">
                                      <span className="text-base font-black text-slate-850 dark:text-slate-150">{count}</span>
                                      <span className="text-[10px] font-extrabold text-slate-400">{pct}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Premium Segmented Bar */}
                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-5 overflow-hidden flex">
                              {statusData.map(s => {
                                const count = s.count;
                                if (count === 0) return null;
                                return (
                                  <div 
                                    key={s.status} 
                                    style={{ 
                                      width: `${(count / totalOrdersCount) * 100}%`,
                                      backgroundColor: colors[s.status] 
                                    }} 
                                    title={`${s.status}: ${count}`}
                                    className="h-full first:rounded-l-full last:rounded-r-full"
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Visual Analytics & Matplotlib Reports Section */}
                {overviewAnalytics && (
                  <div className="space-y-6">
                    {/* Admin Analytics Summary Cards */}
                    <div>
                      <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-500" />
                        <span>Admin Analytics Summary Cards</span>
                      </h2>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                          { 
                            label: "Total Registered", 
                            val: overviewAnalytics.summary_cards?.total_registered ?? 0, 
                            color: "text-blue-500",
                            bgColor: "bg-blue-500/10",
                            icon: Users
                          },
                          { 
                            label: "New This Month", 
                            val: overviewAnalytics.summary_cards?.new_this_month ?? 0, 
                            color: "text-indigo-500",
                            bgColor: "bg-indigo-500/10",
                            icon: Calendar
                          },
                          { 
                            label: "Active Customers", 
                            val: overviewAnalytics.summary_cards?.active_customers ?? 0, 
                            color: "text-emerald-500",
                            bgColor: "bg-emerald-500/10",
                            icon: CheckCircle2
                          },
                          { 
                            label: "Blocked Users", 
                            val: overviewAnalytics.summary_cards?.blocked_users ?? 0, 
                            color: "text-rose-500",
                            bgColor: "bg-rose-500/10",
                            icon: ShieldAlert
                          },
                          { 
                            label: "Total Revenue", 
                            val: `₹${formatPrice(overviewAnalytics.summary_cards?.total_revenue ?? 0)}`, 
                            color: "text-purple-500",
                            bgColor: "bg-purple-500/10",
                            icon: ArrowUpRight
                          }
                        ].map(card => {
                          const IconComponent = card.icon;
                          return (
                            <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
                                <span className={`text-xl font-black mt-1 block ${card.color} ${card.label === "Total Revenue" ? "price-amount" : ""}`}>{card.val}</span>
                              </div>
                              <div className={`${card.bgColor} p-2.5 rounded-xl ${card.color}`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Audit Logs */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm mt-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-emerald-500" />
                          <span>Audit Logs</span>
                          <span className="audit-logs-count-badge">
                            {generalAuditLogs.length} total
                          </span>
                        </h2>
                        
                        {/* Audit Logs Filter Controls */}
                        <div className="flex flex-wrap gap-3 items-center">
                          <div className="relative min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search logs..."
                              value={auditSearch}
                              onChange={(e) => setAuditSearch(e.target.value)}
                              className="pl-9 pr-4 py-2 w-full text-sm bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200"
                            />
                          </div>
                          
                          {/* Action Type Dropdown */}
                          <select
                            value={auditActionType}
                            onChange={(e) => setAuditActionType(e.target.value)}
                            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200"
                          >
                            <option value="">All Action Types</option>
                            {ACTION_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>

                          {/* Status Dropdown */}
                          <select
                            value={auditStatus}
                            onChange={(e) => setAuditStatus(e.target.value)}
                            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200"
                          >
                            <option value="">All Statuses</option>
                            <option value="Success">Success</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                              <th className="pb-3 pr-4">Timestamp</th>
                              <th className="pb-3 px-4">Admin Name</th>
                              <th className="pb-3 px-4">Action Type</th>
                              <th className="pb-3 px-4">Module</th>
                              <th className="pb-3 px-4">Details</th>
                              <th className="pb-3 pl-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                            {generalAuditLogs.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold">
                                  No audit logs match the selected filters.
                                </td>
                              </tr>
                            ) : (
                              (() => {
                                const startIndex = (auditPage - 1) * auditPerPage;
                                const paginatedLogs = generalAuditLogs.slice(startIndex, startIndex + auditPerPage);
                                return paginatedLogs.map((log) => {
                                  // Action type styling helper
                                  let actionBadgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                                  const type = log.action_type || "";
                                  if (type.includes("Added") || type.includes("Unblocked")) {
                                    actionBadgeColor = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450";
                                  } else if (type.includes("Deleted") || type.includes("Blocked") || type.includes("Cancelled")) {
                                    actionBadgeColor = "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-455";
                                  } else if (type.includes("Updated") || type.includes("Changed") || type.includes("Status")) {
                                    actionBadgeColor = "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-455";
                                  } else if (type.includes("Login") || type.includes("Logout")) {
                                    actionBadgeColor = "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-450";
                                  }
                                  
                                  return (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-all border-b border-slate-100 dark:border-slate-800/50">
                                      <td className="py-3.5 pr-4 text-slate-500 admin-timestamp-text whitespace-nowrap">
                                        {log.created_at}
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-800 admin-table-text">
                                        {log.admin_username}
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap ${actionBadgeColor}`}>
                                          {log.action_type}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-600 admin-table-text whitespace-nowrap">
                                        {log.module}
                                      </td>
                                      <td className="py-3.5 px-4 max-w-[280px] text-slate-600 admin-table-text truncate" title={log.details}>
                                        {log.details}
                                      </td>
                                      <td className="py-3.5 pl-4">
                                        <span className={log.status === 'Success' 
                                            ? 'status-badge-success' 
                                            : 'px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-455'
                                        }>
                                          {log.status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {generalAuditLogs.length > auditPerPage && (
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 text-xs">
                          <span className="font-medium text-slate-400">
                            Showing {((auditPage - 1) * auditPerPage) + 1} to {Math.min(auditPage * auditPerPage, generalAuditLogs.length)} of {generalAuditLogs.length} audit logs
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                              disabled={auditPage === 1}
                              className={`px-3 py-1.5 font-bold rounded-lg border border-slate-200 dark:border-slate-800 transition-all ${
                                auditPage === 1 
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                              }`}
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setAuditPage(prev => Math.min(prev + 1, Math.ceil(generalAuditLogs.length / auditPerPage)))}
                              disabled={auditPage >= Math.ceil(generalAuditLogs.length / auditPerPage)}
                              className={`px-3 py-1.5 font-bold rounded-lg border border-slate-200 dark:border-slate-800 transition-all ${
                                auditPage >= Math.ceil(generalAuditLogs.length / auditPerPage) 
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                              }`}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Matplotlib Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                      {[
                        { title: "Revenue Trend (30 Days)", img: overviewAnalytics.charts.revenue_trend },
                        { title: "Top Selling Products", img: overviewAnalytics.charts.top_selling_products },
                        { title: "Low Stock Inventory Analytics", img: overviewAnalytics.charts.low_stock_inventory }
                      ].map(chart => (
                        <div key={chart.title} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 self-start">{chart.title}</h4>
                          <div className="w-full bg-slate-50 dark:bg-slate-955/60 border border-slate-105 dark:border-slate-850 p-2 rounded-2xl flex justify-start items-center overflow-x-auto">
                            <img 
                              src={`${SERVER_BASE_URL}${chart.img}`}
                              alt={chart.title}
                              className="max-h-[220px] min-w-[500px] lg:min-w-0 w-auto object-contain rounded-lg"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Return Request Manager & Low Stock Alerts Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Left block (1/3 size): Low Stock Alerts */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm xl:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                        <span>Low Stock Warnings</span>
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-450 rounded-full">
                        {getLowStockProducts().length} items
                      </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                      {getLowStockProducts().length === 0 ? (
                        <div className="text-center py-8 text-xs font-semibold text-slate-400">
                          All products are sufficiently stocked.
                        </div>
                      ) : (
                        getLowStockProducts().map(p => (
                          <div key={p.id} className="p-3 border border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-750 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl flex items-center justify-between transition-all">
                            <div className="max-w-[70%]">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-250 block truncate">{p.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">{p.category} • <span className="price-amount">₹{formatPrice(p.price)}</span></span>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 text-[11px] font-black bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-lg animate-pulse">
                                {p.stock} left
                              </span>
                              <button
                                onClick={() => {
                                  handleTabChange('products');
                                  setEditingProduct(p);
                                  setEditProductImages(initEditImages(p));
                                  setIsEditImagesOpen(false);
                                }}
                                className="block text-[10px] font-black text-emerald-500 hover:text-emerald-600 mt-2 hover:underline"
                              >
                                Restock Item
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right block (2/3 size): Return & Refund Request Manager */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm xl:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <RefreshCw className="h-4.5 w-4.5 text-rose-500" />
                        <span>Return & Refund Request Manager</span>
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-450 rounded-full">
                        {getReturnRequests().length} pending
                      </span>
                    </div>

                    <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
                      {getReturnRequests().length === 0 ? (
                        <div className="text-center py-12 text-xs font-semibold text-slate-400">
                          No pending return or refund requests.
                        </div>
                      ) : (
                        getReturnRequests().map(o => (
                          <div key={o.id} className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl space-y-3">
                            <div className="flex flex-wrap justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Order ID: {o.id}</span>
                                  <span className="text-[10px] font-bold text-slate-400">by User ID: {o.user_id}</span>
                                </div>
                                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 block mt-1">
                                  Refund Amount: <span className="text-emerald-500 price-amount">₹{formatPrice(o.total_price)}</span>
                                </span>
                              </div>
                              <span className="text-[10px] font-black text-rose-500 uppercase bg-rose-500/10 px-2 py-0.5 rounded-full">
                                Requested
                              </span>
                            </div>

                            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Return Reason:</span>
                              {o.return_request.reason || "No reason provided"}
                            </div>

                            {/* Action note box */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400">Admin Action Note / Rejection Reason</label>
                              <input
                                type="text"
                                placeholder="Enter note (e.g. Returned item verified, or Policy limit exceeded)..."
                                value={returnNotes[o.id] || ''}
                                onChange={(e) => setReturnNotes({ ...returnNotes, [o.id]: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                              <button
                                onClick={() => handleManageReturn(o.id, false, returnNotes[o.id])}
                                className="px-3 py-1.5 text-[11px] font-bold text-slate-550 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-all"
                              >
                                Reject Return
                              </button>
                              <button
                                onClick={() => handleManageReturn(o.id, true, returnNotes[o.id])}
                                className="px-3 py-1.5 text-[11px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all"
                              >
                                Approve & Cancel Order
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
                <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-extrabold flex items-center gap-2">
                        <span>Catalog Products</span>
                        <span className="px-2.5 py-1 text-xs bg-[#D4A75F] text-[#111827] rounded-full font-bold shadow-sm">
                          {products.length}
                        </span>
                      </h3>
                      <button
                        onClick={() => {
                          setIsAddModalOpen(true);
                          setIsAddImagesOpen(false);
                        }}
                        className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Product</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                    {products.map(p => {
                      const discountedPrice = Math.round(p.price - (p.price * (p.discount / 100)));
                      
                      // Audit date formatting helper
                      const formatAudit = (dateStr) => {
                        if (!dateStr) return "N/A";
                        try {
                          const d = new Date(dateStr);
                          return d.toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });
                        } catch(e) {
                          return dateStr;
                        }
                      };

                      return (
                        <div key={p._id} className="border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 rounded-xl md:rounded-2xl p-3 md:p-4.5 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                          <div>
                            {/* Product Image and Category */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3">
                              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex-shrink-0">
                                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'} alt="" className="h-full w-full object-cover" />
                              </div>
                              <div className="flex flex-col justify-center min-w-0">
                                <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{p.category}</span>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5" title={p.name}>{p.name}</h4>
                              </div>
                            </div>

                            {/* Price / Discount History */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800/80 p-2 sm:p-2.5 rounded-xl text-[10px] sm:text-xs space-y-1 mb-3">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-0.5 sm:gap-0">
                                <span className="text-slate-400 font-medium">Pricing:</span>
                                <div className="flex flex-wrap items-center gap-1">
                                  {p.discount > 0 ? (
                                    <>
                                      <span className="text-slate-455 dark:text-slate-505 line-through price-amount">₹{formatPrice(p.price)}</span>
                                      <span className="text-slate-400">↓</span>
                                      <span className="text-slate-900 dark:text-slate-100 font-extrabold text-xs sm:text-sm price-amount">₹{formatPrice(discountedPrice)}</span>
                                      <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-455 rounded">{p.discount}% OFF</span>
                                    </>
                                  ) : (
                                    <span className="text-slate-900 dark:text-slate-105 font-extrabold text-xs sm:text-sm price-amount">₹{formatPrice(p.price)}</span>
                                  )}
                                </div>
                              </div>
                              {p.discount > 0 && p.discount_applied_at && (
                                <div className="text-[8px] sm:text-[9px] text-slate-400 flex justify-between border-t border-slate-100 dark:border-slate-850/50 pt-1 mt-1">
                                  <span>Applied On:</span>
                                  <span className="font-semibold">{formatAudit(p.discount_applied_at)}</span>
                                </div>
                              )}
                            </div>

                            {/* Stock Display */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-0 mb-3">
                              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Stock Status:</span>
                              <span className={`stock-badge-container ${
                                p.stock === 0 
                                  ? 'stock-badge-out-of-stock' 
                                  : p.stock < 10 
                                    ? 'stock-badge-low-stock' 
                                    : 'stock-badge-in-stock'
                              }`}>
                                {p.stock === 0 ? "Out Of Stock" : p.stock < 10 ? `${p.stock} Left` : `${p.stock} Units`}
                              </span>
                            </div>

                            {/* Audit Logs */}
                            <div className="border-t border-slate-100 dark:border-slate-850/60 pt-2.5 pb-2 text-[9px] sm:text-[10px] text-slate-400 space-y-1">
                              <div className="flex justify-between">
                                <span>Created:</span>
                                <span className="font-semibold text-slate-550 dark:text-slate-450">{formatAudit(p.created_at)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Modified:</span>
                                <span className="font-semibold text-slate-550 dark:text-slate-450">{formatAudit(p.updated_at || p.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions Grid */}
                          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-850/60">
                            <button
                              onClick={() => {
                                setEditingProduct({ ...p, image_url: p.images?.[0] || '' });
                                setEditProductImages(initEditImages(p));
                                setIsEditImagesOpen(false);
                              }}
                              className="py-1.5 sm:py-2 px-1 sm:px-2.5 text-[9px] sm:text-[10px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg sm:rounded-xl transition-all text-center flex items-center justify-center gap-1"
                            >
                              <Edit2 className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                              <span className="truncate">Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenStockModal(p)}
                              className="py-1.5 sm:py-2 px-1 sm:px-2.5 text-[9px] sm:text-[10px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-450 rounded-lg sm:rounded-xl transition-all text-center flex items-center justify-center gap-1"
                            >
                              <Package className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                              <span className="truncate">Stock</span>
                            </button>
                            <button
                              onClick={() => handleOpenOrdersModal(p)}
                              className="py-1.5 sm:py-2 px-1 sm:px-2.5 text-[9px] sm:text-[10px] font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-650 dark:text-purple-400 rounded-lg sm:rounded-xl transition-all text-center flex items-center justify-center gap-1"
                            >
                              <ShoppingBag className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                              <span className="truncate">Orders</span>
                            </button>
                            <button
                              onClick={() => handleOpenAnalyticsModal(p)}
                              className="py-1.5 sm:py-2 px-1 sm:px-2.5 text-[9px] sm:text-[10px] font-bold border border-[#D4A75F]/35 dark:border-[#D4A75F] bg-[#D4A75F]/8 dark:bg-[rgba(212,167,95,0.12)] text-[#9A7232] dark:text-[#D4A75F] hover:bg-[#D4A75F] hover:text-white dark:hover:bg-[#D4A75F] dark:hover:text-white dark:hover:border-transparent hover:translate-y-[-2px] shadow-[0_4px_12px_rgba(212,167,95,0.08)] dark:shadow-[0_4px_12px_rgba(212,167,95,0.20)] rounded-lg sm:rounded-xl transition-all duration-[250ms] ease-in-out text-center flex items-center justify-center gap-1"
                            >
                              <BarChart3 className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                              <span className="truncate">Sales</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
            )}

            {/* TAB CONTENT: ORDERS MANAGEMENT */}
            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
                <h3 className="text-base font-bold mb-4">Customer Orders list ({orders.length})</h3>

                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                      <th className="py-2.5">Order ID</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Total Amount</th>
                      <th className="py-2.5">Customer / Address</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Update Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {orders.map(o => (
                      <tr key={o._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">{o.order_id}</td>
                        <td className="py-3.5 text-slate-500 admin-datetime-text">{formatTimestamp(o.created_at)}</td>
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100 price-amount">₹{formatPrice(o.total_amount)}</td>
                        <td className="py-3.5 max-w-[200px] truncate text-slate-550" title={o.shipping_address?.address}>
                          {o.shipping_address?.name} - {o.shipping_address?.address}, {o.shipping_address?.city}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm ${
                            (o.status || '').toLowerCase() === 'pending'
                              ? 'status-badge-pending'
                              : (o.status || '').toLowerCase() === 'processing' || (o.status || '').toLowerCase() === 'confirmed' || (o.status || '').toLowerCase() === 'packed'
                              ? 'bg-[#3B82F6] text-white border-[#2563EB]'
                              : (o.status || '').toLowerCase() === 'shipped' || (o.status || '').toLowerCase() === 'dispatched'
                              ? 'bg-[#06B6D4] text-white border-[#0891B2]'
                              : (o.status || '').toLowerCase() === 'out for delivery'
                              ? 'bg-[#8B5CF6] text-white border-[#7C3AED]'
                              : (o.status || '').toLowerCase() === 'delivered'
                              ? 'status-badge-success'
                              : (o.status || '').toLowerCase() === 'cancelled'
                              ? 'bg-[#EF4444] text-white border-[#DC2626]'
                              : 'bg-[#6B7280] text-white border-[#4B5563]'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <select
                            value={o.status}
                            onChange={(e) => handleOrderStatusUpdate(o._id, e.target.value)}
                            className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 px-2 py-1 rounded-lg focus:outline-none text-slate-850 dark:text-slate-100"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-[#D4A75F]/10 dark:hover:bg-[#D4A75F]/15 dark:text-[#D4A75F] rounded-lg transition-colors font-bold"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: SUPPORT TICKETS */}
            {activeTab === 'support' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-500" />
                  <span>Customer Support Messages ({messages.length})</span>
                </h3>

                {messages.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-6 text-center">No contact support messages registered.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-850 space-y-4">
                    {messages.map((m, idx) => (
                      <div key={m._id || idx} className="pt-4 first:pt-0 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{m.name}</p>
                            <p className="text-slate-450">{m.email}</p>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {m.created_at ? new Date(m.created_at).toLocaleString() : "Recently"}
                          </span>
                        </div>
                        <p className="text-slate-655 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850 leading-relaxed font-sans select-all">
                          {m.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SITE CONFIGURATION */}
            {activeTab === 'config' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-6 gap-4">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-150">
                      <Settings className="h-5 w-5 text-emerald-500" />
                      <span>Site Configuration</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Manage carousel banners, FAQs, and support links shown across the website.</p>
                  </div>
                </div>

                {/* Nested Sub-tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-8 w-full max-w-full overflow-x-auto whitespace-nowrap border border-slate-200/40 dark:border-slate-800 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    onClick={() => setActiveConfigSubTab('banners')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl flex-shrink-0 transition-all ${
                      activeConfigSubTab === 'banners'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <Image className="h-3.5 w-3.5" />
                    <span>Carousel Images</span>
                  </button>
                  <button
                    onClick={() => setActiveConfigSubTab('faqs')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl flex-shrink-0 transition-all ${
                      activeConfigSubTab === 'faqs'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-300'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>FAQs</span>
                  </button>
                  <button
                    onClick={() => setActiveConfigSubTab('support_links')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl flex-shrink-0 transition-all ${
                      activeConfigSubTab === 'support_links'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-300'
                    }`}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>Support Links</span>
                  </button>
                  <button
                    onClick={() => setActiveConfigSubTab('reports')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl flex-shrink-0 transition-all ${
                      activeConfigSubTab === 'reports'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-300'
                    }`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Report Automation</span>
                  </button>
                  <button
                    onClick={() => setActiveConfigSubTab('homepage')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl flex-shrink-0 transition-all ${
                      activeConfigSubTab === 'homepage'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-300'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Homepage Settings</span>
                  </button>
                </div>

                {/* Sub-tab 1: Banners Management */}
                {activeConfigSubTab === 'banners' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Homepage Banners ({banners.length})</h4>
                      <button
                        onClick={() => {
                          setBannerForm({
                            title: '',
                            subtitle: '',
                            description: '',
                            button_text: 'Shop Now',
                            button_link: '',
                            image_url: '',
                            background_style: 'from-slate-900 via-indigo-950 to-slate-900',
                            category: '',
                            display_order: banners.length + 1,
                            is_active: true
                          });
                          setEditingBannerId(null);
                          setBannerError(null);
                          setBannerSuccess(null);
                          setIsBannerModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add New Slide</span>
                      </button>
                    </div>

                    {loadingBanners ? (
                      <p className="text-slate-400 italic text-xs py-6 text-center">Loading banners...</p>
                    ) : banners.length === 0 ? (
                      <p className="text-slate-400 italic text-xs py-6 text-center">No banners found.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {banners.map((b) => (
                          <div key={b.id} className="border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-3">
                                <div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                    {b.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                  <span className="ml-2 text-[10px] text-slate-400 font-medium">Order: {b.display_order}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEditBanner(b)}
                                    className="p-1 text-slate-400 hover:text-emerald-500 rounded transition-colors"
                                    title="Edit Slide"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBanner(b.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                    title="Delete Slide"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {b.image_url ? (
                                <div className="h-28 w-full rounded-lg bg-cover bg-center mb-3 relative overflow-hidden flex items-end p-3" style={{ backgroundImage: `url(${b.image_url})` }}>
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                                  <div className="relative text-white z-10">
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{b.subtitle}</p>
                                    <h5 className="font-bold text-xs line-clamp-1">{b.title}</h5>
                                  </div>
                                </div>
                              ) : (
                                <div className={`h-28 w-full rounded-lg bg-gradient-to-r ${b.background_style || 'from-slate-950 via-indigo-950 to-slate-950'} mb-3 flex flex-col justify-end p-3 relative`}>
                                  <div className="relative text-white">
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{b.subtitle}</p>
                                    <h5 className="font-bold text-xs line-clamp-1">{b.title}</h5>
                                  </div>
                                </div>
                              )}
                              <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2 mt-1">{b.description || 'No description provided.'}</p>
                              {b.button_text && (
                                <div className="mt-2 text-[10px]">
                                  <span className="text-slate-400">Action:</span> <span className="font-semibold text-slate-600 dark:text-slate-300">{b.button_text}</span>
                                  {b.button_link && <span className="text-slate-400 text-[9px] block">Link: {b.button_link}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 2: FAQs Management */}
                {activeConfigSubTab === 'faqs' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        Frequently Asked Questions (FAQs) ({faqs.length})
                      </h4>
                      <button
                        onClick={() => {
                          setNewFaq({ question: '', answer: '' });
                          setIsAddFaqModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add New FAQ</span>
                      </button>
                    </div>

                    {loadingFaqs ? (
                      <p className="text-slate-400 italic text-xs py-6 text-center">Loading FAQs...</p>
                    ) : faqs.length === 0 ? (
                      <p className="text-slate-400 italic text-xs py-6 text-center">No FAQs found.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-850 space-y-4">
                        {faqs.map((f) => (
                          <div key={f.id || f._id} className="pt-4 first:pt-0 text-xs">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <p className="font-bold text-sm text-slate-850 dark:text-slate-100">Q: {f.question}</p>
                                <p className="text-slate-655 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850 leading-relaxed font-sans">
                                  A: {f.answer}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingFaq({ id: f.id, question: f.question, answer: f.answer });
                                    setIsEditFaqModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                  title="Edit FAQ"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFaq(f.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Delete FAQ"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 3: Support Links Management */}
                {activeConfigSubTab === 'support_links' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Footer Support Links ({supportLinks.length})</h4>
                      <button
                        onClick={() => {
                          setSupportLinkForm({
                            title: '',
                            url: '',
                            icon: 'Phone',
                            is_active: true
                          });
                          setEditingSupportLinkId(null);
                          setIsSupportLinkModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add New Link</span>
                      </button>
                    </div>

                    {loadingSupportLinks ? (
                      <p className="text-slate-400 italic text-xs py-6 text-center">Loading support links...</p>
                    ) : supportLinks.length === 0 ? (
                      <p className="text-slate-400 italic text-xs py-6 text-center">No support links found.</p>
                    ) : (
                      <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 text-slate-500 font-bold">
                              <th className="p-3">Title</th>
                              <th className="p-3">Icon</th>
                              <th className="p-3">Destination Link / Value</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                            {supportLinks.map((link) => {
                              return (
                                <tr key={link.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{link.title}</td>
                                  <td className="p-3 text-slate-500">
                                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-[10px]">
                                      {link.icon}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400 max-w-xs truncate">{link.url}</td>
                                  <td className="p-3">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${link.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                      {link.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={() => startEditSupportLink(link)}
                                        className="p-1 text-slate-400 hover:text-emerald-500 rounded transition-colors"
                                        title="Edit Link"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSupportLink(link.id)}
                                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                        title="Delete Link"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeConfigSubTab === 'reports' && (
                  renderReportAutomation()
                )}

                {activeConfigSubTab === 'homepage' && (
                  renderHomepageSettings()
                )}

              </div>
            )}

            {/* TAB CONTENT: USERS MANAGEMENT */}
            {activeTab === 'users' && (
              renderUsersManagement()
            )}

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
                        <td className="py-3.5 text-slate-500">
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
                <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="edit_show_on_homepage"
                    checked={editingProduct.show_on_homepage || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, show_on_homepage: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="edit_show_on_homepage" className="block text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
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
                    <label htmlFor="add_show_on_homepage" className="block text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
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

      {/* ADD FAQ MODAL */}
      {isAddFaqModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative flex flex-col">
            <button 
              onClick={() => setIsAddFaqModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              <span>Add New FAQ</span>
            </h3>
            <form onSubmit={handleAddFaq} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Question</label>
                <input
                  type="text"
                  required
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="Enter the question..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Answer</label>
                <textarea
                  required
                  rows="4"
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddFaqModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 rounded-xl font-bold transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all text-xs"
                >
                  Add FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FAQ MODAL */}
      {isEditFaqModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative flex flex-col">
            <button 
              onClick={() => setIsEditFaqModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-emerald-500" />
              <span>Edit FAQ</span>
            </h3>
            <form onSubmit={handleUpdateFaq} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Question</label>
                <input
                  type="text"
                  required
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="Enter the question..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Answer</label>
                <textarea
                  required
                  rows="4"
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditFaqModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 rounded-xl font-bold transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Carousel Banner Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setIsBannerModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Image className="h-4 w-4 text-emerald-500" />
              <span>{editingBannerId ? 'Edit Banner Slide' : 'Add New Banner Slide'}</span>
            </h3>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              {bannerError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  {bannerError}
                </div>
              )}
              {bannerSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  {bannerSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Title *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder="e.g. Fresh Summer Fruits"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Subtitle</label>
                  <input
                    type="text"
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    placeholder="e.g. UP TO 30% OFF"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Description</label>
                <textarea
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                  placeholder="Short description of the promo..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Button Text</label>
                  <input
                    type="text"
                    value={bannerForm.button_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                    placeholder="e.g. Shop Now"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Button Link / URL</label>
                  <input
                    type="text"
                    value={bannerForm.button_link}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_link: e.target.value })}
                    placeholder="e.g. /category/Fruits"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Banner Image</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={bannerForm.image_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                    placeholder="Or enter image URL manually..."
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold transition-all border border-slate-200/50 dark:border-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                    <Upload className="h-4 w-4" />
                    <span>{uploadingBannerImage ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageUpload}
                      className="hidden"
                      disabled={uploadingBannerImage}
                    />
                  </label>
                </div>
                {bannerForm.image_url && (
                  <div className="mt-2 relative inline-block">
                    <img src={bannerForm.image_url} alt="Preview" className="h-16 w-32 object-cover rounded-lg border border-slate-200 dark:border-slate-850" />
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, image_url: '' })}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Background Gradient Style (Alternative to Image)</label>
                <input
                  type="text"
                  value={bannerForm.background_style}
                  onChange={(e) => setBannerForm({ ...bannerForm, background_style: e.target.value })}
                  placeholder="e.g. from-slate-900 via-indigo-950 to-slate-900"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none font-mono text-[10px]"
                />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setBannerForm({ ...bannerForm, background_style: 'from-slate-900 via-indigo-950 to-slate-900' })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded text-[9px] font-medium"
                  >
                    Indigo Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerForm({ ...bannerForm, background_style: 'from-slate-900 via-emerald-950 to-slate-900' })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded text-[9px] font-medium"
                  >
                    Emerald Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerForm({ ...bannerForm, background_style: 'from-slate-900 via-purple-950 to-slate-900' })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded text-[9px] font-medium"
                  >
                    Purple Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerForm({ ...bannerForm, background_style: 'from-slate-900 via-rose-950 to-slate-900' })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded text-[9px] font-medium"
                  >
                    Rose Theme
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Display Order</label>
                  <input
                    type="number"
                    required
                    value={bannerForm.display_order}
                    onChange={(e) => setBannerForm({ ...bannerForm, display_order: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    id="is_active_banner"
                    checked={bannerForm.is_active}
                    onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="is_active_banner" className="text-slate-700 dark:text-slate-350 font-bold select-none cursor-pointer">Active</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Link Modal */}
      {isSupportLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setIsSupportLinkModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 mb-4">
              <LinkIcon className="h-4 w-4 text-emerald-500" />
              <span>{editingSupportLinkId ? 'Edit Support Link' : 'Add Support Link'}</span>
            </h3>

            <form onSubmit={handleSaveSupportLink} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Title *</label>
                <input
                  type="text"
                  required
                  value={supportLinkForm.title}
                  onChange={(e) => setSupportLinkForm({ ...supportLinkForm, title: e.target.value })}
                  placeholder="e.g. Call Support"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Link Destination / Value *</label>
                <input
                  type="text"
                  required
                  value={supportLinkForm.url}
                  onChange={(e) => setSupportLinkForm({ ...supportLinkForm, url: e.target.value })}
                  placeholder="e.g. tel:+919876543210 or mailto:support@bb.com"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Icon Type *</label>
                <select
                  value={supportLinkForm.icon}
                  onChange={(e) => setSupportLinkForm({ ...supportLinkForm, icon: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Phone">Phone (Telephone icon)</option>
                  <option value="Mail">Mail (Envelope icon)</option>
                  <option value="MapPin">MapPin (Location/Address icon)</option>
                  <option value="Globe">Globe (Web/External URL icon)</option>
                  <option value="MessageSquare">MessageSquare (Chat icon)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_support_link"
                  checked={supportLinkForm.is_active}
                  onChange={(e) => setSupportLinkForm({ ...supportLinkForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_active_support_link" className="text-slate-700 dark:text-slate-350 font-bold select-none cursor-pointer">Active / Visible on Footer</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsSupportLinkModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                {editingCategory ? "Edit Category Details" : "Add New Category"}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              {categoryError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold">
                  {categoryError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">System Identifier (Unique)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory}
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Bangles"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-sm disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">English Translation Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name_en}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                  placeholder="e.g. Bangles"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Hindi Translation Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name_hi}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_hi: e.target.value })}
                  placeholder="e.g. चूड़ियाँ"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 mb-1.5">Category Cover Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={categoryForm.image_url}
                    onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                    placeholder="/logo.svg"
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-800">
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadMediaFile(e.target.files[0], 'category');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-bold rounded-xl shadow-sm flex items-center gap-1"
                >
                  {categorySubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>Save Category</span>
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
