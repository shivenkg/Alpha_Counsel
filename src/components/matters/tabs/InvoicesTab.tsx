import React, { useState } from 'react';
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileCode,
  FileText,
  IndianRupee,
  Lock,
  Plus,
  Printer,
  Receipt,
  Scale,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatINR } from '../../../utils/currency';
import { Invoice, Matter } from '../../../types';

interface Props {
  matter: Matter;
}

export const InvoicesTab: React.FC<Props> = ({ matter }) => {
  const { theme, invoices, applyTrustToInvoice, clients, setMatterSubTab } = useApp();
  const isDark = theme === 'dark';
  const matterInvoices = invoices.filter((inv) => inv.matterId === matter.id);

  const client = clients.find((c) => c.id === matter.clientId);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showLedesModal, setShowLedesModal] = useState<Invoice | null>(null);

  const totalBilled = matterInvoices
    .filter((i) => i.status !== 'VOID' && i.status !== 'DRAFT')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalPaid = matterInvoices
    .filter((i) => i.status !== 'VOID')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const totalAr = Math.max(0, totalBilled - totalPaid);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Receipt className="w-4 h-4 text-amber-500" />
            Matter Invoices & Statements
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Single-matter billing invariant: Each invoice is strictly tied to {matter.matterNumber}
          </p>
        </div>

        <button
          onClick={() => setMatterSubTab('wip')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            isDark
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-amber-600 text-white hover:bg-amber-500 shadow-sm'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Invoice from WIP</span>
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className={`border rounded-lg p-3 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Billed</div>
          <div className={`text-base font-semibold font-num mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {formatINR(totalBilled)}
          </div>
        </div>
        <div className={`border rounded-lg p-3 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Collected</div>
          <div className={`text-base font-semibold font-num mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {formatINR(totalPaid)}
          </div>
        </div>
        <div className={`border rounded-lg p-3 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Outstanding A/R
          </div>
          <div className={`text-base font-semibold font-num mt-0.5 ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
            {formatINR(totalAr)}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b uppercase tracking-wider text-[10px] ${
              isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}>
              <th className="py-2.5 px-3">Invoice Number</th>
              <th className="py-2.5 px-3">Issued Date</th>
              <th className="py-2.5 px-3">Due Date</th>
              <th className="py-2.5 px-3 text-right">Time Fees</th>
              <th className="py-2.5 px-3 text-right">Expenses</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-right">Balance Due</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-200'}>
            {matterInvoices.map((inv) => (
              <tr key={inv.id} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-slate-50/80 transition-colors'}>
                <td className={`py-2.5 px-3 font-mono font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {inv.invoiceNumber}
                </td>
                <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{inv.issuedDate}</td>
                <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{inv.dueDate}</td>
                <td className={`py-2.5 px-3 text-right font-num ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {formatINR(inv.subtotalTime)}
                </td>
                <td className={`py-2.5 px-3 text-right font-num ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {formatINR(inv.subtotalExpenses)}
                </td>
                <td className={`py-2.5 px-3 text-right font-num font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {formatINR(inv.totalAmount)}
                </td>
                <td className={`py-2.5 px-3 text-right font-num font-bold ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
                  {formatINR(inv.balanceDue)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      inv.status === 'PAID'
                        ? isDark ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : inv.status === 'PART_PAID'
                        ? isDark ? 'bg-sky-950/50 text-sky-300 border-sky-800/60' : 'bg-sky-50 text-sky-700 border-sky-300'
                        : inv.status === 'ISSUED'
                        ? isDark ? 'bg-amber-950/50 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-300'
                        : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right space-x-1.5">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    title="View Formal PDF Invoice"
                    className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-amber-300' : 'hover:bg-slate-100 text-slate-500 hover:text-amber-600'}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowLedesModal(inv)}
                    title="View LEDES-1998B Format"
                    className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-sky-300' : 'hover:bg-slate-100 text-slate-500 hover:text-sky-600'}`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formal PDF Invoice View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className={`text-base font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Invoice {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
                    isDark
                      ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className={`text-sm ml-2 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 bg-white text-slate-900 p-8 rounded-lg font-sans">
              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div>
                  <h2 className="font-legal-heading text-xl font-bold tracking-tight text-slate-900">
                    VANCE & STERLING LLP
                  </h2>
                  <p className="text-xs text-slate-500">ATTORNEYS AT LAW</p>
                  <p className="text-xs text-slate-600 mt-1">
                    555 California Street, 42nd Floor
                    <br />
                    San Francisco, CA 94104
                    <br />
                    T: +1 (415) 792-8000 · tax-id: 94-2891044
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-legal-heading text-amber-700">
                    INVOICE
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-700 mt-1">
                    #{selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Date: {selectedInvoice.issuedDate}
                  </div>
                  <div className="text-xs text-slate-500">Due: {selectedInvoice.dueDate}</div>
                </div>
              </div>

              {/* Client & Matter Details */}
              <div className="grid grid-cols-2 gap-4 text-xs py-2">
                <div>
                  <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Billed To
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{matter.clientName}</div>
                  <div className="text-slate-600 mt-0.5">
                    Attn: {client?.primaryContactName}
                    <br />
                    {client?.address}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Matter Reference
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    [{matter.matterNumber}] {matter.title}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Practice Area: {matter.practiceArea}
                    <br />
                    Court Docket: {matter.caseDocketNumber || 'Private Forum'}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-700 uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-1">Date</th>
                      <th className="py-2 px-2">Description / Timekeeper</th>
                      <th className="py-2 px-1 text-right">Hours</th>
                      <th className="py-2 px-1 text-right">Rate</th>
                      <th className="py-2 px-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedInvoice.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2 px-1 font-mono text-slate-600">{line.date}</td>
                        <td className="py-2 px-2">
                          <div className="font-medium text-slate-900">{line.description}</div>
                          {line.attorneyName && (
                            <div className="text-[11px] text-slate-500">
                              {line.attorneyName} {line.utbmsCode ? `· ${line.utbmsCode}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-1 text-right font-num text-slate-700">
                          {line.hours ? line.hours.toFixed(1) : '—'}
                        </td>
                        <td className="py-2 px-1 text-right font-num text-slate-700">
                          {line.rate ? `₹${line.rate}` : '—'}
                        </td>
                        <td className="py-2 px-1 text-right font-num font-semibold text-slate-900">
                          {formatINR(line.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="border-t-2 border-slate-300 pt-4 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Professional Fees:</span>
                    <span className="font-num">{formatINR(selectedInvoice.subtotalTime)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Expenses & Costs:</span>
                    <span className="font-num">
                      {formatINR(selectedInvoice.subtotalExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                    <span>Total Amount:</span>
                    <span className="font-num font-semibold">
                      {formatINR(selectedInvoice.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Amount Paid / Credits:</span>
                    <span className="font-num">
                      −{formatINR(selectedInvoice.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-rose-700 pt-1 border-t border-slate-200">
                    <span>Balance Due:</span>
                    <span className="font-num">
                      {formatINR(selectedInvoice.balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remittance Instructions */}
              <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
                <span className="font-semibold text-slate-700">Remittance: </span>
                Wire transfers payable to Vance & Sterling LLP Master Operating Account #00921448,
                Routing #121000358. Or apply from client pre-funded IOLTA Trust Account upon authorization.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEDES 1998B Modal */}
      {showLedesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <FileCode className="w-4 h-4 text-sky-500" />
                LEDES-1998B Electronic Data Format
              </h3>
              <button
                onClick={() => setShowLedesModal(null)}
                className={`text-sm ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                ✕
              </button>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Electronic legal electronic data exchange standard file format for enterprise e-billing
              software (TyMetrix, CounselLink, Brightflag).
            </p>

            <div className={`border rounded p-3 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto ${
              isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-900 border-slate-700 text-emerald-400'
            }`}>
              {showLedesModal.ledesFormatString ||
                `INVOICE|${showLedesModal.invoiceNumber}|20260915|${showLedesModal.totalAmount}.00|INR\nLINE|FEE|20260905|EV|850.00|10.5|8925.00|L240`}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLedesModal(null)}
                className={`px-3 py-1.5 font-medium text-xs rounded transition-colors ${
                  isDark ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-amber-600 text-white hover:bg-amber-500 shadow-sm'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
