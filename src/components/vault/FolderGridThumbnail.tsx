import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  File,
  Lock,
  Sparkles,
} from 'lucide-react';
import { FolderThumbnailPreview, FolderThumbnailSlot } from '../../types';

interface FolderGridThumbnailProps {
  thumbnail?: FolderThumbnailPreview;
  isEncrypted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
  className?: string;
  isGenerating?: boolean;
}

export const FolderGridThumbnail: React.FC<FolderGridThumbnailProps> = ({
  thumbnail,
  isEncrypted = false,
  size = 'md',
  isDark = true,
  className = '',
  isGenerating = false,
}) => {
  const slots = thumbnail?.slots || [null, null, null, null];

  // Sizing definitions
  const containerDimensions = {
    sm: 'w-12 h-12 p-1',
    md: 'w-16 h-16 p-1.5',
    lg: 'w-20 h-20 p-2',
  }[size];

  const iconSize = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const extTextSize = {
    sm: 'text-[7px]',
    md: 'text-[8px]',
    lg: 'text-[9px]',
  }[size];

  const renderSlotIcon = (slot: FolderThumbnailSlot) => {
    switch (slot.fileType) {
      case 'pdf':
        return (
          <div
            title={`${slot.docTitle} (${slot.fileName})`}
            className={`w-full h-full rounded-md flex flex-col items-center justify-center transition-transform hover:scale-105 border ${
              isDark
                ? 'bg-rose-950/70 border-rose-800/60 text-rose-400'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          >
            <FileText className={iconSize} />
            <span className={`font-mono font-bold tracking-tighter ${extTextSize}`}>PDF</span>
          </div>
        );
      case 'xlsx':
        return (
          <div
            title={`${slot.docTitle} (${slot.fileName})`}
            className={`w-full h-full rounded-md flex flex-col items-center justify-center transition-transform hover:scale-105 border ${
              isDark
                ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}
          >
            <FileSpreadsheet className={iconSize} />
            <span className={`font-mono font-bold tracking-tighter ${extTextSize}`}>XLS</span>
          </div>
        );
      case 'docx':
        return (
          <div
            title={`${slot.docTitle} (${slot.fileName})`}
            className={`w-full h-full rounded-md flex flex-col items-center justify-center transition-transform hover:scale-105 border ${
              isDark
                ? 'bg-blue-950/70 border-blue-800/60 text-blue-400'
                : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            <FileText className={iconSize} />
            <span className={`font-mono font-bold tracking-tighter ${extTextSize}`}>DOC</span>
          </div>
        );
      case 'img':
        return (
          <div
            title={`${slot.docTitle} (${slot.fileName})`}
            className={`w-full h-full rounded-md flex flex-col items-center justify-center transition-transform hover:scale-105 border ${
              isDark
                ? 'bg-amber-950/70 border-amber-800/60 text-amber-400'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            <ImageIcon className={iconSize} />
            <span className={`font-mono font-bold tracking-tighter ${extTextSize}`}>IMG</span>
          </div>
        );
      case 'txt':
        return (
          <div
            title={`${slot.docTitle} (${slot.fileName})`}
            className={`w-full h-full rounded-md flex flex-col items-center justify-center transition-transform hover:scale-105 border ${
              isDark
                ? 'bg-purple-950/70 border-purple-800/60 text-purple-400'
                : 'bg-purple-50 border-purple-200 text-purple-600'
            }`}
          >
            <FileCode className={iconSize} />
            <span className={`font-mono font-bold tracking-tighter ${extTextSize}`}>TXT</span>
          </div>
        );
      default:
        return (
          <div
            title={`${slot.docTitle} (${slot.fileName})`}
            className={`w-full h-full rounded-md flex flex-col items-center justify-center transition-transform hover:scale-105 border ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <File className={iconSize} />
            <span className={`font-mono font-bold tracking-tighter ${extTextSize}`}>
              {slot.ext?.slice(0, 3).toUpperCase() || 'DOC'}
            </span>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative select-none shrink-0 ${containerDimensions} rounded-xl border transition-all ${
        isEncrypted
          ? isDark
            ? 'bg-slate-900/90 border-emerald-500/50 shadow-sm shadow-emerald-950/30'
            : 'bg-emerald-50/40 border-emerald-400 shadow-sm'
          : isDark
          ? 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
          : 'bg-slate-50 border-slate-200/90 hover:border-slate-300'
      } ${className}`}
      title={
        isEncrypted
          ? `AES-256-GCM Encrypted Folder Preview (${thumbnail?.itemCount || 0} items)`
          : `Folder Preview (${thumbnail?.itemCount || 0} items)`
      }
    >
      {/* 2x2 Grid of Document Icons */}
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
        {slots.slice(0, 4).map((slot, idx) => (
          <div key={idx} className="w-full h-full min-w-0 min-h-0 flex items-center justify-center">
            {slot ? (
              renderSlotIcon(slot)
            ) : (
              // Empty Slot Placeholder
              <div
                className={`w-full h-full rounded-md border border-dashed flex items-center justify-center opacity-40 transition-opacity ${
                  isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-300 bg-slate-100/50'
                }`}
              >
                <span className="text-[8px] text-slate-500 font-mono">+</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Secure Lock Badge for Encrypted Folders */}
      {isEncrypted && (
        <div
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs border border-emerald-400 ring-2 ring-slate-950"
          title="Protected under AES-256-GCM Encryption"
        >
          <Lock className="w-2.5 h-2.5" />
        </div>
      )}

      {/* Background Generator Activity Pulse Indicator */}
      {isGenerating && (
        <div
          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center animate-spin"
          title="Background preview generation active"
        >
          <Sparkles className="w-2 h-2 text-amber-300" />
        </div>
      )}
    </div>
  );
};
