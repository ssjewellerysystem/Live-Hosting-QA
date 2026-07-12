import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { HelpCircle, ChevronDown, ChevronUp, Mail, Send, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';
import { API_BASE_URL, AuthContext } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

export const Support = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch FAQ content
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/support/faqs`);
        setFaqs(response.data);
      } catch (err) {
        console.error(err);
        // Fallback FAQs if backend is offline
        setFaqs([
          { id: 1, question: "What is SSJewellery?", answer: "SSJewellery is a premium luxury jewellery e-commerce brand specializing in handcrafted rings, necklaces, earrings, bracelets, and bridal collections." },
          { id: 2, question: "How do I track my order?", answer: "Go to the 'My Orders' tab in the navbar. You will see the delivery status, purchase details, and estimated delivery dates for all your orders." },
          { id: 3, question: "What is the OTP verification during checkout?", answer: "To secure your transaction, we send a 6-digit OTP code to your registered email. Enter this OTP during checkout to complete your order." }
        ]);
      } finally {
        setLoadingFaqs(false);
      }
    };
    fetchFaqs();
  }, []);

  const handleFaqToggle = (id) => {
    setActiveFaq(prev => (prev === id ? null : id));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg(t('support_page.form_validation'));
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post(`${API_BASE_URL}/support`, {
        name,
        email,
        message
      });
      setSuccessMsg(response.data.message);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || t('support_page.send_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 min-h-screen pb-16 font-sans">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-400 border border-white/10 mb-3">
            <HelpCircle className="h-3.5 w-3.5" />
            {t('support_page.support_center')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t('support_page.help_title')}</h1>
          <p className="text-slate-350 text-sm mt-2 max-w-lg mx-auto">
            {t('support_page.help_subtitle')}
          </p>

          {user && (
            <div className="mt-6">
              <Link
                to="/support-center"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                {t('support_page.go_ticket')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Support content */}
      <div className="max-w-[97%] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* FAQ Accordion Side */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              <span>{t('support_page.faq_title')}</span>
            </h2>

            {loadingFaqs && (
              <div className="space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-14 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-xl" />
                ))}
              </div>
            )}

            {!loadingFaqs && faqs.map((faq) => {
              const isOpen = activeFaq === faq.id;
              const qKey = `support_page.faqs.faq_${faq.id}.question`;
              const aKey = `support_page.faqs.faq_${faq.id}.answer`;
              const translatedQ = t(qKey);
              const translatedA = t(aKey);
              const questionText = translatedQ !== qKey ? translatedQ : faq.question;
              const answerText = translatedA !== aKey ? translatedA : faq.answer;

              return (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => handleFaqToggle(faq.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-sm sm:text-base hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                  >
                    <span>{questionText}</span>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-emerald-500" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-655 dark:text-slate-350 border-t border-slate-100 dark:border-slate-850 pt-3 leading-relaxed">
                      {answerText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Form Side */}
          <div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-1.5 flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-500" />
                <span>{t('support_page.send_ticket')}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                {t('support_page.send_ticket_desc')}
              </p>

              {successMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-650 dark:text-emerald-400 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 mb-4">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-650 dark:text-red-400 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 mb-4">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('support_page.your_name')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('support_page.email_address')}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('support_page.message_desc')}</label>
                  <textarea
                    rows="5"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder={t('support_page.message_placeholder')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-base font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  <Send className="h-5 w-5" />
                  <span>{submitting ? t('support_page.sending') : t('support_page.send_btn')}</span>
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
