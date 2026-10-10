import React, { useState } from 'react';
import {
  FolderInput,
  Copy,
  X,
  Check,
  Folder,
  Lock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { VaultDocument } from '../../types';

interface BulkMoveCopyModalProps {
  mode: 'move' | 'copy';
  selectedDocs: VaultDocument[];
  availableFolders: string[];
  encryptedFolders?: Record<string, { isEncrypted: boolean }>;
  isDark?: boolean;
  onClose: () => void;
  onConfirm: (targetFolder: string) => void;
}

export const BulkMoveCopyModal: React.FC<BulkMoveCopyModalProps> = ({
  mode,
  selectedDocs,
  availableFolders,
  encryptedFolders = {},
  isDark = true,
  onClose,
  onConfirm,
}) => {
  // Exclude 'ALL' and default to first valid folder
  const folders = availableFolders.filter((f) => f !== 'ALL');
  const [targetFolder, setTargetFolder] = useState<string>(folders[0] || 'Discovery');
  const isMove = mode === 'move';

  const isTargetEncrypted = !!encryptedFolders[targetFolder]?.isEncrypted;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFolder) return;
    onConfirm(targetFolder);
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
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                isMove
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isMove ? <FolderInput className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isMove ? 'Move Documents' : 'Copy Documents'}
              </h3>
              <p className="text-xs opacity-70">
                {isMove
                  ? `Relocate ${selectedDocs.length} items to a target vault directory`
                  : `Duplicate ${selectedDocs.length} items into a target vault directory`}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Selected items overview */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
              Documents to {isMove ? 'Move' : 'Copy'} ({selectedDocs.length})
            </label>
            <div
              className={`max-h-36 overflow-y-auto rounded-xl border p-2.5 space-y-1.5 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {selectedDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-medium truncate">{doc.title}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Current: {doc.folder}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Folder Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
              Select Destination Folder
            </label>
            <div className="grid grid-cols-2 gap-2">
              {folders.map((f) => {
                const isSelected = targetFolder === f;
                const isEnc = !!encryptedFolders[f]?.isEncrypted;

                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTargetFolder(f)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? isDark
                          ? 'bg-blue-950/40 border-blue-500 text-white ring-2 ring-blue-500/30'
                          : 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-400/30'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-blue-500' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-semibold truncate">{f}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isEnc && (
                        <span title="Destination folder is AES-256 encrypted">
                          <Lock className="w-3 h-3 text-emerald-400" />
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Encryption notice if target is encrypted */}
          {isTargetEncrypted && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                isDark
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Destination Folder is AES-256 Encrypted:</span>
                <p className="opacity-80 mt-0.5 text-[11px]">
                  Files placed into '{targetFolder}' will automatically inherit AES-256-GCM cryptographic protection and restricted access controls.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
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
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5 ${
                isMove
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isMove ? <FolderInput className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isMove ? `Move ${selectedDocs.length} Files` : `Copy ${selectedDocs.length} Files`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
