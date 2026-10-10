import React, { useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  FileSpreadsheet,
  FileText,
  FolderLock,
  Gavel,
  History,
  IndianRupee,
  Lock,
  Milestone,
  Receipt,
  Scale,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../hooks/useAudit';
import { evaluateMatterAccess } from '../../services/matterPolicy';
import { MatterSubTab } from '../../types';
import { AIDraftingTab } from './tabs/AIDraftingTab';
import { AuditTab } from './tabs/AuditTab';
import { ChronologyTab } from './tabs/ChronologyTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { ExpensesTab } from './tabs/ExpensesTab';
import { InvoicesTab } from './tabs/InvoicesTab';
import { LegalHoldTab } from './tabs/LegalHoldTab';
import { OverviewTab } from './tabs/OverviewTab';
import { PartiesTab } from './tabs/PartiesTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { TasksTab } from './tabs/TasksTab';
import { TimeTab } from './tabs/TimeTab';
import { TrustTab } from './tabs/TrustTab';
import { WIPTab } from './tabs/WIPTab';

const SUB_TABS: { id: MatterSubTab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: Scale },
  { id: 'parties', label: 'Parties & Counsel', icon: Users },
  { id: 'chronology', label: 'Chronology', icon: Milestone },
  { id: 'tasks', label: 'Tasks & Deadlines', icon: Calendar },
  { id: 'documents', label: 'Document Vault', icon: FolderLock },
  { id: 'ai-drafting', label: 'AI Drafting Studio', icon: Sparkles },
  { id: 'legal-hold', label: 'Legal Hold', icon: Lock },
  { id: 'time', label: 'Time Entries', icon: Clock },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'wip', label: 'WIP Review', icon: FileSpreadsheet },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'payments', label: 'Payments & A/R', icon: IndianRupee },
  { id: 'trust', label: 'Trust (IOLTA)', icon: Shield },
  { id: 'activity', label: 'Audit Trail', icon: History },
];

export const MatterWorkspace: React.FC = () => {
  const {
    activeMatterId,
    matters,
    matterSubTab,
    setMatterSubTab,
    setCurrentView,
    currentUser,
    ethicalWalls,
    logAudit,
    users,
    setCurrentUser,
    theme,
  } = useApp();

  const isDark = theme === 'dark';

  const matter = matters.find((m) => m.id === activeMatterId) || matters[0];
  const { logMatterView } = useAudit();

  // Evaluate Matter Access Policy and Ethical Wall below the UI
  const auth = evaluateMatterAccess(currentUser, matter, ethicalWalls);

  // If screened, log audit alert; if permitted, record matter view in audit events
  useEffect(() => {
    if (!auth.isPermitted) {
      logAudit(
        'ETHICAL_WALL_BLOCKED',
        'Matter',
        matter.id,
        `ACCESS REJECTED: User ${currentUser.name} attempted unauthorized access to screened matter ${matter.matterNumber}. Policy check: ${auth.denialReason}`,
        matter.id,
        matter.matterNumber
      );
    } else if (matter?.id) {
      logMatterView(matter.id, matter.title, matter.matterNumber);
    }
  }, [auth.isPermitted, currentUser.id, matter.id, logMatterView]);

  // If user is screened by an Ethical Wall, render the Security Boundary screen
  if (!auth.isPermitted) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-slate-950">
        <div className="max-w-xl w-full bg-slate-900 border-2 border-red-800/80 rounded-xl p-8 space-y-5 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-700 mx-auto flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold px-2 py-0.5 bg-red-950/60 rounded border border-red-800/60">
              Ethical Wall Boundary Enforced
            </span>
            <h2 className="text-xl font-bold text-slate-100 font-legal-heading">
              Access Restricted Under ABA Model Rule 1.10
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {auth.denialReason}
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 text-left text-xs space-y-2 font-mono">
            <div className="text-slate-400 flex justify-between">
              <span>Attempted Matter:</span>
              <span className="text-slate-200">{matter.matterNumber}</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Active User:</span>
              <span className="text-amber-300">{currentUser.name} ({currentUser.role})</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Policy Evaluation:</span>
              <span className="text-red-400">DENIED — ISOLATION CEILING</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Forensic Audit:</span>
              <span className="text-emerald-400">LOGGED & CRYPTOGRAPHICALLY SEALED</span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <p className="text-[11px] text-slate-400">
              To inspect this matter as an authorized attorney, switch persona below:
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {users
                .filter((u) => u.id !== currentUser.id && u.role !== 'CLIENT_CONTACT')
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setCurrentUser(u)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition-colors font-medium"
                  >
                    Switch to {u.name} ({u.role.slice(0, 10)})
                  </button>
                ))}
            </div>

            <button
              onClick={() => setCurrentView('matters')}
              className="mt-3 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Matter Directory</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Matter Workspace Header */}
      <div className={`px-6 py-4 border-b ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('matters')}
                className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Matters</span>
              </button>
              <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
              <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200 font-semibold'
              }`}>
                {matter.matterNumber}
              </span>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {matter.clientName}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                  matter.status === 'ACTIVE'
                    ? isDark
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {matter.status}
              </span>
            </div>

            <h1 className={`text-xl font-bold font-legal-heading tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {matter.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {matter.hasActiveHold && (
              <button
                onClick={() => setMatterSubTab('legal-hold')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors font-medium border ${
                  isDark
                    ? 'bg-rose-950/50 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>Legal Hold Active</span>
              </button>
            )}

            <button
              onClick={() => setMatterSubTab('ai-drafting')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-semibold rounded hover:bg-amber-400 transition-colors shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Drafting Studio</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation Bar */}
        <div className={`flex items-center gap-1 mt-4 overflow-x-auto border-t pt-2 no-scrollbar ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = matterSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMatterSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? isDark
                      ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-sm'
                      : 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (isDark ? 'text-amber-400' : 'text-blue-600') : (isDark ? 'text-slate-500' : 'text-slate-400')}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {matterSubTab === 'overview' && <OverviewTab matter={matter} />}
        {matterSubTab === 'parties' && <PartiesTab matter={matter} />}
        {matterSubTab === 'chronology' && <ChronologyTab matter={matter} />}
        {matterSubTab === 'tasks' && <TasksTab matter={matter} />}
        {matterSubTab === 'documents' && <DocumentsTab matter={matter} />}
        {matterSubTab === 'ai-drafting' && <AIDraftingTab matter={matter} />}
        {matterSubTab === 'legal-hold' && <LegalHoldTab matter={matter} />}
        {matterSubTab === 'time' && <TimeTab matter={matter} />}
        {matterSubTab === 'expenses' && <ExpensesTab matter={matter} />}
        {matterSubTab === 'wip' && <WIPTab matter={matter} />}
        {matterSubTab === 'invoices' && <InvoicesTab matter={matter} />}
        {matterSubTab === 'payments' && <PaymentsTab matter={matter} />}
        {matterSubTab === 'trust' && <TrustTab matter={matter} />}
        {matterSubTab === 'activity' && <AuditTab matter={matter} />}
      </div>
    </div>
  );
};
