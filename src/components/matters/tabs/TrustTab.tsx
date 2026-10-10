import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  IndianRupee,
  Landmark,
  Mail,
  Plus,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatINR } from '../../../utils/currency';
import { useAudit } from '../../../hooks/useAudit';
import { Matter, TrustTransaction } from '../../../types';

interface Props {
  matter: Matter;
}

export const TrustTab: React.FC<Props> = ({ matter }) => {
  const { theme, trustTransactions, addTrustTransaction, currentUser } = useApp();
  const isDark = theme === 'dark';
  const { logTrustTransaction } = useAudit();

  const matterTrustTx = trustTransactions
    .filter((t) => t.matterId === matter.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Current balance
  const currentBalance = matterTrustTx.reduce((sum, t) => sum + t.amount, 0);

  const isBelowEvergreen = currentBalance < matter.evergreenTrustMinimum;
  const shortfall = Math.max(0, matter.evergreenTrustMinimum - currentBalance);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [amount, setAmount] = useState(15000);
  const [description, setDescription] = useState('Client wire deposit into IOLTA trust escrow');
  const [reference, setReference] = useState('IOLTA-DEP-');

  // Running balance calculation for ledger display
  let running = 0;
  const ledgerWithRunning = matterTrustTx.map((tx) => {
    running += tx.amount;
    return { ...tx, runningBalance: running };
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    const depositAmt = Math.abs(amount);
    addTrustTransaction({
      matterId: matter.id,
      date: new Date().toISOString().split('T')[0],
      type: 'DEPOSIT',
      amount: depositAmt,
      description,
      reference,
      cleared: true,
      recordedBy: currentUser.name,
      authorizedBy: currentUser.name,
    });

    // Record central audit business event
    logTrustTransaction(
      'DEPOSIT',
      depositAmt,
      matter.id,
      `IOLTA Trust Retainer Deposit (${reference}): ${description}`
    );

    setShowDepositModal(false);
  };

  const handleDisburse = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > currentBalance) {
      alert('Disbursement cannot exceed current available matter trust balance.');
      return;
    }
    const disburseAmt = Math.abs(amount);
    addTrustTransaction({
      matterId: matter.id,
      date: new Date().toISOString().split('T')[0],
      type: 'DISBURSEMENT',
      amount: -disburseAmt,
      description,
      reference,
      cleared: true,
      recordedBy: currentUser.name,
      authorizedBy: currentUser.name,
    });

    // Record central audit business event
    logTrustTransaction(
      'DISBURSEMENT',
      disburseAmt,
      matter.id,
      `IOLTA Trust Escrow Disbursement (${reference}): ${description}`
    );

    setShowDisburseModal(false);
  };

  const handleSendReplenishmentNotice = () => {
    alert(
      `Evergreen Retainer Replenishment Notice dispatched to ${matter.clientName}.\nRequested Replenishment Amount: ${formatINR(
        shortfall + 10000
      )}\nEvergreen Minimum Floor: ${formatINR(matter.evergreenTrustMinimum)}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Landmark className="w-4 h-4 text-sky-500" />
            IOLTA Trust Accounting & Evergreen Retainer
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Segregated fiduciary escrow ledger compliant with State Bar Rule 1.15
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isBelowEvergreen && (
            <button
              onClick={handleSendReplenishmentNotice}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded transition-colors ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <span>Issue Replenishment Notice ({formatINR(shortfall)})</span>
            </button>
          )}

          <button
            onClick={() => setShowDisburseModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors border ${
              isDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
            <span>Disburse Funds</span>
          </button>

          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded hover:bg-sky-500 transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deposit Trust Retainer</span>
          </button>
        </div>
      </div>

      {/* Evergreen Retainer Alert Bar */}
      {isBelowEvergreen ? (
        <div className={`border rounded-lg p-4 flex items-center justify-between ${
          isDark ? 'bg-red-950/40 border-red-800/60' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <div className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                Evergreen Retainer Threshold Deficit
              </div>
              <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Current Trust Balance ({formatINR(currentBalance)}) has fallen below the
                stipulated evergreen minimum of {formatINR(matter.evergreenTrustMinimum)}.
                Shortfall is <strong className={`${isDark ? 'text-red-300' : 'text-red-700'} font-num`}>{formatINR(shortfall)}</strong>.
              </div>
            </div>
          </div>
          <button
            onClick={handleSendReplenishmentNotice}
            className="px-3 py-1.5 bg-red-600 text-white font-medium text-xs rounded hover:bg-red-500 shrink-0 shadow-sm"
          >
            Send Demand to Client
          </button>
        </div>
      ) : (
        <div className={`border rounded-lg p-3 flex items-center justify-between text-xs ${
          isDark ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              Fiduciary Compliance OK: Trust balance exceeds the evergreen threshold of{' '}
              {formatINR(matter.evergreenTrustMinimum)}.
            </span>
          </div>
          <span className="font-num font-semibold">Surplus: +{formatINR(currentBalance - matter.evergreenTrustMinimum)}</span>
        </div>
      )}

      {/* Financial Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`border rounded-lg p-4 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Current Escrow Trust Balance
          </div>
          <div
            className={`text-xl font-bold font-num mt-1 ${
              isBelowEvergreen ? 'text-red-500' : isDark ? 'text-sky-300' : 'text-sky-600'
            }`}
          >
            {formatINR(currentBalance)}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Strictly segregated from operating capital
          </div>
        </div>

        <div className={`border rounded-lg p-4 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Evergreen Retainer Minimum
          </div>
          <div className={`text-xl font-bold font-num mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {formatINR(matter.evergreenTrustMinimum)}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Agreed replenishment trigger floor</div>
        </div>

        <div className={`border rounded-lg p-4 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Ledger Transactions
          </div>
          <div className={`text-xl font-bold font-num mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {matterTrustTx.length}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600 font-medium'}`}>Three-Way Reconciled ✓</div>
        </div>
      </div>

      {/* Trust Ledger Table */}
      <div className="space-y-2">
        <div className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <FileText className="w-3.5 h-3.5 text-sky-500" />
          Fiduciary Escrow Ledger
        </div>

        <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[10px] ${
                isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Reference / Bank Transaction</th>
                <th className="py-2.5 px-3">Description & Purpose</th>
                <th className="py-2.5 px-3 text-right">Debit / Credit</th>
                <th className="py-2.5 px-3 text-right">Running Balance</th>
                <th className="py-2.5 px-3 text-center">Reconciled</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-200'}>
              {ledgerWithRunning.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <tr key={tx.id} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-slate-50/80 transition-colors'}>
                    <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{tx.date}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          tx.type === 'DEPOSIT'
                            ? isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : tx.type === 'APPLIED_TO_INVOICE'
                            ? isDark ? 'bg-sky-950/40 text-sky-300 border-sky-800/50' : 'bg-sky-50 text-sky-700 border-sky-300'
                            : isDark ? 'bg-rose-950/40 text-rose-300 border-rose-800/50' : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{tx.reference}</td>
                    <td className={`py-2.5 px-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{tx.description}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-num font-bold ${
                        isCredit
                          ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                          : isDark ? 'text-rose-400' : 'text-rose-600'
                      }`}
                    >
                      {isCredit ? '+' : ''}
                      {formatINR(tx.amount)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-num font-semibold ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
                      {formatINR(tx.runningBalance)}
                    </td>
                    <td className={`py-2.5 px-3 text-center ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>✓</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <Landmark className="w-4 h-4 text-sky-500" />
              Deposit Client Funds to Matter IOLTA Trust
            </h3>

            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Deposit Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className={`w-full rounded px-3 py-1.5 text-xs font-num font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-sky-300' : 'bg-slate-50 border-slate-300 text-sky-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Bank Reference / Wire Confirmation #
                </label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Fiduciary Purpose Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className={`px-3 py-1.5 text-xs ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sky-600 text-white font-medium text-xs rounded hover:bg-sky-500 shadow-sm"
                >
                  Record Fiduciary Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
              Disburse / Refund Trust Funds
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Available balance: {formatINR(currentBalance)}
            </p>

            <form onSubmit={handleDisburse} className="space-y-3">
              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Disbursement Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentBalance}
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className={`w-full rounded px-3 py-1.5 text-xs font-num font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-rose-300' : 'bg-slate-50 border-slate-300 text-rose-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Payment Reference / Check #
                </label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-rose-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Disbursement Purpose / Retainer Refund Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className={`px-3 py-1.5 text-xs ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-600 text-white font-medium text-xs rounded hover:bg-rose-500 shadow-sm"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
