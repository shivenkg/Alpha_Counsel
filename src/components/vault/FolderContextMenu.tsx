import React, { useEffect, useRef, useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  FolderOpen,
  RefreshCw,
  Info,
  Check,
  Key,
  X,
} from 'lucide-react';
import { EncryptedFolderRecord } from '../../types';

interface FolderContextMenuProps {
  folderName: string;
  docCount: number;
  isEncrypted: boolean;
  encryptionRecord?: EncryptedFolderRecord;
  position: { x: number; y: number } | null;
  isDark?: boolean;
  onClose: () => void;
  onToggleEncrypt: (folderName: string) => Promise<void>;
  onOpenFolder: (folderName: string) => void;
  onRegenerateThumbnail: (folderName: string) => void;
  onViewCipherDetails: (folderName: string) => void;
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  folderName,
  docCount,
  isEncrypted,
  encryptionRecord,
  position,
  isDark = true,
  onClose,
  onToggleEncrypt,
  onOpenFolder,
  onRegenerateThumbnail,
  onViewCipherDetails,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [justCompletedAction, setJustCompletedAction] = useState<string | null>(null);

  // Close on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!position) return null;

  // Keep menu on screen
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const menuWidth = 280;
  const menuHeight = 320;

  const adjustedX = Math.min(position.x, screenWidth - menuWidth - 16);
  const adjustedY = Math.min(position.y, screenHeight - menuHeight - 16);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onToggleEncrypt(folderName);
      setJustCompletedAction(isEncrypted ? 'Decrypted' : 'Encrypted with AES-256');
      setTimeout(() => setJustCompletedAction(null), 2500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${Math.max(16, adjustedY)}px`, left: `${Math.max(16, adjustedX)}px` }}
      className={`fixed z-50 w-72 rounded-2xl border shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-200 shadow-slate-950/80'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl'
      }`}
    >
      {/* Menu Header */}
      <div
        className={`p-3.5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
        }`}
      >
        <div className="min-w-0 flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isEncrypted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {isEncrypted ? <Lock className="w-3.5 h-3.5" /> : <FolderOpen className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold truncate max-w-[140px]">{folderName}</span>
              {isEncrypted && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AES-256
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              {docCount} {docCount === 1 ? 'document' : 'documents'} in vault
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action Notification Toast */}
      {justCompletedAction && (
        <div className="px-3.5 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          <span>Folder {justCompletedAction} successfully</span>
        </div>
      )}

      {/* Main Feature: Encrypt Folder Toggle */}
      <div className="p-3 border-b border-slate-800/60">
        <div
          onClick={handleToggle}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            isEncrypted
              ? isDark
                ? 'bg-emerald-950/20 border-emerald-500/40 hover:bg-emerald-950/30'
                : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
              : isDark
              ? 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                isEncrypted
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isProcessing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : isEncrypted ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">Encrypt Folder</span>
                {isEncrypted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                {isEncrypted
                  ? 'Mock AES-256-GCM authenticated cipher active'
                  : 'Secure sensitive client data with mock AES-256'}
              </p>
            </div>
          </div>

          {/* Toggle Switch Component */}
          <div
            className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
              isEncrypted ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                isEncrypted ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Status subtext */}
        <div className="mt-1.5 px-1 flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Security Standard:</span>
          <span className="font-mono font-bold text-slate-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            FIPS 140-3 AES-GCM
          </span>
        </div>
      </div>

      {/* Menu Action Items */}
      <div className="p-2 space-y-1 text-xs font-medium">
        {/* Open Folder */}
        <button
          onClick={() => {
            onOpenFolder(folderName);
            onClose();
          }}
          className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2 transition-colors text-left ${
            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-blue-400" />
          <span>Open & Filter Vault Documents</span>
        </button>

        {/* View Cipher Parameters */}
        {isEncrypted && (
          <button
            onClick={() => {
              onViewCipherDetails(folderName);
              onClose();
            }}
            className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2 transition-colors text-left ${
              isDark ? 'hover:bg-slate-800 text-emerald-400' : 'hover:bg-slate-100 text-emerald-700'
            }`}
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span>View AES-256 Cipher Parameters</span>
          </button>
        )}

        {/* Regenerate 2x2 Thumbnail Grid */}
        <button
          onClick={() => {
            onRegenerateThumbnail(folderName);
            onClose();
          }}
          className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2 transition-colors text-left ${
            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-purple-400" />
          <span>Regenerate 2x2 Thumbnail Preview</span>
        </button>
      </div>

      {/* Footer info */}
      <div
        className={`px-3.5 py-2 text-[10px] border-t flex items-center justify-between ${
          isDark
            ? 'border-slate-800/80 bg-slate-950/40 text-slate-500'
            : 'border-slate-100 bg-slate-50 text-slate-400'
        }`}
      >
        <span>Right-click or menu to toggle</span>
        <span className="font-mono">AlphaCounsel Crypt</span>
      </div>
    </div>
  );
};
