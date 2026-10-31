import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  selectedTurbineId: string | null;
  setSelectedTurbineId: (id: string | null) => void;
  isAutoPollingActive: boolean;
  toggleAutoPolling: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTurbineId, setSelectedTurbineId] = useState<string | null>(null);
  const [isAutoPollingActive, setIsAutoPollingActive] = useState<boolean>(true);

  const toggleAutoPolling = () => {
    setIsAutoPollingActive((prev) => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        selectedTurbineId,
        setSelectedTurbineId,
        isAutoPollingActive,
        toggleAutoPolling,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppState => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp AppProvider kapsamında kullanılmalıdır');
  }
  return context;
};

