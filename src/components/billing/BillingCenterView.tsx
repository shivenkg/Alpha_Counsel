import React, { useState } from 'react';
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Landmark,
  Receipt,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/currency';
import { Invoice } from '../../types';

export const BillingCenterView: React.FC = () => {
  const {
    invoices,
    timeEntries,
    expenses,
    matters,
    setActiveMatterId,
    setMatterSubTab,
    setCurrentView,
    theme,
  } = useApp();

  const isDark = theme === 'dark';
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Firm-wide aggregates
  const totalBilled = invoices
    .filter((i) => i.status !== 'VOID' && i.status !== 'DRAFT')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalCollected = invoices
    .filter((i) => i.status !== 'VOID')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const totalAr = Math.max(0, totalBilled - totalCollected);

  const unbilledWipTotal =
    timeEntries
      .filter((t) => !t.invoiceId && t.status !== 'WRITTEN_OFF')
      .reduce((s, t) => s + (t.writtenDownAmount !== undefined ? t.writtenDownAmount : t.total), 0) +
    expenses
      .filter((e) => e.billable && !e.invoiceId && e.status === 'UNBILLED')
      .reduce((s, e) => s + e.amount, 0);

  const realizationRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  const filteredInvoices =
    filterStatus === 'ALL' ? invoices : invoices.filter((i) => i.status === filterStatus);

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
            <FileSpreadsheet className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
            Firm Billing Operations & A/R Realization
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Single-matter invoice lifecycle, WIP pre-bills, realization rates, and LEDES e-billing
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className={`rounded-xl p-4 border transition-all ${
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
            Total Unbilled WIP
          </div>
          <div
            className={`text-2xl font-bold font-num mt-1 ${
              isDark ? 'text-amber-300' : 'text-amber-600'
            }`}
          >
            {formatINR(unbilledWipTotal)}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Across all open matters
          </div>
        </div>

        <div
          className={`rounded-xl p-4 border transition-all ${
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
            Total Issued Invoices
          </div>
          <div
            className={`text-2xl font-bold font-num mt-1 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {formatINR(totalBilled)}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Strict single-matter invariant
          </div>
        </div>

        <div
          className={`rounded-xl p-4 border transition-all ${
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
            Outstanding Firm A/R
          </div>
          <div
            className={`text-2xl font-bold font-num mt-1 ${
              isDark ? 'text-rose-300' : 'text-rose-600'
            }`}
          >
            {formatINR(totalAr)}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Pending collections
          </div>
        </div>

        <div
          className={`rounded-xl p-4 border transition-all ${
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
            Collection Realization
          </div>
          <div
            className={`text-2xl font-bold font-num mt-1 ${
              isDark ? 'text-emerald-400' : 'text-emerald-600'
            }`}
          >
            {realizationRate}%
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Collected ÷ Billed
          </div>
        </div>
      </div>

      {/* Strict Billing Invariant Notice */}
      <div
        className={`rounded-lg p-4 flex items-center justify-between text-xs border ${
          isDark
            ? 'bg-slate-900/60 border-slate-800 text-slate-300'
            : 'bg-blue-50/70 border-blue-200 text-blue-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Receipt
            className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-blue-600'}`}
          />
          <span>
            <strong>Strict Billing Architecture:</strong> Invoices adhere to the single-matter
            invariant (1 Invoice = 1 Matter). Consolidated statements may present invoices together,
            but WIP entries are never commingled.
          </span>
        </div>
      </div>

      {/* Invoice Ledger Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            className={`text-sm font-semibold flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <FileText className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
            All Issued & Draft Invoices
          </h2>

          <div
            className={`flex items-center gap-1 p-1 rounded-md border text-xs ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            {['ALL', 'ISSUED', 'PART_PAID', 'PAID'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterStatus === status
                    ? isDark
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-50 text-blue-700 border border-blue-300 font-semibold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`border rounded-lg overflow-hidden ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b uppercase tracking-wider text-[10px] ${
                  isDark
                    ? 'border-slate-800 bg-slate-950/60 text-slate-400'
                    : 'border-slate-200 bg-slate-50 text-slate-600 font-semibold'
                }`}
              >
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Matter Reference</th>
                <th className="py-2.5 px-3">Issued Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Time Fees</th>
                <th className="py-2.5 px-3 text-right">Disbursements</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}
            >
              {filteredInvoices.map((inv) => {
                const m = matters.find((item) => item.id === inv.matterId);
                return (
                  <tr
                    key={inv.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td
                      className={`py-2.5 px-3 font-mono font-semibold ${
                        isDark ? 'text-amber-300' : 'text-blue-700'
                      }`}
                    >
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div
                        onClick={() => {
                          if (m) {
                            setActiveMatterId(m.id);
                            setMatterSubTab('invoices');
                            setCurrentView('matters');
                          }
                        }}
                        className={`font-semibold hover:underline cursor-pointer ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      >
                        {m?.title || 'Matter Reference'}
                      </div>
                      <div
                        className={`text-[10px] font-mono ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {inv.matterNumber}
                      </div>
                    </td>
                    <td
                      className={`py-2.5 px-3 font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {inv.issuedDate}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {inv.dueDate}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-num ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {formatINR(inv.subtotalTime)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-num ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {formatINR(inv.subtotalExpenses)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-num font-semibold ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      {formatINR(inv.totalAmount)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-num font-bold ${
                        isDark ? 'text-rose-300' : 'text-rose-600'
                      }`}
                    >
                      {formatINR(inv.balanceDue)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          inv.status === 'PAID'
                            ? isDark
                              ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : inv.status === 'PART_PAID'
                            ? isDark
                              ? 'bg-sky-950/50 text-sky-300 border-sky-800/60'
                              : 'bg-sky-50 text-sky-700 border-sky-300'
                            : isDark
                            ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          if (m) {
                            setActiveMatterId(m.id);
                            setMatterSubTab('invoices');
                            setCurrentView('matters');
                          }
                        }}
                        className={`text-xs hover:underline font-medium ${
                          isDark ? 'text-amber-400' : 'text-blue-600'
                        }`}
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
