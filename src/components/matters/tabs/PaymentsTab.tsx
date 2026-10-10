import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Landmark,
  Plus,
  Receipt,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatINR } from '../../../utils/currency';
import { useAudit } from '../../../hooks/useAudit';
import { Matter, PaymentAllocation } from '../../../types';

interface Props {
  matter: Matter;
}

export const PaymentsTab: React.FC<Props> = ({ matter }) => {
  const {
    theme,
    invoices,
    payments,
    trustTransactions,
    applyTrustToInvoice,
    recordDirectPayment,
    currentUser,
  } = useApp();
  const isDark = theme === 'dark';
  const { logTrustTransaction } = useAudit();

  const matterInvoices = invoices.filter(
    (inv) => inv.matterId === matter.id && inv.status !== 'VOID' && inv.status !== 'DRAFT'
  );
  const matterPayments = payments.filter((p) => p.matterId === matter.id);

  // Matter trust balance
  const matterTrustBalance = trustTransactions
    .filter((t) => t.matterId === matter.id)
    .reduce((sum, t) => sum + t.amount, 0);

  // Unpaid invoices with balance > 0
  const unpaidInvoices = matterInvoices.filter((inv) => inv.balanceDue > 0);

  const [showDirectPayModal, setShowDirectPayModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    unpaidInvoices[0]?.id || ''
  );
  const [payAmount, setPayAmount] = useState<number>(
    unpaidInvoices[0]?.balanceDue || 1000
  );
  const [payMethod, setPayMethod] = useState<PaymentAllocation['method']>('Wire');
  const [payReference, setPayReference] = useState('WIRE-REF-');

  const handleApplyTrust = (invId: string, amount: number) => {
    if (matterTrustBalance <= 0) {
      alert('Cannot apply trust: Matter IOLTA trust balance is ₹0.');
      return;
    }
    const applyAmount = Math.min(amount, matterTrustBalance);
    const targetInv = invoices.find((i) => i.id === invId);
    const success = applyTrustToInvoice(invId, applyAmount);
    if (success) {
      logTrustTransaction(
        'APPLIED_TO_INVOICE',
        applyAmount,
        matter.id,
        `Transferred funds from escrow trust to invoice balance`,
        targetInv?.invoiceNumber
      );
      alert(`Successfully applied ${formatINR(applyAmount)} from Trust to Invoice!`);
    }
  };

  const handleRecordDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || payAmount <= 0) return;
    recordDirectPayment(selectedInvoiceId, payAmount, payMethod, payReference);
    setShowDirectPayModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
            Accounts Receivable & Payment Allocations
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Payment receipt ledger, wire allocations, and trust-to-invoice transfers
          </p>
        </div>

        <button
          onClick={() => setShowDirectPayModal(true)}
          disabled={unpaidInvoices.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-500 transition-colors shadow disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record External Receipt</span>
        </button>
      </div>

      {/* Available Trust Balance Callout Banner */}
      <div className={`border rounded-lg p-4 flex items-center justify-between ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
          }`}>
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Available Matter Trust Balance
            </div>
            <div className={`text-lg font-bold font-num ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
              {formatINR(matterTrustBalance)}
            </div>
          </div>
        </div>

        {unpaidInvoices.length > 0 && matterTrustBalance > 0 && (
          <div className={`text-xs flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span>You can settle outstanding invoices directly using matter trust funds.</span>
          </div>
        )}
      </div>

      {/* Outstanding Invoices Needing Payment */}
      <div className="space-y-3">
        <div className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <Receipt className="w-3.5 h-3.5 text-amber-500" />
          Outstanding Matter Invoices Awaiting Settlement ({unpaidInvoices.length})
        </div>

        {unpaidInvoices.length === 0 ? (
          <div className={`border rounded-lg p-5 text-center text-xs ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-xs'
          }`}>
            All issued invoices for this matter have been settled in full. Outstanding A/R is ₹0.
          </div>
        ) : (
          <div className="space-y-2">
            {unpaidInvoices.map((inv) => (
              <div
                key={inv.id}
                className={`border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isDark ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      {inv.invoiceNumber}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                      isDark ? 'bg-amber-950/60 text-amber-400 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      Due: {inv.dueDate}
                    </span>
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Billed: {formatINR(inv.totalAmount)} · Paid to Date:{' '}
                    {formatINR(inv.amountPaid)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Balance Due
                    </div>
                    <div className={`text-base font-bold font-num ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
                      {formatINR(inv.balanceDue)}
                    </div>
                  </div>

                  {matterTrustBalance > 0 && (
                    <button
                      onClick={() => handleApplyTrust(inv.id, inv.balanceDue)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded transition-colors shadow-sm"
                    >
                      <Landmark className="w-3.5 h-3.5" />
                      <span>Apply Trust ({formatINR(Math.min(inv.balanceDue, matterTrustBalance))})</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Allocation History Table */}
      <div className="space-y-3">
        <div className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
          Allocated Receipts & Transfer History ({matterPayments.length})
        </div>

        <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[10px] ${
                isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference / Transaction</th>
                <th className="py-2.5 px-3">Target Invoice</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Amount Allocated</th>
                <th className="py-2.5 px-3 text-right">Recorded By</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-200'}>
              {matterPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`text-center py-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No payment allocations recorded yet.
                  </td>
                </tr>
              ) : (
                matterPayments.map((p) => {
                  const targetInvoice = invoices.find((i) => i.id === p.invoiceId);
                  return (
                    <tr key={p.id} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-slate-50/80 transition-colors'}>
                      <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{p.paymentDate}</td>
                      <td className={`py-2.5 px-3 font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        {p.reference}
                      </td>
                      <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        {targetInvoice?.invoiceNumber || 'Matter Settlement'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            p.method === 'Trust Transfer'
                              ? isDark ? 'bg-sky-950/50 text-sky-300 border-sky-800/60' : 'bg-sky-50 text-sky-700 border-sky-300'
                              : isDark ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}
                        >
                          {p.method}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-num font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        +{formatINR(p.amount)}
                      </td>
                      <td className={`py-2.5 px-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.recordedBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Direct Payment Modal */}
      {showDirectPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Record External Payment Allocation
            </h3>

            <form onSubmit={handleRecordDirectPayment} className="space-y-3">
              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Target Invoice
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = unpaidInvoices.find((i) => i.id === e.target.value);
                    if (inv) setPayAmount(inv.balanceDue);
                  }}
                  className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} (Balance Due: {formatINR(inv.balanceDue)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Amount Received (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className={`w-full rounded px-3 py-1.5 text-xs font-num font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-emerald-300' : 'bg-slate-50 border-slate-300 text-emerald-600'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Wire">Wire Transfer</option>
                    <option value="ACH">ACH Direct Deposit</option>
                    <option value="Check">Check</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Bank Reference Number
                </label>
                <input
                  type="text"
                  required
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="e.g. WIRE-FED-889104"
                  className={`w-full rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectPayModal(false)}
                  className={`px-3 py-1.5 text-xs ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 text-white font-medium text-xs rounded hover:bg-emerald-500 shadow-sm"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
