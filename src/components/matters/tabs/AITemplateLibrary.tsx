import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  FileCheck,
  FileCode,
  FileText,
  Filter,
  FolderPlus,
  Layers,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AILegalTemplate, Matter } from '../../../types';

interface AITemplateLibraryProps {
  onSelectTemplate: (template: AILegalTemplate) => void;
  activeTemplateId?: string;
  matter?: Matter;
  onClose?: () => void;
}

export const AITemplateLibrary: React.FC<AITemplateLibraryProps> = ({
  onSelectTemplate,
  activeTemplateId,
  matter,
  onClose,
}) => {
  const { legalTemplates, addLegalTemplate, deleteLegalTemplate, theme, currentUser } = useApp();
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedApproval, setSelectedApproval] = useState<string>('ALL');
  const [previewTemplate, setPreviewTemplate] = useState<AILegalTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Template Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<AILegalTemplate['category']>('Commercial Litigation');
  const [newDocType, setNewDocType] = useState('Motion for Summary Judgment');
  const [newJurisdiction, setNewJurisdiction] = useState(
    matter?.courtVenue || 'United States District Court, N.D. Cal.'
  );
  const [newDescription, setNewDescription] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newArguments, setNewArguments] = useState('');
  const [newCitations, setNewCitations] = useState('');
  const [newMandatoryClauses, setNewMandatoryClauses] = useState('');
  const [newEvidenceTypes, setNewEvidenceTypes] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newApproval, setNewApproval] = useState<AILegalTemplate['firmApprovalStatus']>('FIRM_STANDARD');

  // Categories list
  const categories: Array<AILegalTemplate['category']> = [
    'Intellectual Property',
    'Commercial Litigation',
    'Corporate & M&A',
    'Arbitration & MCIA',
    'Governance & Trust',
    'Employment & Labor',
    'General Practice',
  ];

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return legalTemplates.filter((tmpl) => {
      if (selectedCategory !== 'ALL' && tmpl.category !== selectedCategory) return false;
      if (selectedApproval !== 'ALL' && tmpl.firmApprovalStatus !== selectedApproval) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tmpl.title.toLowerCase().includes(q);
        const matchDesc = tmpl.description.toLowerCase().includes(q);
        const matchType = tmpl.documentType.toLowerCase().includes(q);
        const matchJuris = tmpl.jurisdiction.toLowerCase().includes(q);
        const matchTags = tmpl.tags.some((t) => t.toLowerCase().includes(q));
        const matchCitations = tmpl.statutoryCitations.some((c) => c.toLowerCase().includes(q));

        if (!matchTitle && !matchDesc && !matchType && !matchJuris && !matchTags && !matchCitations) {
          return false;
        }
      }
      return true;
    });
  }, [legalTemplates, selectedCategory, selectedApproval, searchQuery]);

  const handleApplyTemplate = (template: AILegalTemplate) => {
    onSelectTemplate(template);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addLegalTemplate({
      title: newTitle,
      category: newCategory,
      documentType: newDocType,
      jurisdiction: newJurisdiction,
      description: newDescription || `Firm-approved legal drafting template for ${newDocType}.`,
      defaultClientPosition: newPosition || `Standard client posture formulation for ${newTitle}.`,
      defaultKeyLegalArguments: newArguments || `Standard legal arguments under ${newJurisdiction}.`,
      suggestedEvidenceTypes: newEvidenceTypes
        ? newEvidenceTypes.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Vault Evidence Records', 'Factual Exhibits'],
      statutoryCitations: newCitations
        ? newCitations.split('\n').map((s) => s.trim()).filter(Boolean)
        : ['Fed. R. Civ. P. 56', 'Governing Practice Rules'],
      mandatoryClauses: newMandatoryClauses
        ? newMandatoryClauses.split('\n').map((s) => s.trim()).filter(Boolean)
        : ['Standard of Review', 'Statement of Undisputed Facts', 'Prayer for Relief'],
      firmApprovalStatus: newApproval,
      approvalSignoff: `${currentUser.name} (${currentUser.role})`,
      version: 'v1.0',
      tags: newTags ? newTags.split(',').map((s) => s.trim()).filter(Boolean) : ['Firm Template', newCategory],
      author: currentUser.name,
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDescription('');
    setNewPosition('');
    setNewArguments('');
    setNewCitations('');
    setNewMandatoryClauses('');
    setNewEvidenceTypes('');
    setNewTags('');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Firm Legal Knowledge Repository · Common Filings</span>
          </div>
          <h3
            className={`text-xl font-bold tracking-tight flex items-center gap-2.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <span>Firm-Approved AI Drafting Template Library</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono border font-semibold ${
                isDark
                  ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {legalTemplates.length} Templates
            </span>
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Pre-vetted statutory citations, mandatory clauses, and strategic argument frameworks for common litigation, transactional, and arbitration filings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Firm Template</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by filing type, statutory rule (Rule 56, DTSA), tags..."
            className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Status Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200'
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">All Practice Areas</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedApproval}
            onChange={(e) => setSelectedApproval(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200'
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">All Approval Tiers</option>
            <option value="FIRM_STANDARD">Firm Standard (Tier 1)</option>
            <option value="MANAGING_PARTNER_APPROVED">Managing Partner Approved</option>
            <option value="PRACTICE_GROUP">Practice Group Approved</option>
            <option value="CUSTOM">Custom Drafts</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.length === 0 ? (
          <div
            className={`col-span-2 p-12 text-center rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold">No legal drafting templates matched your criteria</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your category filter or search keywords to view available firm filings.
            </p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isApplied = activeTemplateId === template.id;

            return (
              <div
                key={template.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                  isApplied
                    ? isDark
                      ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500/40'
                      : 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-400'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:shadow-lg hover:shadow-black/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Tags & Approval Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {template.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {template.version}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        template.firmApprovalStatus === 'FIRM_STANDARD'
                          ? isDark
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                          : isDark
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      <span>{template.firmApprovalStatus.replace(/_/g, ' ')}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4
                    className={`text-sm font-bold leading-snug line-clamp-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {template.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Jurisdiction & Signoff */}
                  <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Jurisdiction:</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                        {template.jurisdiction}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Signoff / Author:</span>
                      <span className="font-semibold text-amber-400 truncate max-w-[200px]">
                        {template.approvalSignoff}
                      </span>
                    </div>
                  </div>

                  {/* Statutory Citations preview chips */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.statutoryCitations.slice(0, 2).map((cite, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-slate-300 truncate max-w-[240px]"
                      >
                        § {cite}
                      </span>
                    ))}
                    {template.statutoryCitations.length > 2 && (
                      <span className="text-[10px] font-mono text-slate-400 px-1 py-0.5">
                        +{template.statutoryCitations.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1 cursor-pointer ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Clauses</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {template.firmApprovalStatus === 'CUSTOM' && (
                      <button
                        onClick={() => deleteLegalTemplate(template.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleApplyTemplate(template)}
                      className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied to Studio</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply to Draft Studio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Template Full Detail Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-3xl border shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-5 border-b flex items-center justify-between ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span>{previewTemplate.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {previewTemplate.version}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {previewTemplate.category} · {previewTemplate.jurisdiction}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Approval Seal */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-amber-950/20 border-amber-900/60' : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approved Firm Filing Specification: {previewTemplate.firmApprovalStatus}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Signed: {previewTemplate.approvalSignoff}
                </span>
              </div>

              {/* Standard Mandatory Clauses */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Mandatory Firm Clauses & Sections
                </span>
                <div className="space-y-1">
                  {previewTemplate.mandatoryClauses.map((clause, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                        isDark ? 'bg-slate-950/40 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{clause}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pre-vetted Statutory Citations */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Pre-Vetted Statutory Authorities & Citations
                </span>
                <div className="space-y-1">
                  {previewTemplate.statutoryCitations.map((cite, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border font-mono text-[11px] flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800 text-amber-300' : 'bg-slate-50 border-slate-200 text-amber-800'
                      }`}
                    >
                      <span>{cite}</span>
                      <button
                        onClick={() => handleCopyText(cite, `cite-${idx}`)}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedId === `cite-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Client Position Outline */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Standard Position Formulation
                </span>
                <p
                  className={`p-3 rounded-xl border leading-relaxed ${
                    isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {previewTemplate.defaultClientPosition}
                </p>
              </div>

              {/* Default Key Legal Arguments */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Key Strategic Argument Outline
                </span>
                <p
                  className={`p-3 rounded-xl border leading-relaxed ${
                    isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {previewTemplate.defaultKeyLegalArguments}
                </p>
              </div>

              {/* Suggested Matter Vault Evidence Types */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Recommended Matter Vault Evidentiary Inputs
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {previewTemplate.suggestedEvidenceTypes.map((ev, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`p-4 border-t flex items-center justify-between ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <button
                onClick={() => setPreviewTemplate(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Close Preview
              </button>

              <button
                onClick={() => {
                  handleApplyTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Template to Drafting Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Firm Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-3xl border shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`p-5 border-b flex items-center justify-between ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold">Save New Firm Drafting Template</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Template Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Motion in Limine — Trade Secret Spoliation Sanctions"
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Practice Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Filing Instrument Type
                  </label>
                  <input
                    type="text"
                    required
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    placeholder="Motion for Summary Judgment"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Court / Jurisdiction
                  </label>
                  <input
                    type="text"
                    required
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value)}
                    placeholder="United States District Court, N.D. Cal."
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Approval Tier
                  </label>
                  <select
                    value={newApproval}
                    onChange={(e) => setNewApproval(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="FIRM_STANDARD">Firm Standard (Tier 1)</option>
                    <option value="MANAGING_PARTNER_APPROVED">Managing Partner Approved</option>
                    <option value="PRACTICE_GROUP">Practice Group Approved</option>
                    <option value="CUSTOM">Custom Working Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Template Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Summary of filing purpose and practice scenarios..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Standard Position Formulation
                </label>
                <textarea
                  rows={2}
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="Default posture formulation for client..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Core Legal Argument Outline
                </label>
                <textarea
                  rows={2}
                  value={newArguments}
                  onChange={(e) => setNewArguments(e.target.value)}
                  placeholder="Essential legal argument points and statutory thresholds..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Statutory Citations (1 per line)
                  </label>
                  <textarea
                    rows={2}
                    value={newCitations}
                    onChange={(e) => setNewCitations(e.target.value)}
                    placeholder="18 U.S.C. § 1836&#10;Fed. R. Civ. P. 56"
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Suggested Vault Evidence (comma separated)
                  </label>
                  <textarea
                    rows={2}
                    value={newEvidenceTypes}
                    onChange={(e) => setNewEvidenceTypes(e.target.value)}
                    placeholder="Deposition Transcripts, Git Diffs, Financial Ledgers"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="p-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
                >
                  Save to Firm Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
