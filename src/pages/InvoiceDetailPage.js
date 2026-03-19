import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getInvoiceDetails, updateInvoiceCorrections, remapInvoice } from '../services/api';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInvoiceDetails(id);
        setInvoice(res.data.invoice);
        setLineItems(res.data.lineItems || []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const updateLineItem = (idx, field, value) => {
    setLineItems(prev => prev.map((li, i) => (i === idx ? { ...li, [field]: value } : li)));
  };

  const handleSave = async () => {
    if (!invoice) return;
    setSaving(true);
    try {
      await updateInvoiceCorrections(id, {
        invoiceUpdates: {
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          supplierNameRaw: invoice.supplierNameRaw,
          supplierCode: invoice.supplierCode,
          subtotal: Number(invoice.subtotal || 0),
          taxAmount: Number(invoice.taxAmount || 0),
          totalAmount: Number(invoice.totalAmount || 0),
          docType: invoice.docType,
          postDate: invoice.postDate,
          description: invoice.description,
          paymentMethod: invoice.paymentMethod,
          chequeNumber: invoice.chequeNumber,
          project: invoice.project,
          paymentProject: invoice.paymentProject,
          currencyRate: Number(invoice.currencyRate || 0),
          bankCharge: Number(invoice.bankCharge || 0),
          docAmount: Number(invoice.docAmount || 0),
          unappliedAmount: Number(invoice.unappliedAmount || 0),
          cancelled: invoice.cancelled,
          nonRefundable: invoice.nonRefundable,
          bouncedDate: invoice.bouncedDate,
          koDocNo: invoice.koDocNo,
          koAmount: Number(invoice.koAmount || 0)
        },
        lineItems: lineItems.map(li => ({
          _id: li._id,
          description: li.description,
          quantity: Number(li.quantity || 0),
          unitPrice: Number(li.unitPrice || 0),
          amount: Number(li.amount || 0),
          accountCode: li.accountCode,
          taxAmount: Number(li.taxAmount || 0)
        }))
      });
      toast.success('Corrections saved');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save corrections');
    } finally {
      setSaving(false);
    }
  };

  const handleRemap = async () => {
    try {
      await remapInvoice(id);
      const res = await getInvoiceDetails(id);
      setInvoice(res.data.invoice);
      setLineItems(res.data.lineItems || []);
      toast.success('Invoice remapped');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remap invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-gray-600">Invoice not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Detail</h1>
          <p className="text-gray-600 mt-1">Edit fields and line items</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRemap}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Remap
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save Corrections'}
          </button>
        </div>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Invoice Number</label>
          <input
            className="input"
            value={invoice.invoiceNumber || ''}
            onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Invoice Date</label>
          <input
            className="input"
            type="date"
            value={invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().slice(0,10) : ''}
            onChange={(e) => setInvoice({ ...invoice, invoiceDate: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Supplier Name</label>
          <input
            className="input"
            value={invoice.supplierNameRaw || ''}
            onChange={(e) => setInvoice({ ...invoice, supplierNameRaw: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Supplier Code</label>
          <input
            className="input"
            value={invoice.supplierCode || ''}
            onChange={(e) => setInvoice({ ...invoice, supplierCode: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Subtotal</label>
          <input
            className="input"
            type="number"
            value={invoice.subtotal || 0}
            onChange={(e) => setInvoice({ ...invoice, subtotal: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Tax Amount</label>
          <input
            className="input"
            type="number"
            value={invoice.taxAmount || 0}
            onChange={(e) => setInvoice({ ...invoice, taxAmount: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Total Amount</label>
          <input
            className="input"
            type="number"
            value={invoice.totalAmount || 0}
            onChange={(e) => setInvoice({ ...invoice, totalAmount: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Doc Type</label>
          <input
            className="input"
            value={invoice.docType || ''}
            onChange={(e) => setInvoice({ ...invoice, docType: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Post Date</label>
          <input
            className="input"
            type="date"
            value={invoice.postDate ? new Date(invoice.postDate).toISOString().slice(0,10) : ''}
            onChange={(e) => setInvoice({ ...invoice, postDate: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            value={invoice.description || ''}
            onChange={(e) => setInvoice({ ...invoice, description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Payment Method</label>
          <input
            className="input"
            value={invoice.paymentMethod || ''}
            onChange={(e) => setInvoice({ ...invoice, paymentMethod: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Cheque Number</label>
          <input
            className="input"
            value={invoice.chequeNumber || ''}
            onChange={(e) => setInvoice({ ...invoice, chequeNumber: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Doc Amount</label>
          <input
            className="input"
            type="number"
            value={invoice.docAmount || 0}
            onChange={(e) => setInvoice({ ...invoice, docAmount: e.target.value })}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
                <th>Account Code</th>
                <th>Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No line items</td>
                </tr>
              ) : (
                lineItems.map((li, idx) => (
                  <tr key={li._id}>
                    <td>
                      <input
                        className="input py-1 px-2 text-sm"
                        value={li.description || ''}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input py-1 px-2 text-sm w-20"
                        type="number"
                        value={li.quantity || 0}
                        onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input py-1 px-2 text-sm w-28"
                        type="number"
                        value={li.unitPrice || 0}
                        onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input py-1 px-2 text-sm w-28"
                        type="number"
                        value={li.amount || 0}
                        onChange={(e) => updateLineItem(idx, 'amount', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input py-1 px-2 text-sm w-28"
                        value={li.accountCode || ''}
                        onChange={(e) => updateLineItem(idx, 'accountCode', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input py-1 px-2 text-sm w-28"
                        type="number"
                        value={li.taxAmount || 0}
                        onChange={(e) => updateLineItem(idx, 'taxAmount', e.target.value)}
                      />
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

export default InvoiceDetailPage;
