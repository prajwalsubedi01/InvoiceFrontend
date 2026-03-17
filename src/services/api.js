import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://invoicebackend-myk5.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout for OCR processing
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Invoice Processing APIs
export const processInvoice = async (file) => {
  const formData = new FormData();
  formData.append('invoice', file);
  
  const response = await api.post('/process-invoice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const processInvoicesBatch = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('invoices', file);
  });
  
  const response = await api.post('/process-invoices-batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Excel Generation APIs
export const generateExcel = async (invoices, options = {}) => {
  const response = await api.post('/generate-excel', 
    { invoices, options },
    {
      responseType: 'blob',
    }
  );
  
  // Create download link
  const blob = new Blob([response.data], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `SQL_Accounting_Import_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return true;
};

export const previewExcel = async (invoices) => {
  const response = await api.post('/preview-excel', { invoices });
  return response.data;
};

// Mapping Rules APIs
export const getMappingRules = async () => {
  const response = await api.get('/mapping-rules');
  return response.data;
};

export const updateMappingRules = async (rules) => {
  const response = await api.post('/mapping-rules', rules);
  return response.data;
};

export const addSupplierMapping = async (supplierName, supplierCode) => {
  const response = await api.post('/mapping-rules/supplier', {
    supplierName,
    supplierCode,
  });
  return response.data;
};

export const addAccountMapping = async (keyword, accountCode) => {
  const response = await api.post('/mapping-rules/account', {
    keyword,
    accountCode,
  });
  return response.data;
};

// Reference Data APIs
export const getAccountCodes = async () => {
  const response = await api.get('/account-codes');
  return response.data;
};

export const getSupplierCodes = async () => {
  const response = await api.get('/supplier-codes');
  return response.data;
};

// Health Check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
