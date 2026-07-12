import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { AuthContext } from '../context/AuthContext';

export const LiveChat = () => {
  const { language } = useContext(AuthContext);
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    if (window.innerWidth >= 640) return;
    if (e.target.closest('input') || e.target.closest('button') || e.target.closest('a')) return;

    const messagesEl = e.target.closest('.messages-area');
    if (messagesEl && messagesEl.scrollTop > 0) return;

    setIsDragging(true);
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragY > 80) {
      setIsOpen(false);
    }
    setDragY(0);
  };

  // Initialize welcome message when language or open state changes
  useEffect(() => {
    setMessages([
      {
        sender: 'bot',
        text: language === 'hi' 
          ? 'नमस्ते! SSJewellery में आपका स्वागत है। आज मैं आपकी क्या सहायता कर सकता हूँ?' 
          : 'Namaste! Welcome to SSJewellery. How can I assist you today?',
        time: new Date()
      }
    ]);
  }, [language]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { sender: 'user', text: inputText, time: new Date() };
    setMessages(prev => [...prev, userMessage]);
    const userQuery = inputText.toLowerCase();
    setInputText('');

    // Trigger bot reply with a slight timeout
    setTimeout(() => {
      let botResponse = "";

      if (language === 'hi') {
        botResponse = "मुझे खेद है, मुझे समझ नहीं आया। क्या आप कृपया दूसरे शब्दों में पूछ सकते हैं? आप 'डिलीवरी', 'रिफंड', 'कूपन', या 'एडमिन' के बारे में पूछ सकते हैं।";

        if (userQuery.includes('hi') || userQuery.includes('hello') || userQuery.includes('hey') || userQuery.includes('नमस्ते') || userQuery.includes('नमस्कार') || userQuery.includes('हेलो')) {
          botResponse = "नमस्ते! आशा है कि आपका खरीदारी का अनुभव शानदार रहेगा। आज आप क्या खरीदना चाह रहे हैं?";
        } else if (userQuery.includes('delivery') || userQuery.includes('ship') || userQuery.includes('track') || userQuery.includes('डिलीवरी') || userQuery.includes('ट्रैक') || userQuery.includes('भेज')) {
          botResponse = "पुष्टि होने के तुरंत बाद आपके आदेश भेज दिए जाते हैं। डिलीवरी में आमतौर पर 3 से 5 कार्य दिवस लगते हैं। आप 'मेरे आदेश' अनुभाग में प्रगति को ट्रैक कर सकते हैं!";
        } else if (userQuery.includes('refund') || userQuery.includes('return') || userQuery.includes('cancel') || userQuery.includes('वापसी') || userQuery.includes('रिफंड') || userQuery.includes('रद्द')) {
          botResponse = "हमारे पास एक आसान 7-दिन की परेशानी मुक्त वापसी नीति है! बस एक सहायता संदेश भेजें या अपनी आदेश आईडी के साथ support@SSJewellery.com पर मेल करें।";
        } else if (userQuery.includes('coupon') || userQuery.includes('discount') || userQuery.includes('promo') || userQuery.includes('कूपन') || userQuery.includes('छूट') || userQuery.includes('डिस्काउंट')) {
          botResponse = "अतिरिक्त छूट (केवल दृश्य) पाने के लिए चेकआउट पर 'JEWEL50' कोड का उपयोग करें! मौसमी सौदों के लिए हमारे बैनर देखें।";
        } else if (userQuery.includes('admin') || userQuery.includes('dashboard') || userQuery.includes('stats') || userQuery.includes('एडमिन') || userQuery.includes('डैशबोर्ड')) {
          botResponse = "आप प्रोफ़ाइल मेनू से एडमिन डैशबोर्ड तक पहुँच सकते हैं! उत्पाद जोड़ने या स्थिति अपडेट करने के लिए आईडी 'admin' और पासवर्ड 'admin123' के साथ लॉगिन करें।";
        } else if (userQuery.includes('thank') || userQuery.includes('thanks') || userQuery.includes('धन्यवाद') || userQuery.includes('शुक्रिया') || userQuery.includes('थैंक्स')) {
          botResponse = "आपका बहुत-बहुत स्वागत है! मुझे बताएं कि क्या मैं आपकी मदद के लिए कुछ और कर सकता हूं। हैप्पी शॉपिंग! 🛍️";
        }
      } else {
        botResponse = "I'm sorry, I didn't quite catch that. Could you please rephrase? You can ask about 'delivery', 'refund', 'coupons', or 'admin'.";

        if (userQuery.includes('hi') || userQuery.includes('hello') || userQuery.includes('hey')) {
          botResponse = "Hello! Hope you are having a wonderful shopping experience. What are you looking to buy today?";
        } else if (userQuery.includes('delivery') || userQuery.includes('ship') || userQuery.includes('track')) {
          botResponse = "Your orders are shipped immediately after confirmation. Delivery usually takes 3 to 5 business days. You can track progress in the 'My Orders' section!";
        } else if (userQuery.includes('refund') || userQuery.includes('return') || userQuery.includes('cancel')) {
          botResponse = "We have an easy 7-day hassle-free return policy! Just submit a support message or mail support@SSJewellery.com with your Order ID.";
        } else if (userQuery.includes('coupon') || userQuery.includes('discount') || userQuery.includes('promo')) {
          botResponse = "Use code 'JEWEL50' on checkout mockups to grab additional discounts (visual only)! Check out our featured slider banners for seasonal deals.";
        } else if (userQuery.includes('admin') || userQuery.includes('dashboard') || userQuery.includes('stats')) {
          botResponse = "You can access the Admin Dashboard from the profile menu! Login with ID 'admin' and Password 'admin123' to add products or update status.";
        } else if (userQuery.includes('thank') || userQuery.includes('thanks')) {
          botResponse = "You're very welcome! Let me know if there is anything else I can do to help you. Happy shopping! 🛍️";
        }
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse, time: new Date() }]);
    }, 800);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans flex flex-col items-end pointer-events-none">
      {/* Closed Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto flex items-center justify-center h-14 w-14 bg-[#3F1D5A] hover:bg-[#2f1543] text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-[#D4A75F] cursor-pointer"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateY(${dragY}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="pointer-events-auto w-[calc(100vw-32px)] sm:w-96 h-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
                    {/* Header */}
          <div className="bg-[#3F1D5A] flex flex-col text-white chat-header relative">
            {/* Drag Handle - Mobile only */}
            <div className="sm:hidden flex justify-center w-full pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-white/40 rounded-full" />
            </div>

            <div className="px-4 pb-3 pt-1.5 sm:py-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">SSJewellery Bot</h4>
                  <span className="text-[10px] text-purple-100 flex items-center">
                    <span className="h-1.5 w-1.5 bg-[#D4A75F] rounded-full inline-block mr-1 animate-pulse"></span>
                    {language === 'hi' ? 'सक्रिय सहायता सहायक' : 'Active support assistant'}
                  </span>
                </div>
              </div>
              
              {/* Close Button - Hidden on mobile devices, visible on desktop/tablet (>= 768px) */}
              <button
                onClick={() => setIsOpen(false)}
                className="hidden md:block text-white hover:text-purple-200 p-1 rounded-lg hover:bg-purple-800/50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Mobile Close Button - Visible only on mobile screens (< 768px) */}
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden absolute top-[14px] right-4 flex items-center justify-center w-8 h-8 rounded-full bg-[#2d1440] border border-white/10 shadow-md hover:bg-[#200e2e] transition-colors cursor-pointer text-white"
                title="Close Chat"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-grow p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950/40 space-y-3 messages-area">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender !== 'user' && (
                  <div className="bg-[#EFE7DB] dark:bg-slate-800 p-1.5 rounded-full mr-2 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-[#3F1D5A] dark:text-[#D4A75F]" />
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#3F1D5A] text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700/50'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[9px] text-slate-400 mt-1 block text-right">
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full ml-2 mt-0.5">
                    <User className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center bg-white dark:bg-slate-900">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={language === 'hi' ? 'कुछ भी पूछें...' : 'Ask anything...'}
              className="flex-grow px-3 py-2 text-sm bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A75F]/50 focus:border-[#D4A75F] text-slate-850 dark:text-slate-105"
            />
            <button
              type="submit"
              className="ml-2 p-2 bg-[#D4A75F] hover:bg-[#c39650] text-white rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
