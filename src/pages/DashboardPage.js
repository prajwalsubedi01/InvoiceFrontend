import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Building2,
  Calendar,
  Loader2
} from 'lucide-react';
import { useInvoices } from '../context/InvoiceContext';
import { healthCheck } from '../services/api';

const DashboardPage = () => {
  const { invoices } = useInvoices();
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const status = await healthCheck();
      setSystemStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
      setSystemStatus({ status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalInvoices: invoices.length,
    processedToday: invoices.filter(inv => {
      const today = new Date().toDateString();
      const invDate = new Date(inv.processingTime).toDateString();
      return today === invDate;
    }).length,
    totalAmount: invoices.reduce((sum, inv) => 
      sum + (inv.extractedData?.totalAmount || 0), 0
    ),
    totalTax: invoices.reduce((sum, inv) => 
      sum + (inv.extractedData?.taxAmount || 0), 0
    ),
    highConfidence: invoices.filter(inv => 
      (inv.extractedData?.confidence || 0) >= 80
    ).length,
    lowConfidence: invoices.filter(inv => 
      (inv.extractedData?.confidence || 0) < 80
    ).length,
  };

  // Get unique suppliers
  const suppliers = [...new Set(
    invoices.map(inv => inv.extractedData?.supplierName).filter(Boolean)
  )];

  // Recent invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.processingTime) - new Date(a.processingTime))
    .slice(0, 5);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of invoice processing and system status
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`card p-4 ${systemStatus?.status === 'ok' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              systemStatus?.status === 'ok' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {systemStatus?.status === 'ok' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">System Status</p>
              <p className={`font-semibold ${
                systemStatus?.status === 'ok' ? 'text-green-600' : 'text-red-600'
              }`}>
                {systemStatus?.status === 'ok' ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="font-semibold text-gray-900">{stats.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unique Suppliers</p>
              <p className="font-semibold text-gray-900">{suppliers.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Processed Today</p>
              <p className="font-semibold text-gray-900">{stats.processedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                RM {stats.totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tax</p>
              <p className="text-3xl font-bold text-gray-900">
                RM {stats.totalTax.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                RM {(stats.totalAmount - stats.totalTax).toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quality Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Extraction Quality</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">High Confidence (≥80%)</span>
                <span className="font-medium text-green-600">{stats.highConfidence}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ 
                    width: `${stats.totalInvoices > 0 ? (stats.highConfidence / stats.totalInvoices * 100) : 0}%` 
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Low Confidence (&lt;80%)</span>
                <span className="font-medium text-yellow-600">{stats.lowConfidence}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ 
                    width: `${stats.totalInvoices > 0 ? (stats.lowConfidence / stats.totalInvoices * 100) : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Suppliers</h3>
          {suppliers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No supplier data available</p>
          ) : (
            <div className="space-y-2">
              {suppliers.slice(0, 5).map((supplier, idx) => {
                const count = invoices.filter(
                  inv => inv.extractedData?.supplierName === supplier
                ).length;
                return (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 truncate max-w-xs">{supplier}</span>
                    <span className="text-sm text-gray-500">{count} invoices</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      {recentInvoices.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Recently Processed</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Invoice #</th>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="max-w-xs truncate">{inv.filename}</td>
                    <td>{inv.extractedData?.invoiceNumber || '-'}</td>
                    <td className="max-w-xs truncate">{inv.extractedData?.supplierName || '-'}</td>
                    <td>RM {(inv.extractedData?.totalAmount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${
                        (inv.extractedData?.confidence || 0) >= 80 
                          ? 'badge-success' 
                          : 'badge-warning'
                      }`}>
                        {inv.extractedData?.confidence || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a 
            href="/" 
            className="btn-primary inline-flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Process New Invoices
          </a>
          <a 
            href="/preview" 
            className="btn-secondary inline-flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Review & Export
          </a>
          <a 
            href="/mappings" 
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            Configure Mappings
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
