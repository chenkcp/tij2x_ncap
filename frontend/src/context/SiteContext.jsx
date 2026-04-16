import { createContext, useContext, useEffect, useState } from 'react';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [selectedSite, setSelectedSite] = useState(
    localStorage.getItem('selectedSite') || 'CJASite_1'
  );

  useEffect(() => {
    localStorage.setItem('selectedSite', selectedSite);
  }, [selectedSite]);

  return (
    <SiteContext.Provider value={{ selectedSite, setSelectedSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used inside SiteProvider');
  }
  return context;
}