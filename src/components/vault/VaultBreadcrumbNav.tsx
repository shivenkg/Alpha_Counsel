import React, { useState } from 'react';
import {
  ChevronRight,
  Folder,
  FolderLock,
  FolderOpen,
  Home,
  CornerLeftUp,
  Lock,
  Copy,
  Check,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface VaultBreadcrumbNavProps {
  currentFolder: string;
  onSelectFolder: (folder: string) => void;
  isDark: boolean;
  folderList: string[];
  documentCount: number;
  isEncrypted?: boolean;
}

export const VaultBreadcrumbNav: React.FC<VaultBreadcrumbNavProps> = ({
  currentFolder,
  onSelectFolder,
  isDark,
  folderList,
  documentCount,
  isEncrypted = false,
}) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [showSubfolderMenu, setShowSubfolderMenu] = useState(false);

  // Deconstruct path into clickable segments
  const isRoot = currentFolder === 'ALL';
  const segments = isRoot ? [] : currentFolder.split('/').filter(Boolean);

  // Find any direct child subfolders of the current directory
  const childSubfolders = folderList.filter((f) => {
    if (f === 'ALL' || f === currentFolder) return false;
    if (isRoot) {
      // Top-level folders (without slashes)
      return !f.includes('/');
    }
    // Direct subfolders starting with currentFolder/
    const prefix = `${currentFolder}/`;
    if (!f.startsWith(prefix)) return false;
    const remaining = f.slice(prefix.length);
    return !remaining.includes('/');
  });

  // Navigate up one folder level
  const handleNavigateUp = () => {
    if (isRoot) return;
    if (segments.length <= 1) {
      onSelectFolder('ALL');
    } else {
      const parentPath = segments.slice(0, -1).join('/');
      onSelectFolder(parentPath);
    }
  };

  // Copy path to clipboard
  const handleCopyPath = () => {
    const displayPath = isRoot ? '/Vault/Root' : `/Vault/${currentFolder}`;
    navigator.clipboard.writeText(displayPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border p-3 md:px-4 md:py-3 transition-colors shadow-xs ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumb Path Segments */}
        <nav
          aria-label="Vault Directory Hierarchy"
          className="flex flex-wrap items-center gap-1.5 text-xs font-medium"
        >
          {/* Quick "Up One Level" Button when inside a folder */}
          {!isRoot && (
            <button
              onClick={handleNavigateUp}
              title={`Go up to ${
                segments.length > 1 ? segments[segments.length - 2] : 'Vault Root'
              }`}
              className={`mr-1 p-1.5 rounded-lg border transition-all active:scale-95 flex items-center justify-center ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-blue-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-blue-400'
              }`}
            >
              <CornerLeftUp className="w-3.5 h-3.5 text-blue-500" />
            </button>
          )}

          {/* Root Directory Segment (Vault Root) */}
          <button
            onClick={() => onSelectFolder('ALL')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              isRoot
                ? isDark
                  ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                  : 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-amber-100/60'
            }`}
            title="Navigate to Counsel Vault Root (All Documents)"
          >
            <FolderLock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Vault Root</span>
          </button>

          {/* Hierarchical Subfolder Segments */}
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            // Accumulate path up to this segment
            const accumulatedPath = segments.slice(0, index + 1).join('/');

            return (
              <React.Fragment key={accumulatedPath}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                {isLast ? (
                  // Current Active Leaf Folder
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border ${
                      isEncrypted
                        ? isDark
                          ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : isDark
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    }`}
                  >
                    {isEncrypted ? (
                      <Lock className="w-3 h-3 text-emerald-300 shrink-0" />
                    ) : (
                      <FolderOpen className="w-3.5 h-3.5 text-blue-100 shrink-0" />
                    )}
                    <span>{segment}</span>
                  </span>
                ) : (
                  // Clickable Intermediate Parent Folder Segment
                  <button
                    onClick={() => onSelectFolder(accumulatedPath)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors group ${
                      isDark
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-amber-100/70'
                    }`}
                    title={`Click to jump back to parent folder: ${accumulatedPath}`}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="group-hover:underline underline-offset-2">
                      {segment}
                    </span>
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right Directory Stats & Quick Subfolder Jumper */}
        <div className="flex items-center gap-2">
          {/* Document Count Badge */}
          <span
            className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-semibold border ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-white border-amber-200 text-slate-700'
            }`}
          >
            {documentCount} {documentCount === 1 ? 'file' : 'files'}
          </span>

          {/* Encryption Indicator Badge */}
          {isEncrypted && (
            <span
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
              title="Protected with client-side mock AES-256-GCM encryption"
            >
              <Lock className="w-3 h-3" />
              <span>AES-256</span>
            </span>
          )}

          {/* Copy Path Button */}
          <button
            onClick={handleCopyPath}
            title="Copy directory path"
            className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'bg-white border-amber-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {copiedPath ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Sibling / Child Subfolders Dropdown (if any exist) */}
          {childSubfolders.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSubfolderMenu(!showSubfolderMenu)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  isDark
                    ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-blue-400'
                    : 'bg-white hover:bg-slate-50 border-amber-200 text-blue-700 shadow-xs'
                }`}
                title="Browse direct subfolders inside this path"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{childSubfolders.length} Subfolders</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showSubfolderMenu && (
                <div
                  className={`absolute right-0 top-full mt-1.5 w-52 rounded-xl border shadow-xl p-1.5 z-40 animate-in fade-in duration-100 ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-white border-amber-200 text-slate-800'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sub-Directories
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {childSubfolders.map((subf) => {
                      const leafName = subf.split('/').pop() || subf;
                      return (
                        <button
                          key={subf}
                          onClick={() => {
                            onSelectFolder(subf);
                            setShowSubfolderMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                            isDark
                              ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                              : 'hover:bg-blue-50 text-slate-700 hover:text-blue-900'
                          }`}
                        >
                          <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{leafName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
