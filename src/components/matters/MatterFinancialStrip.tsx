import React from 'react';
import { AlertCircle, ArrowUpRight, IndianRupee, Lock, ShieldAlert, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateMatterFinancials } from '../../services/financials';
import { formatINR } from '../../utils/currency';
import { Matter } from '../../types';

interface Props {
  matter: Matter;
  showDetailsButton?: boolean;
}

export const MatterFinancialStrip: React.FC<Props> = ({ matter, showDetailsButton = true }) => {
  const { timeEntries, expenses, invoices, payments, trustTransactions, setMatterSubTab, theme } = useApp();

  const isDark = theme === 'dark';

  const snap = calculateMatterFinancials(
    matter.id,
    timeEntries,
    expenses,
    invoices,
    payments,
    trustTransactions
  );

  // Check if trust balance is below evergreen threshold
  const isBelowEvergreen = snap.trustBalance < matter.evergreenTrustMinimum;

  const tileBaseClass = `rounded-xl p-2.5 transition-all shadow-xs ${
    isDark
      ? 'bg-slate-900 border border-slate-800 hover:border-slate-700'
      : 'bg-slate-50/90 border border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/80'
  }`;

  const tileHeaderClass = `text-[10px] uppercase tracking-wider mb-0.5 font-semibold ${
    isDark ? 'text-slate-400' : 'text-slate-500'
  }`;

  const tileSubClass = `text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className={`border rounded-xl p-3.5 shadow-xs transition-colors ${
      isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
            isDark ? 'bg-blue-950 border-blue-800/60 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}>
            <IndianRupee className="w-3 h-3" />
          </div>
          <h4 className={`text-xs font-bold tracking-wide uppercase ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Matter Financial Ledger
          </h4>
          <span className={`text-[11px] font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Single-source-of-truth
          </span>
        </div>
        {isBelowEvergreen && (
          <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${
            isDark
              ? 'text-rose-300 bg-rose-950/60 border-rose-800/60'
              : 'text-rose-700 bg-rose-50 border-rose-200'
          }`}>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Below Evergreen Minimum ({formatINR(matter.evergreenTrustMinimum)})</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Unbilled WIP */}
        <div
          onClick={() => setMatterSubTab('wip')}
          className={`${tileBaseClass} cursor-pointer`}
        >
          <div className={tileHeaderClass}>
            Unbilled WIP
          </div>
          <div className={`text-sm font-bold font-num ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {formatINR(snap.unbilledWip)}
          </div>
          <div className={tileSubClass}>Time + Expenses</div>
        </div>

        {/* Billed */}
        <div
          onClick={() => setMatterSubTab('invoices')}
          className={`${tileBaseClass} cursor-pointer`}
        >
          <div className={tileHeaderClass}>
            Billed
          </div>
          <div className={`text-sm font-bold font-num ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {formatINR(snap.billed)}
          </div>
          <div className={tileSubClass}>Issued Invoices</div>
        </div>

        {/* Paid */}
        <div
          onClick={() => setMatterSubTab('payments')}
          className={`${tileBaseClass} cursor-pointer`}
        >
          <div className={tileHeaderClass}>
            Paid
          </div>
          <div className={`text-sm font-bold font-num ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {formatINR(snap.paid)}
          </div>
          <div className={tileSubClass}>Receipts</div>
        </div>

        {/* Outstanding A/R */}
        <div
          onClick={() => setMatterSubTab('invoices')}
          className={`${tileBaseClass} cursor-pointer`}
        >
          <div className={tileHeaderClass}>
            Outstanding A/R
          </div>
          <div className={`text-sm font-bold font-num ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
            {formatINR(snap.outstandingAr)}
          </div>
          <div className={tileSubClass}>Billed − Paid</div>
        </div>

        {/* Trust / Retainer */}
        <div
          onClick={() => setMatterSubTab('trust')}
          className={`rounded-xl p-2.5 cursor-pointer transition-all shadow-xs ${
            isBelowEvergreen
              ? isDark
                ? 'bg-slate-900 border border-rose-900/60 ring-1 ring-rose-900/40'
                : 'bg-rose-50/50 border border-rose-200 ring-1 ring-rose-200'
              : tileBaseClass
          }`}
        >
          <div className={tileHeaderClass}>
            Trust / Retainer
          </div>
          <div className={`text-sm font-bold font-num ${
            isBelowEvergreen
              ? isDark ? 'text-rose-400' : 'text-rose-600'
              : isDark ? 'text-blue-400' : 'text-blue-600'
          }`}>
            {formatINR(snap.trustBalance)}
          </div>
          <div className={tileSubClass}>IOLTA Balance</div>
        </div>

        {/* Realization Rate */}
        <div className={tileBaseClass}>
          <div className={tileHeaderClass}>
            Realization
          </div>
          <div className={`text-sm font-bold font-num ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {snap.realizationRate}%
          </div>
          <div className={tileSubClass}>Billed ÷ Recorded</div>
        </div>

        {/* Collection Realization Rate */}
        <div className={tileBaseClass}>
          <div className={tileHeaderClass}>
            Collection
          </div>
          <div className={`text-sm font-bold font-num ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {snap.collectionRealizationRate}%
          </div>
          <div className={tileSubClass}>Collected ÷ Billed</div>
        </div>
      </div>
    </div>
  );
};
