import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Building,
  Check,
  ChevronDown,
  HelpCircle,
  LogOut,
  Moon,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BreadcrumbMenu } from './BreadcrumbMenu';

export const TopBar: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    users,
    setCurrentView,
    ethicalWalls,
    currentTenant,
    theme,
    toggleTheme,
    logout,
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);

  // Ethical wall alerts for current user
  const activeScreenedMatters = ethicalWalls
    .filter((w) => w.active && w.userId === currentUser.id)
    .map((w) => w.matterNumber);

  const isDark = theme === 'dark';

  return (
    <header
      className={`h-16 border-b px-4 md:px-6 flex items-center justify-between z-30 shrink-0 select-none font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200/80 text-slate-800'
      }`}
    >
      {/* Left Area: Breadcrumb Button (with all sidebar options) + Search Input + Tenant Badge */}
      <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0 mr-4">
        {/* Breadcrumb Navigation Menu Button */}
        <BreadcrumbMenu isDark={isDark} />

        {/* Tenant Pill */}
        <div
          onClick={() => {
            if (currentUser.role === 'SUPER_ADMIN') {
              setCurrentView('super-admin');
            } else {
              setCurrentView('admin');
            }
          }}
          title="Current Tenant Firm · Click to manage"
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors shrink-0 ${
            isDark
              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-blue-500/50'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400 shadow-xs'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate max-w-[110px]">{currentTenant.name}</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-bold uppercase">
            {currentTenant.plan}
          </span>
        </div>

        {/* Global Search Pill */}
        <button
          onClick={() => setCurrentView('search')}
          className={`hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs transition-all w-full max-w-xs shadow-inner ${
            isDark
              ? 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-normal">Search Counsel Repos...</span>
          <span className={`text-[10px] font-mono ml-auto px-1.5 py-0.5 rounded border shadow-xs ${
            isDark ? 'bg-slate-800/60 text-slate-500 border-slate-700/50' : 'bg-white text-slate-500 border-slate-200'
          }`}>
            ⌘K
          </span>
        </button>

        {activeScreenedMatters.length > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-800/60 text-[11px] text-amber-300 font-medium whitespace-nowrap shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Screened: {activeScreenedMatters.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Right Controls: Super Admin Badge + Theme Toggle + Notifications + User Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Super Admin Console Button */}
        {currentUser.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setCurrentView('super-admin')}
            title="Super Admin Licensing Engine"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-full text-xs font-semibold transition-all shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">SaaS Licensing</span>
          </button>
        )}

        {/* Light / Dark Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
          className={`p-2 rounded-full border transition-all ${
            isDark
              ? 'bg-slate-950 border-slate-800 text-amber-300 hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-blue-600 hover:bg-slate-200'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => setHasNotifications(false)}
          title="Notifications"
          className={`relative p-2 rounded-full transition-colors ${
            isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </button>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className={`flex items-center gap-2 p-1.5 md:px-2.5 md:py-1.5 rounded-full border transition-all ${
              isDark
                ? 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <span className="hidden md:inline text-xs font-medium max-w-[90px] truncate">
              {currentUser.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* User Switcher Dropdown */}
          {showUserDropdown && (
            <div
              className={`absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl p-2 z-50 border space-y-1 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/90'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div
                className={`p-3 border-b mb-1 ${
                  isDark ? 'border-slate-800' : 'border-slate-100'
                }`}
              >
                <div className="font-semibold text-xs">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      currentUser.role === 'SUPER_ADMIN'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : currentUser.role === 'TENANT_ADMIN' || currentUser.role === 'MANAGING_PARTNER'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : currentUser.role === 'PARTNER'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : currentUser.role === 'ASSOCIATE'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {currentUser.role.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-num">
                    ₹{currentUser.billingRate}/hr
                  </span>
                </div>
              </div>

              {/* Persona Switcher */}
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500">
                Switch Role / Persona (Simulate)
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {users
                  .filter((u) => u.tenantId === currentUser.tenantId || u.role === 'SUPER_ADMIN')
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        currentUser.id === u.id
                          ? isDark
                            ? 'bg-blue-600/20 text-blue-400 font-semibold'
                            : 'bg-blue-50 text-blue-700 font-semibold'
                          : isDark
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.role.replace('_', ' ')}</div>
                      </div>
                      {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  ))}
              </div>

              <div
                className={`pt-1 border-t mt-1 ${
                  isDark ? 'border-slate-800' : 'border-slate-100'
                }`}
              >
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs transition-colors ${
                    isDark
                      ? 'text-red-400 hover:bg-red-950/30'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

