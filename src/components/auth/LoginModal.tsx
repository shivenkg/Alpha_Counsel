import React, { useState } from 'react';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  ChevronRight,
  FolderLock,
  Globe,
  IndianRupee,
  Key,
  Lock,
  LogOut,
  Moon,
  Scale,
  Shield,
  ShieldCheck,
  Sun,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPER_ADMIN_USER } from '../../data/saasData';
import { formatCurrency } from '../../services/financials';
import { User, UserRole } from '../../types';

export const LoginModal: React.FC = () => {
  const {
    users,
    login,
    tenants,
    currentTenantId,
    setCurrentTenantId,
    theme,
    toggleTheme,
  } = useApp();

  const [selectedTenantId, setSelectedTenantId] = useState(currentTenantId);
  const [emailInput, setEmailInput] = useState('msterling@alphacounsel.law');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [errorMsg, setErrorMsg] = useState('');

  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check if super admin email
    if (
      emailInput.toLowerCase().includes('admin') ||
      emailInput.toLowerCase().includes('super') ||
      emailInput.toLowerCase() === SUPER_ADMIN_USER.email.toLowerCase()
    ) {
      login(SUPER_ADMIN_USER, selectedTenantId);
      return;
    }

    // Find in users list
    const found = users.find(
      (u) => u.email.toLowerCase() === emailInput.toLowerCase()
    );

    if (found) {
      login(found, selectedTenantId);
    } else {
      // Default to first user or create a temporary session
      login(users[1] || SUPER_ADMIN_USER, selectedTenantId);
    }
  };

  const handleQuickPersona = (user: User) => {
    login(user, user.role === 'SUPER_ADMIN' ? 'tenant-1' : selectedTenantId);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#070c18]/90' : 'bg-slate-900/60'
      }`}
    >
      <div
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col md:flex-row ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Left Brand Panel */}
        <div
          className={`md:w-5/12 p-8 flex flex-col justify-between relative overflow-hidden ${
            isDark ? 'bg-[#091535] text-white' : 'bg-[#124294] text-white'
          }`}
        >
          {/* Subtle glow background */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Counsel Repos</h2>
                  <span className="text-[10px] text-blue-300 uppercase tracking-widest font-semibold block">
                    Legal Practice OS
                  </span>
                </div>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-200" />}
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Enterprise Practice & Ethical Screen Management
              </h3>
              <p className="text-xs text-blue-200/90 leading-relaxed">
                Multi-tenant legal document vault, IOLTA escrow accounting, and role-based ethical wall boundary enforcement.
              </p>
            </div>

            {/* Current Active Tenant Card */}
            <div className="bg-black/25 backdrop-blur-xs border border-white/15 rounded-2xl p-4 space-y-2">
              <div className="text-[10px] uppercase font-bold text-blue-300 tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>Active Law Firm Tenant</span>
              </div>
              <div className="text-sm font-bold text-white">{activeTenant.name}</div>
              <div className="flex items-center justify-between text-[11px] text-blue-200">
                <span>Tier: <span className="font-semibold text-white">{activeTenant.plan}</span></span>
                <span>Seats: <span className="font-semibold text-white">{activeTenant.seatsAllocated}/{activeTenant.maxSeats}</span></span>
              </div>
              <div className="text-[10px] font-mono text-blue-300/80 truncate">
                Key: {activeTenant.licenseKey}
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 text-[11px] text-blue-200/70 flex items-center justify-between">
            <span>SaaS Version 2.4.0</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Fiduciary Segregated
            </span>
          </div>
        </div>

        {/* Right Authentication & Persona Selector */}
        <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Sign In to Your Account
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Choose a role persona below for instant 1-click verification
                </p>
              </div>

              {/* Tenant Switcher */}
              <div className="text-right">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tenant Firm
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => {
                    setSelectedTenantId(e.target.value);
                    setCurrentTenantId(e.target.value);
                  }}
                  className={`text-xs rounded-xl px-2.5 py-1 font-medium border focus:outline-none ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Persona Buttons (Key Demo Requirement) */}
            <div className="space-y-2 mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Instant 1-Click Role Login</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Super Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickPersona(SUPER_ADMIN_USER)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                    isDark
                      ? 'bg-purple-950/40 border-purple-800/60 hover:border-purple-500 hover:bg-purple-900/40'
                      : 'bg-purple-50 border-purple-200 hover:border-purple-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Super Admin</span>
                    </div>
                    <div className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Alex Rivera (SaaS Owner)
                    </div>
                    <div className="text-[10px] text-purple-400/80">Licensing & All Tenants</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>

                {/* Tenant / Portal Admin (Marcus Sterling) */}
                <button
                  type="button"
                  onClick={() => handleQuickPersona(users[1] || users[0])}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                    isDark
                      ? 'bg-blue-950/40 border-blue-800/60 hover:border-blue-500 hover:bg-blue-900/40'
                      : 'bg-blue-50 border-blue-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-blue-400 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      <span>Portal / Tenant Admin</span>
                    </div>
                    <div className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Marcus Sterling (Managing)
                    </div>
                    <div className="text-[10px] text-blue-400/80">Firm RBAC & User Access</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>

                {/* Trial Partner */}
                <button
                  type="button"
                  onClick={() => {
                    const usr = users.find((u) => u.role === 'PARTNER') || users[2];
                    handleQuickPersona(usr);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-blue-500 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-blue-400" />
                      <span>Senior Partner</span>
                    </div>
                    <div className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Eleanor Vance
                    </div>
                    <div className="text-[10px] text-slate-400">Lead Counsel & Pre-bills</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>

                {/* Senior Associate */}
                <button
                  type="button"
                  onClick={() => {
                    const usr = users.find((u) => u.role === 'SENIOR_ASSOCIATE') || users[3];
                    handleQuickPersona(usr);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-blue-500 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Senior Associate</span>
                    </div>
                    <div className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Sophia Chen
                    </div>
                    <div className="text-[10px] text-slate-400">Timesheets & Briefs</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>

                {/* Billing Admin */}
                <button
                  type="button"
                  onClick={() => {
                    const usr = users.find((u) => u.role === 'BILLING_ADMIN') || users[5];
                    handleQuickPersona(usr);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-blue-500 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Billing Specialist</span>
                    </div>
                    <div className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Elena Rostova
                    </div>
                    <div className="text-[10px] text-slate-400">Invoices & Trust Escrow</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>

                {/* External Client Portal */}
                <button
                  type="button"
                  onClick={() => {
                    const usr = users.find((u) => u.role === 'CLIENT_PORTAL') || users[6];
                    handleQuickPersona(usr);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-blue-500 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                      <span>Client Portal</span>
                    </div>
                    <div className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Sarah Jenkins (Apex)
                    </div>
                    <div className="text-[10px] text-slate-400">Pleadings & Bills Only</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className={`px-2 ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>
                  Or Sign In with Credentials
                </span>
              </div>
            </div>

            {/* Standard Login Form */}
            <form onSubmit={handleCustomLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={`w-full text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`w-full text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md active:scale-98"
              >
                Sign In to Legal Portal
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
