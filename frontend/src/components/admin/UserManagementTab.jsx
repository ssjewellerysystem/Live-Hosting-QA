import React from 'react';
import { Users, Search, Calendar, Shield, X, Clock, ShoppingBag, DollarSign, MapPin, Eye } from 'lucide-react';

export const UserManagementTab = ({
  users,
  userSearchQuery,
  setUserSearchQuery,
  selectedUserDetails,
  setSelectedUserDetails,
  fetchUserDetails,
  formatAddress,
  formatPrice,
  formatTimestamp,
  setViewingOrderItems,
  handleOpenStatusModal
}) => {
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
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-855 dark:text-slate-100"
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
                    <td className="py-3.5 px-2 text-slate-550 dark:text-slate-355">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-2 font-mono text-slate-555 dark:text-slate-350">
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
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-105 dark:border-slate-850">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Joined Date</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {selectedUserDetails.created_at ? new Date(selectedUserDetails.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-105 dark:border-slate-850">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Role</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    {selectedUserDetails.is_admin ? 'Admin' : 'Customer'}
                  </span>
                </div>
                <div className="bg-slate-55 dark:bg-slate-955 p-3 rounded-2xl border border-slate-105 dark:border-slate-850 col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Last Login</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {selectedUserDetails.last_login ? new Date(selectedUserDetails.last_login).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-55 dark:bg-slate-955 p-3 rounded-2xl border border-slate-105 dark:border-slate-850">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Total Orders</span>
                  <span className="stats-value-highlight flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    {selectedUserDetails.total_orders || 0}
                  </span>
                </div>
                <div className="bg-slate-55 dark:bg-slate-955 p-3 rounded-2xl border border-slate-105 dark:border-slate-850">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Total Spent</span>
                  <span className="stats-value-highlight flex items-center gap-1.5 price-amount">
                    <DollarSign className="h-3.5 w-3.5" />
                    ₹{formatPrice(selectedUserDetails.total_spent || 0)}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-105 dark:border-slate-850 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold block">Delivery Address</span>
                <div className="flex items-start gap-2 text-xs text-slate-705 dark:text-slate-350">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{formatAddress(selectedUserDetails.address)}</span>
                </div>
              </div>

              {/* Status History (Audit Trail) */}
              {selectedUserDetails.audit_logs && selectedUserDetails.audit_logs.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Status Audit Trail</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedUserDetails.audit_logs.map((log, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-105 dark:border-slate-850 text-[10px] space-y-1">
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
                          <span className="text-slate-455 font-mono">
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
                          className="w-full py-1.5 px-3 bg-white dark:bg-slate-950 border border-slate-155 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer text-slate-655 dark:text-slate-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Items</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-455 italic text-[11px] py-2">No orders placed yet.</p>
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
