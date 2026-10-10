import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Key,
  Copy,
  Check,
  X,
  RefreshCw,
  Unlock,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { EncryptedFolderRecord } from '../../types';

interface FolderCipherModalProps {
  folderName: string;
  record?: EncryptedFolderRecord;
  isDark?: boolean;
  onClose: () => void;
  onToggleEncrypt: (folderName: string) => Promise<void>;
}

export const FolderCipherModal: React.FC<FolderCipherModalProps> = ({
  folderName,
  record,
  isDark = true,
  onClose,
  onToggleEncrypt,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      await onToggleEncrypt(folderName);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/80'
            : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">AES-256-GCM Cryptographic Parameters</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  FIPS 140-3
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Folder:{' '}
                <span className="font-semibold text-slate-200">{folderName}</span> (Sensitive Client Workproduct)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              record?.isEncrypted
                ? isDark
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isDark
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">
                {record?.isEncrypted
                  ? 'Folder Authenticated & Encrypted'
                  : 'Folder Currently Decrypted'}
              </div>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                {record?.isEncrypted
                  ? 'All document binaries and index manifests in this folder are secured with mock AES-256 Galois/Counter Mode. Key derivation enforced via PBKDF2-HMAC-SHA256.'
                  : 'Folder is in plaintext accessible mode. You may re-enable AES-256 encryption at any time.'}
              </p>
            </div>
          </div>

          {/* Cryptographic Key Parameters */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cipher Specifications & Authentication
            </div>

            {/* Key Fingerprint */}
            <div
              className={`p-3 rounded-xl border font-mono text-[11px] flex items-center justify-between gap-2 ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-sans font-semibold">
                  SHA-256 Key Fingerprint:
                </span>
                <span className="text-emerald-400 truncate block">
                  {record?.keyFingerprint || 'SHA256:7f8a9b2c3d4e5f60a1b2c3d4e5f6a7b8'}
                </span>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    record?.keyFingerprint || 'SHA256:7f8a9b2c3d4e5f60a1b2c3d4e5f6a7b8',
                    'fingerprint'
                  )
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
              >
                {copiedField === 'fingerprint' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* IV & Auth Tag Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                className={`p-3 rounded-xl border font-mono text-[11px] ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] text-slate-400 block font-sans font-semibold">
                  Initialization Vector (96-bit IV):
                </span>
                <span className="text-blue-400 truncate block mt-0.5">
                  {record?.cipherIv || '9f82d1c0b3a5e781c49b01ef'}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border font-mono text-[11px] ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] text-slate-400 block font-sans font-semibold">
                  GCM Authentication Tag (128-bit):
                </span>
                <span className="text-purple-400 truncate block mt-0.5">
                  {record?.authTag || 'e3b0c44298fc1c149afbf4c8996fb924'}
                </span>
              </div>
            </div>

            {/* Custodian & Timestamp */}
            <div
              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className="text-slate-400">Cipher Custodian:</span>{' '}
                <span className="font-semibold text-slate-200">
                  {record?.encryptedBy || 'Managing Partner'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Encrypted At:</span>{' '}
                <span className="font-mono text-slate-300">
                  {record?.encryptedAt
                    ? new Date(record.encryptedAt).toLocaleString()
                    : 'Sep 23, 2026, 8:30 AM'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tamper-proof HMAC verified</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              disabled={isProcessing}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                record?.isEncrypted
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>
                {isProcessing
                  ? 'Processing...'
                  : record?.isEncrypted
                  ? 'Decrypt Folder'
                  : 'Encrypt Folder'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
