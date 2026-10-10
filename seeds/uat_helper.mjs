/**
 * AlphaCounsel Legal Practice Operating System - UAT Helper Utilities
 * Pure domain logic helpers implementing core business rules, RBAC matrices,
 * financial invariant calculations, Indian currency formatting, and security policies.
 */

// --- 1. RBAC & Permissions ---

export const STANDARD_ROLES = ['Administrator', 'Lawyer', 'Paralegal', 'Client'];

export const BOUNDED_DOMAINS = [
  'Matters',
  'Documents',
  'Billing',
  'Trust',
  'Tasks',
  'Parties',
  'Chronology',
  'LegalHold',
  'Audit',
  'ClientPortal',
];

export const DEFAULT_ROLE_PERMISSIONS = {
  Administrator: {
    Matters: ['view', 'create', 'edit', 'delete'],
    Documents: ['view', 'create', 'edit', 'delete'],
    Billing: ['view', 'create', 'edit', 'delete'],
    Trust: ['view', 'create', 'edit', 'delete'],
    Tasks: ['view', 'create', 'edit', 'delete'],
    Parties: ['view', 'create', 'edit', 'delete'],
    Chronology: ['view', 'create', 'edit', 'delete'],
    LegalHold: ['view', 'create', 'edit', 'delete'],
    Audit: ['view'], // Audit logs are immutable
    ClientPortal: ['view', 'create', 'edit', 'delete'],
  },
  Lawyer: {
    Matters: ['view', 'create', 'edit'],
    Documents: ['view', 'create', 'edit', 'delete'],
    Billing: ['view', 'create', 'edit'],
    Trust: ['view', 'create'],
    Tasks: ['view', 'create', 'edit', 'delete'],
    Parties: ['view', 'create', 'edit'],
    Chronology: ['view', 'create', 'edit', 'delete'],
    LegalHold: ['view', 'create', 'edit'],
    Audit: ['view'],
    ClientPortal: ['view'],
  },
  Paralegal: {
    Matters: ['view'],
    Documents: ['view', 'create', 'edit'],
    Billing: ['create'], // Can record draft time; no access to invoice approval or WIP write-offs
    Trust: [], // Escrow accounts restricted from non-attorneys
    Tasks: ['view', 'create', 'edit'],
    Parties: ['view', 'create', 'edit'],
    Chronology: ['view', 'create', 'edit'],
    LegalHold: ['view'],
    Audit: [],
    ClientPortal: [],
  },
  Client: {
    Matters: ['view'],
    Documents: ['view', 'create'],
    Billing: ['view', 'create'],
    Trust: ['view', 'create'],
    Tasks: ['view'],
    Parties: ['view'],
    Chronology: ['view'],
    LegalHold: [],
    Audit: [],
    ClientPortal: ['view', 'create', 'edit'],
  },
};

export function normalizeRole(role) {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'TENANT_ADMIN':
    case 'MANAGING_PARTNER':
    case 'BILLING_ADMIN':
    case 'Administrator':
      return 'Administrator';
    case 'PARTNER':
    case 'SENIOR_ASSOCIATE':
    case 'ASSOCIATE':
    case 'Lawyer':
      return 'Lawyer';
    case 'PARALEGAL':
    case 'Paralegal':
      return 'Paralegal';
    case 'CLIENT_PORTAL':
    case 'CLIENT_CONTACT':
    case 'Client':
      return 'Client';
    default:
      return 'Lawyer';
  }
}

export function hasDomainPermission(role, domain, action) {
  const standardRole = normalizeRole(role);
  const domainPerms = DEFAULT_ROLE_PERMISSIONS[standardRole]?.[domain] || [];
  return domainPerms.includes(action);
}

export function checkPermission(user, domain, action, matter = null, ethicalWalls = []) {
  const standardRole = normalizeRole(user.role);

  // 1. Role-Based Domain Check
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[standardRole]?.[domain] || [];
  if (!rolePerms.includes(action)) {
    return {
      allowed: false,
      reason: `RBAC Restriction: Role "${standardRole}" lacks "${action}" permission on domain "${domain}".`,
    };
  }

  // 2. Matter Access Policy Check
  if (matter) {
    const auth = evaluateMatterAccess(user, matter, ethicalWalls);
    if (!auth.isPermitted) {
      return {
        allowed: false,
        reason: `Matter Access Policy Denied: ${auth.denialReason || auth.reason || 'Screened under ethical wall.'}`,
      };
    }
  }

  // 3. Client Role Scope Check
  if (standardRole === 'Client' && matter) {
    if (user.department && user.department !== matter.clientId && !matter.assignedUserIds?.includes(user.id)) {
      return {
        allowed: false,
        reason: `Client Boundary: You are only authorized to view matters belonging to your institutional account.`,
      };
    }
  }

  return { allowed: true };
}

// --- 2. Ethical Wall Access Evaluation (ABA Model Rule 1.10) ---

export function evaluateMatterAccess(user, matter, ethicalWalls = []) {
  // Check for Active Ethical Wall rule against this user and matter
  const activeWall = ethicalWalls.find(
    (rule) => rule.active && rule.userId === user.id && rule.matterId === matter.id
  );

  if (activeWall) {
    const reasonText = `ETHICAL WALL ACTIVE: ${activeWall.reason}. Personnel strictly screened under ABA Model Rule 1.10.`;
    return {
      allowed: false,
      reason: reasonText,
      ruleId: activeWall.id,
      screenedAt: activeWall.establishedAt || activeWall.screenedDate,
      isPermitted: false,
      denialReason: reasonText,
    };
  }

  // Client Portal User: strictly limited to their own client's assigned matters
  if (user.role === 'CLIENT_PORTAL' || user.role === 'CLIENT_CONTACT') {
    if (matter.clientId === user.department || matter.assignedUserIds?.includes(user.id)) {
      return { allowed: true, isPermitted: true };
    }
    const denial = 'Client Portal scope restriction: User can only access matters authorized for their entity.';
    return {
      allowed: false,
      reason: denial,
      isPermitted: false,
      denialReason: denial,
    };
  }

  return { allowed: true, isPermitted: true };
}

export function filterAuthorizedMatters(user, matters, ethicalWalls = []) {
  return matters.filter((matter) => evaluateMatterAccess(user, matter, ethicalWalls).allowed);
}

// --- 3. Legal Hold Preservation Verification ---

export function verifyLegalHoldPreservation(matter, document, legalHolds = []) {
  const activeHold = legalHolds.find(
    (h) => h.matterId === matter.id && h.status === 'ACTIVE'
  );

  if (activeHold) {
    return {
      isPreserved: true,
      holdId: activeHold.id,
      holdTitle: activeHold.holdTitle,
      canDelete: false,
      reason: `Document is preserved under active Legal Hold "${activeHold.holdTitle}" (Matter ${matter.matterNumber}). Deletion locked to prevent spoliation of evidence.`,
    };
  }

  return {
    isPreserved: false,
    canDelete: true,
  };
}

// --- 4. WIP & Financial Invariant Engine ---

export function calculateMatterFinancials(
  matterId,
  timeEntries = [],
  expenses = [],
  invoices = [],
  payments = [],
  trustTransactions = []
) {
  // 1. Unbilled Time
  const matterTime = timeEntries.filter((t) => t.matterId === matterId);
  const unbilledTimeAmount = matterTime
    .filter((t) => !t.invoiceId && t.status !== 'WRITTEN_OFF')
    .reduce((sum, t) => sum + (t.writtenDownAmount !== undefined ? t.writtenDownAmount : t.total), 0);

  // 2. Unbilled Expenses
  const matterExpenses = expenses.filter((e) => e.matterId === matterId);
  const unbilledExpensesAmount = matterExpenses
    .filter((e) => e.billable && !e.invoiceId && e.status === 'UNBILLED')
    .reduce((sum, e) => sum + e.amount, 0);

  const unbilledWip = unbilledTimeAmount + unbilledExpensesAmount;

  // 3. Billed
  const matterInvoices = invoices.filter(
    (inv) =>
      inv.matterId === matterId &&
      inv.status !== 'DRAFT' &&
      inv.status !== 'VOID' &&
      inv.status !== 'CREDIT_NOTE'
  );
  const billed = matterInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // 4. Paid
  const matterPayments = payments.filter((p) => p.matterId === matterId);
  const paid = matterPayments.reduce((sum, p) => sum + p.amount, 0);

  // 5. Outstanding A/R
  const outstandingAr = Math.max(0, billed - paid);

  // 6. Trust / Retainer
  const matterTrust = trustTransactions.filter((tx) => tx.matterId === matterId);
  const trustBalance = matterTrust.reduce((sum, tx) => sum + tx.amount, 0);

  // 7. Realization Rate
  const totalRecorded = unbilledWip + billed;
  const realizationRate = totalRecorded > 0 ? (billed / totalRecorded) * 100 : 100;

  // 8. Collection Realization Rate
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

// --- 5. Indian Currency & Number Formatting Utility ---

export function formatIndianNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === '') {
    return decimals > 0 ? `0.${'0'.repeat(decimals)}` : '0';
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    return decimals > 0 ? `0.${'0'.repeat(decimals)}` : '0';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const fixedStr = absNum.toFixed(decimals);
  const [integerPart, decimalPart] = fixedStr.split('.');

  let formattedInteger = '';
  if (integerPart.length <= 3) {
    formattedInteger = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherDigits = integerPart.substring(0, integerPart.length - 3);
    const groupedPairs = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInteger = `${groupedPairs},${lastThree}`;
  }

  const result = decimals > 0 && decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  return isNegative ? `-${result}` : result;
}

export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || amount === '') {
    const sym = options.symbol ?? '₹';
    const dec = options.exact ? 2 : (options.decimals ?? 2);
    return dec > 0 ? `${sym}0.${'0'.repeat(dec)}` : `${sym}0`;
  }

  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) {
    const sym = options.symbol ?? '₹';
    const dec = options.exact ? 2 : (options.decimals ?? 2);
    return dec > 0 ? `${sym}0.${'0'.repeat(dec)}` : `${sym}0`;
  }

  const sym = options.symbol ?? '₹';
  const spacing = options.space ? ' ' : '';
  const isNegative = num < 0;
  const absAmount = Math.abs(num);

  if (options.compact) {
    if (absAmount >= 10000000) {
      const crVal = (absAmount / 10000000).toFixed(2);
      const sign = isNegative ? '-' : '';
      return `${sign}${sym}${spacing}${crVal} Cr`;
    } else if (absAmount >= 100000) {
      const lVal = (absAmount / 100000).toFixed(2);
      const sign = isNegative ? '-' : '';
      return `${sign}${sym}${spacing}${lVal} L`;
    }
  }

  const decimals = options.exact !== undefined ? (options.exact ? 2 : 0) : (options.decimals ?? 2);
  const formattedNumber = formatIndianNumber(absAmount, decimals);

  if (isNegative) {
    return `-${sym}${spacing}${formattedNumber}`;
  }
  return `${sym}${spacing}${formattedNumber}`;
}

export function formatINR(amount, options) {
  if (typeof options === 'boolean') {
    return formatCurrency(amount, { exact: options, decimals: options ? 2 : 0 });
  }

  const decimals = options?.decimals ?? (options?.exact === false ? 0 : 2);
  const exact = options?.exact ?? (decimals === 2);

  return formatCurrency(amount, {
    decimals,
    exact,
    compact: options?.compact,
    space: options?.space,
  });
}

export function formatCurrencyCompact(amount) {
  return formatCurrency(amount, { compact: true });
}

export function parseIndianCurrency(input) {
  if (!input) return 0;
  const cleaned = String(input).replace(/[₹$,\s]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// --- 6. Evergreen Retainer & Trust Safeguards ---

export function checkEvergreenRetainerThreshold(matter, trustBalance) {
  const minRequired = matter.evergreenTrustMinimum || 0;
  const isDeficit = trustBalance < minRequired;
  const replenishmentAmount = isDeficit ? minRequired - trustBalance : 0;

  return {
    matterId: matter.id,
    matterNumber: matter.matterNumber,
    evergreenMinimum: minRequired,
    currentTrustBalance: trustBalance,
    isDeficit,
    replenishmentAmount,
    status: isDeficit ? 'BELOW_EVERGREEN_MINIMUM' : 'COMPLIANT',
  };
}
