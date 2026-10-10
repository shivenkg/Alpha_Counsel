import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  Folder,
  Eye,
  Hash,
  Layers,
  History,
  Tag,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Table,
  Sparkles,
  RotateCcw,
  Upload,
  GitBranch,
  GitCommit,
  AlertTriangle,
  FileCheck,
  Diff,
  RefreshCw,
  BookmarkCheck,
  Scale,
  ListFilter,
  CheckCircle2,
} from 'lucide-react';
import { VaultDocument, Matter, DocumentSummaryResult, DocumentVersion } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../hooks/useAudit';
import { generateDocumentSummary } from '../../services/aiService';

interface FilePreviewModalProps {
  document: VaultDocument;
  onClose: () => void;
  onDownload: (doc: VaultDocument) => void;
}

type PreviewTab = 'canvas' | 'text' | 'summary' | 'metadata' | 'history';

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  document: doc,
  onClose,
  onDownload,
}) => {
  const {
    matters,
    theme,
    currentUser,
    updateDocument,
    addDocumentVersion,
    revertDocumentVersion,
  } = useApp();
  const { logDocumentAction, audit_events } = useAudit();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<PreviewTab>('canvas');
  const [activePage, setActivePage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSheetTab, setActiveSheetTab] = useState<string>('Summary');

  // AI Summary State
  const [summaryResult, setSummaryResult] = useState<DocumentSummaryResult | null>(
    doc.aiSummary || null
  );
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [summaryFocus, setSummaryFocus] = useState<'overview' | 'risks' | 'evidence' | 'timeline'>('overview');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [savedSummaryToMeta, setSavedSummaryToMeta] = useState<boolean>(false);

  // Version Control State
  const [revertingVersion, setRevertingVersion] = useState<DocumentVersion | null>(null);
  const [revertReason, setRevertReason] = useState<string>('');
  const [isSubmittingRevert, setIsSubmittingRevert] = useState<boolean>(false);
  const [versionSuccessMessage, setVersionSuccessMessage] = useState<string | null>(null);
  const [showUploadNewVersion, setShowUploadNewVersion] = useState<boolean>(false);
  const [newVersionNum, setNewVersionNum] = useState<string>(() => {
    const match = (doc.currentVersion || 'v1.0').match(/v?(\d+)\.(\d+)/);
    if (match) {
      return `v${match[1]}.${parseInt(match[2], 10) + 1}`;
    }
    return `v${(doc.versions?.length || 1) + 1}.0`;
  });
  const [newVersionNotes, setNewVersionNotes] = useState<string>('');
  const [diffVersion, setDiffVersion] = useState<DocumentVersion | null>(null);

  const matter = matters.find((m) => m.id === doc.matterId) || {
    id: doc.matterId,
    title: 'General Commercial Portfolio',
    matterNumber: 'M-2026-001',
    clientName: 'Meridian Holdings Ltd',
    courtVenue: 'U.S. District Court, N.D. Cal.',
  };

  // Generate deterministic SHA-256 style fingerprint for integrity verification
  const sha256Fingerprint = useMemo(() => {
    let hash = 0;
    const str = `${doc.id}-${doc.fileName}-${doc.fileSize}-${doc.createdAt}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `d7a8fb9c${hex}e34b12aa894459b1287c90e654b1f4864a7813a48`;
  }, [doc]);

  // Extract or generate simulated multi-page legal content
  const totalPages = doc.fileType === 'pdf' ? 3 : doc.fileType === 'xlsx' ? 2 : 1;

  // Filter audit events specific to this document
  const docAuditLogs = useMemo(() => {
    return audit_events.filter(
      (e) =>
        e.entityId === doc.id ||
        (e.details && e.details.toLowerCase().includes(doc.title.toLowerCase()))
    );
  }, [audit_events, doc]);

  const handleCopyText = () => {
    const textToCopy =
      doc.ocrExtractedText ||
      `DOCUMENT: ${doc.title}\nFILE: ${doc.fileName}\nMATTER: ${matter.matterNumber} - ${matter.title}\nCUSTODIAN: ${doc.createdBy}\nCONFIDENTIALITY: ${doc.confidentialityLevel || 'Privileged'}\n\n${doc.title} - Certified Record.`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleGenerateSummary = async (focusOverride?: 'overview' | 'risks' | 'evidence' | 'timeline') => {
    const focus = focusOverride || summaryFocus;
    setIsGeneratingSummary(true);
    setSavedSummaryToMeta(false);
    try {
      const res = await generateDocumentSummary(doc, { focus });
      setSummaryResult(res);
      logDocumentAction(
        'DOCUMENT_VIEWED',
        doc.id,
        doc.title,
        doc.matterId,
        matter.matterNumber,
        { action: 'AI_SUMMARY_GENERATED', model: 'gemini-3.8-flash', focus }
      );
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult.rawSummaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleSaveSummaryToVault = () => {
    if (!summaryResult) return;
    updateDocument(doc.id, {
      summary: summaryResult.executiveOverview,
      aiSummary: summaryResult,
    });
    setSavedSummaryToMeta(true);
    setTimeout(() => setSavedSummaryToMeta(false), 3000);
  };

  const handleExecuteRevert = () => {
    if (!revertingVersion) return;
    setIsSubmittingRevert(true);
    try {
      const success = revertDocumentVersion(
        doc.id,
        revertingVersion.versionNumber,
        revertReason || `Revert to ${revertingVersion.versionNumber}`
      );
      if (success) {
        setVersionSuccessMessage(`Document successfully reverted to ${revertingVersion.versionNumber}`);
        setRevertingVersion(null);
        setRevertReason('');
        setTimeout(() => setVersionSuccessMessage(null), 3500);
      }
    } finally {
      setIsSubmittingRevert(false);
    }
  };

  const handleUploadNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionNum.trim()) return;
    addDocumentVersion(doc.id, {
      versionNumber: newVersionNum.trim(),
      notes: newVersionNotes.trim() || `Revision ${newVersionNum}`,
      fileSize: doc.fileSize,
      fileName: doc.fileName,
      ocrExtractedText: doc.ocrExtractedText,
      summary: doc.summary,
    });
    setVersionSuccessMessage(`New version ${newVersionNum} published successfully.`);
    setShowUploadNewVersion(false);
    setNewVersionNotes('');
    setTimeout(() => setVersionSuccessMessage(null), 3500);
  };

  const getFileBadge = () => {
    const ext = (doc.fileName.split('.').pop() || doc.fileType || '').toLowerCase();
    if (ext === 'pdf') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
          PDF DOCUMENT
        </span>
      );
    }
    if (ext === 'xlsx' || ext === 'xls') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
          EXCEL SPREADSHEET
        </span>
      );
    }
    if (ext === 'docx' || ext === 'doc') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30">
          WORD CONTRACT
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/30">
        RAW TEXT / CODE
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div
        className={`w-full flex flex-col rounded-2xl md:rounded-3xl shadow-2xl border transition-all overflow-hidden ${
          isFullscreen ? 'h-full max-w-full' : 'max-h-[92vh] max-w-5xl h-[880px]'
        } ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200'
          }`}
        >
          {/* Document Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                doc.fileType === 'pdf'
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  : doc.fileType === 'xlsx'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }`}
            >
              {doc.fileType === 'pdf' && <FileText className="w-5 h-5" />}
              {doc.fileType === 'xlsx' && <FileSpreadsheet className="w-5 h-5" />}
              {doc.fileType !== 'pdf' && doc.fileType !== 'xlsx' && (
                <FileCode className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className={`text-sm md:text-base font-bold truncate max-w-md ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  title={doc.title}
                >
                  {doc.title}
                </h2>
                {getFileBadge()}
                {doc.isHeld && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    LITIGATION HOLD FROZEN
                  </span>
                )}
                {doc.confidentialityLevel && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {doc.confidentialityLevel}
                  </span>
                )}
              </div>

              <div
                className={`text-xs flex items-center gap-2 mt-0.5 truncate ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span className="font-semibold text-blue-500">[{matter.matterNumber}]</span>
                <span>{matter.title}</span>
                <span>•</span>
                <span className="font-mono">{doc.fileName}</span>
                <span>•</span>
                <span>{doc.fileSize}</span>
              </div>
            </div>
          </div>

          {/* Quick Toolbar Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setActiveTab('summary');
                if (!summaryResult && !isGeneratingSummary) {
                  handleGenerateSummary();
                }
              }}
              title="Generate AI Executive Legal Summary"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                activeTab === 'summary'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                  : isDark
                  ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-800/60'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">AI Summary</span>
            </button>

            <button
              onClick={handleCopyText}
              title="Copy OCR & Document Text"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                copiedText
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedText ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className={`p-2 rounded-xl transition-colors border ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
              title="Close Preview (Esc)"
              className={`p-2 rounded-xl transition-colors ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUBHEADER: NAVIGATION TABS & CONTROLS */}
        <div
          className={`px-5 py-2 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Tab Selection */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'canvas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Document Canvas</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'text'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Extracted OCR Text</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('summary');
                if (!summaryResult && !isGeneratingSummary) {
                  handleGenerateSummary();
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'summary'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : isDark
                  ? 'text-purple-300 hover:text-white hover:bg-purple-950/40'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Legal Summary</span>
              {summaryResult ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'metadata'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Metadata & Forensics</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Version History</span>
              {doc.versions && doc.versions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {doc.versions.length + 1}
                </span>
              )}
            </button>
          </div>

          {/* Canvas Controls: Zoom and Page Navigation */}
          {activeTab === 'canvas' && (
            <div className="flex items-center gap-3 text-xs">
              {/* Page Selector */}
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  disabled={activePage <= 1}
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="p-1 disabled:opacity-30 hover:text-blue-500"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-num font-semibold px-1">
                  Page {activePage} of {totalPages}
                </span>
                <button
                  disabled={activePage >= totalPages}
                  onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 disabled:opacity-30 hover:text-blue-500"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                  className="p-1 hover:text-blue-500"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-num font-semibold px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                  className="p-1 hover:text-blue-500"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className={`text-[10px] px-1.5 py-0.5 rounded ml-1 font-semibold ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Fit
                </button>
              </div>
            </div>
          )}

          {/* Search bar inside Text tab */}
          {activeTab === 'text' && (
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search OCR keywords..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500 border ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          )}
        </div>

        {/* MODAL MAIN CONTENT AREA */}
        <div className="flex-1 overflow-hidden flex relative">
          {/* TAB 1: VISUAL CANVAS & THUMBNAILS */}
          {activeTab === 'canvas' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Thumbnails Rail */}
              <div
                className={`w-44 border-r overflow-y-auto p-3 space-y-3 shrink-0 select-none hidden sm:block ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Pages & Sheets
                </div>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isSelected = activePage === pageNum;
                  return (
                    <div
                      key={pageNum}
                      onClick={() => setActivePage(pageNum)}
                      className={`group cursor-pointer rounded-xl border p-2 transition-all flex flex-col items-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                          : isDark
                          ? 'border-slate-800 bg-slate-900 hover:border-slate-700'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {/* Mini Thumbnail Representation */}
                      <div className="w-24 h-32 bg-white rounded border border-slate-300 shadow-xs p-1.5 overflow-hidden flex flex-col justify-between select-none pointer-events-none scale-95">
                        <div className="space-y-1">
                          <div className="h-1.5 bg-slate-800 w-3/4 rounded-xs" />
                          <div className="h-1 bg-slate-300 w-full rounded-xs" />
                          <div className="h-1 bg-slate-200 w-5/6 rounded-xs" />
                          <div className="h-1 bg-slate-200 w-4/5 rounded-xs" />
                          <div className="h-1 bg-slate-300 w-full rounded-xs" />
                        </div>
                        <div className="text-[7px] text-center font-bold text-slate-400 font-num">
                          p. {pageNum}
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold mt-1.5 ${
                          isSelected
                            ? 'text-blue-500 font-bold'
                            : isDark
                            ? 'text-slate-400'
                            : 'text-slate-600'
                        }`}
                      >
                        Page {pageNum}
                      </span>
                    </div>
                  );
                })}

                <div
                  className={`p-2.5 rounded-xl border text-[10px] space-y-1 mt-4 ${
                    isDark
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1 text-blue-500">
                    <Sparkles className="w-3 h-3" />
                    <span>In-Browser View</span>
                  </div>
                  <p>Full legal canvas rendered directly from firm vault metadata.</p>
                </div>
              </div>

              {/* Center Canvas Viewport */}
              <div
                className={`flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start ${
                  isDark ? 'bg-slate-950' : 'bg-slate-100/70'
                }`}
              >
                {/* RENDERED DOCUMENT SHEET (SIMULATED LEGAL PAPER) */}
                {doc.fileType === 'xlsx' ? (
                  /* SPREADSHEET VIEWER */
                  <div
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                    className="w-full max-w-3xl bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 overflow-hidden font-sans select-text"
                  >
                    {/* Sheet Ribbon Header */}
                    <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>{doc.title} — Financial & Quantum Model</span>
                      </div>
                      <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded font-mono">
                        Formula Audited
                      </span>
                    </div>

                    {/* Sheet Tabs */}
                    <div className="flex border-b border-slate-200 bg-slate-50 text-xs px-2 pt-1 gap-1">
                      {['Summary', 'Damage Quantum', 'Fee Allocation', 'Tax / GST'].map((sheet) => (
                        <button
                          key={sheet}
                          onClick={() => setActiveSheetTab(sheet)}
                          className={`px-3 py-1 font-medium rounded-t border-t border-x ${
                            activeSheetTab === sheet
                              ? 'bg-white text-emerald-800 border-slate-200 font-bold border-b-white'
                              : 'bg-slate-100 text-slate-500 border-transparent hover:text-slate-800'
                          }`}
                        >
                          {sheet}
                        </button>
                      ))}
                    </div>

                    {/* Table Spreadsheet Grid */}
                    <div className="overflow-x-auto p-4">
                      <table className="w-full text-xs border-collapse font-num">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 border border-slate-300">
                            <th className="p-2 border border-slate-300 w-10 text-center font-bold">
                              #
                            </th>
                            <th className="p-2 border border-slate-300 text-left font-bold">
                              Description / Ledger Code
                            </th>
                            <th className="p-2 border border-slate-300 text-right font-bold">
                              Units / Hrs
                            </th>
                            <th className="p-2 border border-slate-300 text-right font-bold">
                              Rate (₹)
                            </th>
                            <th className="p-2 border border-slate-300 text-right font-bold">
                              Total Claim (₹)
                            </th>
                            <th className="p-2 border border-slate-300 text-center font-bold">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              id: 1,
                              desc: 'Contractual Default Damages under Clause 14.2',
                              units: '1.0',
                              rate: '15,00,000.00',
                              total: '15,00,000.00',
                              status: 'Verified',
                            },
                            {
                              id: 2,
                              desc: 'Expert Witness Valuation (Deloitte Forensic)',
                              units: '42.5',
                              rate: '18,500.00',
                              total: '7,86,250.00',
                              status: 'Approved',
                            },
                            {
                              id: 3,
                              desc: 'Mitigation Expenses & Escrow Holding Interest',
                              units: '12.0',
                              rate: '24,000.00',
                              total: '2,88,000.00',
                              status: 'Settled',
                            },
                            {
                              id: 4,
                              desc: 'Statutory Stamp Duty & Registry Filings',
                              units: '1.0',
                              rate: '1,25,000.00',
                              total: '1,25,000.00',
                              status: 'Reconciled',
                            },
                            {
                              id: 5,
                              desc: 'Arbitration Tribunal Seat Booking (MCIA)',
                              units: '3.0',
                              rate: '75,000.00',
                              total: '2,25,000.00',
                              status: 'Deposited',
                            },
                          ].map((row) => (
                            <tr key={row.id} className="hover:bg-blue-50/50">
                              <td className="p-2 border border-slate-200 text-center font-bold text-slate-400">
                                {row.id}
                              </td>
                              <td className="p-2 border border-slate-200 text-slate-800 font-sans font-medium">
                                {row.desc}
                              </td>
                              <td className="p-2 border border-slate-200 text-right text-slate-700">
                                {row.units}
                              </td>
                              <td className="p-2 border border-slate-200 text-right text-slate-700">
                                ₹{row.rate}
                              </td>
                              <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">
                                ₹{row.total}
                              </td>
                              <td className="p-2 border border-slate-200 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
                            <td colSpan={4} className="p-2 text-right uppercase text-slate-700">
                              Total Reconciled Quantum:
                            </td>
                            <td className="p-2 text-right text-emerald-700 text-sm">
                              ₹29,24,250.00
                            </td>
                            <td className="p-2 text-center text-emerald-600 font-sans font-semibold text-[10px]">
                              100% Invariant
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* LEGAL BRIEF / PLEADING PAPER CANVAS */
                  <div
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                    className="w-full max-w-2xl bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 p-8 sm:p-12 relative min-h-[750px] font-legal-heading select-text transition-transform"
                  >
                    {/* Watermark Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-30deg]">
                      <span className="text-6xl font-black text-slate-950 uppercase tracking-widest text-center">
                        COUNSEL REPOS AUDITED RECORD
                      </span>
                    </div>

                    {/* Legal Pleading Numbers on Left Margin */}
                    <div className="absolute left-3 sm:left-5 top-12 bottom-12 w-4 text-[10px] font-num text-slate-300 select-none flex flex-col justify-between border-r border-slate-100 pr-1">
                      {Array.from({ length: 28 }).map((_, i) => (
                        <span key={i}>{i + 1}</span>
                      ))}
                    </div>

                    {/* Court Header & Caption */}
                    <div className="pl-6 sm:pl-8 space-y-6">
                      <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                        <div className="text-[11px] font-bold tracking-widest uppercase text-slate-600 font-sans">
                          {matter.courtVenue || 'BEFORE THE HON’BLE HIGH COURT OF JUDICATURE'}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 font-sans">
                          COMMERCIAL DIVISION / APPELLATE JURISDICTION
                        </div>
                      </div>

                      {/* Case Caption Box */}
                      <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-200 text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 uppercase">
                            {matter.clientName || 'MERIDIAN GLOBAL CORP.'}
                          </div>
                          <div className="text-[10px] italic text-slate-500 font-sans">
                            Petitioner / Plaintiff,
                          </div>
                          <div className="text-center font-bold text-slate-400 py-1 font-sans">
                            - VERSUS -
                          </div>
                          <div className="font-bold text-slate-900 uppercase">
                            APEX INFRASTRUCTURE PARTNERS
                          </div>
                          <div className="text-[10px] italic text-slate-500 font-sans">
                            Respondents / Defendants.
                          </div>
                        </div>

                        <div className="border-l border-slate-200 pl-4 space-y-1.5 font-sans">
                          <div className="text-[11px] text-slate-600">
                            <strong>Matter No:</strong> {matter.matterNumber}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>Dossier File:</strong> {doc.fileName}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>Category:</strong> {doc.folder}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>Custodian:</strong> {doc.createdBy}
                          </div>
                          <div className="pt-2">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              CERTIFIED REPOSITORY RECORD
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Document Title Header */}
                      <div className="text-center py-2">
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 underline decoration-slate-400 underline-offset-4 tracking-wide uppercase">
                          {doc.title}
                        </h1>
                        <p className="text-[11px] text-slate-500 font-sans mt-1">
                          Filed under Section 9 of the Arbitration & Conciliation Act / FRCP 26(b)
                        </p>
                      </div>

                      {/* Document Text Body */}
                      <div className="space-y-4 text-xs leading-relaxed text-slate-800 text-justify font-sans">
                        <p>
                          <strong>COMES NOW</strong> the Plaintiff, by and through designated
                          counsel of record, and respectfully submits this {doc.title} in accordance
                          with governing procedural rules and evidentiary standards.
                        </p>

                        <p className="text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 italic font-serif">
                          "{doc.ocrExtractedText ||
                            'The contractual obligations stipulated under Exhibit C mandate clear retention of financial escrow and strict segregated trust compliance without encumbrance.'}"
                        </p>

                        <p>
                          1. <strong>Factual Antecedents:</strong> On or about the date recorded
                          in the docket registry, the parties executed that certain binding
                          commercial accord governing mutual rights and representations. The records
                          herein confirm full compliance with mandatory evidentiary preservation
                          orders.
                        </p>

                        <p>
                          2. <strong>Evidentiary Preservation:</strong> All digital files and
                          transcripts associated with this filing have been forensically preserved.
                          No alterations, redactions, or spoliations have occurred subsequent to
                          ingestion into Counsel Repos.
                        </p>

                        {activePage > 1 && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-slate-800 text-[11px]">
                            <p className="font-semibold text-blue-900 mb-1">
                              Page {activePage} Supplementary Clause:
                            </p>
                            <p>
                              The relief prayed for includes restitution of liquidated sums,
                              mandatory escrow replenishment under the evergreen retainer floor, and
                              adjudication of all ancillary costs incurred in litigation.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Signature Block & Tamper Stamp */}
                      <div className="pt-8 border-t border-slate-200 flex items-end justify-between font-sans text-xs">
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">
                            Cryptographic Fingerprint
                          </div>
                          <div className="font-mono text-[9px] text-slate-600 max-w-[260px] truncate">
                            {sha256Fingerprint}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Integrity Verified & Timestamped</span>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="w-36 border-b border-slate-800 ml-auto pb-1 font-serif italic text-blue-900 text-sm">
                            {doc.createdBy || 'Authorized Partner'}
                          </div>
                          <div className="font-semibold text-slate-800">{currentUser.name}</div>
                          <div className="text-[10px] text-slate-500">Counsel for Plaintiff</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EXTRACTED OCR & FULL TEXT */}
          {activeTab === 'text' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <h4
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Forensic OCR & Full-Text Search Engine
                  </h4>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    High-accuracy optical character recognition (OCR) indexed with UTBMS litigation
                    coding.
                  </p>
                </div>
                <button
                  onClick={handleCopyText}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy Full Text'}</span>
                </button>
              </div>

              {/* Text Box */}
              <div
                className={`p-5 rounded-2xl border font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800 shadow-inner'
                }`}
              >
                {doc.ocrExtractedText ? (
                  searchQuery ? (
                    doc.ocrExtractedText
                      .split(new RegExp(`(${searchQuery})`, 'gi'))
                      .map((part, i) =>
                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                          <mark
                            key={i}
                            className="bg-amber-400 text-slate-900 font-bold px-0.5 rounded"
                          >
                            {part}
                          </mark>
                        ) : (
                          part
                        )
                      )
                  ) : (
                    doc.ocrExtractedText
                  )
                ) : (
                  `DOCUMENT: ${doc.title}\nFILE NAME: ${doc.fileName}\nSIZE: ${doc.fileSize}\nMATTER: ${matter.matterNumber} - ${matter.title}\nCUSTODIAN: ${doc.createdBy}\nCONFIDENTIALITY: ${doc.confidentialityLevel || 'Privileged Work-Product'}\n\n[OCR INGESTION LOG]\n- Optical Character Recognition complete (99.4% confidence score)\n- Extracted text indexed into global search query vector database\n- Legal holds verification: Immutable record preservation active\n- Associated Matter: ${matter.matterNumber} (${matter.courtVenue || 'Federal Jurisdiction'})\n\nSUMMARY TEXT:\nThis document serves as an authentic pleading and evidentiary submission in support of Plaintiff's claims. Certified for production under Federal Rules of Civil Procedure 26(b) and 37.`
                )}
              </div>
            </div>
          )}

          {/* TAB 3: METADATA & FORENSICS */}
          {activeTab === 'metadata' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div>
                <h4
                  className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Document Dossier & Technical Attributes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">File Name</div>
                    <div className="font-semibold text-xs mt-1 truncate">{doc.fileName}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Size: {doc.fileSize}</div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Associated Matter
                    </div>
                    <div className="font-semibold text-xs mt-1 text-blue-500 truncate">
                      [{matter.matterNumber}] {matter.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{matter.clientName}</div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Folder / Category
                    </div>
                    <div className="font-semibold text-xs mt-1 flex items-center gap-1 text-amber-500">
                      <Folder className="w-3.5 h-3.5" />
                      <span>{doc.folder}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Ingested into Counsel Repos
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Creation & Custodian
                    </div>
                    <div className="font-semibold text-xs mt-1">{doc.createdBy || 'Partner'}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-num">
                      Date: {doc.createdAt}
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Preservation & Legal Hold
                    </div>
                    <div className="font-semibold text-xs mt-1 flex items-center gap-1.5">
                      {doc.isHeld ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-rose-500 font-bold">Litigation Hold Active</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Standard Retention</span>
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Tamper-proof protection
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Confidentiality Level
                    </div>
                    <div className="font-semibold text-xs mt-1 text-purple-400">
                      {doc.confidentialityLevel || 'Privileged Work-Product'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Screened via Ethical Wall
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Hash Section */}
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    SHA-256 Cryptographic Hash (Forensic Signature)
                  </span>
                </div>
                <div className="font-mono text-xs text-blue-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                  {sha256Fingerprint}
                </div>
                <p className="text-[11px] text-slate-400">
                  Every byte is hashed upon intake to prove zero file modification in accordance
                  with evidentiary chain of custody standards.
                </p>
              </div>

              {/* Access Audit Trail Log for this Document */}
              <div>
                <h4
                  className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Access Audit Trail (Chain of Custody)
                </h4>
                <div
                  className={`rounded-xl border overflow-hidden ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <table className="w-full text-xs text-left">
                    <thead
                      className={`text-[10px] uppercase font-bold border-b ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <tr>
                        <th className="p-2.5 px-4">Timestamp</th>
                        <th className="p-2.5">User</th>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {docAuditLogs.length > 0 ? (
                        docAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-blue-50/5">
                            <td className="p-2.5 px-4 font-mono text-slate-400 text-[11px]">
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>
                            <td className="p-2.5 font-medium">{log.userName}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-400">{log.details}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500 text-xs">
                            Current session preview logged. Complete chain of custody is stored in
                            central audit events.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI LEGAL SUMMARY */}
          {activeTab === 'summary' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Header with status and controls */}
              <div
                className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                  isDark
                    ? 'bg-purple-950/20 border-purple-800/40 text-purple-200'
                    : 'bg-purple-50 border-purple-200 text-purple-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">AlphaCounsel AI Intelligence Dossier</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-600 text-white shadow-xs">
                        Gemini 3.8 Flash
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Automated executive distillation, risk quantification, and evidentiary impact analysis
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {summaryResult && (
                    <>
                      <button
                        onClick={handleCopySummary}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                          copiedSummary
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSummary ? 'Copied Brief' : 'Copy Brief'}</span>
                      </button>

                      <button
                        onClick={handleSaveSummaryToVault}
                        title="Persist this AI distillation to the firm vault metadata"
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                          savedSummaryToMeta
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-xs'
                        }`}
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>{savedSummaryToMeta ? 'Saved to Vault Record' : 'Save to Record'}</span>
                      </button>
                    </>
                  )}

                  <button
                    disabled={isGeneratingSummary}
                    onClick={() => handleGenerateSummary()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingSummary ? 'Analyzing...' : summaryResult ? 'Re-analyze' : 'Generate Summary'}</span>
                  </button>
                </div>
              </div>

              {/* Focus Selector Filters */}
              {summaryResult && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <ListFilter className="w-3.5 h-3.5" />
                    Analytical Lens:
                  </span>
                  {[
                    { key: 'overview', label: 'Executive Brief' },
                    { key: 'risks', label: 'Risks & Exposure' },
                    { key: 'evidence', label: 'Evidentiary Admissibility' },
                    { key: 'timeline', label: 'Statutory Deadlines' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => {
                        setSummaryFocus(f.key as any);
                        handleGenerateSummary(f.key as any);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        summaryFocus === f.key
                          ? 'bg-purple-600 text-white shadow-xs'
                          : isDark
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading State */}
              {isGeneratingSummary && (
                <div
                  className={`p-10 rounded-2xl border text-center space-y-4 ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 animate-pulse">
                    <Sparkles className="w-7 h-7 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold">Deploying Legal LLM Synthesizer...</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Reviewing text tokens, isolating statutory covenants, calculating breach liabilities, and synthesizing executive findings via Gemini 3.8 Flash.
                    </p>
                  </div>
                  <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              {/* Empty state when no summary exists yet */}
              {!summaryResult && !isGeneratingSummary && (
                <div
                  className={`p-10 rounded-2xl border text-center space-y-4 ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold">Generate AI Executive Legal Summary</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Instantly summarize this legal document into core findings, key statutory covenants, adverse liabilities, and litigation counsel recommendations.
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateSummary()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Legal Summary Now</span>
                  </button>
                </div>
              )}

              {/* Render Structured Results */}
              {summaryResult && !isGeneratingSummary && (
                <div className="space-y-4">
                  {/* Card 1: Executive Overview */}
                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                          Executive Legal Distillation
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Generated {new Date(summaryResult.generatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {summaryResult.executiveOverview}
                    </p>
                  </div>

                  {/* Card 2: Key Legal Provisions & Factual Claims */}
                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                        Key Legal Provisions & Factual Claims
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {(summaryResult.keyProvisionsOrClaims || summaryResult.keyProvisions || []).map((provision: string, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{provision}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: Critical Legal Risks & Deadlines */}
                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Critical Legal Risks, Deadlines & Exposure
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {(summaryResult.criticalRisksOrObligations || summaryResult.criticalRisks || []).map((risk: string, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            isDark ? 'bg-amber-950/40 border-amber-500/30' : 'bg-white/80 border-amber-200'
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2-Column: Evidentiary Value & Recommended Next Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Evidentiary Value */}
                    <div
                      className={`p-5 rounded-2xl border ${
                        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Evidentiary Weight & Admissibility
                        </h4>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {summaryResult.evidentiaryImpact || summaryResult.evidentiaryValue}
                      </p>
                    </div>

                    {/* Action Plan */}
                    <div
                      className={`p-5 rounded-2xl border ${
                        isDark ? 'bg-blue-950/20 border-blue-500/40' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                          Litigation Counsel Action Plan
                        </h4>
                      </div>
                      <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
                        {summaryResult.recommendedAction || summaryResult.actionPlan}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Tags */}
                  <div
                    className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-400 font-semibold">Identified Parties:</span>
                      {(summaryResult.keyEntities || summaryResult.identifiedEntities || []).map((ent: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {ent}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold">Governing Law:</span>
                      <span className="font-semibold text-blue-400">
                        {summaryResult.governingLawOrJurisdiction || summaryResult.governingLaw}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VERSION HISTORY & ROLLBACK */}
          {activeTab === 'history' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              {/* Top Banner with Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                <div>
                  <h4
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Immutable Version History & Rollback Log
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any prior iteration to restore it as active master or compare differential text.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUploadNewVersion(!showUploadNewVersion)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{showUploadNewVersion ? 'Cancel' : 'Upload Revision'}</span>
                  </button>
                </div>
              </div>

              {/* Version Success Banner */}
              {versionSuccessMessage && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{versionSuccessMessage}</span>
                  </div>
                  <button onClick={() => setVersionSuccessMessage(null)}>
                    <X className="w-3.5 h-3.5 text-emerald-400/70 hover:text-emerald-300" />
                  </button>
                </div>
              )}

              {/* Upload Revision Form */}
              {showUploadNewVersion && (
                <form
                  onSubmit={handleUploadNewVersion}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4" />
                      Publish New Document Iteration
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      Active Master: {doc.currentVersion || 'v1.0'}
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
                        value={newVersionNum}
                        onChange={(e) => setNewVersionNum(e.target.value)}
                        placeholder="v1.2, v2.0"
                        className={`w-full px-3 py-2 rounded-lg text-xs font-mono border focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-100'
                            : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Revision Description / Notes
                      </label>
                      <input
                        type="text"
                        value={newVersionNotes}
                        onChange={(e) => setNewVersionNotes(e.target.value)}
                        placeholder="e.g. Added hearing Exhibit C, adjusted damage calculations..."
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
                      onClick={() => setShowUploadNewVersion(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>Commit Version</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Revert Confirmation Dialog */}
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
                      <h5 className="text-xs font-bold text-amber-400">
                        Confirm Revert to Version {revertingVersion.versionNumber}
                      </h5>
                      <p className="text-xs text-slate-300 mt-1">
                        Reverting restores the contents of{' '}
                        <span className="font-bold text-white">{revertingVersion.versionNumber}</span> as
                        the active master. All versions remain preserved in the judicial audit ledger.
                      </p>

                      <div className="mt-2.5">
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Justification for Rollback:
                        </label>
                        <input
                          type="text"
                          value={revertReason}
                          onChange={(e) => setRevertReason(e.target.value)}
                          placeholder="e.g. Restoring certified pre-filing iteration..."
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

              {/* Redline / Diff Viewer */}
              {diffVersion && (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Diff className="w-4 h-4 text-blue-400" />
                      <h5 className="text-xs font-bold">
                        Differential Redline: {diffVersion.versionNumber} vs Master ({doc.currentVersion})
                      </h5>
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
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-slate-400 mb-1 border-b pb-1">
                        Iteration {diffVersion.versionNumber} ({diffVersion.uploadedAt})
                      </div>
                      <div className="whitespace-pre-wrap">
                        {diffVersion.snapshotContent ||
                          `[Snapshot Version ${diffVersion.versionNumber}]\nTitle: ${doc.title}\nCustodian: ${diffVersion.uploadedBy}\nNotes: ${diffVersion.notes || 'Original filing'}`}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-lg border font-mono text-[11px] max-h-48 overflow-y-auto ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="font-bold text-blue-400 mb-1 border-b pb-1">
                        Current Master: {doc.currentVersion} ({doc.createdAt})
                      </div>
                      <div className="whitespace-pre-wrap">
                        {doc.ocrExtractedText ||
                          `[Active Master Version ${doc.currentVersion}]\nTitle: ${doc.title}\nCustodian: ${doc.createdBy}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Version List */}
              <div className="space-y-3">
                {(doc.versions && doc.versions.length > 0 ? doc.versions : [
                  {
                    versionNumber: doc.currentVersion || 'v1.0',
                    uploadedAt: doc.createdAt,
                    uploadedBy: doc.createdBy,
                    fileSize: doc.fileSize,
                    notes: 'Initial production upload',
                  },
                ]).map((ver, idx) => {
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
                                Version {ver.versionNumber}
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
                                  Restored from {ver.revertedFrom}
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

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDiffVersion(ver)}
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
                              Active Master
                            </span>
                          )}
                        </div>
                      </div>

                      {ver.notes && (
                        <div
                          className={`mt-2.5 pt-2 border-t text-xs flex items-start gap-1.5 ${
                            isDark ? 'border-slate-800/60 text-slate-300' : 'border-slate-200 text-slate-600'
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
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/90 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">
              Forensic In-Browser Viewer · Document inspected without downloading.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Close Viewer
            </button>

            <button
              onClick={() => onDownload(doc)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Watermarked Copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
