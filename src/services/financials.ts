import {
  ExpenseEntry,
  Invoice,
  MatterFinancialSnapshot,
  PaymentAllocation,
  TimeEntry,
  TrustTransaction,
} from '../types';

/**
 * Matter Financial Strip & Firm Accounting Engine
 * Implements the single source of truth financial invariant:
 * - Unbilled WIP = Unbilled time + billable expenses
 * - Billed = Issued invoice totals (ISSUED, PART_PAID, PAID)
 * - Paid = Allocated payments
 * - Outstanding A/R = Issued - allocated payments
 * - Trust / Retainer = Current matter trust balance
 * - Realization = Billed / Recorded
 * - Collection realization = Collected / Billed
 */
export function calculateMatterFinancials(
  matterId: string,
  timeEntries: TimeEntry[],
  expenses: ExpenseEntry[],
  invoices: Invoice[],
  payments: PaymentAllocation[],
  trustTransactions: TrustTransaction[]
): MatterFinancialSnapshot {
  // 1. Unbilled Time: status in ['DRAFT', 'REVIEW', 'WIP', 'PARTNER_APPROVED', 'HELD'] and no invoiceId
  const matterTime = timeEntries.filter((t) => t.matterId === matterId);
  const unbilledTimeAmount = matterTime
    .filter((t) => !t.invoiceId && t.status !== 'WRITTEN_OFF')
    .reduce((sum, t) => sum + (t.writtenDownAmount !== undefined ? t.writtenDownAmount : t.total), 0);

  // 2. Unbilled Expenses: billable and no invoiceId
  const matterExpenses = expenses.filter((e) => e.matterId === matterId);
  const unbilledExpensesAmount = matterExpenses
    .filter((e) => e.billable && !e.invoiceId && e.status === 'UNBILLED')
    .reduce((sum, e) => sum + e.amount, 0);

  const unbilledWip = unbilledTimeAmount + unbilledExpensesAmount;

  // 3. Billed: Sum of invoices that are in active billed status (ISSUED, PART_PAID, PAID)
  // Exclude DRAFT, VOID, and CREDIT_NOTE
  const matterInvoices = invoices.filter(
    (inv) =>
      inv.matterId === matterId &&
      inv.status !== 'DRAFT' &&
      inv.status !== 'VOID' &&
      inv.status !== 'CREDIT_NOTE'
  );
  const billed = matterInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // 4. Paid: Total payments allocated to this matter
  const matterPayments = payments.filter((p) => p.matterId === matterId);
  const paid = matterPayments.reduce((sum, p) => sum + p.amount, 0);

  // 5. Outstanding A/R: Billed minus Paid (clamped at 0)
  const outstandingAr = Math.max(0, billed - paid);

  // 6. Trust / Retainer: Sum of all trust ledger transactions for this matter
  const matterTrust = trustTransactions.filter((tx) => tx.matterId === matterId);
  const trustBalance = matterTrust.reduce((sum, tx) => sum + tx.amount, 0);

  // 7. Realization Rate: Billed / Recorded (Recorded = Unbilled WIP + Billed)
  const totalRecorded = unbilledWip + billed;
  const realizationRate = totalRecorded > 0 ? (billed / totalRecorded) * 100 : 100;

  // 8. Collection Realization Rate: Collected / Billed
  const collectionRealizationRate = billed > 0 ? (paid / billed) * 100 : 100;

  return {
    unbilledWip,
    billed,
    paid,
    outstandingAr,
    trustBalance,
    realizationRate: Math.round(realizationRate * 10) / 10,
    collectionRealizationRate: Math.round(collectionRealizationRate * 10) / 10,
  };
}

export {
  formatINR,
  formatCurrency,
  formatCurrencyExact,
  formatCurrencyCompact,
  formatIndianNumber,
  parseIndianCurrency,
  type CurrencyFormatOptions,
} from '../utils/currency';
