import React from 'react';
import { Users, Calendar, Check, Lock, DollarSign, Search, Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const formatDateTime = (isoString) => {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  const dateObj = new Date(isoString);
  if (isNaN(dateObj.getTime())) return { date: 'N/A', time: 'N/A' };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = months[dateObj.getMonth()];
  const y = dateObj.getFullYear();
  const dateStr = `${d}-${m}-${y}`;

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

  return { date: dateStr, time: timeStr };
};

const renderAddress = (addr) => {
  if (!addr) return 'N/A';
  const parts = [
    addr.street,
    addr.city,
    addr.state,
    addr.pincode,
    addr.country
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

export const HomeUserManagement = ({
  usersAnalytics,
  userSearchQuery,
  setUserSearchQuery,
  setUserPage,
  userFilter,
  setUserFilter,
  setShowAddUserModal,
  currentUsers,
  formatPrice,
  setSelectedUserForDetails,
  indexOfFirstItem,
  indexOfLastItem,
  filteredUsers,
  totalPages,
  userPage
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Registered</span>
            <span className="text-xl font-black text-slate-850 dark:text-white mt-0.5 block">
              {usersAnalytics?.total_users ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-500">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">New This Month</span>
            <span className="text-xl font-black text-slate-850 dark:text-white mt-0.5 block">
              {usersAnalytics?.new_users_this_month ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Customers</span>
            <span className="text-xl font-black text-slate-850 dark:text-white mt-0.5 block">
              {usersAnalytics?.active_users ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
          <div className="bg-rose-500/10 p-3 rounded-xl text-rose-500">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Blocked Users</span>
            <span className="text-xl font-black text-slate-855 dark:text-white mt-0.5 block">
              {usersAnalytics?.blocked_users ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex items-center gap-4 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Revenue</span>
            <span className="text-xl font-black text-slate-855 dark:text-white mt-0.5 block price-amount">
              ₹{formatPrice(usersAnalytics?.total_revenue ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={userSearchQuery}
            onChange={(e) => {
              setUserSearchQuery(e.target.value);
              setUserPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/35 text-xs text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center justify-start lg:justify-end">
          {[
            { label: 'All Users', value: 'all' },
            { label: 'Active Users', value: 'active' },
            { label: 'Blocked Users', value: 'blocked' },
            { label: 'New Users', value: 'new' },
            { label: 'With Orders', value: 'with_orders' },
            { label: 'Without Orders', value: 'without_orders' }
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setUserFilter(f.value);
                setUserPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${userFilter === f.value
                  ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850'
                }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-emerald-550 bg-emerald-500 hover:bg-emerald-600 text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ml-0 lg:ml-2"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-150 dark:border-slate-800 sticky top-0 z-10">
              <tr className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6 font-bold">User ID</th>
                <th className="py-4 px-6 font-bold">Full Name</th>
                <th className="py-4 px-6 font-bold">Mobile Number</th>
                <th className="py-4 px-6 font-bold">Email Address</th>
                <th className="py-4 px-6 font-bold">Role</th>
                <th className="py-4 px-6 font-bold">Address</th>
                <th className="py-4 px-6 font-bold">Registration Date</th>
                <th className="py-4 px-6 font-bold">Registration Time</th>
                <th className="py-4 px-6 font-bold text-center">Total Orders</th>
                <th className="py-4 px-6 font-bold text-center">Total Spending</th>
                <th className="py-4 px-6 font-bold text-center">Pending Orders</th>
                <th className="py-4 px-6 font-bold text-center">Delivered Orders</th>
                <th className="py-4 px-6 font-bold">Account Status</th>
                <th className="py-4 px-6 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="14" className="py-12 text-center text-slate-450 italic">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                currentUsers.map((u) => {
                  const { date, time } = formatDateTime(u.created_at);
                  const pendingOrdersCount = u.orders?.filter(o => o.order_status === 'Pending').length || 0;
                  const deliveredOrdersCount = u.orders?.filter(o => o.order_status === 'Delivered').length || 0;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-55/30 dark:hover:bg-slate-850/30 transition-colors"
                    >
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-400">
                        {u.id}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100">
                        {u.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-650 dark:text-slate-350">
                        {u.mobile}
                      </td>
                      <td className="py-4 px-6 text-slate-650 dark:text-slate-350">
                        {u.email}
                      </td>
                      <td className="py-4 px-6">
                        {u.is_admin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            Customer
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-slate-500 dark:text-slate-400" title={renderAddress(u.address)}>
                        {renderAddress(u.address)}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">
                        {date}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">
                        {time}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-700 dark:text-slate-300">
                        {u.total_orders || 0}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-emerald-600 dark:text-emerald-400 price-amount">
                        ₹{formatPrice(u.total_spent || 0)}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-amber-500">
                        {pendingOrdersCount}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-emerald-500">
                        {deliveredOrdersCount}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-[12px] py-[4px] rounded-full text-[10px] font-semibold border shadow-sm ${
                          (u.status || (u.is_blocked ? "Blocked" : "Active")).toLowerCase() === 'active'
                            ? 'bg-[#22C55E] text-[#FFFFFF] border-[#16A34A]'
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
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setSelectedUserForDetails(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-955/40 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              Showing <span className="font-bold text-slate-700 dark:text-slate-300">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {Math.min(indexOfLastItem, filteredUsers.length)}
              </span>{' '}
              of <span className="font-bold text-slate-700 dark:text-slate-300">{filteredUsers.length}</span> users
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setUserPage(p => Math.max(1, p - 1))}
                disabled={userPage === 1}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setUserPage(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${userPage === p
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-655 dark:text-slate-400'
                    }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setUserPage(p => Math.min(totalPages, p + 1))}
                disabled={userPage === totalPages}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
