import React from 'react';
import {
  FolderInput,
  Copy,
  Trash2,
  Sparkles,
  X,
  CheckSquare,
  ShieldAlert,
} from 'lucide-react';

interface VaultFloatingActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  isAllSelected: boolean;
  hasHeldDocuments: boolean;
  isDark?: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onMove: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onAutoTag: () => void;
}

export const VaultFloatingActionBar: React.FC<VaultFloatingActionBarProps> = ({
  selectedCount,
  totalFilteredCount,
  isAllSelected,
  hasHeldDocuments,
  isDark = true,
  onSelectAll,
  onClearSelection,
  onMove,
  onCopy,
  onDelete,
  onAutoTag,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[94vw] sm:max-w-2xl px-2">
      <div
        className={`flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200 select-none ${
          isDark
            ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/90'
            : 'bg-white/95 border-slate-300 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Selection Counter & Quick Select Controls */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs shrink-0">
            {selectedCount}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>{selectedCount} Selected</span>
              {hasHeldDocuments && (
                <span
                  title="Selection includes documents protected under Litigation Preservation Hold"
                  className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono flex items-center gap-0.5"
                >
                  <ShieldAlert className="w-2.5 h-2.5" />
                  Hold
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className={`text-[10px] font-medium transition-colors ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {isAllSelected ? 'Deselect all' : `Select all (${totalFilteredCount})`}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-6 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Move Button */}
          <button
            type="button"
            onClick={onMove}
            title="Move selected documents to another folder"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
            }`}
          >
            <FolderInput className="w-3.5 h-3.5 text-blue-400" />
            <span>Move</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={onCopy}
            title="Copy selected documents to another folder"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
            }`}
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Copy</span>
          </button>

          {/* ML Auto-Tag Button */}
          <button
            type="button"
            onClick={onAutoTag}
            title="AI/ML legal content analysis & tag generation"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ML Auto-Tag</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDelete}
            title="Delete selected documents from vault"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          {/* Close / Dismiss Bar */}
          <button
            type="button"
            onClick={onClearSelection}
            title="Clear selection"
            className={`p-1.5 rounded-xl transition-colors ml-1 ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
