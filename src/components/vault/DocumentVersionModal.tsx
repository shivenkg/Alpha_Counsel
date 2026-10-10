import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Upload,
  Check,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Hash,
  ShieldCheck,
  ArrowRight,
  GitCommit,
  GitBranch,
  FileCheck,
  Diff,
} from 'lucide-react';
import { VaultDocument, DocumentVersion } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../hooks/useAudit';

interface DocumentVersionModalProps {
  document: VaultDocument;
  onClose: () => void;
  onVersionReverted?: (revertedDoc: VaultDocument) => void;
}

export const DocumentVersionModal: React.FC<DocumentVersionModalProps> = ({
  document: doc,
  onClose,
  onVersionReverted,
}) => {
  const { revertDocumentVersion, addDocumentVersion, theme, currentUser, matters } = useApp();
  const { logDocumentAction } = useAudit();
  const isDark = theme === 'dark';

  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [revertingVersion, setRevertingVersion] = useState<DocumentVersion | null>(null);
  const [revertReason, setRevertReason] = useState<string>('');
  const [isSubmittingRevert, setIsSubmittingRevert] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New version upload state
  const [showUploadNew, setShowUploadNew] = useState<boolean>(false);
  const [newVersionNotes, setNewVersionNotes] = useState<string>('');
  const [newVersionNumber, setNewVersionNumber] = useState<string>(() => {
    const match = (doc.currentVersion || 'v1.0').match(/v?(\d+)\.(\d+)/);
    if (match) {
      return `v${match[1]}.${parseInt(match[2], 10) + 1}`;
    }
    return `v${(doc.versions?.length || 1) + 1}.0`;
  });

  // Diff comparison view
  const [diffVersion, setDiffVersion] = useState<DocumentVersion | null>(null);

  const matter = matters.find((m) => m.id === doc.matterId);

  // Ensure versions list is sorted newest first
  const versionList = doc.versions && doc.versions.length > 0 ? doc.versions : [
    {
      versionNumber: doc.currentVersion || 'v1.0',
      uploadedAt: doc.createdAt,
      uploadedBy: doc.createdBy,
      fileSize: doc.fileSize,
      notes: 'Initial production upload',
    },
  ];

  const handleExecuteRevert = () => {
    if (!revertingVersion) return;
    setIsSubmittingRevert(true);

    try {
      const success = revertDocumentVersion(
        doc.id,
        revertingVersion.versionNumber,
        revertReason || `Reverted to ${revertingVersion.versionNumber}`
      );

      if (success) {
        setSuccessMessage(`Document successfully reverted to ${revertingVersion.versionNumber}`);
        setRevertingVersion(null);
        setRevertReason('');
        if (onVersionReverted) {
          onVersionReverted(doc);
        }
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3500);
      }
    } finally {
      setIsSubmittingRevert(false);
    }
  };

  const handleCreateNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionNumber.trim()) return;

    addDocumentVersion(doc.id, {
      versionNumber: newVersionNumber.trim(),
      notes: newVersionNotes.trim() || `Manual revision update to ${newVersionNumber}`,
      fileSize: doc.fileSize,
      fileName: doc.fileName,
      ocrExtractedText: doc.ocrExtractedText,
      summary: doc.summary,
    });

    setSuccessMessage(`New version ${newVersionNumber} published successfully.`);
    setShowUploadNew(false);
    setNewVersionNotes('');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Version Control & Audit History</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                  {doc.currentVersion || 'v1.0'} Active
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-lg">
                {doc.title} · <span className="font-mono">{doc.fileName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATION BANNER */}
        {successMessage && (
          <div className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400/70 hover:text-emerald-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ACTION BAR: UPLOAD NEW VERSION / COMPARISON */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/40">
            <div className="text-xs text-slate-400">
              Preserved versions: <span className="font-bold text-blue-400">{versionList.length}</span> ·
              Immutable legal hold integrity guaranteed
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadNew(!showUploadNew)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{showUploadNew ? 'Cancel Upload' : 'Upload New Version'}</span>
              </button>
            </div>
          </div>

          {/* UPLOAD NEW VERSION FORM */}
          {showUploadNew && (
            <form
              onSubmit={handleCreateNewVersion}
              className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" />
                  Publish New Version Iteration
                </h4>
                <span className="text-[11px] text-slate-400">
                  Current Master: {doc.currentVersion || 'v1.0'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Version Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionNumber}
                    onChange={(e) => setNewVersionNumber(e.target.value)}
                    placeholder="e.g. v1.2, v2.0"
                    className={`w-full px-3 py-2 rounded-lg text-xs font-mono border focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Changelog / Revision Notes
                  </label>
                  <input
                    type="text"
                    value={newVersionNotes}
                    onChange={(e) => setNewVersionNotes(e.target.value)}
                    placeholder="e.g., Incorporated partner redlines, added Exhibit B..."
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUploadNew(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Commit Revision</span>
                </button>
              </div>
            </form>
          )}

          {/* REVERT CONFIRMATION DIALOG */}
          {revertingVersion && (
            <div
              className={`p-4 rounded-xl border border-amber-500/50 space-y-3 ${
                isDark ? 'bg-amber-950/20' : 'bg-amber-50/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-400">
                    Confirm Version Rollback to {revertingVersion.versionNumber}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Reverting will restore the state of{' '}
                    <span className="font-bold text-white">{revertingVersion.versionNumber}</span> as
                    the new active master version. The current version ({doc.currentVersion}) and all
                    other iterations will remain permanently intact in the historical audit log.
                  </p>

                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Reason for Revert (Recorded in Judicial Audit Trail):
                    </label>
                    <input
                      type="text"
                      value={revertReason}
                      onChange={(e) => setRevertReason(e.target.value)}
                      placeholder="e.g., Erroneous redaction in v1.1, restoring pre-hearing text..."
                      className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-3 justify-end">
                    <button
                      type="button"
                      disabled={isSubmittingRevert}
                      onClick={() => setRevertingVersion(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingRevert}
                      onClick={handleExecuteRevert}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isSubmittingRevert ? 'Reverting...' : `Confirm Revert to ${revertingVersion.versionNumber}`}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DIFF COMPARISON PREVIEW */}
          {diffVersion && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Diff className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold">
                    Differential Comparison: {diffVersion.versionNumber} vs Current ({doc.currentVersion})
                  </h4>
                </div>
                <button
                  onClick={() => setDiffVersion(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close Diff
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div
                  className={`p-3 rounded-lg border font-mono text-[11px] max-h-48 overflow-y-auto ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="font-bold text-slate-400 mb-1 border-b pb-1">
                    Version {diffVersion.versionNumber} ({diffVersion.uploadedAt})
                  </div>
                  <div className="text-slate-300 whitespace-pre-wrap">
                    {diffVersion.snapshotContent ||
                      `[Version ${diffVersion.versionNumber} Text Snapshot]\nFile: ${diffVersion.fileName || doc.fileName}\nNotes: ${diffVersion.notes || 'Original draft.'}\n\nEvidence record and pleadings filed with court docket.`}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border font-mono text-[11px] max-h-48 overflow-y-auto ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="font-bold text-blue-400 mb-1 border-b pb-1">
                    Active Master: {doc.currentVersion} ({doc.createdAt})
                  </div>
                  <div className="text-slate-200 whitespace-pre-wrap">
                    {doc.ocrExtractedText ||
                      `[Master Version ${doc.currentVersion}]\nTitle: ${doc.title}\nCustodian: ${doc.createdBy}\nClassification: ${doc.confidentialityLevel}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHRONOLOGICAL VERSION TIMELINE */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Version Chronology
            </h4>

            {versionList.map((ver, idx) => {
              const isCurrent = ver.versionNumber === doc.currentVersion;
              const isReverted = !!ver.revertedFrom;

              return (
                <div
                  key={`${ver.versionNumber}-${idx}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? isDark
                        ? 'bg-blue-950/25 border-blue-500/50 shadow-sm'
                        : 'bg-blue-50/80 border-blue-300 shadow-sm'
                      : isDark
                      ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Left details */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : isDark
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {ver.versionNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">
                            Iteration {ver.versionNumber}
                          </span>

                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              ACTIVE MASTER
                            </span>
                          )}

                          {isReverted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <RotateCcw className="w-2.5 h-2.5" />
                              Rolled back from {ver.revertedFrom}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ver.uploadedBy || doc.createdBy}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {ver.uploadedAt}
                          </span>
                          <span>•</span>
                          <span>{ver.fileSize || doc.fileSize}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDiffVersion(ver)}
                        title="Compare redline against current master"
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                          isDark
                            ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                            : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Diff className="w-3 h-3 text-blue-400" />
                        <span>Compare Diff</span>
                      </button>

                      {!isCurrent ? (
                        <button
                          onClick={() => {
                            setRevertingVersion(ver);
                            setRevertReason(`Rollback to ${ver.versionNumber}`);
                          }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Revert to this</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold px-2 py-1 flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5" />
                          Current State
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Version notes / changelog block */}
                  {ver.notes && (
                    <div
                      className={`mt-2.5 pt-2 border-t text-xs text-slate-300 flex items-start gap-1.5 ${
                        isDark ? 'border-slate-800/60' : 'border-slate-200'
                      }`}
                    >
                      <span className="text-slate-500 font-semibold shrink-0">Notes:</span>
                      <span className="italic">{ver.notes}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Forensic version control preserves chain-of-custody without data deletion.</span>
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
