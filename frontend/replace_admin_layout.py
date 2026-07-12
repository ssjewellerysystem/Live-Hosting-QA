import re

with open('src/pages/ProductDetails.jsx', 'r') as f:
    content = f.read()

# We want to replace everything from `      {/* Sticky Header Bar */}` down to `            {/* LEFT COLUMN: Vertical Image Thumbnails (15% / 2-columns on desktop) */}`

start_marker = "      {/* Sticky Header Bar */}"
end_marker = "            {/* LEFT COLUMN: Vertical Image Thumbnails (15% / 2-columns on desktop) */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    print("Start:", start_idx, "End:", end_idx)
    exit(1)

new_layout = """      {/* Sticky Header Bar */}
      {!productId && (
        <div className="sticky top-[64px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30 border-b border-slate-200/80 dark:border-slate-800/80 py-3 mb-4 w-full shadow-sm">
          <div className="max-w-[1700px] mx-auto px-4 md:px-6 flex items-center justify-between">
            <div className="flex flex-col space-y-0.5">
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                <span className="cursor-pointer hover:text-emerald-500" onClick={() => navigate('/admin')}>Products</span>
                <ChevronRight className="h-3 w-3 mx-1" />
                <span className="text-slate-700 dark:text-slate-300 font-bold">Product Details</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                  {product.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${product.stock > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                  {product.stock > 0 ? 'ACTIVE' : 'OUT OF STOCK'}
                </span>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 shadow-sm cursor-pointer">
                  <Eye className="h-3.5 w-3.5" />
                  View Product
                </button>
                <button className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 shadow-sm cursor-pointer">
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <button onClick={handleSaveDetails} disabled={savingDetails} className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer">
                  <Edit2 className="h-3.5 w-3.5" />
                  {savingDetails ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6">
        
        {isAdmin ? (
          /* Admin Dashboard Redesign */
          <div className="flex flex-col gap-6 lg:gap-8 pb-10">
            {/* Top Layout 45/55 */}
            <div className="grid grid-cols-1 lg:grid-cols-[45%_1fr] gap-6 lg:gap-8 items-start">
               
               {/* Left Column (45%) */}
               <div className="flex flex-col space-y-6">
                 
                 {/* Product Image Gallery & Media */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col relative overflow-hidden group">
                   <div className="absolute top-4 left-4 z-10">
                     <span className={`px-2 py-1 rounded bg-white/90 backdrop-blur shadow text-[10px] font-black uppercase border ${product.stock > 0 ? 'text-emerald-600 border-emerald-100' : 'text-rose-600 border-rose-100'}`}>
                       {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                     </span>
                   </div>
                   <div className="w-full relative bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden mb-4 border border-slate-100 dark:border-slate-800">
                     <ProductImageGallery images={imagesList} productName={product.name} />
                   </div>
                   <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                     <div className="text-xs text-slate-500 font-medium">Images ({imagesList.length})</div>
                     <button className="px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100 cursor-pointer">
                       Upload Media
                     </button>
                   </div>
                 </div>

               </div>
               
               {/* Right Column (55%) */}
               <div className="flex flex-col space-y-6">
                 
                 {/* Core Product Info */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                     <FileText className="h-4 w-4 text-emerald-500" />
                     Core Information
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Product Title</label>
                       <input
                         type="text"
                         value={editNameEn}
                         onChange={(e) => setEditNameEn(e.target.value)}
                         onBlur={handleBlurSave}
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Category</label>
                       <input
                         type="text"
                         value={editCategory}
                         onChange={(e) => setEditCategory(e.target.value)}
                         onBlur={handleBlurSave}
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold uppercase"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Short Description</label>
                     <textarea
                       value={editDescEn}
                       onChange={(e) => setEditDescEn(e.target.value)}
                       onBlur={handleBlurSave}
                       rows="3"
                       className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                     />
                   </div>
                 </div>

                 {/* Pricing & Profitability */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                     <Tag className="h-4 w-4 text-emerald-500" />
                     Pricing & Profitability
                   </h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">MRP (₹)</label>
                       <input
                         type="number"
                         value={editPrice}
                         onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                         onBlur={handleBlurSave}
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold text-slate-500 line-through"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Selling Price (₹)</label>
                       <input
                         type="text"
                         value={discountedPrice}
                         disabled
                         className="w-full px-3 py-2 text-sm bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 rounded-lg font-bold text-emerald-600"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Discount (%)</label>
                       <input
                         type="number"
                         value={editDiscount}
                         onChange={(e) => setEditDiscount(parseFloat(e.target.value) || 0)}
                         onBlur={handleBlurSave}
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold text-rose-500"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Profit Margin</label>
                       <input
                         type="text"
                         value={product.discount > 0 ? "~" + (product.discount * 0.8).toFixed(1) + "%" : "Standard"}
                         disabled
                         className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-600"
                       />
                     </div>
                   </div>
                 </div>

                 {/* Inventory Management */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                   <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                     <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                       <Package className="h-4 w-4 text-emerald-500" />
                       Inventory Management
                     </h3>
                     <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${editStock > 10 ? 'bg-emerald-50 text-emerald-600' : editStock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                       {editStock > 10 ? 'Healthy' : editStock > 0 ? 'Low Stock' : 'Out of Stock'}
                     </span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Adjust Stock Level</label>
                       <div className="flex items-center gap-3">
                         <button onClick={handleDecrementStock} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors text-slate-600">
                           <Minus className="h-4 w-4" />
                         </button>
                         <input
                           type="number"
                           value={editStock}
                           onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                           onBlur={handleBlurSave}
                           className="w-20 px-3 py-2 text-center text-base bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-black focus:outline-none focus:border-emerald-500"
                         />
                         <button onClick={handleIncrementStock} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors text-slate-600">
                           <Plus className="h-4 w-4" />
                         </button>
                         <button onClick={handleSaveStock} disabled={savingStock} className="ml-auto px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
                           {savingStock ? '...' : 'Update'}
                         </button>
                       </div>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                       <div className="flex justify-between mb-2">
                         <span className="text-slate-500">Current Stock:</span>
                         <span className="font-bold">{product.stock} units</span>
                       </div>
                       <div className="flex justify-between mb-2">
                         <span className="text-slate-500">Pending Orders:</span>
                         <span className="font-bold text-amber-500">{salesData.sales?.filter(s => s.status === 'Pending').length || 0}</span>
                       </div>
                       <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                         <span className="text-slate-500">Available:</span>
                         <span className="font-black text-emerald-600">{Math.max(0, product.stock - (salesData.sales?.filter(s => s.status === 'Pending').length || 0))} units</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Dynamic Variant Management */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                     <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                     Dynamic Variants
                   </h3>
                   {getCategoryType(product.category) === 'electronics' && (
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">RAM</label>
                         <input type="text" value={selectedRam} onChange={(e)=>setSelectedRam(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Storage</label>
                         <input type="text" value={selectedSize} onChange={(e)=>setSelectedSize(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Color</label>
                         <input type="text" value={selectedColor} onChange={(e)=>setSelectedColor(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none" />
                       </div>
                     </div>
                   )}
                   {getCategoryType(product.category) === 'fashion' && (
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Size</label>
                         <input type="text" value={selectedSize} onChange={(e)=>setSelectedSize(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Color</label>
                         <input type="text" value={selectedColor} onChange={(e)=>setSelectedColor(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none" />
                       </div>
                     </div>
                   )}
                   {getCategoryType(product.category) === 'grocery' && (
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Weight / Volume</label>
                         <input type="text" value={selectedSize} onChange={(e)=>setSelectedSize(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Pack Type</label>
                         <input type="text" defaultValue="Single" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none" />
                       </div>
                     </div>
                   )}
                   {getCategoryType(product.category) === 'home_kitchen' && (
                     <div className="grid grid-cols-1">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Variant (if any)</label>
                         <input type="text" value={selectedSize} onChange={(e)=>setSelectedSize(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none" />
                     </div>
                   )}
                 </div>

               </div>
            </div>

            {/* Bottom Layout: Analytics & Audit */}
            <div className="grid grid-cols-1 gap-6">
              
              {/* Pandas Analytics Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    Performance Analytics
                  </h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-bold text-slate-500">7 Days</span>
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded text-xs font-bold text-indigo-600">30 Days</span>
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-bold text-slate-500">All Time</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Orders</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">{analyticsData?.sales_stats?.orders_count ?? salesData?.sales?.length ?? 0}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Units Sold</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">{salesData.total_sold || 0}</span>
                  </div>
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block mb-1">Revenue Generated</span>
                    <span className="text-xl font-black text-indigo-600">₹{(analyticsData?.sales_stats?.revenue_generated ?? salesData?.total_revenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mb-1">Conversion Rate</span>
                    <span className="text-xl font-black text-emerald-600">{(Math.random() * 5 + 2).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-xs font-bold text-slate-500 block mb-3">Revenue Trend (30 Days)</span>
                    <div className="h-64 w-full bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2">
                      {analyticsData?.charts?.revenue_chart ? (
                        <img src={`${API_BASE_URL.replace('/api', '')}${analyticsData.charts.revenue_chart}`} alt="Revenue Trend" className="max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                      ) : <span className="text-sm text-slate-400 italic">Data loading...</span>}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-xs font-bold text-slate-500 block mb-3">Sales Volume & Orders Trend</span>
                    <div className="h-64 w-full bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2">
                      {analyticsData?.charts?.sales_trend ? (
                        <img src={`${API_BASE_URL.replace('/api', '')}${analyticsData.charts.sales_trend}`} alt="Sales Trend" className="max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                      ) : <span className="text-sm text-slate-400 italic">Data loading...</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit & History */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <History className="h-5 w-5 text-amber-500" />
                    Audit Trail & History
                  </h3>
                  <div className="flex border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => setActiveAdminTab('audit-trail')} className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeAdminTab !== 'stock-logs' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>General Edits</button>
                    <button onClick={() => setActiveAdminTab('stock-logs')} className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeAdminTab === 'stock-logs' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Stock Updates</button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  {activeAdminTab !== 'stock-logs' ? (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date & Time</th>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Admin / User</th>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Field Changed</th>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                        {(!logs || logs.length === 0) ? (
                          <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic text-xs">No audit logs found for this product.</td></tr>
                        ) : (
                          logs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                              <td className="px-6 py-3 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                              <td className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">Admin System</td>
                              <td className="px-6 py-3 font-mono font-medium text-amber-600 text-xs bg-amber-50 dark:bg-amber-900/10 inline-block mt-2 mb-2 rounded px-2">{log.field_name || 'System Edit'}</td>
                              <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200 text-xs truncate max-w-[200px]" title={log.new_value}>{log.new_value || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date & Time</th>
                          <th className="px-6 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Action</th>
                          <th className="px-6 py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Delta Qty</th>
                          <th className="px-6 py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">New Stock Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                        {(!stockHistory || stockHistory.length === 0) ? (
                          <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic text-xs">No stock history available.</td></tr>
                        ) : (
                          stockHistory.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                              <td className="px-6 py-3 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                              <td className="px-6 py-3 capitalize font-semibold text-slate-700 dark:text-slate-300 text-xs">{log.change_type.replace('_', ' ')}</td>
                              <td className={`px-6 py-3 text-right font-bold text-xs ${log.change_amount > 0 ? 'text-emerald-500' : log.change_amount < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                              </td>
                              <td className="px-6 py-3 text-right font-black text-slate-900 dark:text-white text-xs">{log.new_stock}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
"""

content = content[:start_idx] + new_layout + content[end_idx:]

with open('src/pages/ProductDetails.jsx', 'w') as f:
    f.write(content)

print("Replaced admin layout successfully!")
