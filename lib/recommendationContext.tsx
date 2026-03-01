'use client';

import React, { createContext, useState, useCallback } from 'react';

interface RecommendationContextType {
  refreshCount: number;
  triggerRefresh: () => void;
}

export const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

export const RecommendationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  return (
    <RecommendationContext.Provider value={{ refreshCount, triggerRefresh }}>
      {children}
    </RecommendationContext.Provider>
  );
};

export const useRecommendationRefresh = () => {
  const context = React.useContext(RecommendationContext);
  if (!context) {
    throw new Error('useRecommendationRefresh must be used within RecommendationProvider');
  }
  return context;
};
