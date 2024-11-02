import React, { createContext, useContext } from 'react';

type CardContextType = {
  size: 'sm' | 'md' | 'lg';
};

const CardContext = createContext<CardContextType | undefined>(undefined);

export function CardProvider({
  value,
  children,
}: {
  value: CardContextType;
  children: React.ReactNode;
}) {
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export function useCardContext() {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCardContext must be used within a CardProvider');
  }
  return context;
}
