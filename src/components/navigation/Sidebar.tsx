import React, { useState } from 'react';
import {
  Briefcase,
  LayoutDashboard,
  FolderLock,
  Receipt,
  Key,
  ShieldCheck,
  Moon,
  Sun,
  LogOut,
  UploadCloud,
  History,
  Globe,
  Star,
  Clock,
  Folder,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Pin,
  PinOff,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { MainNavView, useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    matters,
    currentTenant,
    theme,
    toggleTheme,
    logout,
    openUploadModal,
    adminTab,
    setAdminTab,
    audit_events,
    clientPortalShares,
    documents,
    favoriteDocIds,
    favoriteFolders,
    toggleFavoriteDoc,
    toggleFavoriteFolder,
    recentItems,
    recordRecentItem,
    setSelectedVaultFolder,
    setSelectedVaultDocId,
    setActiveVersionSidebarDoc,
  } = useApp();

  const isDark = theme === 'dark';

  // Toggle between 'favorites' and 'recent' view in the bookmark section
  const [sidebarTab, setSidebarTab] = useState<'favorites' | 'recent'>('favorites');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Available unique folders from documents
  const allFolders = Array.from(
    new Set([
      'Contracts',
      'Finance & Reports',
      'Product Specs',
      'Marketing',
      'Discovery',
      'Drafts',
      ...documents.map((d) => d.folder).filter(Boolean),
    ])
  );

  const navItems: Array<{
    id: MainNavView;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    onClick?: () => void;
  }> = [
    { id: 'vault', label: 'All Documents', icon: FolderLock },
    { id: 'matters', label: 'Workspaces & Projects', icon: Briefcase, badge: matters.length },
    {
      id: 'client-portal',
      label: 'Shared & Portals',
      icon: Globe,
      badge: clientPortalShares.length > 0 ? clientPortalShares.length : undefined,
    },
    { id: 'dashboard', label: 'DMS Insights', icon: LayoutDashboard },
    { id: 'billing', label: 'Storage & Plan', icon: Receipt },
    { id: 'admin', label: 'Access & Roles', icon: Key },
    {
      id: 'audit-log',
      label: 'Audit Trail',
      icon: History,
      badge: audit_events.length,
      onClick: () => {
        setAdminTab('audit');
        setCurrentView('admin');
      },
    },
  ];

  // Helper for file type icons
  const renderFileIcon = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <ImageIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    if (ext === 'ts' || ext === 'js' || ext === 'json') return <FileCode className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    return <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  };

  // Click handler for pinned/recent folder
  const handleOpenFolder = (folderName: string) => {
    setSelectedVaultFolder(folderName);
    setSelectedVaultDocId(null);
    setCurrentView('vault');
    recordRecentItem({
      id: folderName,
      name: folderName,
      type: 'folder',
    });
  };

  // Click handler for pinned/recent document
  const handleOpenDocument = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setSelectedVaultDocId(doc.id);
      setSelectedVaultFolder(doc.folder || 'ALL');
      setCurrentView('vault');
      recordRecentItem({
        id: doc.id,
        name: doc.title,
        type: 'file',
        ext: doc.fileName.split('.').pop(),
        fileSize: doc.fileSize,
      });
    }
  };

  return (
    <aside
      className={`w-64 border-r flex flex-col shrink-0 select-none z-20 relative font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-[#0a1532] border-slate-800/80 text-slate-100'
          : 'bg-white border-slate-200/80 text-slate-800'
      }`}
    >
      {/* Brand Header */}
      <div className={`p-5 pb-3 transition-colors duration-200 ${isDark ? '' : 'bg-white'}`}>
        <div className="flex items-center gap-2.5">
          {/* Minimalist Logo Mark */}
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-sm tracking-wider">
            DV
          </div>
          <div>
            <h1
              className={`font-bold text-base tracking-tight flex items-center gap-1 leading-none ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              DocuVault
            </h1>
            <span
              className={`text-[10px] tracking-wider font-semibold uppercase mt-0.5 block ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              Enterprise Document OS
            </span>
          </div>
        </div>

        {/* Active Workspace / Tenant Subtitle */}
        <div
          className={`mt-3 px-3 py-1.5 rounded-xl text-[11px] flex items-center justify-between border transition-colors ${
            isDark
              ? 'bg-blue-950/60 border-blue-800/40 text-blue-200'
              : 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          <span className={`truncate font-semibold ${isDark ? 'text-blue-200' : 'text-slate-800'}`}>
            {currentTenant.name}
          </span>
          <span
            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
              isDark ? 'text-blue-400 bg-blue-900/60' : 'text-blue-700 bg-blue-100'
            }`}
          >
            {currentTenant.plan}
          </span>
        </div>
      </div>

      {/* Upload New Files Pill Button */}
      <div className={`px-4 py-1.5 transition-colors duration-200 ${isDark ? '' : 'bg-white'}`}>
        <button
          onClick={() => {
            setCurrentView('vault');
            openUploadModal();
          }}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-98"
        >
          <UploadCloud className="w-4 h-4 text-white" />
          <span>Upload Documents</span>
        </button>
      </div>

      {/* Primary Navigation Links */}
      <div
        className={`pt-2 px-3 space-y-0.5 shrink-0 transition-colors duration-200 ${
          isDark ? '' : 'bg-white'
        }`}
      >
        {/* Super Admin Tab */}
        {currentUser.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setCurrentView('super-admin')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all mb-1 ${
              currentView === 'super-admin'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : isDark
                ? 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/40 border border-purple-800/60'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span>Licensing Console</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-200 text-purple-800'
              }`}
            >
              Master
            </span>
          </button>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentView === item.id ||
            (item.id === 'matters' && currentView === 'matter-detail') ||
            (item.id === 'audit-log' && currentView === 'admin' && adminTab === 'audit') ||
            (item.id === 'admin' && currentView === 'admin' && adminTab !== 'audit');
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else {
                  if (item.id === 'admin' && adminTab === 'audit') {
                    setAdminTab('matrix');
                  }
                  setCurrentView(item.id);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? isDark
                    ? 'bg-blue-600/30 text-white border border-blue-500/40 shadow-xs font-semibold'
                    : 'bg-blue-600 text-white shadow-xs font-semibold'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? isDark
                        ? 'text-blue-400'
                        : 'text-white'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-medium font-num border ${
                    isActive
                      ? isDark
                        ? 'bg-blue-950 text-blue-200 border-blue-400/40'
                        : 'bg-blue-700 text-white border-blue-500'
                      : isDark
                      ? 'bg-slate-800/80 border-slate-700 text-blue-300'
                      : 'bg-slate-100 border-slate-200 text-blue-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RECENT & FAVORITES SECTION (USER REQUEST)                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 mt-3 pt-3 border-t border-slate-800/60 px-3">
        {/* Section Header with Segmented Switcher */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center bg-slate-800/50 p-0.5 rounded-lg border border-slate-700/50">
            <button
              onClick={() => setSidebarTab('favorites')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                sidebarTab === 'favorites'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Pinned folders and files for one-click access"
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Favorites</span>
              <span className="text-[9px] px-1 rounded-full bg-slate-900/60 font-mono">
                {favoriteFolders.length + favoriteDocIds.length}
              </span>
            </button>
            <button
              onClick={() => setSidebarTab('recent')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                sidebarTab === 'recent'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Recently accessed documents and folders"
            >
              <Clock className="w-3 h-3" />
              <span>Recent</span>
            </button>
          </div>

          {/* Quick Pin Dialog / Dropdown Button */}
          {sidebarTab === 'favorites' && (
            <button
              onClick={() => setShowPinModal(!showPinModal)}
              title="Pin a folder or document to Favorites"
              className={`p-1 rounded-md transition-colors text-slate-400 hover:text-white ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Pin Dropdown Helper */}
        {showPinModal && (
          <div
            className={`p-2.5 mb-2 rounded-xl border text-xs space-y-2 animate-in fade-in zoom-in-95 shrink-0 ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-200 shadow-xl'
                : 'bg-white border-slate-200 text-slate-800 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Quick Pin to Favorites</span>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
              <span className="text-[10px] font-semibold uppercase text-slate-500 block px-1">Folders</span>
              {allFolders.map((f) => {
                const isFav = favoriteFolders.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => toggleFavoriteFolder(f)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-blue-600/20 text-left text-[11px]"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Folder className="w-3 h-3 text-amber-400" />
                      <span className="truncate">{f}</span>
                    </span>
                    <Star
                      className={`w-3 h-3 ${
                        isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content: Favorites or Recent */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 pb-2">
          {sidebarTab === 'favorites' ? (
            <>
              {favoriteFolders.length === 0 && favoriteDocIds.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                  <Star className="w-5 h-5 text-slate-600 mx-auto stroke-1" />
                  <p className="font-medium">No pinned items yet</p>
                  <p className="text-[10px] text-slate-500">
                    Click the + icon or star any document in the vault to pin it here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Pinned Folders Subgroup */}
                  {favoriteFolders.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 pt-1 block">
                        Folders
                      </span>
                      {favoriteFolders.map((folderName) => {
                        const count = documents.filter(
                          (d) => d.folder === folderName || d.folder.startsWith(`${folderName}/`)
                        ).length;
                        return (
                          <div
                            key={folderName}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                              isDark
                                ? 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                                : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                            }`}
                            onClick={() => handleOpenFolder(folderName)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate text-xs">{folderName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono text-slate-500 group-hover:hidden">
                                {count}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteFolder(folderName);
                                }}
                                title="Unpin folder"
                                className="hidden group-hover:flex p-1 text-amber-400 hover:text-rose-400 rounded transition-colors"
                              >
                                <PinOff className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pinned Files Subgroup */}
                  {favoriteDocIds.length > 0 && (
                    <div className="space-y-0.5 pt-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 block">
                        Documents
                      </span>
                      {favoriteDocIds.map((docId) => {
                        const doc = documents.find((d) => d.id === docId);
                        if (!doc) return null;
                        return (
                          <div
                            key={doc.id}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                              isDark
                                ? 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                                : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                            }`}
                            onClick={() => handleOpenDocument(doc.id)}
                            title={doc.title}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {renderFileIcon(doc.fileName)}
                              <span className="truncate text-xs">{doc.title}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] font-mono px-1 rounded bg-slate-800/80 text-purple-400 border border-purple-500/20 group-hover:hidden">
                                {doc.currentVersion || 'v1.0'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteDoc(doc.id);
                                }}
                                title="Unpin file"
                                className="hidden group-hover:flex p-1 text-amber-400 hover:text-rose-400 rounded transition-colors"
                              >
                                <PinOff className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* Recent Tab */
            <div className="space-y-0.5">
              {recentItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                  <Clock className="w-5 h-5 text-slate-600 mx-auto stroke-1" />
                  <p className="font-medium">No recent documents</p>
                  <p className="text-[10px] text-slate-500">
                    Opened or viewed documents will show up here.
                  </p>
                </div>
              ) : (
                recentItems.map((item) => {
                  const isFile = item.type === 'file';
                  const isPinned = isFile
                    ? favoriteDocIds.includes(item.id)
                    : favoriteFolders.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isFile) {
                          handleOpenDocument(item.id);
                        } else {
                          handleOpenFolder(item.id);
                        }
                      }}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                        isDark
                          ? 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                          : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isFile ? (
                          renderFileIcon(item.ext ? `file.${item.ext}` : item.name)
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="truncate text-xs">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] text-slate-500 group-hover:hidden">
                          {item.timestamp}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isFile) {
                              toggleFavoriteDoc(item.id);
                            } else {
                              toggleFavoriteFolder(item.id);
                            }
                          }}
                          title={isPinned ? 'Remove from favorites' : 'Pin to favorites'}
                          className="hidden group-hover:flex p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
                        >
                          <Star
                            className={`w-3 h-3 ${
                              isPinned ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* SaaS Licensing & Storage Strip */}
      <div
        className={`p-3 border-t space-y-2 transition-colors duration-200 shrink-0 ${
          isDark
            ? 'border-slate-800/80 bg-slate-950/70 text-slate-400'
            : 'border-slate-200/80 bg-slate-50/70 text-slate-600'
        }`}
      >
        <div
          className={`flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <span>Cloud Storage</span>
          <span className={`font-num font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            {currentTenant.storageUsedGB} GB / {currentTenant.storageLimitGB} GB
          </span>
        </div>

        {/* Quota Bar */}
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{
              width: `${Math.min(
                100,
                (currentTenant.storageUsedGB / currentTenant.storageLimitGB) * 100
              )}%`,
            }}
          />
        </div>

        {/* Theme & Logout Controls */}
        <div
          className={`pt-2 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-slate-800/60' : 'border-slate-200'
          }`}
        >
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Toggle ${isDark ? 'Light' : 'Dark'} mode`}
            className={`flex items-center gap-1.5 transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px]">Dark Mode</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Log out of system"
            className={`flex items-center gap-1 transition-colors ${
              isDark ? 'text-slate-400 hover:text-rose-400' : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[11px]">Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
