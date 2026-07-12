import React from 'react';
import { Users, Calendar, Check, Lock, DollarSign, Clock, Search } from 'lucide-react';

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

export const HomeAdminAnalytics = ({
  usersAnalytics,
  generalAuditLogs,
  auditSearchVal,
  setAuditSearchVal,
  auditActionType,
  setAuditActionType,
  auditStatus,
  setAuditStatus,
  auditPage,
  setAuditPage,
  auditPerPage,
  formatPrice
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">
        Admin Analytics Summary Cards
      </h2>
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
                value={auditSearchVal}
                onChange={(e) => setAuditSearchVal(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Action Type Dropdown */}
            <select
              value={auditActionType}
              onChange={(e) => setAuditActionType(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200"
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
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200"
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
                      actionBadgeColor = "bg-emerald-50 text-emerald-600 dark:bg-emerald-955/30 dark:text-emerald-450";
                    } else if (type.includes("Deleted") || type.includes("Blocked") || type.includes("Cancelled")) {
                      actionBadgeColor = "bg-rose-50 text-rose-600 dark:bg-rose-955/30 dark:text-rose-455";
                    } else if (type.includes("Updated") || type.includes("Changed") || type.includes("Status")) {
                      actionBadgeColor = "bg-amber-50 text-amber-600 dark:bg-amber-955/30 dark:text-amber-455";
                    } else if (type.includes("Login") || type.includes("Logout")) {
                      actionBadgeColor = "bg-blue-50 text-blue-600 dark:bg-blue-955/30 dark:text-blue-450";
                    }

                    const { date, time } = formatDateTime(log.created_at);

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-all border-b border-slate-100 dark:border-slate-800/50">
                        <td className="py-3.5 pr-4 text-slate-500 admin-timestamp-text whitespace-nowrap">
                          {date} <span className="text-[10px] text-slate-400 font-normal">{time}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-100 admin-table-text">
                          {log.admin_username}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap ${actionBadgeColor}`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 admin-table-text whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {log.module}
                        </td>
                        <td className="py-3.5 px-4 max-w-[280px] admin-table-text truncate text-slate-700 dark:text-slate-300" title={log.details}>
                          {log.details}
                        </td>
                        <td className="py-3.5 pl-4">
                          <span className={log.status === 'Success'
                            ? 'status-badge-success'
                            : 'px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-955/40 dark:text-rose-455'
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
                className={`px-3 py-1.5 font-bold rounded-lg border border-slate-200 dark:border-slate-800 transition-all ${auditPage === 1
                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
              >
                Previous
              </button>
              <button
                onClick={() => setAuditPage(prev => Math.min(prev + 1, Math.ceil(generalAuditLogs.length / auditPerPage)))}
                disabled={auditPage >= Math.ceil(generalAuditLogs.length / auditPerPage)}
                className={`px-3 py-1.5 font-bold rounded-lg border border-slate-200 dark:border-slate-800 transition-all ${auditPage >= Math.ceil(generalAuditLogs.length / auditPerPage)
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
    </div>
  );
};
