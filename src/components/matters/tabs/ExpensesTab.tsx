import React, { useState } from 'react';
import { FileCheck, FileSpreadsheet, IndianRupee, Plus, Receipt } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatCurrency } from '../../../services/financials';
import { ExpenseEntry, Matter } from '../../../types';

interface Props {
  matter: Matter;
}

export const ExpensesTab: React.FC<Props> = ({ matter }) => {
  const { theme, expenses, addExpense, currentUser } = useApp();
  const isDark = theme === 'dark';
  const matterExpenses = expenses.filter((e) => e.matterId === matter.id);

  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<ExpenseEntry['category']>('Court Filing Fees');
  const [amount, setAmount] = useState(450);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [billable, setBillable] = useState(true);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) return;

    addExpense({
      matterId: matter.id,
      userId: currentUser.id,
      date,
      category,
      amount,
      description,
      billable,
    });

    setShowAddModal(false);
    setDescription('');
    setAmount(450);
  };

  const totalBillable = matterExpenses
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.amount, 0);

  const unbilledTotal = matterExpenses
    .filter((e) => e.billable && e.status === 'UNBILLED')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Receipt className="w-4 h-4 text-amber-500" />
            Matter Expense Disbursements
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Pass-through litigation costs, expert retainers, court transcripts, and filing receipts
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            isDark
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-amber-600 text-white hover:bg-amber-500 shadow-sm'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className={`border rounded-lg p-3 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Billable Expenses
          </div>
          <div className={`text-base font-semibold font-num mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {formatCurrency(totalBillable)}
          </div>
        </div>
        <div className={`border rounded-lg p-3 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Unbilled in WIP
          </div>
          <div className={`text-base font-semibold font-num mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
            {formatCurrency(unbilledTotal)}
          </div>
        </div>
        <div className={`border rounded-lg p-3 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Disbursement Items
          </div>
          <div className={`text-base font-semibold font-num mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {matterExpenses.length}
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b uppercase tracking-wider text-[10px] ${
              isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3 text-center">Billable</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-200'}>
            {matterExpenses.map((exp) => (
              <tr key={exp.id} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-slate-50/80 transition-colors'}>
                <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{exp.date}</td>
                <td className={`py-2.5 px-3 font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{exp.category}</td>
                <td className={`py-2.5 px-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{exp.description}</td>
                <td className={`py-2.5 px-3 text-right font-num font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {formatCurrency(exp.amount)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      exp.billable
                        ? isDark ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    {exp.billable ? 'YES' : 'NON-BILL'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      exp.status === 'INVOICED'
                        ? isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300'
                        : isDark ? 'bg-amber-950/50 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    {exp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <Receipt className="w-4 h-4 text-amber-500" />
              Record Expense Disbursement
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Court Filing Fees">Court Filing Fees</option>
                    <option value="Expert Witness Fees">Expert Witness Fees</option>
                    <option value="Transcript / Court Reporter">Transcript / Court Reporter</option>
                    <option value="Travel">Travel</option>
                    <option value="Process Server">Process Server</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-num border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Disbursement Purpose & Receipt Memo
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Official fee paid to Clerk of Court for ECF filing..."
                  className={`w-full rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="billableCheck"
                  checked={billable}
                  onChange={(e) => setBillable(e.target.checked)}
                  className={`rounded ${isDark ? 'border-slate-700 bg-slate-950 text-amber-500' : 'border-slate-300 bg-slate-50 text-amber-600'}`}
                />
                <label htmlFor="billableCheck" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Billable to client invoice
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  Save Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
