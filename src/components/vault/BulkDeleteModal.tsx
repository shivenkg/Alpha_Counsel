import React from 'react';
import {
  Trash2,
  X,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Lock,
} from 'lucide-react';
import { VaultDocument } from '../../types';

interface BulkDeleteModalProps {
  selectedDocs: VaultDocument[];
  isDark?: boolean;
  onClose: () => void;
  onConfirmDelete: (docIdsToDelete: string[]) => void;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  selectedDocs,
  isDark = true,
  onClose,
  onConfirmDelete,
}) => {
  const heldDocs = selectedDocs.filter((d) => d.isHeld);
  const deletableDocs = selectedDocs.filter((d) => !d.isHeld);

  const canDeleteAny = deletableDocs.length > 0;

  const handleConfirm = () => {
    if (!canDeleteAny) return;
    onConfirmDelete(deletableDocs.map((d) => d.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/90'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-500">
                Confirm Bulk Document Deletion
              </h3>
              <p className="text-xs opacity-70">
                Permanent purge request for {selectedDocs.length} vault item(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Legal Hold Warning if any held files */}
          {heldDocs.length > 0 && (
            <div
              className={`p-3.5 rounded-xl border space-y-2 ${
                isDark
                  ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-rose-500 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  Litigation Hold Protection: {heldDocs.length} File(s) Cannot Be Deleted
                </span>
              </div>
              <p className="opacity-90 leading-relaxed text-[11px]">
                Under FRCP Rule 37(e) and the firm's legal hold policy, documents preserved under an active litigation hold are immutably locked against deletion or destruction to prevent spoliation.
              </p>
              <div
                className={`p-2 rounded-lg border max-h-24 overflow-y-auto space-y-1 ${
                  isDark ? 'bg-slate-950/60 border-rose-900/50' : 'bg-white border-rose-200'
                }`}
              >
                {heldDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-1.5 text-[11px]">
                    <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="font-semibold truncate">{doc.title}</span>
                    <span className="text-[10px] opacity-70">({doc.fileName})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deletable Files List */}
          {canDeleteAny ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                Eligible for Deletion ({deletableDocs.length})
              </label>
              <div
                className={`max-h-36 overflow-y-auto rounded-xl border p-2.5 space-y-1.5 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {deletableDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{doc.title}</span>
                    </div>
                    <span className="text-[10px] opacity-60 font-mono shrink-0">
                      {doc.folder}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-slate-400 flex items-center gap-1.5 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  This operation will be logged to the immutable practice audit trail.
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-xl border text-center ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className="font-semibold text-rose-400">
                All selected items are under active Legal Hold and cannot be deleted.
              </p>
              <p className="text-[11px] opacity-70 mt-1">
                To delete these files, counsel must first execute a formal legal hold release authorization in the Legal Hold Management module.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-inherit">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancel
            </button>
            {canDeleteAny && (
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  Permanently Delete {deletableDocs.length} {deletableDocs.length === 1 ? 'Document' : 'Documents'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
