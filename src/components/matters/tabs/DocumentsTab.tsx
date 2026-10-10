import React, { useState } from 'react';
import {
  Clock,
  Download,
  Eye,
  FileCheck,
  FileCode,
  FileText,
  Folder,
  FolderLock,
  History,
  Lock,
  Plus,
  Share2,
  ShieldAlert,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter, VaultDocument } from '../../../types';
import { VaultDropzone } from '../../vault/VaultDropzone';

interface Props {
  matter: Matter;
}

const FOLDERS: VaultDocument['folder'][] = [
  'Pleadings',
  'Discovery',
  'Correspondence',
  'Contracts',
  'Exhibits',
  'Drafts',
];

export const DocumentsTab: React.FC<Props> = ({ matter }) => {
  const { documents, addDocument, logAudit, currentUser, theme } = useApp();
  const isDark = theme === 'dark';
  const matterDocs = documents.filter((d) => d.matterId === matter.id);

  const [selectedFolder, setSelectedFolder] = useState<VaultDocument['folder'] | 'ALL'>('ALL');
  const [activeDocPreview, setActiveDocPreview] = useState<VaultDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'dropzone' | 'manual'>('dropzone');
  const [shareLinkInfo, setShareLinkInfo] = useState<{ docTitle: string; url: string } | null>(null);

  // Upload Form
  const [title, setTitle] = useState('');
  const [fileName, setFileName] = useState('');
  const [folder, setFolder] = useState<VaultDocument['folder']>('Pleadings');
  const [confidentiality, setConfidentiality] = useState<VaultDocument['confidentialityLevel']>('Firm Confidential');
  const [ocrText, setOcrText] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const filteredDocs = selectedFolder === 'ALL'
    ? matterDocs
    : matterDocs.filter((d) => d.folder === selectedFolder);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addDocument({
      matterId: matter.id,
      folder,
      title,
      fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
      fileType: 'pdf',
      fileSize: '3.4 MB',
      createdBy: currentUser.name,
      isHeld: matter.hasActiveHold, // Invariant: New content inherits hold!
      legalHoldId: matter.hasActiveHold ? 'lh-1' : undefined,
      ocrExtractedText: ocrText || `VERIFIED RECORD: Document ${title} indexed for full-text search.`,
      tags: tags.length > 0 ? tags : ['Vault Intake'],
      confidentialityLevel: confidentiality,
    });

    setShowUploadModal(false);
    setTitle('');
    setFileName('');
    setOcrText('');
    setTagsInput('');
  };

  const handleDownload = (doc: VaultDocument, watermarked: boolean) => {
    logAudit(
      watermarked ? 'DOCUMENT_DOWNLOADED_WATERMARKED' : 'DOCUMENT_VIEWED',
      'Document',
      doc.id,
      `User ${currentUser.name} downloaded ${watermarked ? 'WATERMARKED' : 'ORIGINAL'} copy of "${doc.title}".`,
      matter.id,
      matter.matterNumber
    );
    alert(
      `Downloading "${doc.fileName}" ${
        watermarked ? 'with mandatory [PRIVILEGED & CONFIDENTIAL] forensic watermark' : ''
      }.\nAudit event permanently recorded.`
    );
  };

  const handleCreateShareLink = (doc: VaultDocument) => {
    const token = Math.random().toString(36).substring(2, 10);
    const link = `https://vault.alphacounsel.law/s/${matter.matterNumber}/${doc.id}?exp=72h&auth=${token}`;
    setShareLinkInfo({ docTitle: doc.title, url: link });
    logAudit(
      'DOCUMENT_VIEWED',
      'Document',
      doc.id,
      `Expiring share link generated (72hr validity) for "${doc.title}".`,
      matter.id,
      matter.matterNumber
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className={`text-sm font-semibold flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <FolderLock className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
            Matter Document Vault
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Immutable document versioning, OCR index, and legal hold lock enforcement
          </p>
        </div>

        <div className="flex items-center gap-2">
          {matter.hasActiveHold && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
                isDark
                  ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>Legal Hold Active: Destructive operations blocked</span>
            </div>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Folders Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedFolder('ALL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            selectedFolder === 'ALL'
              ? isDark
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-blue-50 text-blue-700 border border-blue-300 font-semibold'
              : isDark
              ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 shadow-xs'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>All Folders ({matterDocs.length})</span>
        </button>

        {FOLDERS.map((fld) => {
          const count = matterDocs.filter((d) => d.folder === fld).length;
          return (
            <button
              key={fld}
              onClick={() => setSelectedFolder(fld)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedFolder === fld
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-50 text-blue-700 border border-blue-300 font-semibold'
                  : isDark
                  ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 shadow-xs'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>
                {fld} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className={`rounded-lg p-4 space-y-3 transition-all group flex flex-col justify-between border ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-amber-400'
                        : 'bg-blue-50 border-blue-200 text-blue-600'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold ${
                        isDark ? 'text-amber-400/90' : 'text-blue-600'
                      }`}
                    >
                      {doc.folder} · {doc.currentVersion}
                    </span>
                    <h4
                      className={`text-xs font-semibold line-clamp-1 transition-colors ${
                        isDark
                          ? 'text-slate-100 group-hover:text-amber-300'
                          : 'text-slate-900 group-hover:text-blue-600'
                      }`}
                    >
                      {doc.title}
                    </h4>
                  </div>
                </div>

                {doc.isHeld && (
                  <span
                    title="Document is frozen under active Legal Hold"
                    className={`p-1 rounded border ${
                      isDark
                        ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div
                className={`text-[11px] font-mono flex items-center justify-between ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span>{doc.fileName}</span>
                <span>{doc.fileSize}</span>
              </div>

              {doc.ocrExtractedText && (
                <div
                  className={`rounded p-2 text-[11px] line-clamp-2 italic border ${
                    isDark
                      ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  "{doc.ocrExtractedText}"
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isDark
                        ? 'text-slate-400 bg-slate-800/80'
                        : 'text-slate-600 bg-slate-100 border border-slate-200'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div
              className={`pt-3 border-t flex items-center justify-between text-xs ${
                isDark ? 'border-slate-800/80' : 'border-slate-100'
              }`}
            >
              <button
                onClick={() => setActiveDocPreview(doc)}
                className={`flex items-center gap-1 transition-colors ${
                  isDark
                    ? 'text-slate-300 hover:text-amber-300'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>OCR & Versions</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCreateShareLink(doc)}
                  title="Generate Expiring Share Link"
                  className={`p-1 rounded transition-colors ${
                    isDark
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDownload(doc, true)}
                  title="Download with Privileged Watermark"
                  className={`p-1 rounded transition-colors ${
                    isDark
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-amber-300'
                      : 'hover:bg-slate-100 text-slate-500 hover:text-blue-600'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* OCR & Version History Modal */}
      {activeDocPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`border rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div
              className={`flex items-start justify-between border-b pb-3 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs uppercase tracking-wider font-semibold ${
                      isDark ? 'text-amber-400' : 'text-blue-600'
                    }`}
                  >
                    {activeDocPreview.folder}
                  </span>
                  {activeDocPreview.isHeld && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 border ${
                        isDark
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      Preservation Hold Frozen
                    </span>
                  )}
                </div>
                <h3
                  className={`text-base font-semibold mt-1 ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {activeDocPreview.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDocPreview(null)}
                className={`text-sm ${
                  isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* OCR Full Text Preview */}
              <div>
                <div
                  className={`text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
                  Full-Text OCR Extracted Index
                </div>
                <div
                  className={`border rounded p-3 text-xs font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {activeDocPreview.ocrExtractedText || 'No OCR text extracted.'}
                </div>
              </div>

              {/* Version History */}
              <div>
                <div
                  className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  <History className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
                  Immutable Version Log
                </div>
                <div className="space-y-1.5">
                  {activeDocPreview.versions.map((ver) => (
                    <div
                      key={ver.versionNumber}
                      className={`flex items-center justify-between p-2.5 rounded border text-xs ${
                        isDark
                          ? 'bg-slate-950/60 border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <span
                          className={`font-semibold ${
                            isDark ? 'text-amber-300' : 'text-blue-700'
                          }`}
                        >
                          {ver.versionNumber}
                        </span>
                        <span
                          className={`ml-2 font-mono ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {new Date(ver.uploadedAt).toLocaleString()}
                        </span>
                        {ver.notes && (
                          <div
                            className={`text-[11px] mt-0.5 ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {ver.notes}
                          </div>
                        )}
                      </div>
                      <span
                        className={`font-mono text-[11px] ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {ver.fileSize}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Watermark Notice */}
              <div
                className={`p-3 rounded-md text-xs leading-relaxed border ${
                  isDark
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-300/90'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <strong>Forensic Watermarking Enabled:</strong> Any export from this vault contains
                an invisible cryptographic tracking tag matching user identity (
                {currentUser.name}) and matter timestamp to preserve chain of custody.
              </div>
            </div>

            <div
              className={`flex items-center justify-between pt-3 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <button
                onClick={() => handleCreateShareLink(activeDocPreview)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors ${
                  isDark
                    ? 'text-slate-300 hover:text-white bg-slate-800'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 border border-slate-200'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Create Expiring Share</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(activeDocPreview, true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Watermarked PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {shareLinkInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h3
              className={`text-sm font-semibold flex items-center gap-2 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              <Share2 className="w-4 h-4 text-emerald-500" />
              Expiring Secure Document Share
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              72-Hour tokenized link with client & opposing counsel audit log.
            </p>

            <div>
              <label
                className={`block text-[11px] uppercase tracking-wider mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Document
              </label>
              <div
                className={`text-xs font-semibold ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {shareLinkInfo.docTitle}
              </div>
            </div>

            <div>
              <label
                className={`block text-[11px] uppercase tracking-wider mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Secure Vault URL
              </label>
              <input
                type="text"
                readOnly
                value={shareLinkInfo.url}
                className={`w-full rounded p-2 text-xs font-mono select-all border ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-emerald-300'
                    : 'bg-slate-50 border-slate-300 text-emerald-700'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShareLinkInfo(null)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition-colors shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal Frame */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className={`border rounded-2xl md:rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative transition-all duration-200 animate-in zoom-in-95 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-black/80' : 'bg-white border-slate-200 shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
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
                    Upload to Matter Vault
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target Matter:{' '}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      [{matter.matterNumber}] {matter.title}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Mode Selector Toggle */}
                <div
                  className={`flex items-center p-0.5 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setUploadMode('dropzone')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      uploadMode === 'dropzone'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Drag & Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('manual')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      uploadMode === 'manual'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Manual Form
                  </button>
                </div>

                <button
                  onClick={() => setShowUploadModal(false)}
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
            </div>

            {/* Dropzone Mode */}
            {uploadMode === 'dropzone' ? (
              <VaultDropzone
                targetMatterId={matter.id}
                currentFolder={selectedFolder !== 'ALL' ? selectedFolder : 'Discovery'}
              />
            ) : (
              /* Manual Metadata Form */
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label
                    className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Reply Declaration of Expert Lindqvist"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Folder
                    </label>
                    <select
                      value={folder}
                      onChange={(e) => setFolder(e.target.value as any)}
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      {FOLDERS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Confidentiality
                    </label>
                    <select
                      value={confidentiality}
                      onChange={(e) => setConfidentiality(e.target.value as any)}
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="Firm Confidential">Firm Confidential</option>
                      <option value="Highly Confidential - Attorneys Eyes Only">
                        Highly Confidential (AEO)
                      </option>
                      <option value="Public">Public</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. Motion, Infringement, Exhibit"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    OCR Text Extract
                  </label>
                  <textarea
                    rows={3}
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    placeholder="Extracted textual content for full-text search and AI citations..."
                    className={`w-full rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 border resize-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className={`px-4 py-2 text-xs font-medium ${
                      isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
                  >
                    Ingest & Index
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
