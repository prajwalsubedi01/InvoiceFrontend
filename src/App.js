import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  HelpCircle, 
  BarChart3,
  Database,
  ListChecks,
  Download,
  Menu
} from 'lucide-react';
import UploadPage from './pages/UploadPage';
import PreviewPage from './pages/PreviewPage';
import DashboardPage from './pages/DashboardPage';
import MasterUploadPage from './pages/MasterUploadPage';
import InvoiceListPage from './pages/InvoiceListPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import ExportPage from './pages/ExportPage';
import { InvoiceProvider } from './context/InvoiceContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Upload', icon: Upload },
    { path: '/preview', label: 'Preview & Edit', icon: FileText },
    { path: '/masters', label: 'Master Uploads', icon: Database },
    { path: '/invoices', label: 'Invoices', icon: ListChecks },
    { path: '/exports', label: 'Exports', icon: Download },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <InvoiceProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside 
            className={`
              fixed lg:static inset-y-0 left-0 z-50
              w-64 bg-white border-r border-gray-200
              transform transition-transform duration-200 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <div className="h-full flex flex-col">
              {/* Logo */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg text-gray-900">Invoice OCR</h1>
                    <p className="text-xs text-gray-500">SQL Accounting Export</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <a 
                  href="#help" 
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <HelpCircle className="w-5 h-5" />
                  Help & Support
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Mobile header */}
            <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-semibold">Invoice OCR</span>
              <div className="w-10" />
            </header>

            {/* Page content */}
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<UploadPage />} />
                <Route path="/preview" element={<PreviewPage />} />
                <Route path="/masters" element={<MasterUploadPage />} />
                <Route path="/invoices" element={<InvoiceListPage />} />
                <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/exports" element={<ExportPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </InvoiceProvider>
  );
}

export default App;
