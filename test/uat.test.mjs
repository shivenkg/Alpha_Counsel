import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRole,
  hasDomainPermission,
  checkPermission,
  evaluateMatterAccess,
  filterAuthorizedMatters,
  verifyLegalHoldPreservation,
  calculateMatterFinancials,
  formatINR,
  formatCurrencyCompact,
  formatIndianNumber,
  parseIndianCurrency,
  checkEvergreenRetainerThreshold,
  STANDARD_ROLES,
  BOUNDED_DOMAINS,
} from './uat_helper.mjs';
import {
  SEED_USERS,
  SEED_CLIENTS,
  SEED_MATTERS,
  SEED_ETHICAL_WALLS,
  SEED_LEGAL_HOLDS,
  SEED_DOCUMENTS,
  SEED_TIME_ENTRIES,
  SEED_EXPENSES,
  SEED_INVOICES,
  SEED_PAYMENTS,
  SEED_TRUST_TRANSACTIONS,
} from '../seeds/seedData.mjs';

// --- SCENARIO UAT-01: Multi-Role RBAC & Domain Authorization ---
test('Scenario UAT-01: Multi-Role RBAC & Domain Authorization Security Boundary', () => {
  // 1. Role normalization across all seed users
  assert.equal(normalizeRole('MANAGING_PARTNER'), 'Administrator');
  assert.equal(normalizeRole('BILLING_ADMIN'), 'Administrator');
  assert.equal(normalizeRole('PARTNER'), 'Lawyer');
  assert.equal(normalizeRole('SENIOR_ASSOCIATE'), 'Lawyer');
  assert.equal(normalizeRole('ASSOCIATE'), 'Lawyer');
  assert.equal(normalizeRole('PARALEGAL'), 'Paralegal');
  assert.equal(normalizeRole('CLIENT_PORTAL'), 'Client');

  // 2. Administrator has full domain authority across all domains
  for (const domain of BOUNDED_DOMAINS) {
    assert.equal(hasDomainPermission('Administrator', domain, 'view'), true);
    if (domain !== 'Audit') {
      assert.equal(hasDomainPermission('Administrator', domain, 'delete'), true);
    }
  }

  // 3. Immutable audit logs: No role is permitted to delete audit logs
  for (const role of STANDARD_ROLES) {
    assert.equal(
      hasDomainPermission(role, 'Audit', 'delete'),
      false,
      `Role "${role}" must not be allowed to delete audit logs`
    );
  }

  // 4. Paralegal restricted from fiduciary trust accounting and invoice deletion
  assert.equal(hasDomainPermission('Paralegal', 'Trust', 'view'), false);
  assert.equal(hasDomainPermission('Paralegal', 'Trust', 'create'), false);
  assert.equal(hasDomainPermission('Paralegal', 'Billing', 'create'), true); // Can draft time entries
  assert.equal(hasDomainPermission('Paralegal', 'Billing', 'delete'), false);

  // 5. checkPermission evaluation for Paralegal on Trust
  const paralegal = SEED_USERS.find((u) => u.id === 'usr-5');
  const paralegalPerm = checkPermission(paralegal, 'Trust', 'view');
  assert.equal(paralegalPerm.allowed, false);
  assert.match(paralegalPerm.reason, /RBAC Restriction/);
});

// --- SCENARIO UAT-02: Ethical Wall Enforcement under ABA Model Rule 1.10 ---
test('Scenario UAT-02: Ethical Wall Enforcement (ABA Model Rule 1.10)', () => {
  const matter2 = SEED_MATTERS.find((m) => m.id === 'mat-2');
  const screenedAssociate = SEED_USERS.find((u) => u.id === 'usr-4');
  const managingPartner = SEED_USERS.find((u) => u.id === 'usr-1');
  const partner = SEED_USERS.find((u) => u.id === 'usr-2');

  assert.ok(matter2);
  assert.ok(screenedAssociate);

  // 1. Screened associate (Sophia Chen) strictly denied access to mat-2
  const screenedAuth = evaluateMatterAccess(screenedAssociate, matter2, SEED_ETHICAL_WALLS);
  assert.equal(screenedAuth.allowed, false);
  assert.equal(screenedAuth.isPermitted, false);
  assert.match(screenedAuth.denialReason, /ETHICAL WALL ACTIVE/);
  assert.match(screenedAuth.denialReason, /ABA Model Rule 1.10/);

  // 2. Un-screened counsel retain authorized access
  const leadPartnerAuth = evaluateMatterAccess(managingPartner, matter2, SEED_ETHICAL_WALLS);
  assert.equal(leadPartnerAuth.allowed, true);

  const partnerAuth = evaluateMatterAccess(partner, matter2, SEED_ETHICAL_WALLS);
  assert.equal(partnerAuth.allowed, true);

  // 3. Matter directory filtering excludes screened matters
  const authorizedMatters = filterAuthorizedMatters(screenedAssociate, SEED_MATTERS, SEED_ETHICAL_WALLS);
  assert.equal(authorizedMatters.some((m) => m.id === 'mat-2'), false);
  assert.equal(authorizedMatters.some((m) => m.id === 'mat-1'), true);
  assert.equal(authorizedMatters.some((m) => m.id === 'mat-5'), true);
  assert.equal(authorizedMatters.some((m) => m.id === 'mat-6'), true);
});

// --- SCENARIO UAT-03: Multi-Jurisdictional Legal Hold Preservation & Spoliation Locks ---
test('Scenario UAT-03: Multi-Jurisdictional Legal Hold Preservation & Spoliation Safeguards', () => {
  const heldMatter1 = SEED_MATTERS.find((m) => m.id === 'mat-1'); // Federal IP Hold
  const heldMatter6 = SEED_MATTERS.find((m) => m.id === 'mat-6'); // NCLT IBC Hold
  const nonHeldMatter5 = SEED_MATTERS.find((m) => m.id === 'mat-5'); // Maritime Arbitration

  // 1. Preservation on Federal Patent Litigation (mat-1)
  const doc1 = SEED_DOCUMENTS.find((d) => d.id === 'doc-1');
  const preservation1 = verifyLegalHoldPreservation(heldMatter1, doc1, SEED_LEGAL_HOLDS);
  assert.equal(preservation1.isPreserved, true);
  assert.equal(preservation1.canDelete, false);
  assert.match(preservation1.reason, /spoliation of evidence/);

  // 2. Preservation on NCLT IBC Fraud Recovery (mat-6)
  const doc8 = SEED_DOCUMENTS.find((d) => d.id === 'doc-8');
  const preservation6 = verifyLegalHoldPreservation(heldMatter6, doc8, SEED_LEGAL_HOLDS);
  assert.equal(preservation6.isPreserved, true);
  assert.equal(preservation6.canDelete, false);
  assert.equal(preservation6.holdTitle, 'Litigation Preservation Notice — Forensic Ledgers & Digital Asset Freeze');

  // 3. Unlocked document on non-held matter (mat-5)
  const doc7 = SEED_DOCUMENTS.find((d) => d.id === 'doc-7');
  const preservation5 = verifyLegalHoldPreservation(nonHeldMatter5, doc7, SEED_LEGAL_HOLDS);
  assert.equal(preservation5.isPreserved, false);
  assert.equal(preservation5.canDelete, true);
});

// --- SCENARIO UAT-04: WIP Accounting & Realization Invariants ---
test('Scenario UAT-04: WIP Accounting & Financial Realization Invariants', () => {
  const matterId = 'mat-1';

  const financials = calculateMatterFinancials(
    matterId,
    SEED_TIME_ENTRIES,
    SEED_EXPENSES,
    SEED_INVOICES,
    SEED_PAYMENTS,
    SEED_TRUST_TRANSACTIONS
  );

  // 1. Unbilled WIP = Unbilled time (time-1 ₹2975 + time-2 ₹2860 = ₹5835) + unbilled expense (exp-1 ₹12500) = ₹18,335
  assert.equal(financials.unbilledWip, 18335);

  // 2. Billed = Sum of active invoices (inv-101 ₹9902 + inv-102 ₹22955) = ₹32,857
  assert.equal(financials.billed, 32857);

  // 3. Paid = Total payments allocated (pay-1 ₹9902 + pay-2 ₹10000) = ₹19,902
  assert.equal(financials.paid, 19902);

  // 4. Outstanding A/R = Billed - Paid = ₹32857 - ₹19902 = ₹12,955 (matches inv-102 balanceDue)
  assert.equal(financials.outstandingAr, 12955);

  // 5. Trust Balance = Retainer ₹50000 - Applied ₹9902 = ₹40,098
  assert.equal(financials.trustBalance, 40098);

  // 6. Realization rates
  assert.ok(financials.realizationRate > 0);
  assert.ok(financials.collectionRealizationRate > 0);
});

// --- SCENARIO UAT-05: Indian Currency (INR) & Numbering System Formatting ---
test('Scenario UAT-05: Indian Currency (INR) & Numbering System Formatting', () => {
  // 1. Indian comma grouping (hundreds group of 3, then pairs of 2)
  assert.equal(formatIndianNumber(15000, 2), '15,000.00');
  assert.equal(formatIndianNumber(100000, 2), '1,00,00,000.00' ? '1,00,000.00' : '1,00,000.00');
  assert.equal(formatIndianNumber(1500000, 2), '15,00,000.00');
  assert.equal(formatIndianNumber(15000000, 2), '1,50,00,000.00'); // 1.50 Crore
  assert.equal(formatIndianNumber(4200000000, 2), '4,20,00,00,000.00'); // 420 Crore

  // 2. formatINR with currency symbol
  assert.equal(formatINR(1500000), '₹15,00,000.00');
  assert.equal(formatINR(1500000, false), '₹15,00,000');

  // 3. formatCurrencyCompact (Lakhs and Crores)
  assert.equal(formatCurrencyCompact(2500000), '₹25.00 L');
  assert.equal(formatCurrencyCompact(15000000), '₹1.50 Cr');
  assert.equal(formatCurrencyCompact(4200000000), '₹420.00 Cr');

  // 4. parseIndianCurrency
  assert.equal(parseIndianCurrency('₹25,00,000.00'), 2500000);
  assert.equal(parseIndianCurrency('₹ 1,50,00,000'), 15000000);
});

// --- SCENARIO UAT-06: IOLTA Trust Accounting & Evergreen Deficit Detection ---
test('Scenario UAT-06: IOLTA Trust Accounting & Evergreen Retainer Safeguards', () => {
  const matter1 = SEED_MATTERS.find((m) => m.id === 'mat-1'); // Min 15000, balance 40098 -> Compliant
  const matter4 = SEED_MATTERS.find((m) => m.id === 'mat-4'); // Min 20000, balance 5000 -> DEFICIT 15000
  const matter5 = SEED_MATTERS.find((m) => m.id === 'mat-5'); // Min 500000, balance 1000000 -> Compliant

  // 1. Compliant account check (mat-1)
  const compliant1 = checkEvergreenRetainerThreshold(matter1, 40098);
  assert.equal(compliant1.isDeficit, false);
  assert.equal(compliant1.replenishmentAmount, 0);
  assert.equal(compliant1.status, 'COMPLIANT');

  // 2. Evergreen Deficit Scenario (mat-4 Project Titan)
  const deficit4 = checkEvergreenRetainerThreshold(matter4, 5000);
  assert.equal(deficit4.isDeficit, true);
  assert.equal(deficit4.replenishmentAmount, 15000);
  assert.equal(deficit4.status, 'BELOW_EVERGREEN_MINIMUM');

  // Verify that an invoice exists for this exact deficit replenishment amount
  const replenishmentInvoice = SEED_INVOICES.find(
    (inv) => inv.matterId === 'mat-4' && inv.totalAmount === deficit4.replenishmentAmount
  );
  assert.ok(replenishmentInvoice);
  assert.equal(replenishmentInvoice.id, 'inv-105');
  assert.equal(replenishmentInvoice.totalAmount, 15000);

  // 3. Indian Rupee Escrow Compliant Check (mat-5)
  const compliant5 = checkEvergreenRetainerThreshold(matter5, 1000000);
  assert.equal(compliant5.isDeficit, false);
  assert.equal(compliant5.status, 'COMPLIANT');
});

// --- SCENARIO UAT-07: Document Vault Security & Institutional Multi-Client Scope ---
test('Scenario UAT-07: Document Vault Security & Institutional Multi-Client Scope', () => {
  const apexClient = SEED_USERS.find((u) => u.id === 'usr-7'); // client-1
  const horizonClient = SEED_USERS.find((u) => u.id === 'usr-10'); // client-2
  const luminaClient = SEED_USERS.find((u) => u.id === 'usr-11'); // client-3
  const stateBankClient = SEED_USERS.find((u) => u.id === 'usr-12'); // client-5

  const matter1 = SEED_MATTERS.find((m) => m.id === 'mat-1'); // client-1
  const matter3 = SEED_MATTERS.find((m) => m.id === 'mat-3'); // client-2
  const matter4 = SEED_MATTERS.find((m) => m.id === 'mat-4'); // client-3
  const matter6 = SEED_MATTERS.find((m) => m.id === 'mat-6'); // client-5

  // 1. Authorized client institutional access
  assert.equal(checkPermission(apexClient, 'Documents', 'view', matter1).allowed, true);
  assert.equal(checkPermission(horizonClient, 'Documents', 'view', matter3).allowed, true);
  assert.equal(checkPermission(luminaClient, 'Documents', 'view', matter4).allowed, true);
  assert.equal(checkPermission(stateBankClient, 'Documents', 'view', matter6).allowed, true);

  // 2. Cross-client institutional access denial
  const crossCheck1 = checkPermission(apexClient, 'Documents', 'view', matter3);
  assert.equal(crossCheck1.allowed, false);
  assert.match(crossCheck1.reason, /Client Portal scope restriction|Client Boundary/);

  const crossCheck2 = checkPermission(stateBankClient, 'Documents', 'view', matter1);
  assert.equal(crossCheck2.allowed, false);

  // 3. Clients prohibited from internal work product domains like LegalHold
  assert.equal(checkPermission(apexClient, 'LegalHold', 'view', matter1).allowed, false);
  assert.equal(checkPermission(stateBankClient, 'LegalHold', 'view', matter6).allowed, false);
});

// --- SCENARIO UAT-08: Cross-Border Maritime Arbitration & INR Invoicing ---
test('Scenario UAT-08: Cross-Border Arbitration & Milestone Invoicing Invariants', () => {
  const matterId = 'mat-5';

  const financials = calculateMatterFinancials(
    matterId,
    SEED_TIME_ENTRIES,
    SEED_EXPENSES,
    SEED_INVOICES,
    SEED_PAYMENTS,
    SEED_TRUST_TRANSACTIONS
  );

  // 1. Unbilled WIP in INR: time-9 (₹2,25,000) + time-10 (₹90,000) + exp-4 (₹1,50,000) = ₹4,65,000
  assert.equal(financials.unbilledWip, 465000);

  // 2. Billed Invoices in INR: inv-103 (₹25,00,000 PAID) + inv-104 (₹15,00,000 ISSUED) = ₹40,00,000
  assert.equal(financials.billed, 4000000);

  // 3. Paid in INR: pay-3 (₹25,00,000)
  assert.equal(financials.paid, 2500000);

  // 4. Outstanding A/R in INR: ₹40,00,000 - ₹25,00,000 = ₹15,00,000 (matches inv-104 balanceDue)
  assert.equal(financials.outstandingAr, 1500000);

  // 5. Trust Escrow Balance in INR: tr-5 (₹10,00,000)
  assert.equal(financials.trustBalance, 1000000);
});

// --- SCENARIO UAT-09: Insolvency Moratorium & Forensic Audit Verification ---
test('Scenario UAT-09: Insolvency Moratorium & Forensic Audit Custody Verification', () => {
  const matterId = 'mat-6';

  const financials = calculateMatterFinancials(
    matterId,
    SEED_TIME_ENTRIES,
    SEED_EXPENSES,
    SEED_INVOICES,
    SEED_PAYMENTS,
    SEED_TRUST_TRANSACTIONS
  );

  // 1. Unbilled WIP: time-11 (₹7,600) + forensic accounting retainer exp-5 (₹450,000) = ₹457,600
  assert.equal(financials.unbilledWip, 457600);

  // 2. Resolution Professional Escrow Trust: tr-6 (₹7,500,000 / ₹75 Lakhs)
  assert.equal(financials.trustBalance, 7500000);

  // 3. Verify forensic evidence report doc-8 is locked under lh-2
  const doc8 = SEED_DOCUMENTS.find((d) => d.id === 'doc-8');
  assert.ok(doc8);
  assert.equal(doc8.isHeld, true);
  assert.equal(doc8.legalHoldId, 'lh-2');
  assert.equal(doc8.tags.includes('Section 66 IBC'), true);
});

// --- SCENARIO UAT-10: Complete Domain Coverage & Forensic Immutability ---
test('Scenario UAT-10: Complete Domain Coverage & Forensic Immutability', () => {
  // Ensure all 10 bounded domains have strict permission declarations for all 4 roles
  for (const role of STANDARD_ROLES) {
    for (const domain of BOUNDED_DOMAINS) {
      assert.equal(
        typeof hasDomainPermission(role, domain, 'view'),
        'boolean',
        `Role "${role}" on domain "${domain}" must have defined boolean permission`
      );
    }
  }

  // Verify that SEED datasets represent all 5 distinct clients and 6 diverse matters
  assert.equal(SEED_CLIENTS.length >= 5, true);
  assert.equal(SEED_MATTERS.length >= 6, true);
  assert.equal(SEED_USERS.length >= 12, true);
  assert.equal(SEED_LEGAL_HOLDS.length >= 2, true);
});
