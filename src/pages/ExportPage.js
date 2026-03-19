import React, { useEffect, useState } from 'react';
import { createExport, downloadExport, listInvoices } from '../services/api';
import { Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const ExportPage = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState({});
  const [targetSheet, setTargetSheet] = useState('Sales & Purchase');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await listInvoices();
        setInvoices(res.data || []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = async () => {
    const invoiceIds = Object.keys(selected).filter(id => selected[id]);
    if (invoiceIds.length === 0) {
      return toast.error('Select at least one invoice');
    }
    setExporting(true);
    try {
      const res = await createExport(invoiceIds, { targetSheet });
      await downloadExport(res.data.exportId);
      toast.success('Export generated');
    } catch (error) {
      console.error(error);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export</h1>
          <p className="text-gray-600 mt-1">Generate SQL Accounting Excel exports</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary flex items-center gap-2"
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {exporting ? 'Exporting...' : 'Generate Export'}
        </button>
      </div>

      <div className="card p-4">
        <label className="label">Target Sheet</label>
        <select
          className="input"
          value={targetSheet}
          onChange={(e) => setTargetSheet(e.target.value)}
        >
          <option>Sales & Purchase</option>
          <option>ARAP_IV_DN_CN</option>
          <option>ARAP_Payment</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Invoice No</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No invoices</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!selected[inv._id]}
                        onChange={() => toggle(inv._id)}
                      />
                    </td>
                    <td className="font-medium">{inv.invoiceNumber || '-'}</td>
                    <td>{inv.supplierNameRaw || '-'}</td>
                    <td>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                    <td>{inv.totalAmount?.toFixed(2)}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs ${inv.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
