import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  X,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  FileCode,
  Folder,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface UploadTask {
  id: string;
  name: string;
  folder?: string;
  size: string;
  status: 'uploading' | 'complete' | 'failed';
  progress: number;
}

interface Props {
  tasks?: UploadTask[];
  onRetry?: (id: string) => void;
  onRemove?: (id: string) => void;
  onClose?: () => void;
}

export const UploadProgressDrawer: React.FC<Props> = ({
  tasks,
  onRetry,
  onRemove,
  onClose,
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [internalFiles, setInternalFiles] = useState<UploadTask[]>([]);

  const activeFiles = tasks && tasks.length > 0 ? tasks : internalFiles;

  if (!internalIsOpen || activeFiles.length === 0) return null;

  const handleRetry = (id: string) => {
    if (onRetry) {
      onRetry(id);
    } else {
      setInternalFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'uploading', progress: 60 } : f))
      );
    }
  };

  const handleRemove = (id: string) => {
    if (onRemove) {
      onRemove(id);
    } else {
      setInternalFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleClose = () => {
    setInternalIsOpen(false);
    if (onClose) onClose();
  };

  const totalProgress = Math.round(
    activeFiles.reduce((sum, f) => sum + f.progress, 0) / activeFiles.length
  );

  return (
    <div
      className={`fixed bottom-6 right-8 z-50 w-96 backdrop-blur-md rounded-2xl shadow-2xl border overflow-hidden font-sans select-none transition-all duration-300 ring-1 ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 text-slate-100 ring-white/10'
          : 'bg-white/95 border-slate-200 text-slate-900 ring-black/5 shadow-slate-300/60'
      }`}
    >
      {/* Drawer Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/90 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Ingesting {activeFiles.length} item{activeFiles.length > 1 ? 's' : ''}
          </span>
          <span className="text-xs font-bold text-blue-500 font-num">{totalProgress}%</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-1 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      {!isMinimized && (
        <div
          className={`p-3 space-y-2.5 max-h-64 overflow-y-auto divide-y ${
            isDark
              ? 'bg-slate-950/80 divide-slate-800/40'
              : 'bg-slate-50/50 divide-slate-200'
          }`}
        >
          {activeFiles.map((file) => (
            <div
              key={file.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                file.status === 'failed'
                  ? isDark
                    ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                  : isDark
                  ? 'bg-slate-900/80 border-slate-800/80 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800 shadow-xs'
              }`}
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-1.5">
                  {file.folder && (
                    <span
                      className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded border font-medium ${
                        isDark
                          ? 'text-blue-400 bg-blue-950/80 border-blue-800/40'
                          : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}
                    >
                      <Folder className="w-2.5 h-2.5" />
                      {file.folder}
                    </span>
                  )}
                  <span
                    className={`truncate font-medium text-xs ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                    title={file.name}
                  >
                    {file.name}
                  </span>
                </div>

                {file.status === 'uploading' && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div
                      className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                        isDark ? 'bg-slate-800' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-num ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {file.progress}%
                    </span>
                  </div>
                )}

                {file.status === 'failed' && (
                  <div className="text-[10px] text-rose-500 font-semibold mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Upload Failed
                  </div>
                )}

                {file.status === 'complete' && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-num mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{file.size} · Ingestion & OCR Complete</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {file.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(file.id)}
                    className="px-2 py-0.5 text-[10px] font-bold text-blue-500 hover:text-white bg-blue-100 hover:bg-blue-600 rounded-md transition-colors"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={() => handleRemove(file.id)}
                  className={`p-1 rounded-md transition-colors ${
                    isDark
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                  }`}
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
