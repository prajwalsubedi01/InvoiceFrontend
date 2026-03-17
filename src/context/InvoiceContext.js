import React, { createContext, useContext, useState, useCallback } from 'react';

const InvoiceContext = createContext();

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};

export const InvoiceProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [mappingRules, setMappingRules] = useState(null);

  const addInvoices = useCallback((newInvoices) => {
    setInvoices(prev => [...prev, ...newInvoices]);
  }, []);

  const updateInvoice = useCallback((id, updates) => {
    setInvoices(prev => 
      prev.map(inv => 
        inv.id === id ? { ...inv, ...updates } : inv
      )
    );
  }, []);

  const updateLineItem = useCallback((invoiceId, itemIndex, updates) => {
    setInvoices(prev => 
      prev.map(inv => {
        if (inv.id !== invoiceId) return inv;
        
        const updatedItems = [...(inv.extractedData?.lineItems || [])];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };
        
        return {
          ...inv,
          extractedData: {
            ...inv.extractedData,
            lineItems: updatedItems
          }
        };
      })
    );
  }, []);

  const removeInvoice = useCallback((id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }, []);

  const clearInvoices = useCallback(() => {
    setInvoices([]);
    setPreviewData(null);
  }, []);

  const setPreview = useCallback((data) => {
    setPreviewData(data);
  }, []);

  const updateMappingRules = useCallback((rules) => {
    setMappingRules(rules);
  }, []);

  const value = {
    invoices,
    processing,
    previewData,
    mappingRules,
    setProcessing,
    addInvoices,
    updateInvoice,
    updateLineItem,
    removeInvoice,
    clearInvoices,
    setPreview,
    updateMappingRules,
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};
