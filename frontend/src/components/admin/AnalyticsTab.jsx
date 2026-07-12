import React from 'react';
import { BarChart3, RefreshCw, Package, ShoppingBag, AlertTriangle } from 'lucide-react';

export const AnalyticsTab = ({
  loadDashboardData,
  getCategoryData,
  formatPrice,
  getOrderStatusData,
  orders,
  overviewAnalytics,
  SERVER_BASE_URL,
  getLowStockProducts,
  handleTabChange,
  setEditingProduct,
  setEditProductImages,
  initEditImages,
  setIsEditImagesOpen,
  getReturnRequests,
  returnNotes,
  setReturnNotes,
  handleManageReturn
}) => {
  return (
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
          {/* Revenue Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Today's Revenue", val: overviewAnalytics.revenue_stats.today_revenue, color: "text-emerald-500" },
              { label: "Weekly Revenue", val: overviewAnalytics.revenue_stats.weekly_revenue, color: "text-indigo-500" },
              { label: "Monthly Revenue", val: overviewAnalytics.revenue_stats.monthly_revenue, color: "text-blue-500" },
              { label: "Total Revenue", val: overviewAnalytics.revenue_stats.total_revenue, color: "text-purple-500" }
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                <span className={`text-xl font-black mt-1 block ${item.color} price-amount`}>₹{formatPrice(item.val)}</span>
              </div>
            ))}
          </div>

          {/* Matplotlib Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <span className="px-2 py-1 text-[11px] font-black bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-455 rounded-lg animate-pulse">
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

                  <div className="bg-white dark:bg-slate-955 border border-slate-105 dark:border-slate-850 p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-400">
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
  );
};
