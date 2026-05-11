import { createContext, useContext, useEffect, useState } from 'react';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [selectedSite, setSelectedSite] = useState(
    localStorage.getItem('selectedSite') || 'CJASite_1'
  );

  // Store CPM station data for products (for use across pages)
  const [productCpmData, setProductCpmData] = useState(() => {
    const stored = localStorage.getItem('productCpmData');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem('selectedSite', selectedSite);
  }, [selectedSite]);

  useEffect(() => {
    localStorage.setItem('productCpmData', JSON.stringify(productCpmData));
  }, [productCpmData]);

  // Function to save CPM stations for a product
  const saveCpmStations = (productNumber, cpmStations) => {
    setProductCpmData(prev => ({
      ...prev,
      [productNumber]: {
        cpmStations,
        updatedAt: new Date().toISOString()
      }
    }));
  };

  // Function to get CPM stations for a product
  const getCpmStations = (productNumber) => {
    return productCpmData[productNumber]?.cpmStations || [];
  };

  return (
    <SiteContext.Provider value={{ 
      selectedSite, 
      setSelectedSite,
      productCpmData,
      saveCpmStations,
      getCpmStations
    }}>
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