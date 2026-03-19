import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useInvoices } from '../context/InvoiceContext';
import { checkBackendHealth, processInvoice, processInvoicesHybrid } from '../services/api';

const UploadPage = () => {
  const BATCH_OPTIONS = {
    parallel: 5,
    useCache: true,
    supplierTemplates: true
  };

  const navigate = useNavigate();
  const { addInvoices, setProcessing, processing, clearInvoices } = useInvoices();
  const [files, setFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        toast.error(`${file.name}: ${errors.map(e => e.message).join(', ')}`);
      });
    }

    // Add accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending',
        progress: 0,
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
  });

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
    clearInvoices();
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    try {
      const health = await checkBackendHealth();
      if (!health?.status) {
        toast.error('Backend health check failed. Please try again.');
        return;
      }
      if (health?.database?.connected === false) {
        toast('Backend is in degraded mode: invoices can be processed but may not be saved.');
      }
    } catch (healthError) {
      toast.error(healthError.message || 'Cannot reach backend server.');
      return;
    }

    setProcessing(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    try {
      if (pendingFiles.length === 1) {
        // Single file processing
        const fileItem = pendingFiles[0];
        updateFileStatus(fileItem.id, 'processing');
        updateFileProgress(fileItem.id, 5);

        const result = await processInvoice(fileItem.file, (event) => {
          if (!event.total) return;
          const percent = Math.min(60, Math.round((event.loaded / event.total) * 60));
          updateFileProgress(fileItem.id, percent);
        });
        
        if (result.success) {
          updateFileStatus(fileItem.id, 'completed');
          updateFileProgress(fileItem.id, 100);
          const invoices = result.data?.invoices || [result.data];
          addInvoices(invoices);
          toast.success(`Processed ${invoices.length} invoice(s) successfully!`);
        }
      } else {
        // Batch processing
        pendingFiles.forEach(f => updateFileStatus(f.id, 'processing'));
        pendingFiles.forEach(f => updateFileProgress(f.id, 5));

        const fileList = pendingFiles.map(f => f.file);
        const result = await processInvoicesHybrid(fileList, BATCH_OPTIONS, (event) => {
          if (!event.total) return;
          const percent = Math.min(60, Math.round((event.loaded / event.total) * 60));
          pendingFiles.forEach(f => updateFileProgress(f.id, percent));
        });
        
        if (result.success) {
          // Update file statuses
          result.data.invoices.forEach((inv, idx) => {
            updateFileStatus(pendingFiles[idx]?.id, 'completed');
            updateFileProgress(pendingFiles[idx]?.id, 100);
          });
          
          // Add processed invoices
          addInvoices(result.data.invoices);
          
          // Show error notifications for failed files
          result.data.errorDetails.forEach(err => {
            toast.error(`Failed: ${err.filename}`);
          });
          
          toast.success(`Processed ${result.data.processed} invoices successfully!`);
        }
      }
      
      // Navigate to preview page
      navigate('/preview');
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(error.message || error.response?.data?.message || 'Failed to process invoices');
      
      pendingFiles.forEach(f => {
        updateFileStatus(f.id, 'error', error.message || 'Upload failed');
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateFileStatus = (id, status, error = null) => {
    setFiles(prev => 
      prev.map(f => 
        f.id === id ? { ...f, status, error } : f
      )
    );
  };

  const updateFileProgress = (id, progress) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === id ? { ...f, progress } : f
      )
    );
  };

  const getFileIcon = (filename) => {
    if (filename.toLowerCase().endsWith('.pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <ImageIcon className="w-8 h-8 text-blue-500" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Invoices</h1>
        <p className="text-gray-600 mt-1">
          Upload PDF or image files to extract invoice data for SQL Accounting
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          dropzone
          ${isDragActive ? 'active border-blue-500 bg-blue-50' : ''}
          ${processing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-gray-500 mt-1">
              or click to browse files
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> PDF
            </span>
            <span className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4" /> JPG, PNG
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Maximum file size: 10MB | Maximum files: 10
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Files ({files.length})
            </h3>
            <button
              onClick={clearAllFiles}
              disabled={processing}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Clear all
            </button>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {files.map((fileItem) => (
              <div 
                key={fileItem.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50"
              >
                {getFileIcon(fileItem.file.name)}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {fileItem.status === 'processing' && (
                    <div className="mt-2">
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-blue-600 transition-all"
                          style={{ width: `${fileItem.progress || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{fileItem.progress || 0}%</p>
                    </div>
                  )}
                  {fileItem.error && (
                    <p className="text-sm text-red-600 mt-1">
                      {fileItem.error}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(fileItem.status)}
                  
                  {!processing && (
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {pendingCount > 0 && (
              <span>{pendingCount} file(s) ready to process</span>
            )}
            {completedCount > 0 && (
              <span className="text-green-600 ml-4">
                {completedCount} file(s) processed
              </span>
            )}
          </div>
          
          <button
            onClick={processFiles}
            disabled={processing || pendingCount === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Process {pendingCount} File{pendingCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">
          How it works
        </h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            Upload your invoice files (PDF, JPG, or PNG)
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            Our OCR system extracts invoice data automatically
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            Review and edit the extracted data in the preview page
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            Download the Excel file ready for SQL Accounting import
          </li>
        </ol>
      </div>
    </div>
  );
};

export default UploadPage;
