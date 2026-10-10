import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  FolderLock,
  Receipt,
  Landmark,
  ShieldAlert,
  Search,
  Building,
  Key,
  Users,
  Layers,
  Briefcase,
  X,
  UploadCloud,
  Check,
} from 'lucide-react';
import { MainNavView, useApp } from '../../context/AppContext';

interface BreadcrumbMenuProps {
  isDark: boolean;
}

export const BreadcrumbMenu: React.FC<BreadcrumbMenuProps> = ({ isDark }) => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    matters,
    documents,
    ethicalWalls,
    activeMatterId,
    currentTenant,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Hide breadcrumb entirely on the Super Admin Licensing Engine view
  if (currentView === 'super-admin') {
    return null;
  }

  // Active Screen Count
  const userScreens = ethicalWalls.filter((w) => w.active && w.userId === currentUser.id);

  // All sidebar navigation options moved into this structured breadcrumb menu
  const sidebarOptions: Array<{
    id: MainNavView;
    label: string;
    category: 'Core Practice OS' | 'Financials & Governance' | 'Administration';
    description: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
    isSuperAdminOnly?: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'Practice Overview',
      category: 'Core Practice OS',
      description: 'Executive WIP metrics, collections, and practice alerts',
      icon: LayoutDashboard,
      badge: 'Live WIP',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      id: 'matters',
      label: 'My Repos & Matters',
      category: 'Core Practice OS',
      description: 'Active case files, litigation dockets, and matter work product',
      icon: Briefcase,
      badge: matters.length,
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      id: 'vault',
      label: 'Counsel Repos Vault',
      category: 'Core Practice OS',
      description: 'Enterprise DMS, OCR search, legal hold locks, and AI nested folders',
      icon: FolderLock,
      badge: `${documents.length} Docs`,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'billing',
      label: 'Billing Center (₹ INR)',
      category: 'Financials & Governance',
      description: 'UTBMS time tracking, rate cards, and LEDES 1998B invoicing',
      icon: Receipt,
      badge: '₹ INR',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'trust',
      label: 'IOLTA Trust Ledger',
      category: 'Financials & Governance',
      description: 'Strictly segregated escrow accounting and three-way reconciliation',
      icon: Landmark,
      badge: 'Segregated',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      id: 'conflicts',
      label: 'Conflict & Screens',
      category: 'Financials & Governance',
      description: 'ABA Model Rule 1.10 ethical screening walls & enterprise checks',
      icon: ShieldAlert,
      badge: userScreens.length > 0 ? `${userScreens.length} Screen` : 'Compliant',
      badgeColor: userScreens.length > 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'clients',
      label: 'Client Directory',
      category: 'Financials & Governance',
      description: 'Corporate client accounts, retainers, and outside counsel contacts',
      icon: Users,
      badge: 'Directory',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      id: 'admin',
      label: 'Portal Admin & RBAC',
      category: 'Administration',
      description: 'Role-based access matrix, security logs, and firm policies',
      icon: Key,
    },
  ];

  // Filter based on user authorization and search query
  const filteredOptions = sidebarOptions.filter((opt) => {
    if (opt.isSuperAdminOnly && currentUser.role !== 'SUPER_ADMIN') {
      return false;
    }
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.description.toLowerCase().includes(q) ||
      opt.category.toLowerCase().includes(q)
    );
  });

  // Group filtered options by category
  const categories: Array<'Core Practice OS' | 'Financials & Governance' | 'Administration'> = [
    'Core Practice OS',
    'Financials & Governance',
    'Administration',
  ];

  // Identify current active option
  const activeOption = sidebarOptions.find(
    (opt) =>
      opt.id === currentView ||
      (opt.id === 'matters' && (currentView === 'matter-detail' || activeMatterId))
  ) || sidebarOptions[0];

  const CurrentIcon = activeOption.icon;

  // Active Matter Context if currently viewing a matter
  const activeMatter = activeMatterId ? matters.find((m) => m.id === activeMatterId) : null;

  return (
    <div className="relative flex items-center gap-1.5" ref={menuRef}>
      {/* Root Breadcrumb Trail */}
      <div className="flex items-center gap-1 text-xs select-none">
        <span
          className={`font-semibold hidden sm:inline ${
            isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          } cursor-pointer`}
          onClick={() => setCurrentView('dashboard')}
          title="Return to Practice Overview"
        >
          Counsel Repos
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
      </div>

      {/* Main Interactive Breadcrumb Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Open Navigation Menu (All Sidebar Options)"
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 shadow-xs cursor-pointer ${
          isOpen
            ? isDark
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/50'
              : 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
            : isDark
            ? 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-200 hover:border-blue-500/50'
            : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800 hover:border-blue-400'
        }`}
      >
        <CurrentIcon
          className={`w-3.5 h-3.5 ${
            isOpen ? 'text-white' : isDark ? 'text-blue-400' : 'text-blue-600'
          }`}
        />
        <span className="truncate max-w-[150px] md:max-w-[200px] font-bold">
          {activeOption.label}
        </span>
        <div
          className={`flex items-center justify-center w-4 h-4 rounded transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
        </div>
      </button>

      {/* Optional Sub-Breadcrumb for Active Matter */}
      {activeMatter && currentView === 'matter-detail' && (
        <div className="hidden lg:flex items-center gap-1.5 text-xs select-none">
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span
            className={`font-mono font-semibold px-2 py-0.5 rounded-lg border truncate max-w-[160px] ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-purple-300'
                : 'bg-purple-50 border-purple-200 text-purple-800'
            }`}
          >
            {activeMatter.matterNumber}
          </span>
        </div>
      )}

      {/* Structured All-Navigation Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-2 w-[360px] sm:w-[500px] rounded-2xl border shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh] ${
            isDark
              ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80'
              : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}
        >
          {/* Header with Brand, Tenant Info, and Quick Upload */}
          <div
            className={`p-4 border-b space-y-3 ${
              isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200/80 bg-slate-50/80'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Brand & Tenant Pill */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 87.3 78" className="w-6 h-6 drop-shadow-sm">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l12.3-21.3H1.45c0 1.6.4 3.1 1.2 4.5z" fill="#2563eb" />
                    <path d="M43.65 25 29.1 0c-1.3.8-2.4 1.9-3.2 3.3L1.45 45.45c-.8 1.4-1.2 2.9-1.2 4.5h24.55z" fill="#60a5fa" />
                    <path d="m73.55 76.8c1.3-.8 2.4-1.9 3.2-3.3l1.6-2.75c.8-1.4 1.2-2.9 1.2-4.5H54.4l5.3 9.2c1.3.9 2.6 1.3 4.1 1.35z" fill="#3b82f6" opacity="0.9" />
                    <path d="M43.65 25 58.2 0c-1.6 0-3.2.4-4.6 1.25L32.4 20.35 43.65 25z" fill="#93c5fd" opacity="0.8" />
                    <path d="M54.4 55.45H25.95l-12.3 21.35c1.4.8 2.9 1.2 4.55 1.2h50.85c1.6 0 3.1-.4 4.5-1.2z" fill="#2563eb" />
                    <path d="m85.85 45.45-14.5-25.1c-.8-1.4-1.9-2.5-3.2-3.3L54.4 55.45h25.15c0-1.6-.4-3.1-1.2-4.5z" fill="#60a5fa" opacity="0.85" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs tracking-tight truncate">
                    {currentTenant.name}
                  </div>
                  <div className="text-[10px] text-blue-500 font-semibold uppercase">
                    {currentTenant.plan} Plan · Counsel Repos OS
                  </div>
                </div>
              </div>

              {/* Quick Upload Action Button */}
              <button
                onClick={() => {
                  setCurrentView('vault');
                  setIsOpen(false);
                }}
                title="Quick Upload to Vault"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all shrink-0"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Files</span>
              </button>
            </div>

            {/* Fast Filter Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Jump to practice module or feature..."
                className={`w-full pl-9 pr-7 py-1.5 rounded-xl text-xs focus:outline-none border transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-amber-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                }`}
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Ethical Screening Warning if Screened */}
            {userScreens.length > 0 && (
              <div
                className={`p-2 rounded-xl text-[11px] leading-tight border flex items-center gap-2 ${
                  isDark
                    ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Ethical Wall:</strong> Screened from {userScreens.length} matter(s) under ABA Rule 1.10.
                </span>
              </div>
            )}
          </div>

          {/* Structured Modules by Category */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {categories.map((cat) => {
              const items = filteredOptions.filter((o) => o.category === cat);
              if (items.length === 0) return null;

              return (
                <div key={cat} className="space-y-1.5">
                  <div
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 flex items-center justify-between ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="font-mono text-[9px]">{items.length}</span>
                  </div>

                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        currentView === item.id ||
                        (item.id === 'matters' && currentView === 'matter-detail');

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentView(item.id);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all group ${
                            isActive
                              ? isDark
                                ? 'bg-blue-600/20 border border-blue-500/40 text-white shadow-xs'
                                : 'bg-blue-600 text-white shadow-sm'
                              : isDark
                              ? 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                              : 'hover:bg-amber-100/70 text-slate-700 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                isActive
                                  ? isDark
                                    ? 'bg-blue-600 text-white border-blue-400'
                                    : 'bg-blue-700 text-white border-blue-500'
                                  : isDark
                                  ? 'bg-slate-950 border-slate-800 text-blue-400 group-hover:border-blue-500/50'
                                  : 'bg-white border-amber-200 text-blue-600 group-hover:border-blue-400'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold truncate">{item.label}</span>
                                {isActive && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                      isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-800 text-white'
                                    }`}
                                  >
                                    Active
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-[11px] truncate mt-0.5 ${
                                  isActive
                                    ? isDark
                                      ? 'text-blue-200'
                                      : 'text-blue-100'
                                    : isDark
                                    ? 'text-slate-400 group-hover:text-slate-300'
                                    : 'text-slate-500 group-hover:text-slate-700'
                                }`}
                              >
                                {item.description}
                              </div>
                            </div>
                          </div>

                          {/* Badge */}
                          {item.badge && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border shrink-0 ml-2 ${
                                isActive
                                  ? isDark
                                    ? 'bg-blue-950 text-blue-200 border-blue-400/40'
                                    : 'bg-blue-800 text-white border-blue-500'
                                  : item.badgeColor ||
                                    (isDark
                                      ? 'bg-slate-950 text-slate-300 border-slate-800'
                                      : 'bg-amber-100 text-slate-800 border-amber-200')
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with Seat Quota Bar & Help Shortcut */}
          <div
            className={`p-3 border-t text-[11px] space-y-2 ${
              isDark
                ? 'border-slate-800 bg-slate-950/80 text-slate-400'
                : 'border-slate-200/80 bg-slate-50/80 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
              <span>Licensing Seats</span>
              <span className="font-mono text-blue-500 font-bold">
                {currentTenant.seatsAllocated}/{currentTenant.maxSeats} active
              </span>
            </div>

            <div
              className={`w-full h-1.5 rounded-full overflow-hidden ${
                isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  currentTenant.seatsAllocated >= currentTenant.maxSeats ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (currentTenant.seatsAllocated / currentTenant.maxSeats) * 100
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px]">
              <span>Press Esc to close menu</span>
              <span className="font-mono text-slate-400">⌘K for global search</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
