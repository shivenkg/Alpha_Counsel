import React, { useState, useEffect } from 'react';
import {
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder,
  FolderLock,
  FolderPlus,
  FolderUp,
  Grid,
  Image,
  LayoutGrid,
  Link2,
  List,
  Lock,
  Unlock,
  Key,
  Shield,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Tag,
  Users,
  X,
  History,
  Sparkles,
  RotateCcw,
  CheckSquare,
  Square,
  MinusSquare,
  FolderInput,
  Copy,
  Trash2,
  Tag as TagIcon,
  UploadCloud,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../hooks/useAudit';
import { evaluateMatterAccess } from '../../services/matterPolicy';
import { formatINR } from '../../utils/currency';
import {
  VaultDocument,
  EncryptedFolderRecord,
  FolderThumbnailPreview,
  AutoTagAnalysisResult,
} from '../../types';
import { VaultDropzone } from './VaultDropzone';
import { UploadProgressDrawer, UploadTask } from './UploadProgressDrawer';
import { FilePreviewModal } from './FilePreviewModal';
import { DocumentVersionModal } from './DocumentVersionModal';
import { FolderGridThumbnail } from './FolderGridThumbnail';
import { FolderContextMenu } from './FolderContextMenu';
import { FolderCipherModal } from './FolderCipherModal';
import { VaultFloatingActionBar } from './VaultFloatingActionBar';
import { BulkMoveCopyModal } from './BulkMoveCopyModal';
import { BulkDeleteModal } from './BulkDeleteModal';
import { AutoTagReviewModal } from './AutoTagReviewModal';
import { AIFolderStructureModal } from './AIFolderStructureModal';
import { mockAES256EncryptionService } from '../../services/encryptionService';
import { autoTaggingService } from '../../services/autoTaggingService';
import {
  backgroundThumbnailService,
  buildThumbnailData,
} from '../../services/thumbnailService';

export const FirmVaultView: React.FC = () => {
  const {
    documents,
    matters,
    currentUser,
    ethicalWalls,
    theme,
    setActiveMatterId,
    setCurrentView,
    setMatterSubTab,
    updateDocument,
    deleteDocuments,
    bulkMoveDocuments,
    bulkCopyDocuments,
    openUploadModal,
    closeUploadModal,
    isUploadModalOpen,
    uploadModalFolder,
  } = useApp();
  const { logDocumentAction, logEvent } = useAudit();
  const isDark = theme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [activePreviewDoc, setActivePreviewDoc] = useState<VaultDocument | null>(null);
  const [activeVersionDoc, setActiveVersionDoc] = useState<VaultDocument | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const isUploadOpen = showUploadModal || isUploadModalOpen;
  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    closeUploadModal();
  };
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderList, setFolderList] = useState<string[]>([
    'ALL',
    'Pleadings',
    'Discovery',
    'Contracts',
    'Exhibits',
    'Drafts',
  ]);

  // Bulk Selection State
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [bulkMoveModalOpen, setBulkMoveModalOpen] = useState(false);
  const [bulkCopyModalOpen, setBulkCopyModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // AI Folder Structure Engine State
  const [aiFolderModalOpen, setAiFolderModalOpen] = useState(false);

  // ML Auto-Tagging State
  const [autoTagModalOpen, setAutoTagModalOpen] = useState(false);
  const [autoTagResults, setAutoTagResults] = useState<Record<string, AutoTagAnalysisResult>>({});
  const [isAutoTagLoading, setIsAutoTagLoading] = useState(false);
  const [autoTagToast, setAutoTagToast] = useState<{
    message: string;
    docTitle?: string;
  } | null>(null);

  // Mock AES-256 Encrypted Folders Registry
  const [encryptedFolders, setEncryptedFolders] = useState<Record<string, EncryptedFolderRecord>>(() =>
    mockAES256EncryptionService.getAllRecords()
  );

  // Background Thumbnail Process Cache & Processing State
  const [folderThumbnails, setFolderThumbnails] = useState<Record<string, FolderThumbnailPreview>>({});
  const [isThumbnailGenerating, setIsThumbnailGenerating] = useState(false);

  // Context Menu & Cipher Parameters Modal State
  const [folderContextMenu, setFolderContextMenu] = useState<{
    folderName: string;
    position: { x: number; y: number };
  } | null>(null);
  const [cipherModalFolder, setCipherModalFolder] = useState<string | null>(null);

  // Filter documents through the Matter Access Policy below the UI layer
  const permittedDocs = documents.filter((doc) => {
    const matter = matters.find((m) => m.id === doc.matterId);
    if (!matter) return false;
    const auth = evaluateMatterAccess(currentUser, matter, ethicalWalls);
    return auth.isPermitted;
  });

  const filteredDocs = permittedDocs.filter((doc) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      doc.title.toLowerCase().includes(term) ||
      doc.fileName.toLowerCase().includes(term) ||
      (doc.ocrExtractedText && doc.ocrExtractedText.toLowerCase().includes(term)) ||
      (doc.tags || []).some((t) => t.toLowerCase().includes(term));
    const matchesFolder =
      selectedFolder === 'ALL' ||
      doc.folder === selectedFolder ||
      doc.folder.startsWith(`${selectedFolder}/`);
    return matchesSearch && matchesFolder;
  });

  // Handle Applying AI Proposed Folder Structure & Relocations
  const handleApplyAiFolderStructure = (
    newFolders: string[],
    migrations: Array<{ docId: string; targetFolder: string }>
  ) => {
    // 1. Add all unique new folders into folderList
    setFolderList((prev) => {
      const combined = new Set([...prev, ...newFolders]);
      return Array.from(combined);
    });

    // 2. Relocate files to logical sub-folders
    migrations.forEach((m) => {
      updateDocument(m.docId, { folder: m.targetFolder });
    });

    // 3. Log comprehensive audit event
    logEvent({
      action: 'AI_FOLDER_STRUCTURE_APPLIED',
      entityType: 'Vault',
      entityId: 'ai-taxonomy-engine',
      details: `AI Folder Structure Proposal applied: ${newFolders.length} nested folders created, ${migrations.length} documents reorganized by ${currentUser.name}.`,
      metadata: {
        newFolders,
        migratedCount: migrations.length,
        actor: currentUser.name,
      },
    });

    // 4. Success feedback toast
    setAutoTagToast({
      message: `AI Folder Structure Applied: Created ${newFolders.length} nested sub-folders and organized ${migrations.length} documents.`,
    });
  };

  // Background Process: Asynchronously generate 2x2 document icon grid previews for each folder
  useEffect(() => {
    // Subscribe to background thumbnail service updates
    const unsubscribe = backgroundThumbnailService.subscribe((data, isProcessing) => {
      setFolderThumbnails(data);
      setIsThumbnailGenerating(isProcessing);
    });

    // Launch background generation queue over all folders and permitted documents
    backgroundThumbnailService.processFoldersInBackground(folderList, permittedDocs);

    return () => {
      unsubscribe();
    };
  }, [folderList, permittedDocs]);

  // Handle Mock AES-256 Folder Encryption Toggle
  const handleToggleEncryptFolder = async (folderName: string) => {
    const wasEncrypted = !!encryptedFolders[folderName]?.isEncrypted;
    const folderDocs = permittedDocs.filter((d) => d.folder === folderName);

    const result = await mockAES256EncryptionService.toggleFolderEncryption(
      folderName,
      folderDocs.length,
      { actor: currentUser.name }
    );

    const updated = mockAES256EncryptionService.getAllRecords();
    setEncryptedFolders(updated);

    // Audit Logging for compliance tracking
    logEvent({
      action: result.isEncrypted ? 'FOLDER_ENCRYPTED' : 'FOLDER_DECRYPTED',
      entityType: 'Folder',
      entityId: folderName,
      details: result.isEncrypted
        ? `Folder "${folderName}" was encrypted with mock AES-256-GCM by ${currentUser.name}. FIPS 140-3 policy applied.`
        : `Folder "${folderName}" was decrypted by ${currentUser.name}. Plaintext access restored.`,
      metadata: {
        folderName,
        docCount: folderDocs.length,
        algorithm: 'AES-256-GCM',
        keyFingerprint: result.record?.keyFingerprint,
      },
    });
  };

  // Open Context Menu on Right Click or Button Click
  const handleOpenFolderContextMenu = (folderName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderContextMenu({
      folderName,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleDownload = (doc: VaultDocument) => {
    const m = matters.find((item) => item.id === doc.matterId);
    logDocumentAction(
      'DOCUMENT_DOWNLOADED_WATERMARKED',
      doc.id,
      doc.title,
      doc.matterId,
      m?.matterNumber,
      { fileName: doc.fileName, fileSize: doc.fileSize }
    );
    alert(`Downloading "${doc.fileName}" with cryptographic forensic watermark.`);
  };

  const handlePreview = (doc: VaultDocument) => {
    setActivePreviewDoc(doc);
    const m = matters.find((item) => item.id === doc.matterId);
    logDocumentAction(
      'DOCUMENT_VIEWED',
      doc.id,
      doc.title,
      doc.matterId,
      m?.matterNumber,
      { fileName: doc.fileName }
    );
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const trimmed = newFolderName.trim();
    if (!folderList.includes(trimmed)) {
      setFolderList((prev) => [...prev, trimmed]);
    }
    setSelectedFolder(trimmed);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleUploadStart = (tasks: UploadTask[]) => {
    setUploadTasks((prev) => [...tasks, ...prev]);
  };

  const handleUploadProgress = (taskId: string, progress: number) => {
    setUploadTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progress } : t))
    );
  };

  const handleUploadComplete = async (task: UploadTask, doc?: VaultDocument) => {
    setUploadTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'complete', progress: 100 } : t))
    );

    // Machine Learning Auto-Tagging on New File Ingestion
    if (doc) {
      try {
        const activeMatter = matters.find((m) => m.id === doc.matterId);
        const analysis = await autoTaggingService.analyzeAndSuggestTags(doc, {
          title: activeMatter?.title,
          practiceArea: activeMatter?.practiceArea,
        });

        setAutoTagResults((prev) => ({ ...prev, [doc.id]: analysis }));
        setAutoTagToast({
          message: `AI legal classifier analyzed "${doc.title}" and generated ${analysis.suggestedTags.length} suggested tags.`,
          docTitle: doc.title,
        });
      } catch (err) {
        console.warn('Auto-tagging on upload error:', err);
      }
    }
  };

  // Bulk Selection Helpers
  const selectedDocs = permittedDocs.filter((d) => selectedDocIds.has(d.id));
  const isAllFilteredSelected =
    filteredDocs.length > 0 && filteredDocs.every((d) => selectedDocIds.has(d.id));
  const hasHeldSelectedDocs = selectedDocs.some((d) => d.isHeld);

  const handleToggleSelectDoc = (docId: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedDocIds(new Set(filteredDocs.map((d) => d.id)));
  };

  const handleClearSelection = () => {
    setSelectedDocIds(new Set());
  };

  // Bulk Move Execution
  const handleExecuteBulkMove = (targetFolder: string) => {
    const ids = Array.from(selectedDocIds);
    bulkMoveDocuments(ids, targetFolder);
    setSelectedDocIds(new Set());
    setBulkMoveModalOpen(false);
    backgroundThumbnailService.processFoldersInBackground(folderList, permittedDocs);
  };

  // Bulk Copy Execution
  const handleExecuteBulkCopy = (targetFolder: string) => {
    const ids = Array.from(selectedDocIds);
    bulkCopyDocuments(ids, targetFolder);
    setSelectedDocIds(new Set());
    setBulkCopyModalOpen(false);
    backgroundThumbnailService.processFoldersInBackground(folderList, permittedDocs);
  };

  // Bulk Delete Execution
  const handleExecuteBulkDelete = (docIdsToDelete: string[]) => {
    deleteDocuments(docIdsToDelete);
    setSelectedDocIds(new Set());
    setBulkDeleteModalOpen(false);
    backgroundThumbnailService.processFoldersInBackground(folderList, permittedDocs);
  };

  // Trigger ML Auto-Tagging for Selected Documents
  const handleTriggerAutoTagForSelected = async () => {
    if (selectedDocs.length === 0) return;
    setIsAutoTagLoading(true);
    setAutoTagModalOpen(true);
    try {
      const results = await autoTaggingService.bulkAnalyzeAndSuggestTags(selectedDocs);
      setAutoTagResults(results);
    } catch (err) {
      console.error('Failed to run batch auto-tagging:', err);
    } finally {
      setIsAutoTagLoading(false);
    }
  };

  // Trigger ML Auto-Tagging for a Single Document
  const handleTriggerAutoTagForDoc = async (doc: VaultDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsAutoTagLoading(true);
    setAutoTagModalOpen(true);
    try {
      const activeMatter = matters.find((m) => m.id === doc.matterId);
      const res = await autoTaggingService.analyzeAndSuggestTags(doc, {
        title: activeMatter?.title,
        practiceArea: activeMatter?.practiceArea,
      });
      setAutoTagResults({ [doc.id]: res });
    } catch (err) {
      console.error('Failed to run auto-tagging on document:', err);
    } finally {
      setIsAutoTagLoading(false);
    }
  };

  // Apply approved AI tags
  const handleApplyAutoTags = (docTagsMap: Record<string, string[]>) => {
    let appliedCount = 0;
    for (const [docId, approvedTags] of Object.entries(docTagsMap)) {
      const doc = documents.find((d) => d.id === docId);
      if (doc && approvedTags.length > 0) {
        const mergedTags = Array.from(new Set([...(doc.tags || []), ...approvedTags]));
        updateDocument(docId, { tags: mergedTags });
        appliedCount += approvedTags.length;
        logEvent({
          action: 'DOCUMENTS_AUTO_TAGGED',
          entityType: 'Document',
          entityId: docId,
          details: `ML Auto-tagging applied ${approvedTags.length} legal tags [${approvedTags.join(', ')}] to "${doc.title}" by ${currentUser.name}. Model: Gemini 3.8 Flash / NLP Semantic Classifier.`,
        });
      }
    }
    setAutoTagModalOpen(false);
    setAutoTagToast({
      message: `Successfully applied ${appliedCount} AI-recommended legal tags across ${Object.keys(docTagsMap).length} file(s).`,
    });
    setTimeout(() => setAutoTagToast(null), 5000);
  };

  // Helper for file type icons with theme awareness
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return (
        <div
          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
            isDark
              ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400'
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (ext === 'pdf') {
      return (
        <div
          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
            isDark
              ? 'bg-rose-950/80 border-rose-800/60 text-rose-400'
              : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (ext === 'jpg' || ext === 'png' || ext === 'jpeg' || ext === 'webp') {
      return (
        <div
          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
            isDark
              ? 'bg-amber-950/80 border-amber-800/60 text-amber-400'
              : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
        </div>
      );
    }
    return (
      <div
        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
          isDark
            ? 'bg-blue-950/80 border-blue-800/60 text-blue-400'
            : 'bg-blue-50 border-blue-200 text-blue-600'
        }`}
      >
        <FileText className="w-3.5 h-3.5" />
      </div>
    );
  };

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-7 font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header: Counsel Repos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1
              className={`text-2xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Counsel Repos Vault
            </h1>
            <p
              className={`text-xs mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Enterprise document management with drag-and-drop ingestion, OCR indexing, and legal holds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              title="Upload Legal Documents or Folders"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <UploadCloud className="w-3.5 h-3.5 text-white" />
              <span>Upload Document</span>
            </button>

            <button
              onClick={() => setAiFolderModalOpen(true)}
              title="Analyze Matter Files & Propose Nested Folder Structure"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                isDark
                  ? 'bg-purple-900/40 hover:bg-purple-900/70 border-purple-500/50 text-purple-200 shadow-purple-950/40'
                  : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800 shadow-xs'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>AI Propose Sub-Folders</span>
            </button>

            <button
              onClick={() => setShowNewFolderModal(true)}
              title="Create New Folder Category"
              className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors shadow-xs active:scale-95 shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switchers & Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-64 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files, OCR text, or tags..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none transition-all border ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 shadow-xs'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List / Grid Toggle */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS FOLDER CARDS WITH 2x2 DOCUMENT ICON GRID PREVIEWS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Vault Categories & Document Previews
          </div>

          {/* Background Thumbnail Process Engine Status Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-medium transition-all ${
                isThumbnailGenerating
                  ? 'bg-purple-950/40 text-purple-300 border-purple-800/60 shadow-xs animate-pulse'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-500 shadow-xs'
              }`}
              title="Asynchronous background indexing generates 2x2 grid icon previews of the first 4 documents in each folder"
            >
              <Sparkles
                className={`w-3 h-3 text-purple-400 ${
                  isThumbnailGenerating ? 'animate-spin' : ''
                }`}
              />
              <span>
                {isThumbnailGenerating
                  ? 'Thumbnail Engine: Indexing 2x2 Grids in Background...'
                  : 'Thumbnail Engine: 2x2 Previews Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Folder Cards with 2x2 Grid Thumbnails */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {folderList
            .filter((f) => f !== 'ALL')
            .map((f) => {
              const folderDocs = permittedDocs.filter((d) => d.folder === f);
              const thumbnail =
                folderThumbnails[f] || buildThumbnailData(f, folderDocs);
              const isEnc = !!encryptedFolders[f]?.isEncrypted;
              const isSelected = selectedFolder === f;

              return (
                <div
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  onContextMenu={(e) => handleOpenFolderContextMenu(f, e)}
                  className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 group flex flex-col justify-between h-40 select-none border shadow-xs ${
                    isSelected
                      ? isEnc
                        ? isDark
                          ? 'bg-emerald-950/25 border-emerald-500/70 ring-2 ring-emerald-500/30'
                          : 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-400/30 shadow-md'
                        : isDark
                        ? 'bg-blue-950/25 border-blue-500/70 ring-2 ring-blue-500/30'
                        : 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-400/30 shadow-md'
                      : isDark
                      ? 'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-850'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Top Row: 2x2 Grid-Based Document Thumbnail Preview + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <FolderGridThumbnail
                      thumbnail={thumbnail}
                      isEncrypted={isEnc}
                      size="md"
                      isDark={isDark}
                      isGenerating={
                        isThumbnailGenerating &&
                        (!folderThumbnails[f] || folderThumbnails[f].status !== 'ready')
                      }
                    />

                    <div className="flex items-center gap-1.5">
                      {/* Encryption Status Pill */}
                      {isEnc ? (
                        <div
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-xs"
                          title="Folder protected with mock AES-256-GCM symmetric cipher"
                        >
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          <span>AES-256</span>
                        </div>
                      ) : (
                        <div
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium opacity-60 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          Standard
                        </div>
                      )}

                      {/* Folder Context Menu Trigger Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenFolderContextMenu(f, e)}
                        title="Folder Options & AES-256 Encryption (or right-click)"
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Folder Name, Secure Lock Icon, & File Count */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {/* Secure Lock Icon next to encrypted folders */}
                      {isEnc && (
                        <span title="Protected with AES-256 Encryption">
                          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </span>
                      )}
                      <span
                        className={`text-sm font-bold truncate group-hover:translate-x-0.5 transition-transform ${
                          isSelected
                            ? isEnc
                              ? 'text-emerald-400'
                              : 'text-blue-500'
                            : isDark
                            ? 'text-white'
                            : 'text-slate-900'
                        }`}
                      >
                        {f}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {folderDocs.length} {folderDocs.length === 1 ? 'document' : 'documents'}
                      </span>
                      <span className="text-[10px] font-mono">
                        {isEnc ? 'Encrypted' : 'Plaintext'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ALL FILES DATA TABLE & NAVIGATION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Repository Documents & Exhibits
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <UploadCloud className="w-3.5 h-3.5 text-white" />
              <span>Upload Document</span>
            </button>
            <div
              className={`text-xs font-medium font-num ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {filteredDocs.length} items found
            </div>
          </div>
        </div>

        {/* Dynamic Folder Filter Pills with Secure Lock Icons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {folderList.map((f) => {
            const isEnc = f !== 'ALL' && !!encryptedFolders[f]?.isEncrypted;
            const isSelected = selectedFolder === f;
            const count =
              f === 'ALL'
                ? permittedDocs.length
                : permittedDocs.filter((d) => d.folder === f).length;

            return (
              <div key={f} className="relative group shrink-0 flex items-center">
                <button
                  onClick={() => setSelectedFolder(f)}
                  onContextMenu={(e) => f !== 'ALL' && handleOpenFolderContextMenu(f, e)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? isEnc
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold ring-2 ring-emerald-400/40'
                        : 'bg-blue-600 text-white shadow-xs font-semibold'
                      : isDark
                      ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs'
                  }`}
                >
                  {/* Secure Lock Icon next to encrypted folders in filter bar */}
                  {isEnc && (
                    <span title="Encrypted Folder (AES-256)">
                      <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    </span>
                  )}
                  <span>{f}</span>
                  <span className="text-[10px] opacity-70 font-mono font-normal">
                    ({count})
                  </span>
                </button>

                {/* Quick 3-Dots Context Trigger on Hover */}
                {f !== 'ALL' && (
                  <button
                    type="button"
                    onClick={(e) => handleOpenFolderContextMenu(f, e)}
                    title="Folder options & encryption"
                    className="ml-1 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setShowNewFolderModal(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed transition-all shrink-0 ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900 hover:border-blue-500 shadow-xs'
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>New Folder</span>
          </button>

          {/* AI Suggest Structure Pill */}
          <button
            onClick={() => setAiFolderModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 ${
              isDark
                ? 'bg-purple-950/50 border-purple-500/50 text-purple-300 hover:bg-purple-900/60'
                : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 shadow-xs'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>AI Structure</span>
          </button>
        </div>

        {/* SECURE LOCK BANNER FOR ACTIVE ENCRYPTED FOLDER */}
        {selectedFolder !== 'ALL' && encryptedFolders[selectedFolder]?.isEncrypted && (
          <div
            className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200 ${
              isDark
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">
                    AES-256-GCM Encrypted Folder: {selectedFolder}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    FIPS 140-3
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Client confidential files and extracted OCR transcripts in this directory are protected under cryptographic lock.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCipherModalFolder(selectedFolder)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-500/40'
                    : 'bg-white hover:bg-slate-50 text-emerald-800 border-emerald-300 shadow-xs'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cipher Parameters</span>
              </button>

              <button
                onClick={(e) => handleOpenFolderContextMenu(selectedFolder, e)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span>Folder Options</span>
              </button>
            </div>
          </div>
        )}

        {/* Table View Mode */}
        {viewMode === 'list' ? (
          <div
            className={`rounded-2xl border overflow-hidden transition-colors ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                : 'bg-white border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isDark
                      ? 'border-slate-800 text-slate-400 bg-slate-950/40'
                      : 'border-slate-200 text-slate-500 bg-slate-50/80'
                  }`}
                >
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={isAllFilteredSelected ? handleClearSelection : handleSelectAllFiltered}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 transition-transform"
                      title={isAllFilteredSelected ? 'Deselect all' : `Select all (${filteredDocs.length})`}
                    />
                  </th>
                  <th className="py-3 px-5">Document Name & Tags</th>
                  <th className="py-3 px-4">Custodian / Team</th>
                  <th className="py-3 px-4">Last Modified</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-6 text-right">In-Browser Inspection</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {filteredDocs.map((doc, idx) => {
                  const m = matters.find((item) => item.id === doc.matterId);
                  const isRowActive = selectedDocId === doc.id;
                  const isChecked = selectedDocIds.has(doc.id);

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`cursor-pointer transition-colors group ${
                        isChecked
                          ? isDark
                            ? 'bg-blue-950/40 text-blue-100 font-medium'
                            : 'bg-blue-50/80 text-blue-950 font-medium'
                          : isRowActive
                          ? isDark
                            ? 'bg-slate-800/50 text-blue-200'
                            : 'bg-slate-100/70 text-blue-900'
                          : isDark
                          ? 'hover:bg-slate-800/40 text-slate-300'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      {/* Bulk Checkbox Column */}
                      <td
                        className="py-3.5 px-4 w-10 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleSelectDoc(doc.id, e)}
                          className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                          title="Select item for bulk actions"
                        />
                      </td>

                      {/* Name Column */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getFileIcon(doc.fileName)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`font-semibold transition-colors truncate block ${
                                  isDark
                                    ? 'text-white group-hover:text-blue-400'
                                    : 'text-slate-900 group-hover:text-blue-600'
                                }`}
                              >
                                {doc.title}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveVersionDoc(doc);
                                }}
                                title="Click to view version history and rollback"
                                className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800/80 hover:bg-purple-600 hover:text-white text-purple-300 border border-purple-500/30 transition-colors"
                              >
                                {doc.currentVersion || 'v1.0'}
                              </button>
                              {doc.isHeld && (
                                <span
                                  title="Litigation Preservation Active - Deletion Blocked"
                                  className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 border border-rose-500/30 text-[10px] font-bold flex items-center gap-0.5"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  HOLD
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span
                                className={`text-[11px] truncate ${
                                  isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                {doc.fileName} · {m?.matterNumber}
                              </span>

                              {/* Tags preview */}
                              {doc.tags && doc.tags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {doc.tags.slice(0, 3).map((tag, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-medium border ${
                                        tag.startsWith('#')
                                          ? isDark
                                            ? 'bg-purple-950/40 text-purple-300 border-purple-800/50'
                                            : 'bg-purple-50 text-purple-700 border-purple-200'
                                          : isDark
                                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {doc.tags.length > 3 && (
                                    <span className="text-[9px] opacity-60 font-mono">
                                      +{doc.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owners Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center -space-x-1.5">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                              isDark
                                ? 'bg-slate-800 text-white border-slate-900'
                                : 'bg-slate-200 text-slate-700 border-white'
                            }`}
                          >
                            {(doc.createdBy || 'VS').slice(0, 2).toUpperCase()}
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full bg-blue-600 text-white border-2 flex items-center justify-center text-[10px] font-bold ${
                              isDark ? 'border-slate-900' : 'border-white'
                            }`}
                          >
                            GC
                          </div>
                        </div>
                      </td>

                      {/* Last Modified */}
                      <td
                        className={`py-3.5 px-4 font-medium whitespace-nowrap ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {doc.createdAt}
                      </td>

                      {/* File Size */}
                      <td
                        className={`py-3.5 px-4 font-num whitespace-nowrap font-medium ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {doc.fileSize}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* ML Auto-Tag Button */}
                          <button
                            onClick={(e) => handleTriggerAutoTagForDoc(doc, e)}
                            title="AI Legal Matter Auto-Tagging"
                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                              isDark
                                ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/60'
                                : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Version History Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveVersionDoc(doc);
                            }}
                            title="Version History & Rollback"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'text-slate-400 hover:text-purple-400 hover:bg-slate-800'
                                : 'text-slate-500 hover:text-purple-600 hover:bg-slate-100'
                            }`}
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Quick In-Browser Preview Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(doc);
                            }}
                            title="Open In-Browser Preview"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(doc);
                            }}
                            title="Download Watermarked File"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
                                : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                            }`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => {
              const isChecked = selectedDocIds.has(doc.id);
              const isCardActive = selectedDocId === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[13rem] select-none relative group ${
                    isChecked
                      ? isDark
                        ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-950/25 shadow-md'
                        : 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/80 shadow-md'
                      : isCardActive
                      ? 'border-blue-500 ring-2 ring-blue-500/25 shadow-md'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleToggleSelectDoc(doc.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                        title="Select for bulk operations"
                      />
                      {getFileIcon(doc.fileName)}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* ML Auto-Tag */}
                      <button
                        onClick={(e) => handleTriggerAutoTagForDoc(doc, e)}
                        className={`p-1 rounded transition-colors ${
                          isDark
                            ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/40'
                            : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                        }`}
                        title="AI Legal Matter Auto-Tagging"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVersionDoc(doc);
                        }}
                        className="p-1 text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 rounded"
                        title="Version History & Rollback"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(doc);
                        }}
                        className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="View Document Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className={`text-xs font-bold truncate flex-1 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {doc.title}
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1 rounded bg-slate-800 text-purple-300">
                        {doc.currentVersion || 'v1.0'}
                      </span>
                    </div>
                    <div
                      className={`text-[11px] truncate ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {doc.fileName}
                    </div>
                    {doc.isHeld && (
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-500 text-[10px] font-bold border border-rose-500/30">
                        HOLD ACTIVE
                      </span>
                    )}

                    {/* Tag preview in Grid */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {doc.tags.slice(0, 2).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className={`px-1 py-0.2 rounded text-[9px] font-mono font-medium border truncate max-w-[110px] ${
                              tag.startsWith('#')
                                ? isDark
                                ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                                : isDark
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 2 && (
                          <span className="text-[9px] opacity-60 font-mono">
                            +{doc.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex items-center justify-between text-[11px] border-t pt-2 font-num ${
                      isDark
                        ? 'border-slate-800 text-slate-400'
                        : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    <span>{doc.fileSize}</span>
                    <span>{doc.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ENHANCED FILE PREVIEW MODAL: METADATA, THUMBNAILS, AI SUMMARY & ROLLBACK */}
      {activePreviewDoc && (
        <FilePreviewModal
          document={documents.find((d) => d.id === activePreviewDoc.id) || activePreviewDoc}
          onClose={() => setActivePreviewDoc(null)}
          onDownload={handleDownload}
        />
      )}

      {/* DEDICATED DOCUMENT VERSION CONTROL & ROLLBACK MODAL */}
      {activeVersionDoc && (
        <DocumentVersionModal
          document={documents.find((d) => d.id === activeVersionDoc.id) || activeVersionDoc}
          onClose={() => setActiveVersionDoc(null)}
          onVersionReverted={(revertedDoc) => {
            setActiveVersionDoc(documents.find((d) => d.id === revertedDoc.id) || revertedDoc);
          }}
        />
      )}

      {/* Create New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b pb-3 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3
                  className={`text-sm font-bold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Create New Folder Category
                </h3>
              </div>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expert Reports, Trial Exhibits, Deposition Transcripts"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className={`px-4 py-2 text-xs font-medium ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEPARATE FRAME / MODAL DIALOG FOR DOCUMENT UPLOAD & INGESTION */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={handleCloseUploadModal}
        >
          <div
            className={`border rounded-2xl md:rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative transition-all duration-200 animate-in zoom-in-95 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-black/80' : 'bg-white border-slate-200 shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Frame Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`text-base font-bold tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Upload Document & Legal Ingestion
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Drag-and-drop intake with SHA-256 integrity hashing and OCR full-text search indexing.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseUploadModal}
                className={`p-2 rounded-xl transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Close Upload Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone Component inside the separate frame */}
            <VaultDropzone
              currentFolder={uploadModalFolder || (selectedFolder !== 'ALL' ? selectedFolder : 'Discovery')}
              onUploadStart={handleUploadStart}
              onUploadProgress={handleUploadProgress}
              onUploadComplete={(task, doc) => {
                handleUploadComplete(task, doc);
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Upload Progress Drawer */}
      <UploadProgressDrawer
        tasks={uploadTasks}
        onRemove={(id) => setUploadTasks((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* FOLDER CONTEXT MENU WITH ENCRYPT FOLDER TOGGLE */}
      {folderContextMenu && (
        <FolderContextMenu
          folderName={folderContextMenu.folderName}
          docCount={
            permittedDocs.filter((d) => d.folder === folderContextMenu.folderName).length
          }
          isEncrypted={!!encryptedFolders[folderContextMenu.folderName]?.isEncrypted}
          encryptionRecord={encryptedFolders[folderContextMenu.folderName]}
          position={folderContextMenu.position}
          isDark={isDark}
          onClose={() => setFolderContextMenu(null)}
          onToggleEncrypt={handleToggleEncryptFolder}
          onOpenFolder={(folder) => setSelectedFolder(folder)}
          onRegenerateThumbnail={(folder) =>
            backgroundThumbnailService.regenerateFolder(folder, permittedDocs)
          }
          onViewCipherDetails={(folder) => setCipherModalFolder(folder)}
        />
      )}

      {/* FOLDER CIPHER METADATA MODAL */}
      {cipherModalFolder && (
        <FolderCipherModal
          folderName={cipherModalFolder}
          record={encryptedFolders[cipherModalFolder]}
          isDark={isDark}
          onClose={() => setCipherModalFolder(null)}
          onToggleEncrypt={handleToggleEncryptFolder}
        />
      )}

      {/* FLOATING ACTION TOOLBAR FOR BULK SELECTION */}
      <VaultFloatingActionBar
        selectedCount={selectedDocIds.size}
        totalFilteredCount={filteredDocs.length}
        isAllSelected={isAllFilteredSelected}
        hasHeldDocuments={hasHeldSelectedDocs}
        isDark={isDark}
        onSelectAll={handleSelectAllFiltered}
        onClearSelection={handleClearSelection}
        onMove={() => setBulkMoveModalOpen(true)}
        onCopy={() => setBulkCopyModalOpen(true)}
        onDelete={() => setBulkDeleteModalOpen(true)}
        onAutoTag={handleTriggerAutoTagForSelected}
      />

      {/* BULK MOVE MODAL */}
      {bulkMoveModalOpen && (
        <BulkMoveCopyModal
          mode="move"
          selectedDocs={selectedDocs}
          availableFolders={folderList}
          encryptedFolders={encryptedFolders}
          isDark={isDark}
          onClose={() => setBulkMoveModalOpen(false)}
          onConfirm={handleExecuteBulkMove}
        />
      )}

      {/* BULK COPY MODAL */}
      {bulkCopyModalOpen && (
        <BulkMoveCopyModal
          mode="copy"
          selectedDocs={selectedDocs}
          availableFolders={folderList}
          encryptedFolders={encryptedFolders}
          isDark={isDark}
          onClose={() => setBulkCopyModalOpen(false)}
          onConfirm={handleExecuteBulkCopy}
        />
      )}

      {/* BULK DELETE MODAL WITH LEGAL HOLD SAFEGUARDS */}
      {bulkDeleteModalOpen && (
        <BulkDeleteModal
          selectedDocs={selectedDocs}
          isDark={isDark}
          onClose={() => setBulkDeleteModalOpen(false)}
          onConfirmDelete={handleExecuteBulkDelete}
        />
      )}

      {/* ML AUTO-TAGGING REVIEW MODAL */}
      {autoTagModalOpen && (
        <AutoTagReviewModal
          results={autoTagResults}
          documents={permittedDocs}
          isDark={isDark}
          isLoading={isAutoTagLoading}
          onClose={() => setAutoTagModalOpen(false)}
          onApplyTags={handleApplyAutoTags}
        />
      )}

      {/* AI INTELLIGENT FOLDER STRUCTURE PROPOSAL MODAL */}
      {aiFolderModalOpen && (
        <AIFolderStructureModal
          isOpen={aiFolderModalOpen}
          onClose={() => setAiFolderModalOpen(false)}
          currentFolders={folderList}
          documents={permittedDocs}
          matters={matters}
          isDark={isDark}
          onApplyStructure={handleApplyAiFolderStructure}
        />
      )}

      {/* ML AUTO-TAG TOAST NOTIFICATION FOR NEW UPLOADS & ACTIONS */}
      {autoTagToast && (
        <div className="fixed top-6 right-6 z-50 max-w-sm sm:max-w-md p-3.5 rounded-2xl border shadow-2xl bg-slate-900 border-purple-500/50 text-white flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>AI Tag Suggestions</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ML
                </span>
              </div>
              <div className="text-[11px] text-purple-200/80 truncate mt-0.5">
                {autoTagToast.message}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {Object.keys(autoTagResults).length > 0 && (
              <button
                type="button"
                onClick={() => setAutoTagModalOpen(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-colors"
              >
                Review
              </button>
            )}
            <button
              type="button"
              onClick={() => setAutoTagToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
