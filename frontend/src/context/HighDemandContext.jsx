import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './AuthContext';

export const HighDemandContext = createContext();

export const HighDemandProvider = ({ children }) => {
  const [isHighDemandMode, setIsHighDemandMode] = useState(false);
  const [highDemandData, setHighDemandData] = useState({ enabled_by_admin: '', enabled_at: '' });
  const [toggling, setToggling] = useState(false);

  // Fetch current High Demand status from backend
  const checkHighDemandStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/high-demand/status`);
      if (response.data && response.data.success) {
        setIsHighDemandMode(!!response.data.high_demand_mode);
        setHighDemandData({
          enabled_by_admin: response.data.enabled_by_admin || '',
          enabled_at: response.data.enabled_at || ''
        });
      }
    } catch (err) {
      console.error("[HIGH_DEMAND] Error fetching status:", err);
    }
  }, []);

  // Initial load & Auto Refresh polling every 30 seconds
  useEffect(() => {
    checkHighDemandStatus();
    const interval = setInterval(() => {
      checkHighDemandStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkHighDemandStatus]);

  // Admin function to toggle High Demand mode
  const toggleHighDemandMode = async (enableMode) => {
    setToggling(true);
    try {
      const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/high-demand/toggle`,
        {
          high_demand_mode: enableMode
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        setIsHighDemandMode(response.data.high_demand_mode);
        setHighDemandData({
          enabled_by_admin: response.data.enabled_by_admin,
          enabled_at: response.data.enabled_at
        });
        setToggling(false);
        return { success: true, message: response.data.message };
      } else {
        setToggling(false);
        return { success: false, message: response.data.message || "Failed to update high demand mode." };
      }
    } catch (err) {
      setToggling(false);
      const msg = err.response?.data?.message || err.message || "Failed to toggle high demand mode.";
      return { success: false, message: msg };
    }
  };

  return (
    <HighDemandContext.Provider
      value={{
        isHighDemandMode,
        highDemandData,
        toggling,
        toggleHighDemandMode,
        checkHighDemandStatus
      }}
    >
      {children}
    </HighDemandContext.Provider>
  );
};

export const useHighDemand = () => {
  const context = useContext(HighDemandContext);
  if (!context) {
    throw new Error("useHighDemand must be used within a HighDemandProvider");
  }
  return context;
};
