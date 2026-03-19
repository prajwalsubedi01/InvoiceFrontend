import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  Search,
  Building2,
  Tag,
  Loader2
} from 'lucide-react';
import { 
  getMappingRules, 
  updateMappingRules,
  addSupplierMapping,
  addAccountMapping,
  getAccountCodes
} from '../services/api';

const MappingPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [supplierMappings, setSupplierMappings] = useState({});
  const [accountMappings, setAccountMappings] = useState({});
  const [defaultValues, setDefaultValues] = useState({});
  const [accountCodes, setAccountCodes] = useState([]);
  
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCode, setNewSupplierCode] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newAccountCode, setNewAccountCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesResult, codesResult] = await Promise.all([
        getMappingRules(),
        getAccountCodes()
      ]);
      
      setSupplierMappings(rulesResult.data.supplierMappings || {});
      setAccountMappings(rulesResult.data.accountMappings || {});
      setDefaultValues(rulesResult.data.defaultValues || {});
      setAccountCodes(codesResult.data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load mapping rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMappingRules({
        supplierMappings,
        accountMappings,
        defaultValues
      });
      toast.success('Mapping rules saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save mapping rules');
    } finally {
      setSaving(false);
    }
  };

  const addSupplier = async () => {
    if (!newSupplierName || !newSupplierCode) {
      toast.error('Please enter both supplier name and code');
      return;
    }

    if (supplierMappings[newSupplierName]) {
      toast.error('Supplier already exists in mappings');
      return;
    }
    
    try {
      await addSupplierMapping(newSupplierName, newSupplierCode);
      setSupplierMappings(prev => ({
        ...prev,
        [newSupplierName]: newSupplierCode
      }));
      setNewSupplierName('');
      setNewSupplierCode('');
      toast.success('Supplier mapping added');
    } catch (error) {
      toast.error('Failed to add supplier mapping');
    }
  };

  const removeSupplier = (name) => {
    setSupplierMappings(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const addAccount = async () => {
    if (!newKeyword || !newAccountCode) {
      toast.error('Please enter both keyword and account code');
      return;
    }

    if (accountMappings[newKeyword]) {
      toast.error('Keyword already exists in mappings');
      return;
    }
    
    try {
      await addAccountMapping(newKeyword, newAccountCode);
      setAccountMappings(prev => ({
        ...prev,
        [newKeyword]: newAccountCode
      }));
      setNewKeyword('');
      setNewAccountCode('');
      toast.success('Account mapping added');
    } catch (error) {
      toast.error('Failed to add account mapping');
    }
  };

  const removeAccount = (keyword) => {
    setAccountMappings(prev => {
      const updated = { ...prev };
      delete updated[keyword];
      return updated;
    });
  };

  const filteredSuppliers = Object.entries(supplierMappings).filter(
    ([name, code]) => 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAccounts = Object.entries(accountMappings).filter(
    ([keyword, code]) => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapping Rules</h1>
          <p className="text-gray-600 mt-1">
            Configure supplier and account code mappings for automatic assignment
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'suppliers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Supplier Mappings
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {Object.keys(supplierMappings).length}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'accounts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Account Mappings
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {Object.keys(accountMappings).length}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Supplier Mappings Tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Add new supplier */}
          <div className="card p-4">
            <h3 className="font-medium text-gray-900 mb-3">Add New Supplier Mapping</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Supplier Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., ABC Company Sdn Bhd"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Supplier Code</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., 300-ABC01"
                  value={newSupplierCode}
                  onChange={(e) => setNewSupplierCode(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addSupplier}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Mapping
                </button>
              </div>
            </div>
          </div>

          {/* Supplier list */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Supplier Code</th>
                    <th className="w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No matching suppliers found' : 'No supplier mappings defined'}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(([name, code]) => (
                      <tr key={name}>
                        <td className="font-medium">{name}</td>
                        <td>
                          <input
                            type="text"
                            className="input py-1 px-2 text-sm w-32"
                            value={code}
                            onChange={(e) => {
                              setSupplierMappings(prev => ({
                                ...prev,
                                [name]: e.target.value
                              }));
                            }}
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => removeSupplier(name)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Account Mappings Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Add new account mapping */}
          <div className="card p-4">
            <h3 className="font-medium text-gray-900 mb-3">Add New Account Mapping</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Keyword</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., rent, electricity"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Account Code</label>
                <select
                  className="input"
                  value={newAccountCode}
                  onChange={(e) => setNewAccountCode(e.target.value)}
                >
                  <option value="">Select account code</option>
                  {accountCodes.map((acc) => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={addAccount}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Mapping
                </button>
              </div>
            </div>
          </div>

          {/* Account list */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Account Code</th>
                    <th>Account Description</th>
                    <th className="w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No matching accounts found' : 'No account mappings defined'}
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map(([keyword, code]) => {
                      const account = accountCodes.find(a => a.code === code);
                      return (
                        <tr key={keyword}>
                          <td className="font-medium">{keyword}</td>
                          <td>
                            <select
                              className="input py-1 px-2 text-sm w-40"
                              value={code}
                              onChange={(e) => {
                                setAccountMappings(prev => ({
                                  ...prev,
                                  [keyword]: e.target.value
                                }));
                              }}
                            >
                              {accountCodes.map((acc) => (
                                <option key={acc.code} value={acc.code}>
                                  {acc.code}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="text-gray-600">
                            {account?.description || 'Unknown'}
                          </td>
                          <td>
                            <button
                              onClick={() => removeAccount(keyword)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* Default Values Section */}
      <div className="card p-4">
        <h3 className="font-medium text-gray-900 mb-4">Default Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Default Supplier Code</label>
            <input
              type="text"
              className="input"
              value={defaultValues.supplierCode || ''}
              onChange={(e) => setDefaultValues(prev => ({ ...prev, supplierCode: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Default Account Code</label>
            <select
              className="input"
              value={defaultValues.accountCode || ''}
              onChange={(e) => setDefaultValues(prev => ({ ...prev, accountCode: e.target.value }))}
            >
              <option value="">Select default account</option>
              {accountCodes.map((acc) => (
                <option key={acc.code} value={acc.code}>
                  {acc.code} - {acc.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Default Terms</label>
            <input
              type="text"
              className="input"
              value={defaultValues.terms || ''}
              onChange={(e) => setDefaultValues(prev => ({ ...prev, terms: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">How Mapping Works</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Supplier Mappings:</strong> When an invoice is processed, the system tries to match 
            the supplier name against these mappings. If a match is found, the corresponding supplier code 
            is automatically assigned.
          </p>
          <p>
            <strong>Account Mappings:</strong> For each line item, the system checks if the description 
            contains any of these keywords. If found, the corresponding account code is assigned to that line.
          </p>
          <p>
            <strong>Default Values:</strong> These are used when no matching mapping is found during processing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MappingPage;
