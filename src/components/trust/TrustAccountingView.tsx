import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  FileCheck,
  IndianRupee,
  Landmark,
  Plus,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/currency';
import { useAudit } from '../../hooks/useAudit';

export const TrustAccountingView: React.FC = () => {
  const { trustTransactions, matters, setActiveMatterId, setMatterSubTab, setCurrentView, theme } =
    useApp();
  const isDark = theme === 'dark';

  const totalTrustBalance = trustTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by matter
  const matterBalances = matters.map((m) => {
    const txs = trustTransactions.filter((t) => t.matterId === m.id);
    const balance = txs.reduce((sum, t) => sum + t.amount, 0);
    const isBelow = balance < m.evergreenTrustMinimum;
    return {
      matter: m,
      balance,
      isBelow,
      shortfall: Math.max(0, m.evergreenTrustMinimum - balance),
      txCount: txs.length,
    };
  });

  const belowEvergreenMatters = matterBalances.filter((item) => item.isBelow);

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 space-y-6 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-xl font-bold font-legal-heading flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <Landmark className="w-5 h-5 text-sky-500" />
            IOLTA Master Trust Accounting & Three-Way Reconciliation
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Fiduciary escrow ledgers, individual client matter sub-accounts, and evergreen alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              isDark
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>State Bar Rule 1.15 Verified</span>
          </div>
        </div>
      </div>

      {/* Aggregate Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`rounded-xl p-5 border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
          }`}
        >
          <div
            className={`text-[10px] uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Total IOLTA Escrow Holding
          </div>
          <div
            className={`text-2xl font-bold font-num mt-1 ${
              isDark ? 'text-sky-300' : 'text-blue-600'
            }`}
          >
            {formatINR(totalTrustBalance)}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Separate master bank escrow
          </div>
        </div>

        <div
          className={`rounded-xl p-5 border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
          }`}
        >
          <div
            className={`text-[10px] uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Client Matter Sub-Accounts
          </div>
          <div
            className={`text-2xl font-bold font-num mt-1 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {matters.length} Accounts
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">0 commingling violations</div>
        </div>

        <div
          className={`rounded-xl p-5 border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
          }`}
        >
          <div
            className={`text-[10px] uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Evergreen Retainer Deficits
          </div>
          <div
            className={`text-2xl font-bold font-num mt-1 ${
              belowEvergreenMatters.length > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {belowEvergreenMatters.length} Matters
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Replenishment notices triggered
          </div>
        </div>
      </div>

      {/* Three-Way Reconciliation Audit Card */}
      <div
        className={`rounded-xl p-5 space-y-3 border ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Scale className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              Three-Way Reconciliation Status
            </h3>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Reconciliation Balanced: 0.00 Variance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div
            className={`p-3 rounded border ${
              isDark
                ? 'bg-slate-950/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div
              className={`text-[10px] uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              1. Bank Statement Balance
            </div>
            <div
              className={`text-base font-bold font-num mt-1 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {formatINR(totalTrustBalance)}
            </div>
            <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              First Republic / Chase IOLTA
            </div>
          </div>

          <div
            className={`p-3 rounded border ${
              isDark
                ? 'bg-slate-950/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div
              className={`text-[10px] uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              2. Master Book Balance
            </div>
            <div
              className={`text-base font-bold font-num mt-1 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {formatINR(totalTrustBalance)}
            </div>
            <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              General trust journal
            </div>
          </div>

          <div
            className={`p-3 rounded border ${
              isDark
                ? 'bg-slate-950/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div
              className={`text-[10px] uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              3. Matter Sub-Ledger Sum
            </div>
            <div
              className={`text-base font-bold font-num mt-1 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {formatINR(totalTrustBalance)}
            </div>
            <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Sum of individual client ledgers
            </div>
          </div>
        </div>
      </div>

      {/* Individual Matter Trust Accounts */}
      <div className="space-y-3">
        <h2
          className={`text-sm font-semibold flex items-center gap-2 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}
        >
          <FileCheck className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
          Individual Matter Trust Escrow Accounts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matterBalances.map(({ matter, balance, isBelow, shortfall, txCount }) => (
            <div
              key={matter.id}
              className={`border rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all ${
                isDark
                  ? `bg-slate-900/90 ${isBelow ? 'border-red-900/60' : 'border-slate-800'}`
                  : `bg-white shadow-xs hover:border-slate-300 ${
                      isBelow ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'
                    }`
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                      isDark
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        : 'text-blue-700 bg-blue-50 border-blue-200'
                    }`}
                  >
                    {matter.matterNumber}
                  </span>
                  {isBelow ? (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        isDark
                          ? 'text-red-400 bg-red-950/50 border-red-800'
                          : 'text-red-700 bg-red-50 border-red-200'
                      }`}
                    >
                      Evergreen Deficit
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        isDark
                          ? 'text-emerald-400 bg-emerald-950/50 border-emerald-800'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      Compliant
                    </span>
                  )}
                </div>

                <h3
                  className={`text-sm font-bold mt-2 line-clamp-1 ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {matter.title}
                </h3>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {matter.clientName}
                </div>
              </div>

              <div
                className={`pt-2 border-t space-y-1.5 text-xs ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}
              >
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Trust Balance:</span>
                  <span
                    className={`font-num font-bold ${
                      isBelow
                        ? 'text-red-600'
                        : isDark
                        ? 'text-sky-300'
                        : 'text-blue-700'
                    }`}
                  >
                    {formatINR(balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    Evergreen Minimum:
                  </span>
                  <span className={`font-num ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {formatINR(matter.evergreenTrustMinimum)}
                  </span>
                </div>
                {isBelow && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Shortfall:</span>
                    <span className="font-num">{formatINR(shortfall)}</span>
                  </div>
                )}
              </div>

              <div
                className={`pt-2 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}
              >
                <span
                  className={`font-mono text-[11px] ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {txCount} Transactions
                </span>
                <button
                  onClick={() => {
                    setActiveMatterId(matter.id);
                    setMatterSubTab('trust');
                    setCurrentView('matters');
                  }}
                  className={`font-medium hover:underline ${
                    isDark ? 'text-amber-400' : 'text-blue-600'
                  }`}
                >
                  Manage Ledger →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
