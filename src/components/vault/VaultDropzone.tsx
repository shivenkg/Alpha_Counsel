import React, { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FolderUp,
  FileUp,
  CheckCircle2,
  Folder,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  FileText,
  ArrowDownCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../hooks/useAudit';
import { scanDroppedItems, scanInputFiles, ScannedUploadItem } from '../../utils/fileUpload';
import { UploadTask } from './UploadProgressDrawer';
import { VaultDocument } from '../../types';

interface VaultDropzoneProps {
  currentFolder?: string;
  targetMatterId?: string;
  onUploadStart?: (tasks: UploadTask[]) => void;
  onUploadProgress?: (taskId: string, progress: number) => void;
  onUploadComplete?: (task: UploadTask, doc: VaultDocument) => void;
  compact?: boolean;
}

export const VaultDropzone: React.FC<VaultDropzoneProps> = ({
  currentFolder = 'Discovery',
  targetMatterId,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  compact = false,
}) => {
  const { matters, activeMatterId, addDocument, currentUser, theme } = useApp();
  const { logDocumentAction } = useAudit();
  const isDark = theme === 'dark';

  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedItemCount, setDraggedItemCount] = useState<number>(0);
  const [selectedMatterId, setSelectedMatterId] = useState<string>(
    targetMatterId || activeMatterId || matters[0]?.id || ''
  );
  const [targetCategory, setTargetCategory] = useState<string>(
    currentFolder === 'ALL' ? 'Discovery' : currentFolder
  );
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (targetMatterId) {
      setSelectedMatterId(targetMatterId);
    }
  }, [targetMatterId]);

  useEffect(() => {
    if (currentFolder && currentFolder !== 'ALL') {
      setTargetCategory(currentFolder);
    }
  }, [currentFolder]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);

  const activeMatter =
    matters.find((m) => m.id === selectedMatterId) || matters[0] || {
      id: 'default-matter',
      matterNumber: 'M-2026-001',
      title: 'General Legal Repository',
      hasActiveHold: false,
    };

  const processScannedItems = async (items: ScannedUploadItem[]) => {
    if (items.length === 0) return;

    // Create initial upload tasks
    const newTasks: UploadTask[] = items.map((item, idx) => ({
      id: `up-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      name: item.relativePath || item.file.name,
      folder: item.folderName !== 'Root' ? item.folderName : targetCategory,
      size: item.sizeFormatted,
      status: 'uploading',
      progress: 10,
    }));

    if (onUploadStart) {
      onUploadStart(newTasks);
    }

    // Process each upload with simulated asynchronous progress
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const task = newTasks[i];
      const assignedFolder =
        item.folderName && item.folderName !== 'Root'
          ? item.folderName
          : targetCategory;

      const ext = item.file.name.split('.').pop()?.toLowerCase();
      let fileType: VaultDocument['fileType'] = 'pdf';
      if (ext === 'docx' || ext === 'doc') fileType = 'docx';
      else if (ext === 'xlsx' || ext === 'xls') fileType = 'xlsx';
      else if (ext === 'txt') fileType = 'txt';

      const docTitle = item.file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

      // Simulate progress ticks
      await new Promise((r) => setTimeout(r, 100));
      if (onUploadProgress) onUploadProgress(task.id, 50);

      await new Promise((r) => setTimeout(r, 120));
      if (onUploadProgress) onUploadProgress(task.id, 85);

      const ocrMock =
        fileType === 'xlsx'
          ? `[EXCEL FINANCIAL MODEL]\nFile: ${item.file.name}\nQuantum Claim Damages Sheet\nVerified Line Items: 24\nTotal Currency Value: INR 29,24,250.00\nFormula Checks: Passed.`
          : `[FORENSIC OCR EXTRACTION]\nDocument: ${docTitle}\nIngested into matter [${activeMatter.matterNumber}] ${activeMatter.title}.\nPreservation status: Certified immutable record.\nExtracted Entities: Parties, Claims, Evidentiary exhibits.`;

      // Add to context
      const createdDoc: VaultDocument = {
        id: `doc-${Date.now()}-${i}`,
        matterId: activeMatter.id,
        folder: assignedFolder,
        title: docTitle,
        fileName: item.file.name,
        fileType,
        fileSize: item.sizeFormatted,
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: currentUser.name,
        isHeld: activeMatter.hasActiveHold || false,
        ocrExtractedText: ocrMock,
        currentVersion: '1.0',
        tags: [assignedFolder, fileType.toUpperCase(), 'INGESTED'],
        versions: [
          {
            versionNumber: '1.0',
            uploadedAt: new Date().toISOString().split('T')[0],
            uploadedBy: currentUser.name,
            fileSize: item.sizeFormatted,
            notes: 'Initial ingestion into Counsel Repos vault',
          },
        ],
        confidentialityLevel: activeMatter.hasActiveHold
          ? 'Highly Confidential - Attorneys Eyes Only'
          : 'Firm Confidential',
      };

      addDocument(createdDoc);

      // Audit log
      logDocumentAction(
        'DOCUMENT_UPLOADED',
        createdDoc.id,
        createdDoc.title,
        activeMatter.id,
        activeMatter.matterNumber,
        {
          fileName: item.file.name,
          folder: assignedFolder,
          fileSize: item.sizeFormatted,
          custodian: currentUser.name,
        }
      );

      if (onUploadProgress) onUploadProgress(task.id, 100);
      if (onUploadComplete) onUploadComplete({ ...task, status: 'complete', progress: 100 }, createdDoc);
    }

    setUploadSuccessNotice(`Successfully ingested ${items.length} item(s) into ${targetCategory}`);
    setTimeout(() => setUploadSuccessNotice(null), 4000);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragOver(true);
    if (e.dataTransfer.items) {
      setDraggedItemCount(e.dataTransfer.items.length);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragOver(false);
      dragCounterRef.current = 0;
      setDraggedItemCount(0);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;
    setDraggedItemCount(0);

    const items = await scanDroppedItems(e.dataTransfer, targetCategory);
    await processScannedItems(items);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const items = scanInputFiles(e.target.files, targetCategory);
    await processScannedItems(items);
    e.target.value = '';
  };

  const handleFolderChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const items = scanInputFiles(e.target.files, targetCategory);
    await processScannedItems(items);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Hidden file & folder inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />

      {/* Main Drag & Drop Zone with High-Contrast Visual Feedback */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl md:rounded-3xl transition-all duration-200 select-none overflow-hidden ${
          compact ? 'p-4' : 'p-6 md:p-8'
        } ${
          isDragOver
            ? isDark
              ? 'border-blue-400 bg-blue-950/70 ring-4 ring-blue-500/30 shadow-2xl shadow-blue-500/25 scale-[1.015]'
              : 'border-blue-600 bg-blue-50 ring-4 ring-blue-500/25 shadow-xl shadow-blue-500/15 scale-[1.015]'
            : isDark
            ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/20 shadow-xs'
        }`}
      >
        {/* Pulsing Drag-Over Overlay Cue */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-600/10 pointer-events-none flex items-center justify-center backdrop-blur-[1px] animate-pulse">
            <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 animate-bounce" />
              <span>Drop items now to ingest into {targetCategory}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center space-y-3.5 text-center">
          {/* Animated Ingestion Icon */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isDragOver
                ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/40 ring-4 ring-blue-400/30 animate-bounce'
                : isDark
                ? 'bg-blue-950/80 border border-blue-800/60 text-blue-400'
                : 'bg-blue-50 border border-blue-200 text-blue-600 shadow-xs'
            }`}
          >
            {isDragOver ? (
              <FolderUp className="w-7 h-7" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          {/* Heading and Action Feedback */}
          <div>
            <h3
              className={`text-sm md:text-base font-bold tracking-tight transition-colors ${
                isDragOver
                  ? 'text-blue-600 dark:text-blue-400'
                  : isDark
                  ? 'text-white'
                  : 'text-slate-900'
              }`}
            >
              {isDragOver
                ? 'Release to ingest files & folder trees into Counsel Repos'
                : 'Drag & Drop files or complete folder directories here'}
            </h3>
            <p
              className={`text-xs mt-1 max-w-lg mx-auto leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {isDragOver
                ? 'Recursive intake active — nested directories will be mapped to folder categories automatically.'
                : 'Supports PDF, Word, Excel, and text records. Files will be scanned, hashed, and indexed for instant search without manual tagging.'}
            </p>
          </div>

          {/* Action Buttons: Browse Files & Upload Entire Folder */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <FileUp className="w-4 h-4" />
              <span>Browse Files</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border shadow-xs transition-all active:scale-95 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <FolderUp className="w-4 h-4 text-amber-500" />
              <span>Upload Entire Folder</span>
            </button>
          </div>

          {/* Target Matter and Category Selectors Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            {/* Matter Selector */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Target Matter:
              </span>
              <select
                value={selectedMatterId}
                onChange={(e) => setSelectedMatterId(e.target.value)}
                className={`bg-transparent font-semibold focus:outline-none cursor-pointer text-xs ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {matters.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                    className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}
                  >
                    [{m.matterNumber}] {m.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Folder / Category Selector */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Default Folder:
              </span>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className={`bg-transparent font-semibold focus:outline-none cursor-pointer text-xs ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {['Pleadings', 'Discovery', 'Contracts', 'Exhibits', 'Correspondence', 'Drafts'].map(
                  (cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}
                    >
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Success Notification Pill */}
          {uploadSuccessNotice && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{uploadSuccessNotice}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
