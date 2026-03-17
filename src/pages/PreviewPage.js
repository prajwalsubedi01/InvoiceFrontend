import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Download, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Table,
  Eye
} from 'lucide-react';
import { useInvoices } from '../context/InvoiceContext';
import { generateExcel, previewExcel } from '../services/api';

const PreviewPage = () => {
  const navigate = useNavigate();
  const { 
    invoices, 
    updateInvoice, 
    updateLineItem, 
    removeInvoice,
    previewData,
    setPreview
  } = useInvoices();
  
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);

  useEffect(() => {
    if (invoices.length > 0 && !previewData) {
      loadPreview();
    }
  }, [invoices]);

  const loadPreview = async () => {
    try {
      const result = await previewExcel(invoices);
      setPreview(result.data);
      setLocalPreview(result.data);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to load preview');
    }
  };

  const handleGenerateExcel = async () => {
    setGenerating(true);
    try {
      await generateExcel(invoices, {
        includeSupplierSheet: true,
        includeAccountSheet: true
      });
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate Excel file');
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedInvoice(expandedInvoice === id ? null : id);
  };

  const startEditing = (invoice) => {
    setEditingInvoice({
      ...invoice,
      extractedData: { ...invoice.extractedData }
    });
  };

  const saveEditing = () => {
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, editingInvoice);
      setEditingInvoice(null);
      toast.success('Invoice updated');
      // Reload preview
      loadPreview();
    }
  };

  const cancelEditing = () => {
    setEditingInvoice(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this invoice?')) {
      removeInvoice(id);
      toast.success('Invoice removed');
    }
  };

  const updateEditField = (field, value) => {
    setEditingInvoice(prev => ({
      ...prev,
      extractedData: {
        ...prev.extractedData,
        [field]: value
      }
    }));
  };

  const updateLineItemField = (itemIndex, field, value) => {
    setEditingInvoice(prev => {
      const items = [...(prev.extractedData?.lineItems || [])];
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      
      // Recalculate amount if qty or unitPrice changed
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? parseFloat(value) : items[itemIndex].quantity;
        const price = field === 'unitPrice' ? parseFloat(value) : items[itemIndex].unitPrice;
        items[itemIndex].amount = qty * price;
      }
      
      return {
        ...prev,
        extractedData: {
          ...prev.extractedData,
          lineItems: items
        }
      };
    });
  };

  const displayData = previewMode ? (localPreview || previewData) : null;

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No invoices to preview
        </h2>
        <p className="text-gray-600 mb-6">
          Upload some invoices first to see the preview
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Go to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preview & Edit</h1>
          <p className="text-gray-600 mt-1">
            Review and edit extracted data before generating Excel
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn-secondary flex items-center gap-2 ${previewMode ? 'bg-blue-100 text-blue-700' : ''}`}
          >
            <Table className="w-5 h-5" />
            {previewMode ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          <button
            onClick={handleGenerateExcel}
            disabled={generating}
            className="btn-success flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {generating ? 'Generating...' : 'Download Excel'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {(previewData || localPreview) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">
              {(previewData || localPreview)?.summary?.totalInvoices || invoices.length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              RM {((previewData || localPreview)?.summary?.totalAmount || 0).toFixed(2)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Total Tax</p>
            <p className="text-2xl font-bold text-gray-900">
              RM {((previewData || localPreview)?.summary?.totalTax || 0).toFixed(2)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Suppliers</p>
            <p className="text-2xl font-bold text-gray-900">
              {(previewData || localPreview)?.summary?.supplierCount || 0}
            </p>
          </div>
        </div>
      )}

      {/* Preview Table Mode */}
      {previewMode && displayData && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              SQL Accounting Preview
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doc No</th>
                  <th>Supplier</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                  <th>Tax</th>
                </tr>
              </thead>
              <tbody>
                {displayData.rows?.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.docDate}</td>
                    <td>{row.docNo}</td>
                    <td className="max-w-xs truncate" title={row.supplierName}>
                      {row.supplierCode}
                    </td>
                    <td className="max-w-xs truncate" title={row.description}>
                      {row.description}
                    </td>
                    <td>{row.accountCode}</td>
                    <td>{row.qty}</td>
                    <td>RM {row.unitPrice?.toFixed(2)}</td>
                    <td>RM {row.amount?.toFixed(2)}</td>
                    <td>RM {row.tax?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">
          Extracted Invoices ({invoices.length})
        </h3>
        
        {invoices.map((invoice) => (
          <div key={invoice.id} className="card">
            {/* Invoice Header */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(invoice.id)}
            >
              <div className="flex items-center gap-4">
                {invoice.extractedData?.confidence >= 80 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                
                <div>
                  <p className="font-medium text-gray-900">
                    {invoice.extractedData?.invoiceNumber || 'No Invoice Number'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {invoice.extractedData?.supplierName || 'Unknown Supplier'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    RM {(invoice.extractedData?.totalAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {invoice.extractedData?.invoiceDate || 'No Date'}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(invoice);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(invoice.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {expandedInvoice === invoice.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedInvoice === invoice.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Invoice Number</p>
                    <p className="font-medium">{invoice.extractedData?.invoiceNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{invoice.extractedData?.invoiceDate || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Supplier Code</p>
                    <p className="font-medium">{invoice.extractedData?.supplierCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tax Rate</p>
                    <p className="font-medium">{invoice.extractedData?.taxRate || 0}%</p>
                  </div>
                </div>

                {/* Line Items */}
                {invoice.extractedData?.lineItems?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Line Items</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2">Description</th>
                            <th className="text-right py-2">Qty</th>
                            <th className="text-right py-2">Unit Price</th>
                            <th className="text-right py-2">Amount</th>
                            <th className="text-left py-2">Account</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.extractedData.lineItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2">{item.description}</td>
                              <td className="text-right py-2">{item.quantity}</td>
                              <td className="text-right py-2">RM {item.unitPrice?.toFixed(2)}</td>
                              <td className="text-right py-2">RM {item.amount?.toFixed(2)}</td>
                              <td className="py-2">{item.accountCode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Raw OCR Text (collapsible) */}
                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer">
                    View Raw OCR Text
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-x-auto">
                    {invoice.ocrText}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Invoice</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Invoice Number</label>
                  <input
                    type="text"
                    className="input"
                    value={editingInvoice.extractedData?.invoiceNumber || ''}
                    onChange={(e) => updateEditField('invoiceNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Invoice Date</label>
                  <input
                    type="date"
                    className="input"
                    value={editingInvoice.extractedData?.invoiceDate || ''}
                    onChange={(e) => updateEditField('invoiceDate', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Supplier Name</label>
                <input
                  type="text"
                  className="input"
                  value={editingInvoice.extractedData?.supplierName || ''}
                  onChange={(e) => updateEditField('supplierName', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Supplier Code</label>
                <input
                  type="text"
                  className="input"
                  value={editingInvoice.extractedData?.supplierCode || ''}
                  onChange={(e) => updateEditField('supplierCode', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={editingInvoice.extractedData?.totalAmount || 0}
                    onChange={(e) => updateEditField('totalAmount', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={editingInvoice.extractedData?.taxAmount || 0}
                    onChange={(e) => updateEditField('taxAmount', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Line Items Editor */}
              {editingInvoice.extractedData?.lineItems?.length > 0 && (
                <div>
                  <label className="label">Line Items</label>
                  <div className="space-y-2">
                    {editingInvoice.extractedData.lineItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="col-span-4">
                          <input
                            type="text"
                            className="input text-sm"
                            placeholder="Description"
                            value={item.description || ''}
                            onChange={(e) => updateLineItemField(idx, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            className="input text-sm"
                            placeholder="Qty"
                            value={item.quantity || 1}
                            onChange={(e) => updateLineItemField(idx, 'quantity', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            className="input text-sm"
                            placeholder="Unit Price"
                            value={item.unitPrice || 0}
                            onChange={(e) => updateLineItemField(idx, 'unitPrice', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            className="input text-sm"
                            placeholder="Account Code"
                            value={item.accountCode || ''}
                            onChange={(e) => updateLineItemField(idx, 'accountCode', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={cancelEditing} className="btn-secondary">
                Cancel
              </button>
              <button onClick={saveEditing} className="btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewPage;
