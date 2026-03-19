import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  uploadSupplierMaster, 
  uploadExpenseMaster,
  listSuppliers,
  listExpenseAccounts,
  updateSupplier,
  deleteSupplier,
  updateExpenseAccount,
  deleteExpenseAccount,
  createSupplier,
  createExpenseAccount,
  listSupplierUploads,
  listExpenseUploads
} from '../services/api';
import { Upload, FileSpreadsheet } from 'lucide-react';

const MasterUploadPage = () => {
  const [supplierFile, setSupplierFile] = useState(null);
  const [expenseFile, setExpenseFile] = useState(null);
  const [supplierSheet, setSupplierSheet] = useState('');
  const [expenseSheet, setExpenseSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [supplierUploads, setSupplierUploads] = useState([]);
  const [expenseUploads, setExpenseUploads] = useState([]);
  const [newSupplier, setNewSupplier] = useState({ code: '', name: '' });
  const [newExpense, setNewExpense] = useState({ code: '', name: '' });
  const [selectedSupplierUpload, setSelectedSupplierUpload] = useState(null);
  const [selectedExpenseUpload, setSelectedExpenseUpload] = useState(null);

  const loadMasters = async () => {
    try {
      const [supRes, expRes, supUp, expUp] = await Promise.all([
        listSuppliers(),
        listExpenseAccounts(),
        listSupplierUploads(),
        listExpenseUploads()
      ]);
      setSuppliers(supRes.data || []);
      setExpenses(expRes.data || []);
      setSupplierUploads(supUp.data || []);
      setExpenseUploads(expUp.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load master data');
    }
  };

  React.useEffect(() => {
    loadMasters();
  }, []);

  const handleUpload = async (type) => {
    try {
      setLoading(true);
      if (type === 'supplier') {
        if (!supplierFile) return toast.error('Please select supplier Excel file');
        const res = await uploadSupplierMaster(supplierFile, supplierSheet);
        setResult({ type, ...res.data });
        toast.success('Supplier master uploaded');
        await loadMasters();
      } else {
        if (!expenseFile) return toast.error('Please select expense Excel file');
        const res = await uploadExpenseMaster(expenseFile, expenseSheet);
        setResult({ type, ...res.data });
        toast.success('Expense master uploaded');
        await loadMasters();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Excel Uploads</h1>
        <p className="text-gray-600 mt-1">Upload supplier and expense/account master files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold">Supplier Master</h2>
          </div>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setSupplierFile(e.target.files?.[0] || null)}
            className="input"
          />
          <input
            type="text"
            className="input"
            placeholder="Sheet name (optional)"
            value={supplierSheet}
            onChange={(e) => setSupplierSheet(e.target.value)}
          />
          <button
            onClick={() => handleUpload('supplier')}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Supplier Master
          </button>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold">Expense/Account Master</h2>
          </div>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setExpenseFile(e.target.files?.[0] || null)}
            className="input"
          />
          <input
            type="text"
            className="input"
            placeholder="Sheet name (optional)"
            value={expenseSheet}
            onChange={(e) => setExpenseSheet(e.target.value)}
          />
          <button
            onClick={() => handleUpload('expense')}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Expense Master
          </button>
        </div>
      </div>

      {result && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900">Latest Upload Result</h3>
          <p className="text-gray-600 mt-1">Type: {result.type}</p>
          <p className="text-gray-600">Rows processed: {result.rowCount}</p>
          {result.errors?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-red-600">Errors:</p>
              <ul className="text-sm text-red-600 list-disc pl-5">
                {result.errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>{err.error} ({err.supplierCode || err.accountCode})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Supplier Master List</h3>
          </div>
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="input"
                placeholder="Supplier Code"
                value={newSupplier.code}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, code: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Supplier Name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
              />
              <button
                className="btn-primary"
                onClick={async () => {
                  if (!newSupplier.code || !newSupplier.name) {
                    return toast.error('Supplier code and name required');
                  }
                  await createSupplier({ supplierCode: newSupplier.code, supplierName: newSupplier.name });
                  setNewSupplier({ code: '', name: '' });
                  await loadMasters();
                  toast.success('Supplier added');
                }}
              >
                Add Supplier
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th className="w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">No suppliers</td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s._id}>
                      <td>
                        {editingSupplierId === s._id ? (
                          <input
                            className="input py-1 px-2 text-sm w-28"
                            value={s.supplierCode || ''}
                            onChange={(e) => setSuppliers(prev => prev.map(x => x._id === s._id ? { ...x, supplierCode: e.target.value } : x))}
                          />
                        ) : (
                          <span className="font-medium">{s.supplierCode}</span>
                        )}
                      </td>
                      <td>
                        {editingSupplierId === s._id ? (
                          <input
                            className="input py-1 px-2 text-sm"
                            value={s.supplierName || ''}
                            onChange={(e) => setSuppliers(prev => prev.map(x => x._id === s._id ? { ...x, supplierName: e.target.value } : x))}
                          />
                        ) : (
                          s.supplierName
                        )}
                      </td>
                      <td>
                        {editingSupplierId === s._id ? (
                          <select
                            className="input py-1 px-2 text-sm"
                            value={s.status || 'active'}
                            onChange={(e) => setSuppliers(prev => prev.map(x => x._id === s._id ? { ...x, status: e.target.value } : x))}
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        ) : (
                          s.status
                        )}
                      </td>
                      <td className="flex items-center gap-2">
                        {editingSupplierId === s._id ? (
                          <>
                            <button
                              className="btn-primary"
                              onClick={async () => {
                                await updateSupplier(s._id, {
                                  supplierCode: s.supplierCode,
                                  supplierName: s.supplierName,
                                  status: s.status
                                });
                                setEditingSupplierId(null);
                                toast.success('Supplier updated');
                              }}
                            >
                              Save
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => setEditingSupplierId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-secondary"
                              onClick={() => setEditingSupplierId(s._id)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-danger"
                              onClick={async () => {
                                await deleteSupplier(s._id);
                                await loadMasters();
                                toast.success('Supplier deleted');
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Expense/Account Master List</h3>
          </div>
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="input"
                placeholder="Account Code"
                value={newExpense.code}
                onChange={(e) => setNewExpense(prev => ({ ...prev, code: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Account Name"
                value={newExpense.name}
                onChange={(e) => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
              />
              <button
                className="btn-primary"
                onClick={async () => {
                  if (!newExpense.code || !newExpense.name) {
                    return toast.error('Account code and name required');
                  }
                  await createExpenseAccount({ accountCode: newExpense.code, accountName: newExpense.name });
                  setNewExpense({ code: '', name: '' });
                  await loadMasters();
                  toast.success('Expense account added');
                }}
              >
                Add Account
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th className="w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">No expense accounts</td>
                  </tr>
                ) : (
                  expenses.map((acc) => (
                    <tr key={acc._id}>
                      <td>
                        {editingExpenseId === acc._id ? (
                          <input
                            className="input py-1 px-2 text-sm w-28"
                            value={acc.accountCode || ''}
                            onChange={(e) => setExpenses(prev => prev.map(x => x._id === acc._id ? { ...x, accountCode: e.target.value } : x))}
                          />
                        ) : (
                          <span className="font-medium">{acc.accountCode}</span>
                        )}
                      </td>
                      <td>
                        {editingExpenseId === acc._id ? (
                          <input
                            className="input py-1 px-2 text-sm"
                            value={acc.accountName || ''}
                            onChange={(e) => setExpenses(prev => prev.map(x => x._id === acc._id ? { ...x, accountName: e.target.value } : x))}
                          />
                        ) : (
                          acc.accountName
                        )}
                      </td>
                      <td>
                        {editingExpenseId === acc._id ? (
                          <select
                            className="input py-1 px-2 text-sm"
                            value={acc.status || 'active'}
                            onChange={(e) => setExpenses(prev => prev.map(x => x._id === acc._id ? { ...x, status: e.target.value } : x))}
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        ) : (
                          acc.status
                        )}
                      </td>
                      <td className="flex items-center gap-2">
                        {editingExpenseId === acc._id ? (
                          <>
                            <button
                              className="btn-primary"
                              onClick={async () => {
                                await updateExpenseAccount(acc._id, {
                                  accountCode: acc.accountCode,
                                  accountName: acc.accountName,
                                  status: acc.status
                                });
                                setEditingExpenseId(null);
                                toast.success('Expense account updated');
                              }}
                            >
                              Save
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => setEditingExpenseId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-secondary"
                              onClick={() => setEditingExpenseId(acc._id)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-danger"
                              onClick={async () => {
                                await deleteExpenseAccount(acc._id);
                                await loadMasters();
                                toast.success('Expense account deleted');
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Supplier Upload History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rows</th>
                  <th>Status</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {supplierUploads.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">No uploads</td>
                  </tr>
                ) : (
                  supplierUploads.map(u => (
                    <tr key={u._id} className="cursor-pointer" onClick={() => setSelectedSupplierUpload(u)}>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
                      <td>{u.rowCount || 0}</td>
                      <td>{u.status}</td>
                      <td>{u.validationErrors?.length || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {selectedSupplierUpload && (
            <div className="p-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Preview Sample</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
{JSON.stringify(selectedSupplierUpload.previewSample || [], null, 2)}
              </pre>
              {selectedSupplierUpload.validationErrors?.length > 0 && (
                <>
                  <h4 className="font-semibold text-red-700 mt-3 mb-2">Errors</h4>
                  <pre className="text-xs bg-red-50 p-3 rounded-lg overflow-x-auto">
{JSON.stringify(selectedSupplierUpload.validationErrors || [], null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Expense Upload History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rows</th>
                  <th>Status</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {expenseUploads.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">No uploads</td>
                  </tr>
                ) : (
                  expenseUploads.map(u => (
                    <tr key={u._id} className="cursor-pointer" onClick={() => setSelectedExpenseUpload(u)}>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
                      <td>{u.rowCount || 0}</td>
                      <td>{u.status}</td>
                      <td>{u.validationErrors?.length || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {selectedExpenseUpload && (
            <div className="p-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Preview Sample</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
{JSON.stringify(selectedExpenseUpload.previewSample || [], null, 2)}
              </pre>
              {selectedExpenseUpload.validationErrors?.length > 0 && (
                <>
                  <h4 className="font-semibold text-red-700 mt-3 mb-2">Errors</h4>
                  <pre className="text-xs bg-red-50 p-3 rounded-lg overflow-x-auto">
{JSON.stringify(selectedExpenseUpload.validationErrors || [], null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterUploadPage;
