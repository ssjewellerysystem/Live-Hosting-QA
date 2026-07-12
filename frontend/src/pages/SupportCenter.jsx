import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosLib from 'axios';
import { 
  MessageSquare, Send, CheckCircle2, AlertTriangle, Clock, 
  ArrowLeft, MessageCircle, User, FileText, HelpCircle, ChevronRight
} from 'lucide-react';
import { AuthContext, API_BASE_URL } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const axiosInstance = axiosLib;

export const SupportCenter = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const { t } = useTranslation();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axiosInstance.get(`${API_BASE_URL}/support/my-tickets`, config);
      setTickets(response.data);
      if (response.data.length > 0) {
        if (selectedTicket) {
          const updatedSelected = response.data.find(t => t.id === selectedTicket.id || t._id === selectedTicket._id);
          setSelectedTicket(updatedSelected || response.data[0]);
        } else {
          setSelectedTicket(response.data[0]);
        }
      } else {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t('support_center.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=support-center');
      return;
    }
    fetchTickets();
  }, [user, token]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setSubmittingReply(true);
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const ticketId = selectedTicket.id || selectedTicket._id;
      await axiosInstance.post(`${API_BASE_URL}/support/${ticketId}/reply`, {
        sender: user.name || "Customer",
        message: replyText.trim()
      }, config);

      setReplyText('');
      await fetchTickets();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || t('support_center.reply_failed'));
    } finally {
      setSubmittingReply(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen pb-16 font-sans">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white py-12 text-center">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
          <Link to="/support" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold mb-3">
            <ArrowLeft className="h-3 w-3" />
            {t('support_center.back_help')}
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-400 border border-white/10 mb-2">
            <MessageSquare className="h-3.5 w-3.5" />
            {t('support_center.ticket_center')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('support_center.conversations_title')}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md">
            {t('support_center.conversations_desc')}
          </p>
        </div>
      </div>

      {/* Main Support Center Workspace */}
      <div className="max-w-[97%] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {loading && tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
            <p className="text-slate-400 mt-4 text-xs font-bold">{t('support_center.retrieving')}</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 p-8 rounded-3xl text-center max-w-md mx-auto">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-650 dark:text-red-400 font-bold">{errorMsg}</p>
            <button onClick={fetchTickets} className="mt-4 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow animate-pulse">
              {t('support_center.retry')}
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto shadow-sm">
            <MessageCircle className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4 animate-bounce" />
            <h4 className="text-lg font-black text-slate-800 dark:text-white">{t('support_center.no_tickets')}</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
              {t('support_center.no_tickets_desc')}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/support" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md">
                {t('support_center.create_ticket')}
              </Link>
              <Link to="/" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold">
                {t('support_center.go_shop')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar Ticket List */}
            <div className="space-y-3 lg:col-span-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('support_center.tickets_count', { count: tickets.length })}</span>
                <button onClick={fetchTickets} className="text-[10px] font-bold text-emerald-500 hover:underline">
                  {t('support_center.refresh')}
                </button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {tickets.map((tItem) => {
                  const ticketId = tItem.id || tItem._id;
                  const isSelected = selectedTicket && (selectedTicket.id === ticketId || selectedTicket._id === ticketId);
                  const hasAdminReply = tItem.replies && tItem.replies.some(r => r.sender === "Admin Support");

                  return (
                    <div
                      key={ticketId}
                      onClick={() => setSelectedTicket(tItem)}
                      className={`p-4 border rounded-2xl cursor-pointer text-left transition-all ${
                        isSelected 
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md transform scale-[1.01]' 
                          : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected 
                            ? 'bg-emerald-600 text-white' 
                            : hasAdminReply 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {hasAdminReply ? t('support_center.status_replied') : t('support_center.status_open')}
                        </span>
                        <span className={`text-[9px] ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {tItem.created_at ? new Date(tItem.created_at).toLocaleDateString() : t('support_center.recently')}
                        </span>
                      </div>

                      <p className={`text-xs font-bold mt-2 truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                        {tItem.message}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {tItem.name?.charAt(0) || 'U'}
                        </div>
                        <span className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-450'}`}>
                          {tItem.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conversation Active Window */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-[600px] overflow-hidden">
                  
                  {/* Conversation Header */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-855 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                          {t('support_center.conversation_with', { name: selectedTicket.name })}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          ID: {selectedTicket.id || selectedTicket._id} • {selectedTicket.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-955/10">
                    
                    {/* Initial Ticket Question */}
                    <div className="flex gap-3 items-start">
                      <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {selectedTicket.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl rounded-tl-none shadow-sm">
                          <p className="text-xs text-slate-800 dark:text-slate-155 leading-relaxed whitespace-pre-wrap font-sans">
                            {selectedTicket.message}
                          </p>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 block pl-1">
                          {t('support_center.initial_message', { time: selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : t('support_center.recently') })}
                        </span>
                      </div>
                    </div>

                    {/* Replies mapping */}
                    {selectedTicket.replies && selectedTicket.replies.map((reply, idx) => {
                      const isAdmin = reply.sender === "Admin Support";
                      return (
                        <div key={reply.id || idx} className={`flex gap-3 items-start ${isAdmin ? 'flex-row-reverse' : ''}`}>
                          <div className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isAdmin 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-955/40 dark:text-blue-400' 
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-400'
                          }`}>
                            {isAdmin ? 'A' : reply.sender?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-grow min-w-0 max-w-[80%]">
                            <div className={`p-3.5 rounded-2xl shadow-sm border ${
                              isAdmin 
                                ? 'bg-blue-500 text-white border-blue-500 rounded-tr-none' 
                                : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 rounded-tl-none'
                            }`}>
                              <p className={`text-xs leading-relaxed whitespace-pre-wrap font-sans ${isAdmin ? 'text-white' : 'text-slate-800 dark:text-slate-155'}`}>
                                {reply.message}
                              </p>
                            </div>
                            <span className={`text-[9px] text-slate-400 mt-1 block pl-1 ${isAdmin ? 'text-right pr-1' : ''}`}>
                              {reply.sender} • {reply.created_at ? new Date(reply.created_at).toLocaleString() : t('support_center.recently')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission Form Footer */}
                  <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 dark:border-slate-855 bg-white dark:bg-slate-900 flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder={t('support_center.reply_placeholder')}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-grow px-4 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs text-slate-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={submittingReply || !replyText.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold border-none flex items-center gap-1 cursor-pointer transition-colors shadow"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{submittingReply ? t('support_center.sending') : t('support_center.send')}</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="h-[600px] border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl flex flex-col justify-center items-center p-8 text-center">
                  <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-700 animate-pulse mb-2" />
                  <p className="text-xs text-slate-450">{t('support_center.select_ticket_hint')}</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
