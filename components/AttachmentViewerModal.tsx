import React, { useState } from 'react';
import { FileAttachment } from '../types';
import { Download, X, FileText, Image as ImageIcon, Calendar, User, HardDrive, Trash2, AlertTriangle } from 'lucide-react';

interface AttachmentViewerModalProps {
  attachment: FileAttachment | null;
  onClose: () => void;
  title?: string;
  onDelete?: () => void;
}

export const downloadAttachment = (att: FileAttachment) => {
  try {
    const link = document.createElement('a');
    link.href = att.dataUrl;
    link.download = att.name || 'attachment';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 200);
  } catch (error) {
    console.error('Download error:', error);
  }
};

export const fileToAttachment = (file: File, uploadedBy: string): Promise<FileAttachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: reader.result as string,
        uploadedBy,
        uploadedAt: new Date().toISOString()
      });
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  attachment,
  onClose,
  title = 'Attachment Viewer',
  onDelete
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!attachment) return null;

  const isImage = 
    attachment.type.startsWith('image/') || 
    attachment.name.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i) ||
    attachment.dataUrl.startsWith('data:image/');

  const handleExecuteDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setConfirmingDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3 min-w-0 pr-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block leading-tight">
                {title}
              </span>
              <h3 className="text-base font-bold text-slate-900 truncate">
                {attachment.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {onDelete && !confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-200 transition-all"
                title="Delete this attachment"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span className="hidden sm:inline">Delete Attachment</span>
              </button>
            )}
            <button
              onClick={() => downloadAttachment(attachment)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              title="Download this file"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={() => {
                setConfirmingDelete(false);
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Modal Delete Confirmation Banner (Safe inside iframe, no window.confirm) */}
        {confirmingDelete && (
          <div className="p-3.5 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>
                Permanently delete <strong>"{attachment.name}"</strong>? This will remove the file for both admin and client.
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/5 flex items-center justify-center min-h-[250px]">
          {isImage ? (
            <div className="max-w-full max-h-[60vh] flex items-center justify-center bg-white rounded-xl p-2 border border-slate-200 shadow-sm overflow-hidden">
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="max-h-[55vh] max-w-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1 truncate">{attachment.name}</h4>
              <p className="text-xs text-slate-500 mb-4">{attachment.type || 'Document File'}</p>
              
              <button
                onClick={() => downloadAttachment(attachment)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Document ({formatFileSize(attachment.size)})</span>
              </button>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-4 flex-wrap gap-y-1">
            <span className="flex items-center space-x-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Size: <strong className="text-slate-700 font-mono">{formatFileSize(attachment.size)}</strong></span>
            </span>
            <span className="flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>By: <strong className="text-slate-700">{attachment.uploadedBy}</strong></span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(attachment.uploadedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {onDelete && !confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Attachment</span>
              </button>
            )}
            <button
              onClick={() => downloadAttachment(attachment)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save to device</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
