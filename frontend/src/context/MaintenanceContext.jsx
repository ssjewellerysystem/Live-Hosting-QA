import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './AuthContext';
import { X } from 'lucide-react';

export const MaintenanceContext = createContext();

export const MaintenanceProvider = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("The website is temporarily under maintenance. Please try again later.");
  const [maintenanceData, setMaintenanceData] = useState({ enabled_by_admin: '', enabled_at: '' });
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Fetch current maintenance status from backend
  const checkMaintenanceStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/maintenance/status`);
      if (response.data && response.data.success) {
        setIsMaintenanceMode(!!response.data.maintenance_mode);
        if (response.data.maintenance_message) {
          setMaintenanceMessage(response.data.maintenance_message);
        }
        setMaintenanceData({
          enabled_by_admin: response.data.enabled_by_admin || '',
          enabled_at: response.data.enabled_at || ''
        });
      }
    } catch (err) {
      console.error("[MAINTENANCE] Error fetching status:", err);
    }
  }, []);

  // Initial load & Auto Refresh every 30 seconds
  useEffect(() => {
    checkMaintenanceStatus();
    const interval = setInterval(() => {
      checkMaintenanceStatus();
    }, 30000); // 30 seconds auto-refresh requirement

    return () => clearInterval(interval);
  }, [checkMaintenanceStatus]);

  // Global Axios Interceptor to catch HTTP 503 maintenance responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 503) {
          if (error.response.data && error.response.data.maintenance) {
            setIsMaintenanceMode(true);
            if (error.response.data.message) {
              setMaintenanceMessage(error.response.data.message);
            }
            setIsUserPopupOpen(true);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Admin function to toggle maintenance mode
  const toggleMaintenanceMode = async (enableMode, customMessage = "") => {
    setToggling(true);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/maintenance/toggle`,
        {
          maintenance_mode: enableMode,
          maintenance_message: customMessage || "The website is temporarily under maintenance. Please try again later."
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        setIsMaintenanceMode(response.data.maintenance_mode);
        setMaintenanceMessage(response.data.maintenance_message);
        setMaintenanceData({
          enabled_by_admin: response.data.enabled_by_admin,
          enabled_at: response.data.enabled_at
        });
        setToggling(false);
        return { success: true, message: response.data.message };
      } else {
        setToggling(false);
        return { success: false, message: response.data.message || "Failed to update maintenance mode." };
      }
    } catch (err) {
      setToggling(false);
      const msg = err.response?.data?.message || err.message || "Failed to toggle maintenance mode.";
      return { success: false, message: msg };
    }
  };

  const showMaintenancePopup = () => {
    setIsUserPopupOpen(true);
  };

  const closeMaintenancePopup = () => {
    setIsUserPopupOpen(false);
  };

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenanceMode,
        maintenanceMessage,
        maintenanceData,
        toggling,
        toggleMaintenanceMode,
        checkMaintenanceStatus,
        showMaintenancePopup,
        closeMaintenancePopup
      }}
    >
      {children}

      {/* Customer-Facing Website Under Maintenance Popup Modal */}
      {isUserPopupOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0B1220] border border-[#D4A75F]/30 rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.6)] transform transition-all animate-scale-up flex flex-col">
            
            {/* Header Close Icon */}
            <button
              onClick={closeMaintenancePopup}
              className="absolute top-3 right-3 z-20 text-white bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 rounded-full transition-colors cursor-pointer border border-white/20 shadow-md"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Full Maintenance Image Body */}
            <div className="relative w-full flex items-center justify-center bg-black overflow-hidden p-2">
              <img
                src="/maintenance_logo.jpg"
                alt="Website Maintenance"
                className="w-full h-auto max-h-[70vh] sm:max-h-[75vh] object-contain rounded-t-2xl block select-none no-zoom"
              />
            </div>

            {/* Bottom Action Button */}
            <div className="p-4 bg-[#0B1220] border-t border-slate-800/80 flex items-center justify-center">
              <button
                onClick={closeMaintenancePopup}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#D4A75F] to-[#BF934B] hover:from-[#BF934B] hover:to-[#A87E39] text-white font-bold rounded-2xl shadow-lg shadow-[#D4A75F]/20 active:scale-98 transition-all text-sm sm:text-base tracking-wide cursor-pointer text-center"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return context;
};
