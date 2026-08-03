import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Trash2, Edit3, Plus, RefreshCw, Check, Sparkles, Image as ImageIcon, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../context/AuthContext';
import { getCategoryBannerEndpoint } from '../CategoryBanner';

export const CategoryBannerManagement = ({ categories = [] }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Image Source Mode: 'upload' vs 'url'
  const [imageSourceMode, setImageSourceMode] = useState('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [urlValidationError, setUrlValidationError] = useState('');

  // Form State & Refs
  const formRef = React.useRef(null);
  const [formHighlight, setFormHighlight] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('SHOP NOW');
  const [buttonLink, setButtonLink] = useState('/products');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);


  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  const authHeaders = {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Admin-Token': token || ''
    }
  };

  const fetchCategoryBanners = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const endpoint = getCategoryBannerEndpoint();
      const res = await axios.get(endpoint);
      setBanners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("[CategoryBannerManagement] Error loading category banners:", err);
      setFetchError('Unable to load Category Banner Management. Please check backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryBanners();
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4500);
  };

  const resetForm = () => {
    setEditingId(null);
    const firstCat = categories.length > 0 ? categories[0] : null;
    const initialCatId = firstCat ? strId(firstCat.id) : '';
    const initialLink = firstCat ? `/?category=${encodeURIComponent(firstCat.name)}` : '/products';

    setCategoryId(initialCatId);
    setBannerImage('');
    setImageUrlInput('');
    setUrlValidationError('');
    setImageSourceMode('upload');
    setTitle('');
    setSubtitle('');
    setDescription('');
    setButtonText('SHOP NOW');
    setButtonLink(initialLink);
    setIsActive(true);
    setDisplayOrder(0);
  };

  const strId = (id) => (id !== undefined && id !== null ? String(id) : '');

  // Auto-generate CTA Link when Category dropdown changes
  const handleCategorySelectChange = (newCatId) => {
    setCategoryId(newCatId);
    if (newCatId) {
      const selectedCat = categories.find((c) => strId(c.id) === strId(newCatId));
      if (selectedCat && selectedCat.name) {
        setButtonLink(`/?category=${encodeURIComponent(selectedCat.name)}`);
      }
    }
  };

  // Sync initial category & CTA Link when categories prop changes
  useEffect(() => {
    if (categories.length > 0 && !categoryId && !editingId) {
      const firstCat = categories[0];
      setCategoryId(strId(firstCat.id));
      setButtonLink(`/?category=${encodeURIComponent(firstCat.name)}`);
    }
  }, [categories]);


  // Handle URL Input Validation & Real-time update
  const handleUrlInputChange = (val) => {
    setImageUrlInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setUrlValidationError('Image URL is required.');
      setBannerImage('');
      return;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      setUrlValidationError('');
      setBannerImage(trimmed);
    } else {
      setUrlValidationError('Please enter a valid HTTP or HTTPS image URL (e.g. https://domain.com/banner.webp)');
      setBannerImage('');
    }
  };

  // Handle File Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const endpoint = getCategoryBannerEndpoint('/upload');
      const res = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Admin-Token': token || ''
        }
      });
      if (res.data && res.data.url) {
        setBannerImage(res.data.url);
        showMsg('success', 'Banner image uploaded successfully!');
      }
    } catch (err) {
      console.error("Error uploading banner image:", err);
      showMsg('error', err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryId) {
      showMsg('error', 'Please select a category from the database.');
      return;
    }

    if (imageSourceMode === 'url') {
      if (!imageUrlInput.trim()) {
        showMsg('error', 'Please provide a valid image URL.');
        setUrlValidationError('Image URL is required.');
        return;
      }
      if (urlValidationError) {
        showMsg('error', urlValidationError);
        return;
      }
    } else {
      if (!bannerImage) {
        showMsg('error', 'Please upload a banner image.');
        return;
      }
    }

    const finalBannerImage = imageSourceMode === 'url' ? imageUrlInput.trim() : bannerImage;

    setSaving(true);
    const payload = {
      category_id: parseInt(categoryId, 10),
      banner_image: finalBannerImage,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      button_text: buttonText.trim(),
      button_link: buttonLink.trim() || '/products',
      is_active: isActive,
      display_order: parseInt(displayOrder, 10) || 0
    };

    try {
      if (editingId) {
        const endpoint = getCategoryBannerEndpoint(`/${editingId}`);
        await axios.put(endpoint, payload, authHeaders);
        showMsg('success', 'Category banner updated successfully!');
      } else {
        const endpoint = getCategoryBannerEndpoint();
        await axios.post(endpoint, payload, authHeaders);
        showMsg('success', 'Category banner created successfully!');
      }
      resetForm();
      fetchCategoryBanners();
    } catch (err) {
      console.error("Error saving category banner:", err);
      showMsg('error', err.response?.data?.message || 'Failed to save category banner.');
    } finally {
      setSaving(false);
    }
  };

  // Populate form for Editing (Auto-detects Upload vs URL mode)
  const handleEdit = (b) => {
    setEditingId(b.id);
    setCategoryId(strId(b.category_id));

    const img = b.banner_image || '';
    setBannerImage(img);

    // Auto-detect Upload Mode vs URL Mode
    if (img.startsWith('http://') || img.startsWith('https://')) {
      setImageSourceMode('url');
      setImageUrlInput(img);
      setUrlValidationError('');
    } else {
      setImageSourceMode('upload');
      setImageUrlInput('');
      setUrlValidationError('');
    }

    setTitle(b.title || '');
    setSubtitle(b.subtitle || '');
    setDescription(b.description || '');
    setButtonText(b.button_text || 'SHOP NOW');
    setButtonLink(b.button_link || '/products');
    setIsActive(b.is_active ?? true);
    setDisplayOrder(b.display_order || 0);

    // Trigger subtle visual highlight without page jump
    setFormHighlight(true);
    setTimeout(() => setFormHighlight(false), 2000);

    // Smoothly keep form in viewport if partially hidden, without scrolling to top of page
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };


  // Toggle Status
  const handleToggleStatus = async (b) => {
    try {
      const endpoint = getCategoryBannerEndpoint(`/${b.id}/status`);
      const res = await axios.patch(endpoint, { is_active: !b.is_active }, authHeaders);
      showMsg('success', res.data.message || 'Status updated!');
      fetchCategoryBanners();
    } catch (err) {
      console.error("Error toggling status:", err);
      showMsg('error', 'Failed to update status.');
    }
  };

  // Delete Banner
  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to delete the category banner for "${catName}"?`)) return;

    try {
      const endpoint = getCategoryBannerEndpoint(`/${id}`);
      await axios.delete(endpoint, authHeaders);
      showMsg('success', 'Category banner deleted!');
      if (editingId === id) resetForm();
      fetchCategoryBanners();
    } catch (err) {
      console.error("Error deleting banner:", err);
      showMsg('error', 'Failed to delete category banner.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#D4A75F]" />
            <h4 className="text-lg font-bold text-slate-850 dark:text-slate-100">
              Category Banner Management
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage database-driven banners loaded dynamically on individual category product pages.
          </p>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            + Create New Banner
          </button>
        )}
      </div>

      {/* Connection Failure Alert */}
      {fetchError && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-none" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={fetchCategoryBanners}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Alert Notification */}
      {msg.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Banner Upload & Editor Form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`bg-slate-50/70 dark:bg-slate-950/40 border transition-all duration-500 rounded-2xl p-5 space-y-5 ${
          formHighlight
            ? 'border-[#D4A75F] ring-2 ring-[#D4A75F]/30 shadow-lg'
            : 'border-slate-200/80 dark:border-slate-800/80'
        }`}
      >

        <h5 className="text-xs font-bold uppercase tracking-wider text-[#D4A75F]">
          {editingId ? 'Edit Category Banner' : 'Add New Category Banner'}
        </h5>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Image Source Selector (Upload Image vs Image URL) */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Image Source
              </label>

              {/* Source Mode Tabs */}
              <div className="flex items-center gap-2 p-1 bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setImageSourceMode('upload');
                    setUrlValidationError('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    imageSourceMode === 'upload'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImageSourceMode('url');
                    if (imageUrlInput) handleUrlInputChange(imageUrlInput);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    imageSourceMode === 'url'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Image URL</span>
                </button>
              </div>
            </div>

            {/* Mode A: Upload Image */}
            {imageSourceMode === 'upload' && (
              <div className="space-y-2">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group">
                  {bannerImage && !bannerImage.startsWith('http://') && !bannerImage.startsWith('https://') ? (
                    <>
                      <img
                        src={bannerImage}
                        alt="Category Banner Preview"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                        <label className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-white/30 transition-all">
                          <Upload className="h-3.5 w-3.5" /> Replace
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                        <button
                          type="button"
                          onClick={() => setBannerImage('')}
                          className="px-3 py-1.5 bg-red-500/80 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-600 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors p-4 text-center">
                      {uploading ? (
                        <RefreshCw className="h-8 w-8 text-[#D4A75F] animate-spin mb-2" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
                      )}
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {uploading ? 'Uploading...' : 'Choose File / Upload Image'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Saves to <code className="text-[#D4A75F]">banner_image</code> column. Responsive layout auto-crops for mobile.
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Mode B: Image URL Mode */}
            {imageSourceMode === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Paste Banner Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/banner.webp or https://res.cloudinary.com/..."
                    value={imageUrlInput}
                    onChange={(e) => handleUrlInputChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-medium focus:outline-none ${
                      urlValidationError ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-[#D4A75F]'
                    }`}
                  />
                  {urlValidationError && (
                    <p className="text-[10px] font-semibold text-red-500 mt-1">{urlValidationError}</p>
                  )}
                </div>

                {/* Live Preview for Image URL */}
                <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  {imageUrlInput && !urlValidationError ? (
                    <img
                      src={imageUrlInput}
                      alt="URL Banner Preview"
                      onError={() => setUrlValidationError('Unable to load image from URL. Please check image link.')}
                      onLoad={() => setUrlValidationError('')}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">Live Image URL preview will appear here</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Combined Image Column Indicator */}
            {bannerImage && (
              <div className="p-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-500 truncate flex items-center justify-between">
                <span className="truncate">
                  <span className="font-bold text-[#D4A75F] uppercase tracking-wider">banner_image:</span> {bannerImage}
                </span>
                <span className="flex-none px-2 py-0.5 rounded bg-slate-300 dark:bg-slate-800 text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300 ml-2">
                  {bannerImage.startsWith('http') ? 'Remote URL' : 'Local File'}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Form Inputs */}
          <div className="space-y-4">
            {/* Category Dropdown */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Select Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => handleCategorySelectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D4A75F]"
                required
              >
                <option value="">-- Select Category from Database --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={strId(cat.id)}>
                    {cat.name} {cat.name_en && cat.name_en !== cat.name ? `(${cat.name_en})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Solitaire Diamond Collection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. RINGS"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Discover handcrafted solitaire rings made in premium gold."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs resize-none"
              />
            </div>

            {/* CTA Button Text & Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. SHOP SOLITAIRES"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  CTA Link (Internal Route)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /?category=Rings"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Automatically generated from the selected category. You can edit this link if required.
                </p>
              </div>
            </div>


            {/* Active Toggle & Display Order */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 pt-2">
              {/* Mobile Row 1 / Desktop Left: Active Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Active Toggle:</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
                <span className={`text-xs font-bold ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Mobile Row 2 / Desktop Right: Display Order */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full sm:w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-left sm:text-center focus:outline-none focus:border-[#D4A75F]"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Submit Controls */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span>{editingId ? 'Update Category Banner' : 'Save Category Banner'}</span>
          </button>
        </div>
      </form>

      {/* Existing Category Banners List */}
      <div className="space-y-4 pt-4">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Active Category Banners in Database ({banners.length})
        </h5>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 text-[#D4A75F] animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400">No category banners found in database. Create your first category banner above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/30 space-y-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#D4A75F] uppercase">
                      {b.category_name || `Category ID #${b.category_id}`}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(b)}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer transition-all ${
                        b.is_active
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}
                    >
                      {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                      {b.banner_image && b.banner_image.startsWith('http') ? 'URL' : 'UPLOAD'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(b)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.category_name)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex-none border border-slate-200 dark:border-slate-800 relative">
                    {b.banner_image ? (
                      <img src={b.banner_image} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">No image</div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0 space-y-0.5">
                    <h6 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {b.title || 'Untitled Banner'}
                    </h6>
                    {b.subtitle && <p className="text-[10px] text-[#D4A75F] uppercase font-semibold">{b.subtitle}</p>}
                    {b.description && <p className="text-[10px] text-slate-400 line-clamp-1">{b.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryBannerManagement;
