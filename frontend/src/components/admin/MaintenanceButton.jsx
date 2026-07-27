import React, { useState } from 'react';
import { Wrench, ShieldAlert } from 'lucide-react';
import { useMaintenance } from '../../context/MaintenanceContext';
import { MaintenanceModal } from './MaintenanceModal';

export const MaintenanceButton = () => {
  const { isMaintenanceMode, toggleMaintenanceMode, toggling } = useMaintenance();
  const [modalOpen, setModalOpen] = useState(false);

  const handleConfirmToggle = async () => {
    const nextState = !isMaintenanceMode;
    const result = await toggleMaintenanceMode(nextState);
    if (result.success) {
      setModalOpen(false);
    } else {
      alert(result.message || "Failed to update maintenance mode.");
    }
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        disabled={toggling}
        title={isMaintenanceMode ? "Click to Disable Maintenance Mode" : "Click to Enable Maintenance Mode"}
        className={`px-4 py-2 rounded-[12px] text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-sm active:scale-95 ${
          isMaintenanceMode
            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 dark:bg-rose-600 dark:hover:bg-rose-700 dark:text-white'
            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-white'
        }`}
      >
        {isMaintenanceMode ? (
          <ShieldAlert className="h-4 w-4 animate-pulse shrink-0" />
        ) : (
          <Wrench className="h-4 w-4 shrink-0" />
        )}
        <span>{isMaintenanceMode ? 'Maintenance ON' : 'Maintenance OFF'}</span>
      </button>

      {/* Confirmation Modal */}
      <MaintenanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isCurrentlyOn={isMaintenanceMode}
        onConfirm={handleConfirmToggle}
        loading={toggling}
      />
    </>
  );
};
