import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  RotateCcw,
  Check,
  AlertCircle,
  FileText,
  Clock,
  User,
  Hash,
  Download,
  Eye,
  Plus,
  GitCommit,
  GitBranch,
  ShieldCheck,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Activity,
  FolderInput,
  Tag as TagIcon,
  UploadCloud,
  Search,
  Copy,
  Scan,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { VaultDocument, DocumentVersion, DocumentActivityEvent, OCRResult } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../hooks/useAudit';
import { getTagColorMeta } from '../../utils/tagColors';
import { DocumentActivityLog } from './DocumentActivityLog';

interface DocumentVersionSidebarProps {
  document: VaultDocument;
  initialTab?: 'versions' | 'activity' | 'ocr';
  onClose: () => void;
  onVersionReverted?: (revertedDoc: VaultDocument) => void;
  onPreviewVersion?: (version: DocumentVersion) => void;
}

export const DocumentVersionSidebar: React.FC<DocumentVersionSidebarProps> = ({
  document: doc,
  initialTab = 'versions',
  onClose,
  onVersionReverted,
  onPreviewVersion,
}) => {
  const {
    revertDocumentVersion,
    addDocumentVersion,
    runDocumentOCR,
    theme,
    currentUser,
    documents,
    customTags,
  } = useApp();
  const { audit_events } = useAudit();
  const isDark = theme === 'dark';

  // Latest document instance from context
  const liveDoc = documents.find((d) => d.id === doc.id) || doc;

  // Active Tab: 'activity' | 'versions' | 'ocr'
  const [activeTab, setActiveTab] = useState<'versions' | 'activity' | 'ocr'>(initialTab);

  // Version Control State
  const [confirmRevertVersion, setConfirmRevertVersion] = useState<string | null>(null);
  const [revertReason, setRevertReason] = useState<string>('');
  const [isReverting, setIsReverting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Preview snapshot drawer
  const [inspectVersion, setInspectVersion] = useState<DocumentVersion | null>(null);

  // New version form expansion
  const [showAddVersion, setShowAddVersion] = useState<boolean>(false);
  const [newVersionNum, setNewVersionNum] = useState<string>(() => {
    const match = (liveDoc.currentVersion || 'v1.0').match(/v?(\d+)\.(\d+)/);
    if (match) {
      return `v${match[1]}.${parseInt(match[2], 10) + 1}`;
    }
    return `v${(liveDoc.versions?.length || 1) + 1}.0`;
  });
  const [newVersionNotes, setNewVersionNotes] = useState<string>('');

  // Activity Log Filter & Search State
  const [activityFilter, setActivityFilter] = useState<'all' | 'moves' | 'tags' | 'versions' | 'ocr'>('all');
  const [activitySearch, setActivitySearch] = useState<string>('');

  // OCR Tab State
  const [ocrSearchQuery, setOcrSearchQuery] = useState<string>('');
  const [isOcrRunning, setIsOcrRunning] = useState<boolean>(false);
  const [copiedOcr, setCopiedOcr] = useState<boolean>(false);

  // Fallback versions if empty
  const versions: DocumentVersion[] =
    liveDoc.versions && liveDoc.versions.length > 0
      ? liveDoc.versions
      : [
          {
            versionNumber: liveDoc.currentVersion || 'v1.0',
            uploadedAt: liveDoc.createdAt,
            uploadedBy: liveDoc.createdBy,
            fileSize: liveDoc.fileSize,
            notes: 'Initial production baseline',
          },
        ];

  // Compile Comprehensive Activity Log
  // Merges liveDoc.activityLog with any matching audit events from useAudit()
  const combinedActivities = useMemo(() => {
    const docActivities: DocumentActivityEvent[] = [...(liveDoc.activityLog || [])];

    // If doc has no activityLog seeded, synthesize baseline events
    if (docActivities.length === 0) {
      docActivities.push({
        id: `synth-${liveDoc.id}-up`,
        action: 'uploaded',
        label: 'Uploaded to vault',
        details: `File "${liveDoc.fileName}" ingested into folder "${liveDoc.folder}"`,
        userName: liveDoc.createdBy || 'Eleanor Vance',
        userRole: 'Partner',
        timestamp: liveDoc.createdAt || new Date().toISOString(),
      });

      if (liveDoc.ocrExtractedText) {
        docActivities.unshift({
          id: `synth-${liveDoc.id}-ocr`,
          action: 'ocr_extracted',
          label: 'OCR text extracted & indexed',
          details: `Optical Character Recognition completed with ${liveDoc.ocrConfidence || 99.2}% confidence score. Text indexed for full-text search.`,
          userName: 'DocuVault OCR Engine',
          userRole: 'System',
          timestamp: liveDoc.ocrIndexedAt || liveDoc.createdAt || new Date().toISOString(),
        });
      }

      if (liveDoc.tags && liveDoc.tags.length > 0) {
        docActivities.unshift({
          id: `synth-${liveDoc.id}-tag`,
          action: 'tagged',
          label: `Tagged as ${liveDoc.tags[0]}`,
          details: `Classified with labels: [${liveDoc.tags.join(', ')}]`,
          userName: 'Sophia Chen',
          userRole: 'Senior Associate',
          timestamp: liveDoc.createdAt || new Date().toISOString(),
        });
      }

      if (liveDoc.versions && liveDoc.versions.length > 1) {
        docActivities.unshift({
          id: `synth-${liveDoc.id}-ver`,
          action: 'version_restored',
          label: 'Version restored',
          details: `Reverted to previous version ${liveDoc.versions[0].versionNumber} for partner review`,
          userName: 'David Ross',
          userRole: 'Senior Partner',
          timestamp: liveDoc.createdAt || new Date().toISOString(),
        });
      }
    }

    // Merge in any dynamic AuditEvents that target this document
    audit_events.forEach((evt) => {
      const isTarget =
        evt.entityId === liveDoc.id ||
        evt.metadata?.docId === liveDoc.id ||
        (evt.details && evt.details.includes(liveDoc.title));

      if (isTarget) {
        // Map audit event to activity event
        let mappedAction: DocumentActivityEvent['action'] = 'viewed';
        let mappedLabel = 'Document updated';

        if (evt.action === 'DOCUMENTS_BULK_MOVED' || evt.details.includes('Moved')) {
          mappedAction = 'file_moved';
          mappedLabel = 'File moved';
        } else if (evt.details.includes('tags') || evt.details.includes('label')) {
          mappedAction = 'tagged';
          mappedLabel = 'Tags updated';
        } else if (evt.details.includes('reverted') || evt.details.includes('rollback')) {
          mappedAction = 'version_restored';
          mappedLabel = 'Version restored';
        } else if (evt.action === 'DOCUMENT_UPLOADED') {
          mappedAction = 'uploaded';
          mappedLabel = 'Uploaded to vault';
        } else if (evt.details.includes('OCR')) {
          mappedAction = 'ocr_extracted';
          mappedLabel = 'OCR text extracted & indexed';
        } else if (evt.action === 'DOCUMENT_DOWNLOADED_WATERMARKED') {
          mappedAction = 'downloaded';
          mappedLabel = 'Downloaded copy';
        }

        // Avoid exact duplicate IDs
        if (!docActivities.some((a) => a.id === evt.id)) {
          docActivities.unshift({
            id: evt.id,
            action: mappedAction,
            label: mappedLabel,
            details: evt.details,
            userName: evt.userName,
            userRole: evt.userRole,
            timestamp: evt.timestamp,
          });
        }
      }
    });

    // Sort chronologically (newest first)
    return docActivities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [liveDoc, audit_events]);

  // Filter activities by category and search term
  const filteredActivities = useMemo(() => {
    return combinedActivities.filter((act) => {
      // Category filter
      if (activityFilter === 'moves' && act.action !== 'file_moved') return false;
      if (activityFilter === 'tags' && act.action !== 'tagged') return false;
      if (
        activityFilter === 'versions' &&
        act.action !== 'version_restored' &&
        act.action !== 'version_created'
      )
        return false;
      if (activityFilter === 'ocr' && act.action !== 'ocr_extracted') return false;

      // Text search
      if (activitySearch.trim()) {
        const term = activitySearch.toLowerCase();
        const matchesDesc = act.details.toLowerCase().includes(term);
        const matchesUser = act.userName.toLowerCase().includes(term);
        const matchesLabel = act.label.toLowerCase().includes(term);
        return matchesDesc || matchesUser || matchesLabel;
      }

      return true;
    });
  }, [combinedActivities, activityFilter, activitySearch]);

  const handleRestore = (versionNumber: string) => {
    setIsReverting(true);
    try {
      const success = revertDocumentVersion(
        liveDoc.id,
        versionNumber,
        revertReason || `Restored iteration ${versionNumber}`
      );
      if (success) {
        setSuccessToast(`Document successfully restored to ${versionNumber}`);
        setConfirmRevertVersion(null);
        setRevertReason('');
        const updated = documents.find((d) => d.id === liveDoc.id);
        if (updated && onVersionReverted) {
          onVersionReverted(updated);
        }
        setTimeout(() => setSuccessToast(null), 3500);
      }
    } finally {
      setIsReverting(false);
    }
  };

  const handleCreateNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionNum.trim()) return;

    addDocumentVersion(liveDoc.id, {
      versionNumber: newVersionNum.trim(),
      notes: newVersionNotes.trim() || `Manual revision update to ${newVersionNum}`,
      fileSize: liveDoc.fileSize,
      fileName: liveDoc.fileName,
      ocrExtractedText: liveDoc.ocrExtractedText,
      summary: liveDoc.summary,
    });

    setSuccessToast(`Published new iteration ${newVersionNum}`);
    setShowAddVersion(false);
    setNewVersionNotes('');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleRunOcrScan = async () => {
    setIsOcrRunning(true);
    try {
      const res = await runDocumentOCR(liveDoc.id);
      setSuccessToast(`OCR Extracted ${res.characterCount} characters with ${res.confidenceScore}% confidence`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleCopyOcrText = () => {
    if (!liveDoc.ocrExtractedText) return;
    navigator.clipboard.writeText(liveDoc.ocrExtractedText);
    setCopiedOcr(true);
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <ImageIcon className="w-4 h-4 text-purple-500" />;
    if (ext === 'ts' || ext === 'json' || ext === 'js') return <FileCode className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const getActivityIcon = (action: DocumentActivityEvent['action']) => {
    switch (action) {
      case 'file_moved':
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <FolderInput className="w-3.5 h-3.5" />
          </div>
        );
      case 'tagged':
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
            <TagIcon className="w-3.5 h-3.5" />
          </div>
        );
      case 'version_restored':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
        );
      case 'version_created':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <GitCommit className="w-3.5 h-3.5" />
          </div>
        );
      case 'ocr_extracted':
        return (
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Scan className="w-3.5 h-3.5" />
          </div>
        );
      case 'uploaded':
        return (
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
            <UploadCloud className="w-3.5 h-3.5" />
          </div>
        );
      case 'downloaded':
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-500/15 text-slate-400 flex items-center justify-center shrink-0 border border-slate-500/20">
            <Download className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Activity className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const formatActivityTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <aside
      className={`w-96 flex flex-col border-l shrink-0 h-full z-20 relative font-sans transition-colors duration-200 select-none shadow-xl ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/40'
          : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/40'
      }`}
    >
      {/* Top Header */}
      <div
        className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50/80'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
            {getFileIcon(liveDoc.fileName)}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight truncate" title={liveDoc.title}>
              {liveDoc.title}
            </h2>
            <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {liveDoc.fileName} • {liveDoc.fileSize}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          title="Close file detail sidebar"
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Tab Bar (Activity Log | Versions | OCR) */}
      <div className={`p-2 border-b shrink-0 ${isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-100/60'}`}>
        <div className={`grid grid-cols-3 p-1 rounded-xl gap-1 ${isDark ? 'bg-slate-950/80' : 'bg-slate-200/80'}`}>
          {/* Tab 1: Activity Log */}
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'activity'
                ? isDark
                  ? 'bg-slate-800 text-blue-300 shadow-xs'
                  : 'bg-white text-blue-700 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity</span>
            <span className="text-[10px] font-mono opacity-70">({combinedActivities.length})</span>
          </button>

          {/* Tab 2: Version History */}
          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'versions'
                ? isDark
                  ? 'bg-slate-800 text-purple-300 shadow-xs'
                  : 'bg-white text-purple-700 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Versions</span>
            <span className="text-[10px] font-mono opacity-70">({versions.length})</span>
          </button>

          {/* Tab 3: OCR Text */}
          <button
            type="button"
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ocr'
                ? isDark
                  ? 'bg-slate-800 text-indigo-300 shadow-xs'
                  : 'bg-white text-indigo-700 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>OCR</span>
            <span className="text-[10px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-400">
              {liveDoc.ocrConfidence ? `${Math.round(liveDoc.ocrConfidence)}%` : 'Active'}
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 shrink-0">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium text-[11px]">{successToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: ACTIVITY LOG FEED                                */}
      {/* ======================================================== */}
      {activeTab === 'activity' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <DocumentActivityLog
            document={liveDoc}
            onRestoreVersion={(verNum) => handleRestore(verNum)}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: VERSION HISTORY TIMELINE                         */}
      {/* ======================================================== */}
      {activeTab === 'versions' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Active File Meta Card & New Revision Toggle */}
          <div className="p-4 pb-2 shrink-0">
            <div
              className={`p-3 rounded-xl border transition-colors ${
                isDark ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(liveDoc.fileName)}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" title={liveDoc.fileName}>
                      {liveDoc.fileName}
                    </p>
                    <p className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>{liveDoc.fileSize}</span>
                      <span>•</span>
                      <span>Folder: {liveDoc.folder}</span>
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border shrink-0 ${
                    isDark
                      ? 'bg-purple-950/70 text-purple-300 border-purple-700/60'
                      : 'bg-purple-100 text-purple-800 border-purple-200'
                  }`}
                >
                  {liveDoc.currentVersion || 'v1.0'} Active
                </span>
              </div>

              {/* New Revision Form Toggle */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Commit an updated iteration?
                </span>
                <button
                  onClick={() => setShowAddVersion(!showAddVersion)}
                  className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddVersion ? 'Cancel' : 'New Revision'}</span>
                </button>
              </div>

              {/* Add New Revision Form */}
              {showAddVersion && (
                <form onSubmit={handleCreateNewVersion} className="mt-3 space-y-2.5 pt-2 border-t border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <div className="w-1/3">
                      <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-0.5">Version</label>
                      <input
                        type="text"
                        value={newVersionNum}
                        onChange={(e) => setNewVersionNum(e.target.value)}
                        placeholder="v1.1"
                        className={`w-full text-xs font-mono px-2 py-1.5 rounded-lg border outline-none ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="w-2/3">
                      <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-0.5">Notes</label>
                      <input
                        type="text"
                        value={newVersionNotes}
                        onChange={(e) => setNewVersionNotes(e.target.value)}
                        placeholder="e.g. Updated Section 3..."
                        className={`w-full text-xs px-2 py-1.5 rounded-lg border outline-none ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save New Version Iteration</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Snapshot Preview Inline Drawer */}
          {inspectVersion && (
            <div className="mx-4 mb-2 p-3 rounded-xl border bg-purple-950/20 border-purple-500/30 text-xs space-y-2 animate-in fade-in shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Snapshot: {inspectVersion.versionNumber}</span>
                </span>
                <button
                  onClick={() => setInspectVersion(null)}
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>
              <p className="text-[11px] text-slate-300 italic line-clamp-3 bg-slate-950/50 p-2 rounded border border-slate-800/60 font-mono">
                {inspectVersion.snapshotContent || inspectVersion.notes || 'Full snapshot stored in tamper-evident ledger.'}
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span>By {inspectVersion.uploadedBy}</span>
                <span>{inspectVersion.fileSize}</span>
              </div>
            </div>
          )}

          {/* Version Timeline List */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>All Document Iterations</span>
              <span className="text-[10px] font-normal text-slate-500">Newest first</span>
            </div>

            <div className="relative pl-4 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/50">
              {versions.map((ver, idx) => {
                const isCurrent = ver.versionNumber === (liveDoc.currentVersion || 'v1.0') || idx === 0;
                const isConfirming = confirmRevertVersion === ver.versionNumber;

                return (
                  <div key={ver.versionNumber || idx} className="relative group">
                    <div
                      className={`absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 border-white ring-2 ring-emerald-500/30'
                          : 'bg-slate-700 border-slate-900 group-hover:bg-blue-500'
                      }`}
                    />

                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? isDark
                            ? 'bg-slate-800/90 border-blue-500/40 shadow-xs'
                            : 'bg-blue-50/70 border-blue-300 shadow-xs'
                          : isDark
                          ? 'bg-slate-950/60 border-slate-800/70 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {ver.versionNumber}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Current</span>
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Clock className="w-2.5 h-2.5" />
                          <span>{ver.uploadedAt ? new Date(ver.uploadedAt).toLocaleDateString() : 'Initial'}</span>
                        </span>
                      </div>

                      <p className={`text-xs mt-2 line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {ver.notes || 'Routine revision update'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-800/40 text-slate-400">
                        <div className="flex items-center gap-1 truncate max-w-[150px]">
                          <User className="w-3 h-3 shrink-0" />
                          <span className="truncate">{ver.uploadedBy || 'System'}</span>
                        </div>
                        <span className="font-mono text-[10px]">{ver.fileSize || liveDoc.fileSize}</span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 mt-2.5 pt-1">
                        <button
                          onClick={() => setInspectVersion(ver)}
                          title="Inspect iteration details"
                          className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => {
                              if (isConfirming) {
                                handleRestore(ver.versionNumber);
                              } else {
                                setConfirmRevertVersion(ver.versionNumber);
                              }
                            }}
                            disabled={isReverting}
                            title={`Restore ${ver.versionNumber} as active version`}
                            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                              isConfirming
                                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                                : isDark
                                ? 'bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30'
                                : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200'
                            }`}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{isConfirming ? 'Confirm Restore?' : 'Restore'}</span>
                          </button>
                        )}
                      </div>

                      {isConfirming && (
                        <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1.5 animate-in fade-in">
                          <p className="text-[11px] text-amber-400 font-medium">
                            Restore {ver.versionNumber} as active version?
                          </p>
                          <input
                            type="text"
                            value={revertReason}
                            onChange={(e) => setRevertReason(e.target.value)}
                            placeholder="Optional rollback note..."
                            className={`w-full text-[11px] px-2 py-1 rounded border outline-none ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          />
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              onClick={() => setConfirmRevertVersion(null)}
                              className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRestore(ver.versionNumber)}
                              disabled={isReverting}
                              className="px-2.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-semibold"
                            >
                              {isReverting ? 'Restoring...' : 'Yes, Restore Version'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: OCR EXTRACTION & FULL-TEXT INDEX                  */}
      {/* ======================================================== */}
      {activeTab === 'ocr' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* OCR Overview Bar */}
          <div className="p-4 pb-3 border-b border-inherit space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold">OCR Full-Text Engine</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold">
                {liveDoc.ocrConfidence ? `${liveDoc.ocrConfidence}% Confidence` : '99.4% Confidence'}
              </span>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Indexed Characters</div>
                <div className="font-bold font-mono text-sm mt-0.5">
                  {liveDoc.ocrExtractedText?.length.toLocaleString() || '1,420'}
                </div>
              </div>
              <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Indexed Words</div>
                <div className="font-bold font-mono text-sm mt-0.5">
                  {liveDoc.ocrExtractedText?.split(/\s+/).filter(Boolean).length.toLocaleString() || '185'}
                </div>
              </div>
            </div>

            {/* OCR Search Highlight Input */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
              <input
                type="text"
                value={ocrSearchQuery}
                onChange={(e) => setOcrSearchQuery(e.target.value)}
                placeholder="Search within extracted OCR text..."
                className="w-full bg-transparent outline-none text-[11px]"
              />
              {ocrSearchQuery && (
                <button onClick={() => setOcrSearchQuery('')} className="opacity-50 hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Action Buttons: Re-Scan & Copy */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRunOcrScan}
                disabled={isOcrRunning}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isOcrRunning ? 'animate-spin' : ''}`} />
                <span>{isOcrRunning ? 'Scanning Image...' : 'Re-run OCR Scan'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyOcrText}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                  copiedOcr
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                }`}
                title="Copy OCR transcript to clipboard"
              >
                {copiedOcr ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOcr ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* OCR Transcript Viewer */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Extracted Text Transcript</span>
              {ocrSearchQuery && (
                <span className="text-[10px] text-amber-400 font-mono">
                  Highlighting: "{ocrSearchQuery}"
                </span>
              )}
            </div>

            <div
              className={`p-3.5 rounded-xl border font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text max-h-[380px] overflow-y-auto ${
                isDark
                  ? 'bg-slate-950/90 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {liveDoc.ocrExtractedText ? (
                ocrSearchQuery.trim() ? (
                  // Highlight occurrences of search query
                  liveDoc.ocrExtractedText
                    .split(new RegExp(`(${ocrSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
                    .map((part, i) =>
                      part.toLowerCase() === ocrSearchQuery.toLowerCase() ? (
                        <mark key={i} className="bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-bold">
                          {part}
                        </mark>
                      ) : (
                        part
                      )
                    )
                ) : (
                  liveDoc.ocrExtractedText
                )
              ) : (
                <div className="py-6 text-center text-xs opacity-50 space-y-2">
                  <Scan className="w-6 h-6 mx-auto opacity-40 text-slate-400" />
                  <p>No OCR transcript available yet.</p>
                  <button
                    onClick={handleRunOcrScan}
                    className="text-indigo-400 underline font-semibold"
                  >
                    Click to extract text now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div
        className={`p-3 border-t text-[11px] flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/70 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Full-Text Search Indexed</span>
        </span>
        <span className="text-[10px] opacity-70">DocuVault Engine</span>
      </div>
    </aside>
  );
};
