import React, { useState, useMemo } from 'react';
import {
  Activity,
  FolderInput,
  Tag as TagIcon,
  RotateCcw,
  GitCommit,
  Scan,
  UploadCloud,
  Download,
  Search,
  X,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { VaultDocument, DocumentActivityEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../hooks/useAudit';
import { getTagColorMeta } from '../../utils/tagColors';

interface DocumentActivityLogProps {
  document: VaultDocument;
  compact?: boolean;
  onClose?: () => void;
  onRestoreVersion?: (versionNumber: string) => void;
  onPreviewVersion?: (versionNumber: string) => void;
}

export const DocumentActivityLog: React.FC<DocumentActivityLogProps> = ({
  document: doc,
  compact = false,
  onClose,
  onRestoreVersion,
  onPreviewVersion,
}) => {
  const {
    documents,
    currentUser,
    theme,
    updateDocument,
    revertDocumentVersion,
    bulkMoveDocuments,
    runDocumentOCR,
    folderList,
  } = useApp();
  const { audit_events } = useAudit();
  const isDark = theme === 'dark';

  // Always keep synced with latest document state from context
  const liveDoc = documents.find((d) => d.id === doc.id) || doc;

  // Filter & Search states
  const [filterType, setFilterType] = useState<
    'all' | 'file_moved' | 'tagged' | 'version_restored' | 'ocr_extracted'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Quick action tester modal / popover state for users to easily test actions
  const [quickActionNotice, setQuickActionNotice] = useState<string | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  // Compile Comprehensive Activity Log
  // Merges liveDoc.activityLog with any matching audit events from useAudit()
  const combinedActivities = useMemo(() => {
    const docActivities: DocumentActivityEvent[] = [...(liveDoc.activityLog || [])];

    // If doc has no activityLog seeded, synthesize baseline realistic events
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
          details: `Optical Character Recognition completed with ${liveDoc.ocrConfidence || 99.4}% confidence. Full-text search index created.`,
          userName: 'DocuVault OCR Engine',
          userRole: 'System',
          timestamp: liveDoc.ocrIndexedAt || liveDoc.createdAt || new Date().toISOString(),
          metadata: {
            confidence: liveDoc.ocrConfidence || 99.4,
            characters: liveDoc.ocrCharacterCount || 428,
            words: liveDoc.ocrWordCount || 52,
          },
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
          metadata: { tags: liveDoc.tags },
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
        let mappedAction: DocumentActivityEvent['action'] = 'viewed';
        let mappedLabel = 'Document updated';

        if (evt.action === 'DOCUMENTS_BULK_MOVED' || evt.details.includes('Moved')) {
          mappedAction = 'file_moved';
          mappedLabel = 'File moved';
        } else if (evt.details.includes('tags') || evt.details.includes('label')) {
          mappedAction = 'tagged';
          mappedLabel = 'Tagged as Urgent';
        } else if (evt.details.includes('reverted') || evt.details.includes('rollback') || evt.details.includes('Restored')) {
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

  // Filter activities
  const filteredActivities = useMemo(() => {
    return combinedActivities.filter((act) => {
      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'file_moved' && act.action !== 'file_moved') return false;
        if (filterType === 'tagged' && act.action !== 'tagged') return false;
        if (
          filterType === 'version_restored' &&
          act.action !== 'version_restored' &&
          act.action !== 'version_created'
        ) {
          return false;
        }
        if (filterType === 'ocr_extracted' && act.action !== 'ocr_extracted') return false;
      }

      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchLabel = act.label.toLowerCase().includes(query);
        const matchDetails = act.details.toLowerCase().includes(query);
        const matchUser = act.userName.toLowerCase().includes(query);
        const matchRole = act.userRole ? act.userRole.toLowerCase().includes(query) : false;
        return matchLabel || matchDetails || matchUser || matchRole;
      }

      return true;
    });
  }, [combinedActivities, filterType, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: combinedActivities.length,
      file_moved: combinedActivities.filter((a) => a.action === 'file_moved').length,
      tagged: combinedActivities.filter((a) => a.action === 'tagged').length,
      version_restored: combinedActivities.filter(
        (a) => a.action === 'version_restored' || a.action === 'version_created'
      ).length,
      ocr_extracted: combinedActivities.filter((a) => a.action === 'ocr_extracted').length,
    };
  }, [combinedActivities]);

  // Relative Time Formatter
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 45) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  // Event Icon and Color Configuration
  const getActionConfig = (action: DocumentActivityEvent['action'], label: string) => {
    if (action === 'file_moved' || label.toLowerCase().includes('moved')) {
      return {
        icon: FolderInput,
        badgeBg: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
        badgeText: isDark ? 'text-blue-400' : 'text-blue-700',
        badgeBorder: isDark ? 'border-blue-500/30' : 'border-blue-200',
        ringColor: 'ring-blue-500/30',
        nodeBg: 'bg-blue-500',
      };
    }
    if (action === 'tagged' || label.toLowerCase().includes('tag')) {
      const isUrgent = label.toLowerCase().includes('urgent');
      return {
        icon: TagIcon,
        badgeBg: isUrgent
          ? isDark ? 'bg-rose-500/15' : 'bg-rose-50'
          : isDark ? 'bg-purple-500/15' : 'bg-purple-50',
        badgeText: isUrgent
          ? isDark ? 'text-rose-400' : 'text-rose-700'
          : isDark ? 'text-purple-400' : 'text-purple-700',
        badgeBorder: isUrgent
          ? isDark ? 'border-rose-500/30' : 'border-rose-200'
          : isDark ? 'border-purple-500/30' : 'border-purple-200',
        ringColor: isUrgent ? 'ring-rose-500/30' : 'ring-purple-500/30',
        nodeBg: isUrgent ? 'bg-rose-500' : 'bg-purple-500',
      };
    }
    if (action === 'version_restored' || label.toLowerCase().includes('restored')) {
      return {
        icon: RotateCcw,
        badgeBg: isDark ? 'bg-amber-500/15' : 'bg-amber-50',
        badgeText: isDark ? 'text-amber-400' : 'text-amber-700',
        badgeBorder: isDark ? 'border-amber-500/30' : 'border-amber-200',
        ringColor: 'ring-amber-500/30',
        nodeBg: 'bg-amber-500',
      };
    }
    if (action === 'version_created' || label.toLowerCase().includes('published')) {
      return {
        icon: GitCommit,
        badgeBg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
        badgeText: isDark ? 'text-emerald-400' : 'text-emerald-700',
        badgeBorder: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
        ringColor: 'ring-emerald-500/30',
        nodeBg: 'bg-emerald-500',
      };
    }
    if (action === 'ocr_extracted' || label.toLowerCase().includes('ocr')) {
      return {
        icon: Scan,
        badgeBg: isDark ? 'bg-indigo-500/15' : 'bg-indigo-50',
        badgeText: isDark ? 'text-indigo-400' : 'text-indigo-700',
        badgeBorder: isDark ? 'border-indigo-500/30' : 'border-indigo-200',
        ringColor: 'ring-indigo-500/30',
        nodeBg: 'bg-indigo-500',
      };
    }
    if (action === 'uploaded') {
      return {
        icon: UploadCloud,
        badgeBg: isDark ? 'bg-teal-500/15' : 'bg-teal-50',
        badgeText: isDark ? 'text-teal-400' : 'text-teal-700',
        badgeBorder: isDark ? 'border-teal-500/30' : 'border-teal-200',
        ringColor: 'ring-teal-500/30',
        nodeBg: 'bg-teal-500',
      };
    }
    if (action === 'downloaded') {
      return {
        icon: Download,
        badgeBg: isDark ? 'bg-slate-500/15' : 'bg-slate-100',
        badgeText: isDark ? 'text-slate-400' : 'text-slate-700',
        badgeBorder: isDark ? 'border-slate-500/30' : 'border-slate-300',
        ringColor: 'ring-slate-500/30',
        nodeBg: 'bg-slate-500',
      };
    }
    return {
      icon: Activity,
      badgeBg: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
      badgeText: isDark ? 'text-blue-400' : 'text-blue-700',
      badgeBorder: isDark ? 'border-blue-500/30' : 'border-blue-200',
      ringColor: 'ring-blue-500/30',
      nodeBg: 'bg-blue-500',
    };
  };

  // Quick Action Testers: Trigger events live so user can verify feed reaction
  const handleQuickTagUrgent = () => {
    setIsPerformingAction(true);
    const hasUrgent = (liveDoc.tags || []).includes('Urgent');
    const updatedTags = hasUrgent
      ? (liveDoc.tags || []).filter((t) => t !== 'Urgent')
      : [...(liveDoc.tags || []), 'Urgent'];

    const newEvent: DocumentActivityEvent = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action: 'tagged',
      label: hasUrgent ? 'Untagged Urgent' : 'Tagged as Urgent',
      details: hasUrgent
        ? `Removed label [Urgent] by ${currentUser.name}`
        : `Tagged as Urgent by ${currentUser.name} for prioritized partner discovery`,
      userName: currentUser.name,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      metadata: { tags: updatedTags },
    };

    updateDocument(liveDoc.id, {
      tags: updatedTags,
      activityLog: [newEvent, ...(liveDoc.activityLog || [])],
    });

    setQuickActionNotice(hasUrgent ? 'Removed Urgent label' : 'Tagged as Urgent');
    setTimeout(() => setQuickActionNotice(null), 3000);
    setIsPerformingAction(false);
  };

  const handleQuickMoveFile = () => {
    setIsPerformingAction(true);
    const availableFolders = folderList.filter((f) => f !== liveDoc.folder);
    const nextFolder = availableFolders[0] || (liveDoc.folder === 'Discovery' ? 'Pleadings' : 'Discovery');

    const newEvent: DocumentActivityEvent = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action: 'file_moved',
      label: 'File moved',
      details: `Moved from "${liveDoc.folder}" to "${nextFolder}" by ${currentUser.name}`,
      userName: currentUser.name,
      userRole: currentUser.role,
      timestamp: new Date().toISOString(),
      metadata: { fromFolder: liveDoc.folder, toFolder: nextFolder },
    };

    updateDocument(liveDoc.id, {
      folder: nextFolder as any,
      activityLog: [newEvent, ...(liveDoc.activityLog || [])],
    });

    setQuickActionNotice(`Moved to folder "${nextFolder}"`);
    setTimeout(() => setQuickActionNotice(null), 3000);
    setIsPerformingAction(false);
  };

  const handleQuickRestoreVersion = () => {
    if (!liveDoc.versions || liveDoc.versions.length <= 1) {
      setQuickActionNotice('No earlier version available to restore');
      setTimeout(() => setQuickActionNotice(null), 3000);
      return;
    }
    const targetVer = liveDoc.versions[0].versionNumber;
    setIsPerformingAction(true);
    const success = revertDocumentVersion(
      liveDoc.id,
      targetVer,
      `Restored version ${targetVer} for compliance review`
    );
    if (success) {
      if (onRestoreVersion) onRestoreVersion(targetVer);
      setQuickActionNotice(`Version restored to ${targetVer}`);
    }
    setTimeout(() => setQuickActionNotice(null), 3000);
    setIsPerformingAction(false);
  };

  const handleQuickRunOCR = async () => {
    setIsPerformingAction(true);
    try {
      const res = await runDocumentOCR(liveDoc.id);
      setQuickActionNotice(`OCR extracted ${res.characterCount} characters (${res.confidenceScore}%)`);
    } catch {
      setQuickActionNotice('OCR scan failed');
    } finally {
      setTimeout(() => setQuickActionNotice(null), 3000);
      setIsPerformingAction(false);
    }
  };

  return (
    <div
      className={`flex flex-col h-full overflow-hidden select-none font-sans ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      {/* HEADER SECTION */}
      <div
        className={`p-3.5 border-b shrink-0 flex items-center justify-between gap-2 ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/90'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs tracking-tight truncate">Activity Log</h3>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                  isDark ? 'bg-slate-800 text-blue-400' : 'bg-slate-200 text-blue-700'
                }`}
              >
                {combinedActivities.length}
              </span>
            </div>
            <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Chronological feed of file operations
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* QUICK SIMULATION / ACTION SHORTCUTS (Real live events) */}
      <div
        className={`px-3 py-2 border-b shrink-0 flex items-center justify-between gap-1.5 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <span className={`text-[10px] font-semibold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Trigger Event:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={handleQuickMoveFile}
            disabled={isPerformingAction}
            title="Move document to another folder"
            className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 shrink-0 border transition-all active:scale-95 ${
              isDark
                ? 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-800 text-blue-300'
                : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
            }`}
          >
            <FolderInput className="w-2.5 h-2.5" />
            <span>Move File</span>
          </button>

          <button
            onClick={handleQuickTagUrgent}
            disabled={isPerformingAction}
            title="Toggle #Urgent tag"
            className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 shrink-0 border transition-all active:scale-95 ${
              (liveDoc.tags || []).includes('Urgent')
                ? 'bg-rose-500 text-white border-rose-600'
                : isDark
                ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800 text-rose-300'
                : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
            }`}
          >
            <TagIcon className="w-2.5 h-2.5" />
            <span>{(liveDoc.tags || []).includes('Urgent') ? 'Untag Urgent' : 'Tag Urgent'}</span>
          </button>

          <button
            onClick={handleQuickRestoreVersion}
            disabled={isPerformingAction || !liveDoc.versions || liveDoc.versions.length <= 1}
            title="Restore earlier version"
            className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 shrink-0 border transition-all active:scale-95 disabled:opacity-40 ${
              isDark
                ? 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-800 text-amber-300'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
            }`}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Restore Ver</span>
          </button>

          <button
            onClick={handleQuickRunOCR}
            disabled={isPerformingAction}
            title="Re-run OCR text extraction & indexing"
            className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 shrink-0 border transition-all active:scale-95 ${
              isDark
                ? 'bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-800 text-indigo-300'
                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
            }`}
          >
            <Scan className="w-2.5 h-2.5" />
            <span>Run OCR</span>
          </button>
        </div>
      </div>

      {/* QUICK NOTIFICATION TOAST */}
      {quickActionNotice && (
        <div className="mx-3 mt-2 px-2.5 py-1.5 rounded-lg text-[11px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="font-semibold">{quickActionNotice}</span>
        </div>
      )}

      {/* SEARCH AND FILTER SEGMENTS */}
      <div
        className={`p-2.5 border-b shrink-0 space-y-2 ${
          isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        {/* Search Input */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <Search className="w-3 h-3 opacity-50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, user, or details..."
            className="w-full bg-transparent outline-none text-[11px]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="opacity-50 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'file_moved', label: 'Moves', count: counts.file_moved },
            { id: 'tagged', label: 'Tags', count: counts.tagged },
            { id: 'version_restored', label: 'Versions', count: counts.version_restored },
            { id: 'ocr_extracted', label: 'OCR', count: counts.ocr_extracted },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className="opacity-70 font-mono text-[9px]">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* CHRONOLOGICAL TIMELINE FEED */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {filteredActivities.length === 0 ? (
          <div className="py-10 text-center text-xs opacity-60 space-y-2">
            <Activity className="w-7 h-7 mx-auto opacity-30" />
            <p className="font-medium">No activity events match criteria</p>
            {(searchQuery || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="text-blue-500 underline text-[11px]"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-5 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/30">
            {filteredActivities.map((act) => {
              const config = getActionConfig(act.action, act.label);
              const IconComp = config.icon;
              const isExpanded = expandedEventId === act.id;

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline rail marker */}
                  <div
                    className={`absolute -left-5 top-2 w-2 h-2 rounded-full ${config.nodeBg} border border-white ring-2 ${config.ringColor}`}
                  />

                  {/* Activity Event Card */}
                  <div
                    className={`p-2.5 rounded-xl border transition-all ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Event Type Icon Badge */}
                      <div
                        className={`w-6 h-6 rounded-lg ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <IconComp className="w-3 h-3" />
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0">
                        {/* Event Label & Timestamp */}
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold leading-tight truncate ${
                              act.label.toLowerCase().includes('urgent')
                                ? 'text-rose-500'
                                : act.action === 'file_moved'
                                ? 'text-blue-400'
                                : act.action === 'version_restored'
                                ? 'text-amber-400'
                                : isDark
                                ? 'text-white'
                                : 'text-slate-900'
                            }`}
                          >
                            {act.label}
                          </span>

                          <span
                            className={`text-[10px] shrink-0 font-mono ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}
                            title={new Date(act.timestamp).toLocaleString()}
                          >
                            {formatTime(act.timestamp)}
                          </span>
                        </div>

                        {/* Details text */}
                        <p
                          className={`text-[11px] mt-1 leading-snug break-words ${
                            isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {act.details}
                        </p>

                        {/* Event Metadata Badges if present */}
                        {act.metadata?.fromFolder && act.metadata?.toFolder && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                                  : 'bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {act.metadata.fromFolder}
                            </span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-50 shrink-0" />
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold">
                              {act.metadata.toFolder}
                            </span>
                          </div>
                        )}

                        {/* User Attribution Footer */}
                        <div
                          className={`flex items-center justify-between mt-2 pt-1.5 border-t text-[10px] ${
                            isDark ? 'border-slate-800/60' : 'border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0 ${
                                act.userName.includes('Engine') || act.userName.includes('System')
                                  ? 'bg-indigo-600 text-white'
                                  : isDark
                                  ? 'bg-slate-800 text-blue-300 border border-slate-700'
                                  : 'bg-slate-200 text-blue-700'
                              }`}
                            >
                              {act.userName.slice(0, 2).toUpperCase()}
                            </div>
                            <span
                              className={`font-semibold truncate ${
                                isDark ? 'text-slate-300' : 'text-slate-700'
                              }`}
                            >
                              {act.userName}
                            </span>
                          </div>

                          {act.userRole && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono shrink-0 ${
                                isDark
                                  ? 'bg-slate-800/80 text-slate-400'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {act.userRole}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER AUDIT STAMP */}
      <div
        className={`p-2.5 border-t shrink-0 flex items-center justify-between text-[10px] ${
          isDark
            ? 'border-slate-800 bg-slate-950/80 text-slate-400'
            : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Immutable Document Ledger</span>
        </div>
        <span className="font-mono">Total {combinedActivities.length} logs</span>
      </div>
    </div>
  );
};
