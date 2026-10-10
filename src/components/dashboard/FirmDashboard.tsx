import React from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Clock,
  FileSpreadsheet,
  FileText,
  FolderLock,
  IndianRupee,
  Landmark,
  Lock,
  Plus,
  Scale,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/currency';

export const FirmDashboard: React.FC = () => {
  const {
    matters,
    timeEntries,
    expenses,
    invoices,
    payments,
    trustTransactions,
    currentUser,
    setActiveMatterId,
    setCurrentView,
    setMatterSubTab,
    ethicalWalls,
    legalHolds,
    theme,
  } = useApp();

  const isDark = theme === 'dark';

  // Aggregate firm financial metrics
  const unbilledTimeVal = timeEntries
    .filter((t) => !t.invoiceId && t.status !== 'WRITTEN_OFF')
    .reduce((sum, t) => sum + (t.writtenDownAmount !== undefined ? t.writtenDownAmount : t.total), 0);

  const unbilledExpVal = expenses
    .filter((e) => e.billable && !e.invoiceId && e.status === 'UNBILLED')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalUnbilledWip = unbilledTimeVal + unbilledExpVal;

  const totalBilled = invoices
    .filter((i) => i.status !== 'DRAFT')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstandingAr = Math.max(0, totalBilled - totalCollected);

  const totalTrustBalance = trustTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Active Ethical Screens
  const activeWallsCount = ethicalWalls.filter((w) => w.active).length;
  const activeHoldsCount = legalHolds.filter((h) => h.status === 'ACTIVE').length;

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-6 font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div
            className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
              isDark ? 'text-blue-400' : 'text-blue-700'
            }`}
          >
            VANCE & STERLING LLP · PRACTICE EXECUTIVE
          </div>
          <h1
            className={`text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Welcome back, {currentUser.name}
          </h1>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Role: <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{currentUser.role.replace(/_/g, ' ')}</span> ·
            Billing Rate: <span className={`font-num font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{formatINR(currentUser.billingRate)}/hr</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('conflicts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all shadow-xs ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Conflict Check</span>
          </button>
          <button
            onClick={() => setCurrentView('matters')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Matters Directory</span>
          </button>
        </div>
      </div>

      {/* Firm Key Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Unbilled WIP */}
        <div
          onClick={() => setCurrentView('billing')}
          className={`rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all group border shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-amber-500/40'
              : 'bg-white border-slate-200 hover:border-amber-400/60'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold">Unbilled Firm WIP</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-num text-amber-500">
            {formatINR(totalUnbilledWip)}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Ready for partner pre-bill
          </div>
        </div>

        {/* Outstanding A/R */}
        <div
          onClick={() => setCurrentView('billing')}
          className={`rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all group border shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-rose-500/40'
              : 'bg-white border-slate-200 hover:border-rose-400/60'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold">Outstanding A/R</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-num text-rose-500">
            {formatINR(totalOutstandingAr)}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Issued client receivables
          </div>
        </div>

        {/* Total Trust Balance */}
        <div
          onClick={() => setCurrentView('trust')}
          className={`rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all group border shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-blue-500/40'
              : 'bg-white border-slate-200 hover:border-blue-400/60'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              IOLTA Escrow Trust
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-num text-blue-500">
            {formatINR(totalTrustBalance)}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Strictly segregated ledger
          </div>
        </div>

        {/* Collections */}
        <div
          onClick={() => setCurrentView('billing')}
          className={`rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all group border shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
              : 'bg-white border-slate-200 hover:border-emerald-400/60'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Cash Collections
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-num text-emerald-500">
            {formatINR(totalCollected)}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Realization: 93.8%
          </div>
        </div>
      </div>

      {/* Compliance & Ethical Walls Alert Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ethical Walls Card */}
        <div
          onClick={() => setCurrentView('conflicts')}
          className={`rounded-2xl p-5 cursor-pointer transition-all border shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-amber-500/40'
              : 'bg-white border-slate-200 hover:border-amber-400/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h3
                className={`text-xs font-bold uppercase tracking-wide ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                Active Ethical Screening Walls ({activeWallsCount})
              </h3>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Manage →
            </span>
          </div>
          <p
            className={`text-xs leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Screened personnel are fully isolated from case notes, documents, and time billing records in
            strict accordance with ABA Model Rule 1.10.
          </p>
        </div>

        {/* Legal Hold Card */}
        <div
          onClick={() => setCurrentView('vault')}
          className={`rounded-2xl p-5 cursor-pointer transition-all border shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-rose-500/40'
              : 'bg-white border-slate-200 hover:border-rose-400/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" />
              <h3
                className={`text-xs font-bold uppercase tracking-wide ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                Legal Hold Preservation Notices ({activeHoldsCount})
              </h3>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Vault →
            </span>
          </div>
          <p
            className={`text-xs leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Preservation locks in effect across document repositories. Deletion, destruction, or purging
            is disabled firm-wide under FRCP 37(e).
          </p>
        </div>
      </div>

      {/* Active Matters Quick Access Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            className={`text-sm font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Priority Firm Matters
          </h2>
          <button
            onClick={() => setCurrentView('matters')}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            View all ({matters.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {matters.map((m) => {
            const hasHold = m.hasActiveHold;
            return (
              <div
                key={m.id}
                onClick={() => {
                  setActiveMatterId(m.id);
                  setMatterSubTab('overview');
                  setCurrentView('matters');
                }}
                className={`rounded-2xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-3 border shadow-xs group ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-blue-500/40'
                    : 'bg-white border-slate-200 hover:border-blue-400/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isDark
                          ? 'text-blue-300 bg-blue-950/80 border-blue-800/60'
                          : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}
                    >
                      {m.matterNumber}
                    </span>
                    {hasHold && (
                      <span className="text-[10px] px-2 py-0.5 bg-rose-500/15 text-rose-500 border border-rose-500/30 font-bold rounded-full">
                        HOLD
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-sm font-bold line-clamp-1 transition-colors ${
                      isDark
                        ? 'text-white group-hover:text-blue-400'
                        : 'text-slate-900 group-hover:text-blue-600'
                    }`}
                  >
                    {m.title}
                  </h3>
                  <div
                    className={`text-xs line-clamp-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {m.description}
                  </div>
                </div>

                <div
                  className={`pt-3 border-t flex items-center justify-between text-xs ${
                    isDark ? 'border-slate-800/80' : 'border-amber-200/60'
                  }`}
                >
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    {m.clientName}
                  </span>
                  <span
                    className={`font-semibold font-num ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Cap: {formatINR(m.budgetCap)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
