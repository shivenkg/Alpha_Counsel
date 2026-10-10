import React, { useState } from 'react';
import {
  AlertCircle,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  MinusCircle,
  PauseCircle,
  Percent,
  PlayCircle,
  Receipt,
  Square,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatCurrency } from '../../../services/financials';
import { ExpenseEntry, Matter, TimeEntry } from '../../../types';

interface Props {
  matter: Matter;
}

export const WIPTab: React.FC<Props> = ({ matter }) => {
  const {
    theme,
    timeEntries,
    expenses,
    updateTimeEntryStatus,
    createInvoiceFromWip,
    currentUser,
    users,
    setMatterSubTab,
  } = useApp();

  const isDark = theme === 'dark';

  // Unbilled time entries for this matter
  const unbilledTime = timeEntries.filter(
    (t) => t.matterId === matter.id && !t.invoiceId && t.status !== 'WRITTEN_OFF'
  );

  // Unbilled billable expenses
  const unbilledExpenses = expenses.filter(
    (e) => e.matterId === matter.id && e.billable && !e.invoiceId && e.status === 'UNBILLED'
  );

  const [selectedTimeIds, setSelectedTimeIds] = useState<string[]>(
    unbilledTime.filter((t) => t.status !== 'HELD').map((t) => t.id)
  );
  const [selectedExpIds, setSelectedExpIds] = useState<string[]>(
    unbilledExpenses.map((e) => e.id)
  );

  // Write-down modal state
  const [writeDownEntry, setWriteDownEntry] = useState<TimeEntry | null>(null);
  const [writeDownAmount, setWriteDownAmount] = useState<number>(0);
  const [writeDownReason, setWriteDownReason] = useState<string>('Partner pre-billing adjustment');

  // Write-off modal state
  const [writeOffEntry, setWriteOffEntry] = useState<TimeEntry | null>(null);
  const [writeOffReason, setWriteOffReason] = useState<string>(
    'Non-billable administrative redundancy'
  );

  const toggleSelectAllTime = () => {
    if (selectedTimeIds.length === unbilledTime.length) {
      setSelectedTimeIds([]);
    } else {
      setSelectedTimeIds(unbilledTime.map((t) => t.id));
    }
  };

  const toggleSelectTime = (id: string) => {
    setSelectedTimeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectExp = (id: string) => {
    setSelectedExpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedTimeTotal = unbilledTime
    .filter((t) => selectedTimeIds.includes(t.id))
    .reduce((sum, t) => sum + (t.writtenDownAmount !== undefined ? t.writtenDownAmount : t.total), 0);

  const selectedExpTotal = unbilledExpenses
    .filter((e) => selectedExpIds.includes(e.id))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSelectedWip = selectedTimeTotal + selectedExpTotal;

  const handleGenerateInvoice = () => {
    if (selectedTimeIds.length === 0 && selectedExpIds.length === 0) {
      alert('Please select at least one time or expense entry to bill.');
      return;
    }
    const inv = createInvoiceFromWip(matter.id, selectedTimeIds, selectedExpIds);
    alert(
      `Single-Matter Invoice ${inv.invoiceNumber} successfully created and issued for ₹${inv.totalAmount.toLocaleString('en-IN')}!\nInvariant preserved: Exactly one matter per invoice.`
    );
    setMatterSubTab('invoices');
  };

  const handleApplyWriteDown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeDownEntry) return;
    updateTimeEntryStatus(
      writeDownEntry.id,
      writeDownEntry.status,
      writeDownAmount,
      writeDownReason
    );
    setWriteDownEntry(null);
  };

  const handleConfirmWriteOff = () => {
    if (!writeOffEntry) return;
    updateTimeEntryStatus(writeOffEntry.id, 'WRITTEN_OFF', 0, writeOffReason);
    setWriteOffEntry(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & 1-Click Invoice Action */}
      <div className={`border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            Work In Progress (WIP) Review & Billing Preparation
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Audit time slips, apply partner write-downs, hold items, and issue matter invoice
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Selected to Bill
            </div>
            <div className={`text-lg font-bold font-num ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
              {formatCurrency(totalSelectedWip)}
            </div>
          </div>

          <button
            onClick={handleGenerateInvoice}
            disabled={totalSelectedWip === 0}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-md hover:bg-emerald-500 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Matter Invoice</span>
          </button>
        </div>
      </div>

      {/* Unbilled Time Entries Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAllTime}
              className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {selectedTimeIds.length === unbilledTime.length && unbilledTime.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-amber-500" />
              ) : (
                <Square className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              )}
              <span>Select All Time ({unbilledTime.length})</span>
            </button>
          </div>
          <span className={`text-xs font-num ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Time Total: {formatCurrency(selectedTimeTotal)}
          </span>
        </div>

        <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[10px] ${
                isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Timekeeper</th>
                <th className="py-2.5 px-3">UTBMS / Narrative</th>
                <th className="py-2.5 px-3 text-right">Hours</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Partner Controls</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-200'}>
              {unbilledTime.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`text-center py-6 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No unbilled time entries in WIP for this matter.
                  </td>
                </tr>
              ) : (
                unbilledTime.map((t) => {
                  const isSelected = selectedTimeIds.includes(t.id);
                  const attorney = users.find((u) => u.id === t.userId);
                  const effectiveAmount =
                    t.writtenDownAmount !== undefined ? t.writtenDownAmount : t.total;

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'
                      } ${
                        isSelected ? (isDark ? 'bg-amber-500/5' : 'bg-amber-50/60') : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <button onClick={() => toggleSelectTime(t.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                          )}
                        </button>
                      </td>
                      <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.date}</td>
                      <td className={`py-2.5 px-3 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        {attorney?.name}
                      </td>
                      <td className="py-2.5 px-3 max-w-sm">
                        <div className={`text-[10px] font-mono ${isDark ? 'text-amber-400' : 'text-amber-700 font-semibold'}`}>{t.utbmsCode}</div>
                        <div className={`line-clamp-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.narrative}</div>
                        {t.writtenDownAmount !== undefined && (
                          <div className="text-[10px] text-rose-500 font-mono">
                            Written down from {formatCurrency(t.total)}
                          </div>
                        )}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-num ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {t.hours.toFixed(1)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-num ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        ₹{t.rate}/hr
                      </td>
                      <td className={`py-2.5 px-3 text-right font-num font-semibold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                        {formatCurrency(effectiveAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            t.status === 'PARTNER_APPROVED'
                              ? isDark ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : t.status === 'HELD'
                              ? isDark ? 'bg-amber-950/50 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-300'
                              : isDark ? 'bg-sky-950/50 text-sky-300 border-sky-800/60' : 'bg-sky-50 text-sky-700 border-sky-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setWriteDownEntry(t);
                            setWriteDownAmount(effectiveAmount * 0.8);
                          }}
                          title="Write-Down Amount"
                          className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-amber-300' : 'hover:bg-slate-100 text-slate-500 hover:text-amber-600'}`}
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            updateTimeEntryStatus(
                              t.id,
                              t.status === 'HELD' ? 'WIP' : 'HELD'
                            );
                          }}
                          title={t.status === 'HELD' ? 'Unhold (Include)' : 'Hold from billing'}
                          className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-sky-300' : 'hover:bg-slate-100 text-slate-500 hover:text-sky-600'}`}
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setWriteOffEntry(t)}
                          title="Write-Off Entry Completely"
                          className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-rose-400' : 'hover:bg-slate-100 text-slate-500 hover:text-rose-600'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unbilled Expenses Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            Unbilled Billable Disbursements ({unbilledExpenses.length})
          </span>
          <span className={`text-xs font-num ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Expense Total: {formatCurrency(selectedExpTotal)}
          </span>
        </div>

        <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[10px] ${
                isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-200'}>
              {unbilledExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`text-center py-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No unbilled disbursements.
                  </td>
                </tr>
              ) : (
                unbilledExpenses.map((e) => {
                  const isSelected = selectedExpIds.includes(e.id);
                  return (
                    <tr
                      key={e.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'
                      } ${
                        isSelected ? (isDark ? 'bg-amber-500/5' : 'bg-amber-50/60') : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <button onClick={() => toggleSelectExp(e.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                          )}
                        </button>
                      </td>
                      <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{e.date}</td>
                      <td className={`py-2.5 px-3 font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{e.category}</td>
                      <td className={`py-2.5 px-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{e.description}</td>
                      <td className={`py-2.5 px-3 text-right font-num font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Write-Down Modal */}
      {writeDownEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <MinusCircle className="w-4 h-4 text-amber-500" />
              Partner Write-Down Adjustment
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Original billed amount: {formatCurrency(writeDownEntry.total)} ({writeDownEntry.hours} hrs @ ₹{writeDownEntry.rate}/hr)
            </p>

            <form onSubmit={handleApplyWriteDown} className="space-y-3">
              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Adjusted Billable Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  max={writeDownEntry.total}
                  required
                  value={writeDownAmount}
                  onChange={(e) => setWriteDownAmount(parseFloat(e.target.value) || 0)}
                  className={`w-full rounded px-3 py-1.5 text-xs font-num font-semibold border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-amber-300 focus:outline-none focus:border-amber-500/50' : 'bg-slate-50 border-slate-300 text-amber-600 focus:outline-none focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Write-Down Justification Reason
                </label>
                <input
                  type="text"
                  required
                  value={writeDownReason}
                  onChange={(e) => setWriteDownReason(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500/50' : 'bg-slate-50 border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWriteDownEntry(null)}
                  className={`px-3 py-1.5 text-xs ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-3 py-1.5 font-medium text-xs rounded transition-colors ${
                    isDark ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-amber-600 text-white hover:bg-amber-500 shadow-sm'
                  }`}
                >
                  Apply Write-Down
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write-Off Modal */}
      {writeOffEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-sm font-semibold text-rose-500 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Confirm Time Entry Write-Off
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Are you sure you want to write off {formatCurrency(writeOffEntry.total)} recorded by{' '}
              {users.find((u) => u.id === writeOffEntry.userId)?.name}? This permanently removes the
              item from billable WIP and logs an audit record.
            </p>

            <div>
              <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Write-Off Audit Reason
              </label>
              <input
                type="text"
                required
                value={writeOffReason}
                onChange={(e) => setWriteOffReason(e.target.value)}
                className={`w-full rounded px-3 py-1.5 text-xs border ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500/50' : 'bg-slate-50 border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWriteOffEntry(null)}
                className={`px-3 py-1.5 text-xs ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWriteOff}
                className="px-3 py-1.5 bg-rose-600 text-white font-medium text-xs rounded hover:bg-rose-500 shadow-sm"
              >
                Confirm Write-Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
