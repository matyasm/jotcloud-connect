
import React, { createContext, useContext } from 'react';
import { StoreContextType } from './types';

// Create context with default values
const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Custom hook to use the store context
export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export { StoreContext };
