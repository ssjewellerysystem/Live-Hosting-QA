import React, { useState } from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { useHighDemand } from '../../context/HighDemandContext';
import { HighDemandModal } from './HighDemandModal';

export const HighDemandButton = () => {
  const { isHighDemandMode, toggleHighDemandMode, toggling } = useHighDemand();
  const [modalOpen, setModalOpen] = useState(false);

  const handleConfirmToggle = async () => {
    const nextState = !isHighDemandMode;
    const result = await toggleHighDemandMode(nextState);
    if (result.success) {
      setModalOpen(false);
    } else {
      alert(result.message || "Failed to update high demand mode.");
    }
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        disabled={toggling}
        title={isHighDemandMode ? "Click to Disable High Demand Mode" : "Click to Enable High Demand Mode"}
        className={`px-4 py-2 rounded-[12px] text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-sm active:scale-95 ${
          isHighDemandMode
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white'
        }`}
      >
        {isHighDemandMode ? (
          <Flame className="h-4 w-4 animate-pulse shrink-0" />
        ) : (
          <TrendingUp className="h-4 w-4 shrink-0" />
        )}
        <span>{isHighDemandMode ? 'High Demand ON' : 'High Demand OFF'}</span>
      </button>

      {/* Confirmation Modal */}
      <HighDemandModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isCurrentlyOn={isHighDemandMode}
        onConfirm={handleConfirmToggle}
        loading={toggling}
      />
    </>
  );
};
