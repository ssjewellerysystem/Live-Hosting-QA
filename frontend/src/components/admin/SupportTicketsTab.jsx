import React from 'react';
import axios from 'axios';
import { MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../../context/AuthContext';

export const SupportTicketsTab = ({
  messages,
  fetchMessages
}) => {
  return (
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
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{m.name} <span className="text-slate-400 font-normal">({m.email})</span></p>
                </div>
                <span className="text-[10px] text-slate-400">
                  {m.created_at ? new Date(m.created_at).toLocaleString() : "Recently"}
                </span>
              </div>
              <p className="text-slate-655 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850 leading-relaxed font-sans select-all">
                {m.message}
              </p>

              {/* Existing Replies */}
              {m.replies && m.replies.length > 0 && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-2.5">
                  {m.replies.map((reply, rIdx) => (
                    <div key={reply.id || rIdx} className="text-xs bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-105 dark:border-slate-900">
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        {reply.sender} <span className="font-normal text-[10px] text-slate-400">({reply.created_at ? new Date(reply.created_at).toLocaleString() : 'Recently'})</span>
                      </p>
                      <p className="text-slate-605 dark:text-slate-450 mt-1 leading-relaxed">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input Form */}
              <div className="mt-3 ml-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a reply to this customer..."
                  id={`admin-reply-${m.id || m._id}`}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs text-slate-800 dark:text-white"
                />
                <button
                  onClick={async () => {
                    const inputEl = document.getElementById(`admin-reply-${m.id || m._id}`);
                    const replyMsg = inputEl?.value?.trim();
                    if (!replyMsg) return;
                    try {
                      const token = localStorage.getItem('token');
                      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                      await axios.post(`${API_BASE_URL}/support/${m.id || m._id}/reply`, {
                        sender: "Admin Support",
                        message: replyMsg
                      }, config);
                      if (inputEl) inputEl.value = '';
                      fetchMessages();
                    } catch (err) {
                      alert("Failed to send reply: " + (err.response?.data?.message || err.message));
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-xl text-xs border-none cursor-pointer"
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
