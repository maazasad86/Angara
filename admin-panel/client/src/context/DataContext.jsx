import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  const fetchAllData = async () => {
    setIsDataLoading(true);
    try {
      const baseUrl = `http://${window.location.hostname || 'localhost'}:5000`;
      const [itemsRes, catsRes, dealsRes] = await Promise.all([
        axios.get(`${baseUrl}/api/items`),
        axios.get(`${baseUrl}/api/categories`),
        axios.get(`${baseUrl}/api/deals`)
      ]);
      
      setItems(itemsRes.data);
      setCategories(catsRes.data);
      setDeals(dealsRes.data);
      setDataError(null);
    } catch (err) {
      console.error('Error fetching global data:', err);
      setDataError(err.message);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <DataContext.Provider value={{
      items, setItems,
      categories, setCategories,
      deals, setDeals,
      isDataLoading,
      dataError,
      refreshData: fetchAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};
