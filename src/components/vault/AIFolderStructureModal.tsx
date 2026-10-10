import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  FolderTree,
  Folder,
  FolderPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Sliders,
  Check,
  Layers,
  Lock,
} from 'lucide-react';
import { VaultDocument, Matter } from '../../types';
import {
  folderStructureAiService,
  FolderStructureProposal,
  DocumentMigrationSuggestion,
  SubFolderNode,
} from '../../services/folderStructureAiService';

interface AIFolderStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolders?: string[];
  documents: VaultDocument[];
  matters: Matter[];
  isDark?: boolean;
  onApplyStructure: (
    newFolders: string[],
    migrations: Array<{ docId: string; targetFolder: string }>
  ) => void;
}

export const AIFolderStructureModal: React.FC<AIFolderStructureModalProps> = ({
  isOpen,
  onClose,
  currentFolders = [],
  documents,
  matters,
  isDark = true,
  onApplyStructure,
}) => {
  const [selectedMatterId, setSelectedMatterId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'tree' | 'migrations' | 'compliance'>('tree');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [proposal, setProposal] = useState<FolderStructureProposal | null>(null);
  const [selectedDocMigrations, setSelectedDocMigrations] = useState<Record<string, boolean>>({});
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    Discovery: true,
    Pleadings: true,
    Contracts: true,
    Exhibits: true,
    Drafts: true,
  });

  // Run analysis when modal opens or selected matter changes
  const runAnalysis = async (matterId: string) => {
    setIsLoading(true);
    try {
      const targetMatter = matterId !== 'ALL' ? matters.find((m) => m.id === matterId) : null;
      const res = await folderStructureAiService.generateFolderStructureSuggestions(
        documents,
        targetMatter
      );
      setProposal(res);

      // Initialize all migrations as selected by default
      const initialSelection: Record<string, boolean> = {};
      res.documentMigrations.forEach((m) => {
        initialSelection[m.docId] = true;
      });
      setSelectedDocMigrations(initialSelection);
    } catch (err) {
      console.error('Error running AI folder structure analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAnalysis(selectedMatterId);
    }
  }, [isOpen, selectedMatterId]);

  if (!isOpen) return null;

  const toggleSelectAll = (select: boolean) => {
    if (!proposal) return;
    const updated: Record<string, boolean> = {};
    proposal.documentMigrations.forEach((m) => {
      updated[m.docId] = select;
    });
    setSelectedDocMigrations(updated);
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocMigrations((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const toggleExpandParent = (parent: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parent]: !prev[parent],
    }));
  };

  const selectedCount = Object.values(selectedDocMigrations).filter(Boolean).length;

  const handleApply = () => {
    if (!proposal) return;

    // Collect all proposed subfolder paths
    const newFolderPaths = proposal.subFolders.map((sf) => sf.path);

    // Collect selected migrations
    const migrationsToApply = proposal.documentMigrations
      .filter((m) => selectedDocMigrations[m.docId])
      .map((m) => ({
        docId: m.docId,
        targetFolder: m.suggestedFolder,
      }));

    onApplyStructure(newFolderPaths, migrationsToApply);
    onClose();
  };

  // Group sub-folders by parent
  const parentGroups: Record<string, SubFolderNode[]> = {};
  if (proposal) {
    proposal.subFolders.forEach((sf) => {
      if (!parentGroups[sf.parentFolder]) {
        parentGroups[sf.parentFolder] = [];
      }
      parentGroups[sf.parentFolder].push(sf);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-slate-950/90'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/80'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  AI Intelligent Folder Structure Engine
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Analyzes matter records, forensic OCR transcripts, and legal workflows to propose logical nested sub-folders.
              </p>
            </div>
          </div>

          {/* Scope Selector + Close Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Scope:
              </span>
              <select
                value={selectedMatterId}
                onChange={(e) => setSelectedMatterId(e.target.value)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-200'
                    : 'bg-white border-amber-200 text-slate-800 shadow-xs'
                }`}
              >
                <option value="ALL">All Vault Documents ({documents.length})</option>
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matterNumber} — {m.title.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => runAnalysis(selectedMatterId)}
              disabled={isLoading}
              title="Re-run AI Analysis"
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'hover:bg-slate-800 border-slate-700 text-slate-300'
                  : 'hover:bg-amber-100 border-amber-200 text-slate-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-amber-100 text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diagnostic Metric Bar & Dual Health Gauge */}
        {proposal && (
          <div
            className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 transition-colors ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/80'
            }`}
          >
            {/* Health Meter */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Document Taxonomy Health
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs line-through font-mono font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                    {proposal.organizationScoreBefore}%
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm font-bold font-mono text-emerald-500">
                    {proposal.organizationScoreAfter}% Structured
                  </span>
                </div>
              </div>
              <div className="w-32 bg-slate-800/80 h-2 rounded-full overflow-hidden flex border border-slate-700/50">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${proposal.organizationScoreAfter}%` }}
                />
              </div>
            </div>

            {/* Metric Counters */}
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className={`text-[10px] block uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Analyzed Files
                </span>
                <span className="font-bold font-num text-sm text-blue-400">
                  {proposal.analyzedDocumentsCount}
                </span>
              </div>
              <div>
                <span className={`text-[10px] block uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Proposed Sub-Folders
                </span>
                <span className="font-bold font-num text-sm text-purple-400">
                  +{proposal.proposedSubFoldersCount}
                </span>
              </div>
              <div>
                <span className={`text-[10px] block uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Files to Organize
                </span>
                <span className="font-bold font-num text-sm text-amber-500">
                  {proposal.unorganizedFilesCount}
                </span>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div
              className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-200'
              }`}
            >
              <button
                onClick={() => setActiveTab('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'tree'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Nested Tree</span>
              </button>
              <button
                onClick={() => setActiveTab('migrations')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'migrations'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Relocation Plan ({proposal.documentMigrations.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'compliance'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Legal Compliance</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin flex items-center justify-center" />
                <Sparkles className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base">Running Semantic Document Structure Analysis...</h3>
                <p className={`text-xs max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Examining document categories, procedural litigation phases, deposition transcripts, and non-disclosure clauses against standard legal taxonomies.
                </p>
              </div>
            </div>
          ) : !proposal ? (
            <div className="py-16 text-center text-slate-400">
              No analysis available. Click "Scan Again" to generate structure suggestions.
            </div>
          ) : (
            <>
              {/* Executive Rationale Callout */}
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
                  isDark
                    ? 'bg-purple-950/20 border-purple-800/40 text-purple-200'
                    : 'bg-purple-50 border-purple-200 text-purple-950'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold mr-1">AI Organizational Diagnosis:</span>
                  {proposal.executiveRationale}
                </div>
              </div>

              {/* TAB 1: NESTED HIERARCHICAL TREE VIEW */}
              {activeTab === 'tree' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>PROPOSED NESTED FOLDER TAXONOMY & MATCHED MATTER FILES</span>
                    <span className="text-[11px] text-purple-400">
                      Auto-generated from document semantic tags & OCR
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(parentGroups).map(([parent, subFolders]) => {
                      const isExpanded = expandedParents[parent] ?? true;
                      const totalDocsInParent = subFolders.reduce(
                        (acc, sf) => acc + sf.suggestedDocIds.length,
                        0
                      );

                      return (
                        <div
                          key={parent}
                          className={`rounded-2xl border overflow-hidden transition-all ${
                            isDark
                              ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                              : 'bg-white border-amber-200/80 hover:border-amber-300 shadow-xs'
                          }`}
                        >
                          {/* Parent Folder Header */}
                          <div
                            onClick={() => toggleExpandParent(parent)}
                            className={`p-3.5 flex items-center justify-between cursor-pointer border-b select-none ${
                              isDark
                                ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/50'
                                : 'border-amber-100 bg-amber-50/50 hover:bg-amber-100/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                              <Folder className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                              <span className="font-bold text-sm">{parent}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                                  isDark
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-amber-100 text-slate-800'
                                }`}
                              >
                                {subFolders.length} sub-folders · {totalDocsInParent} files
                              </span>
                            </div>
                          </div>

                          {/* Nested Sub-Folders List */}
                          {isExpanded && (
                            <div className="p-3 space-y-2.5">
                              {subFolders.map((sf) => {
                                const matchedFiles = documents.filter((d) =>
                                  sf.suggestedDocIds.includes(d.id)
                                );

                                return (
                                  <div
                                    key={sf.path}
                                    className={`p-3 rounded-xl border space-y-2 ${
                                      isDark
                                        ? 'bg-slate-900/70 border-slate-800/80'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                        <span className="font-semibold text-xs text-purple-400">
                                          {sf.name}
                                        </span>
                                        <span
                                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                            sf.category === 'Evidentiary'
                                              ? 'bg-emerald-500/20 text-emerald-400'
                                              : sf.category === 'Privilege'
                                              ? 'bg-rose-500/20 text-rose-400'
                                              : sf.category === 'Contractual'
                                              ? 'bg-blue-500/20 text-blue-400'
                                              : 'bg-amber-500/20 text-amber-400'
                                          }`}
                                        >
                                          {sf.category}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {matchedFiles.length} item(s)
                                      </span>
                                    </div>

                                    <p
                                      className={`text-[11px] leading-tight ${
                                        isDark ? 'text-slate-400' : 'text-slate-600'
                                      }`}
                                    >
                                      {sf.description}
                                    </p>

                                    {/* Matched Documents Pill Preview */}
                                    {matchedFiles.length > 0 && (
                                      <div className="pt-1.5 border-t border-inherit flex flex-wrap gap-1.5">
                                        {matchedFiles.map((doc) => (
                                          <span
                                            key={doc.id}
                                            title={doc.title}
                                            className={`text-[10px] px-2 py-0.5 rounded-md truncate max-w-[220px] font-mono border ${
                                              isDark
                                                ? 'bg-slate-950 border-slate-800 text-slate-300'
                                                : 'bg-white border-amber-200 text-slate-800'
                                            }`}
                                          >
                                            📄 {doc.title}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENT RELOCATION PLAN */}
              {activeTab === 'migrations' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSelectAll(true)}
                        className="text-xs text-purple-400 hover:underline font-semibold"
                      >
                        Select All ({proposal.documentMigrations.length})
                      </button>
                      <span className="text-slate-500">·</span>
                      <button
                        onClick={() => toggleSelectAll(false)}
                        className="text-xs text-slate-400 hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {selectedCount} of {proposal.documentMigrations.length} files selected for relocation
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl border overflow-hidden ${
                      isDark ? 'border-slate-800' : 'border-amber-200'
                    }`}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr
                            className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                              isDark
                                ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={selectedCount === proposal.documentMigrations.length}
                                onChange={(e) => toggleSelectAll(e.target.checked)}
                                className="rounded text-purple-600 focus:ring-0 cursor-pointer"
                              />
                            </th>
                            <th className="p-3">Document Title & Filename</th>
                            <th className="p-3">Current Folder</th>
                            <th className="p-3">Proposed Nested Path</th>
                            <th className="p-3">AI Confidence</th>
                            <th className="p-3">Legal Basis & Rationale</th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            isDark ? 'divide-slate-800' : 'divide-amber-200/60'
                          }`}
                        >
                          {proposal.documentMigrations.map((m) => {
                            const isSelected = !!selectedDocMigrations[m.docId];
                            const isMove = m.currentFolder !== m.suggestedFolder;

                            return (
                              <tr
                                key={m.docId}
                                onClick={() => toggleDocSelection(m.docId)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? isDark
                                      ? 'bg-purple-950/15 hover:bg-purple-950/25'
                                      : 'bg-purple-50/50 hover:bg-purple-100/50'
                                    : isDark
                                    ? 'hover:bg-slate-900/50'
                                    : 'hover:bg-amber-50/40'
                                }`}
                              >
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleDocSelection(m.docId)}
                                    className="rounded text-purple-600 focus:ring-0 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-100 dark:text-white line-clamp-1">
                                    {m.docTitle}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {m.fileName}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                                      isDark
                                        ? 'bg-slate-950 border-slate-800 text-slate-400'
                                        : 'bg-amber-50 border-amber-200 text-slate-700'
                                    }`}
                                  >
                                    {m.currentFolder}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5">
                                    <ArrowRight className="w-3 h-3 text-purple-400 shrink-0" />
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                                        isDark
                                          ? 'bg-purple-950/60 border-purple-800/60 text-purple-300'
                                          : 'bg-purple-100 border-purple-200 text-purple-900'
                                      }`}
                                    >
                                      {m.suggestedFolder}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xs text-emerald-400">
                                      {Math.round(m.confidence * 100)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`text-[11px] leading-tight line-clamp-2 ${
                                      isDark ? 'text-slate-300' : 'text-slate-700'
                                    }`}
                                  >
                                    {m.reason}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LEGAL COMPLIANCE & BEST PRACTICES */}
              {activeTab === 'compliance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-amber-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4" />
                        <span>ABA Rule 1.6 Privilege Isolation</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        By segregating attorney-client advisory communications into dedicated nested paths (`Correspondence/Client Privileged`), potential inadvertent disclosures during discovery production are minimized.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-amber-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>FRCP 26(b) Proportionality</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Sub-categorizing discovery demands into separate `Deposition Transcripts`, `Written Interrogatories`, and `Subpoenas` accelerates retrieval during motion hearings and trial preparation.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-amber-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                        <Lock className="w-4 h-4" />
                        <span>Legal Hold Preservation Scope</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Litigation holds can be mapped precisely down to granular sub-folders without locking unrelated corporate or governance files.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`p-5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>
              Engine: <span className="font-semibold text-slate-300">{proposal?.usedAiModel || 'Gemini 3.8 Flash'}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-amber-100 border-amber-200 text-slate-700 shadow-xs'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isLoading || !proposal || selectedCount === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Apply Intelligent Structure ({selectedCount} Files)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
