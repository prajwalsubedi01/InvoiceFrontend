import axios from 'axios';

function normalizeApiBaseUrl(rawUrl) {
  const fallback = 'https://invoicebackend-myk5.onrender.com/api';
  const input = (rawUrl || '').trim();
  if (!input) return fallback;

  const cleaned = input.replace(/\/+$/, '');
  if (/\/api$/i.test(cleaned)) return cleaned;
  return `${cleaned}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_URL||'https://invoicebackend-myk5.onrender.com/api');
const API_CANDIDATES = Array.from(new Set([
  API_BASE_URL,
  'https://invoicebackend-myk5.onrender.com/api',
  'http://127.0.0.1:3001/api'
]));
let currentApiBaseUrl = API_CANDIDATES[0];

console.log(`API Base URL: ${currentApiBaseUrl}`);

const api = axios.create({
  baseURL: currentApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for large PDF processing
});

const HEALTH_TIMEOUT_MS = 5000;

const describeNetworkError = (error) => {
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Please check backend responsiveness and try again.';
  }

  if (error?.message === 'Network Error') {
    return `Cannot reach backend at ${currentApiBaseUrl}. Make sure backend server is running.`;
  }

  return error?.response?.data?.message || error?.message || 'Request failed';
};

const isNetworkError = (error) =>
  error?.message === 'Network Error' || error?.code === 'ERR_NETWORK';

const rotateApiBaseUrl = () => {
  const currentIndex = API_CANDIDATES.indexOf(currentApiBaseUrl);
  const nextIndex = (currentIndex + 1) % API_CANDIDATES.length;
  currentApiBaseUrl = API_CANDIDATES[nextIndex];
  api.defaults.baseURL = currentApiBaseUrl;
  console.warn(`Switched API base URL to ${currentApiBaseUrl}`);
};

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
  async (error) => {
    if (isNetworkError(error) && error.config && !error.config.__retried_with_fallback) {
      error.config.__retried_with_fallback = true;
      rotateApiBaseUrl();
      return api.request(error.config);
    }

    const message = describeNetworkError(error);
    console.error('API Error:', message, error.response?.data || '');
    return Promise.reject(error);
  }
);

export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health', { timeout: HEALTH_TIMEOUT_MS });
    return response.data;
  } catch (error) {
    throw new Error(describeNetworkError(error));
  }
};

// Invoice Processing APIs
export const processInvoice = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('invoice', file);
  
  let response;
  try {
    response = await api.post('/process-invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  } catch (error) {
    throw new Error(describeNetworkError(error));
  }
  
  return response.data;
};

export const processInvoicesBatch = async (files, onUploadProgress) => {
  return processInvoicesHybrid(files, {
    parallel: 5,
    useCache: true,
    supplierTemplates: true
  }, onUploadProgress);
};

export const processInvoicesHybrid = async (files, options = {}, onUploadProgress) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('invoices', file);
  });

  formData.append('parallel', String(options.parallel ?? 5));
  formData.append('useCache', String(options.useCache ?? true));
  formData.append('supplierTemplates', String(options.supplierTemplates ?? true));
  if (options.targetSheet) formData.append('targetSheet', options.targetSheet);
  
  let response;
  try {
    response = await api.post('/process-invoices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  } catch (error) {
    throw new Error(describeNetworkError(error));
  }
  
  return response.data;
};

export const addLearningCorrection = async (payload) => {
  const response = await api.post('/learning/correct', payload);
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

// Master Upload APIs
export const uploadSupplierMaster = async (file, sheetName) => {
  const formData = new FormData();
  formData.append('file', file);
  if (sheetName) formData.append('sheetName', sheetName);

  const response = await api.post('/mappings/suppliers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const uploadExpenseMaster = async (file, sheetName) => {
  const formData = new FormData();
  formData.append('file', file);
  if (sheetName) formData.append('sheetName', sheetName);

  const response = await api.post('/mappings/expenses/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Admin APIs
export const listSuppliers = async () => {
  const response = await api.get('/suppliers');
  return response.data;
};

export const listExpenseAccounts = async () => {
  const response = await api.get('/expense-accounts');
  return response.data;
};

export const updateSupplier = async (id, payload) => {
  const response = await api.put(`/suppliers/${id}`, payload);
  return response.data;
};

export const createSupplier = async (payload) => {
  const response = await api.post('/suppliers', payload);
  return response.data;
};

export const deleteSupplier = async (id) => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data;
};

export const updateExpenseAccount = async (id, payload) => {
  const response = await api.put(`/expense-accounts/${id}`, payload);
  return response.data;
};

export const createExpenseAccount = async (payload) => {
  const response = await api.post('/expense-accounts', payload);
  return response.data;
};

export const deleteExpenseAccount = async (id) => {
  const response = await api.delete(`/expense-accounts/${id}`);
  return response.data;
};

export const listSupplierUploads = async () => {
  const response = await api.get('/mappings/suppliers/uploads');
  return response.data;
};

export const listExpenseUploads = async () => {
  const response = await api.get('/mappings/expenses/uploads');
  return response.data;
};

export const listInvoices = async () => {
  const response = await api.get('/invoices');
  return response.data;
};

export const getInvoiceDetails = async (id) => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const updateInvoiceCorrections = async (id, payload) => {
  const response = await api.put(`/invoices/${id}/corrections`, payload);
  return response.data;
};

export const remapInvoice = async (id) => {
  const response = await api.post(`/invoices/${id}/remap`);
  return response.data;
};

export const createExport = async (invoiceIds, options = {}) => {
  const response = await api.post('/export', { invoiceIds, options });
  return response.data;
};

export const listExports = async () => {
  const response = await api.get('/exports');
  return response.data;
};

export const downloadExport = async (exportId) => {
  const response = await api.get(`/export/${exportId}/download`, { responseType: 'blob' });
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

export const getJobStatus = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}`);
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
  return checkBackendHealth();
};

export default api;
