import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listInvoices } from '../services/api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const InvoiceListPage = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-1">Review extracted invoices and corrections</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th className="w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No invoices yet</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className="font-medium">{inv.invoiceNumber || '-'}</td>
                    <td>{inv.supplierNameRaw || '-'}</td>
                    <td>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                    <td>{inv.totalAmount?.toFixed(2)}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs ${inv.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <Link className="text-blue-600 hover:underline" to={`/invoices/${inv._id}`}>View</Link>
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

export default InvoiceListPage;
