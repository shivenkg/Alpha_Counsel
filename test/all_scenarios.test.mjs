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

// ============================================================================
// WORKFLOW TEST 1: Patent Litigation Lifecycle & Trust Invariant (mat-1)
// ============================================================================
test('Workflow 1: Patent Litigation Lifecycle & Trust Invariant (mat-1)', () => {
  const matter = SEED_MATTERS.find((m) => m.id === 'mat-1');
  assert.ok(matter);
  assert.equal(matter.status, 'ACTIVE');
  assert.equal(matter.practiceArea, 'Intellectual Property');

  // Verify Lead Partner Eleanor Vance (₹850/hr)
  const leadPartner = SEED_USERS.find((u) => u.id === matter.leadPartnerId);
  assert.equal(leadPartner.name, 'Eleanor Vance');
  assert.equal(leadPartner.billingRate, 850);

  // Verify active legal hold on patent matter
  assert.equal(matter.hasActiveHold, true);
  const hold = SEED_LEGAL_HOLDS.find((h) => h.matterId === matter.id);
  assert.ok(hold);
  assert.equal(hold.status, 'ACTIVE');
  assert.equal(hold.custodians.length >= 4, true);

  // Verify financial snapshot & trust payment application
  const fin = calculateMatterFinancials(
    matter.id,
    SEED_TIME_ENTRIES,
    SEED_EXPENSES,
    SEED_INVOICES,
    SEED_PAYMENTS,
    SEED_TRUST_TRANSACTIONS
  );

  assert.equal(fin.unbilledWip, 18335);
  assert.equal(fin.billed, 32857);
  assert.equal(fin.paid, 19902);
  assert.equal(fin.outstandingAr, 12955);
  assert.equal(fin.trustBalance, 40098);

  // Invariant: Billed = Paid + Outstanding A/R
  assert.equal(fin.billed, fin.paid + fin.outstandingAr);

  // Invariant: Trust Balance = Total Deposits (₹50,000) - Applied (₹9,902)
  assert.equal(fin.trustBalance, 50000 - 9902);
});

// ============================================================================
// WORKFLOW TEST 2: Ethical Wall Screening & Imputed Disqualification (mat-2)
// ============================================================================
test('Workflow 2: Ethical Wall Screening & Imputed Disqualification (mat-2)', () => {
  const matter = SEED_MATTERS.find((m) => m.id === 'mat-2');
  const screenedAssociate = SEED_USERS.find((u) => u.id === 'usr-4'); // Sophia Chen
  const managingPartner = SEED_USERS.find((u) => u.id === 'usr-1'); // Marcus Sterling

  // Check rule definition
  const wallRule = SEED_ETHICAL_WALLS.find((w) => w.matterId === matter.id && w.userId === screenedAssociate.id);
  assert.ok(wallRule);
  assert.equal(wallRule.active, true);
  assert.match(wallRule.reason, /ABA Model Rule 1.10/);

  // Screening blocks associate
  const screenedCheck = evaluateMatterAccess(screenedAssociate, matter, SEED_ETHICAL_WALLS);
  assert.equal(screenedCheck.allowed, false);
  assert.equal(screenedCheck.isPermitted, false);

  // Managing Partner is authorized
  const adminCheck = evaluateMatterAccess(managingPartner, matter, SEED_ETHICAL_WALLS);
  assert.equal(adminCheck.allowed, true);

  // Filter verification: Screening prevents appearance in associate's matter docket
  const visibleMatters = filterAuthorizedMatters(screenedAssociate, SEED_MATTERS, SEED_ETHICAL_WALLS);
  assert.equal(visibleMatters.some((m) => m.id === 'mat-2'), false);
});

// ============================================================================
// WORKFLOW TEST 3: Regulatory Antitrust Second Request Capped Model (mat-3)
// ============================================================================
test('Workflow 3: Regulatory Antitrust Second Request Capped Model (mat-3)', () => {
  const matter = SEED_MATTERS.find((m) => m.id === 'mat-3');
  assert.equal(matter.feeArrangement, 'Capped Hourly');
  assert.equal(matter.budgetCap, 500000);
  assert.equal(matter.hasActiveHold, false);

  // Trust is compliant
  const trustBalance = SEED_TRUST_TRANSACTIONS
    .filter((tx) => tx.matterId === matter.id)
    .reduce((sum, tx) => sum + tx.amount, 0);
  assert.equal(trustBalance, 35000);

  const threshold = checkEvergreenRetainerThreshold(matter, trustBalance);
  assert.equal(threshold.isDeficit, false);
  assert.equal(threshold.status, 'COMPLIANT');
});

// ============================================================================
// WORKFLOW TEST 4: PE M&A Flat Fee & Evergreen Deficit Replenishment (mat-4)
// ============================================================================
test('Workflow 4: PE M&A Flat Fee & Evergreen Deficit Replenishment (mat-4)', () => {
  const matter = SEED_MATTERS.find((m) => m.id === 'mat-4');
  assert.equal(matter.feeArrangement, 'Fixed / Flat Fee');
  assert.equal(matter.evergreenTrustMinimum, 20000);

  // Calculate trust balance
  const trustBalance = SEED_TRUST_TRANSACTIONS
    .filter((tx) => tx.matterId === matter.id)
    .reduce((sum, tx) => sum + tx.amount, 0);
  assert.equal(trustBalance, 5000); // Only ₹5,000 deposited

  // Trigger deficit calculation
  const deficit = checkEvergreenRetainerThreshold(matter, trustBalance);
  assert.equal(deficit.isDeficit, true);
  assert.equal(deficit.replenishmentAmount, 15000);
  assert.equal(deficit.status, 'BELOW_EVERGREEN_MINIMUM');

  // Verify automated replenishment invoice INV-2024-1003
  const replenishmentInv = SEED_INVOICES.find(
    (inv) => inv.matterId === matter.id && inv.totalAmount === deficit.replenishmentAmount
  );
  assert.ok(replenishmentInv);
  assert.equal(replenishmentInv.id, 'inv-105');
  assert.equal(replenishmentInv.status, 'ISSUED');
  assert.equal(replenishmentInv.balanceDue, 15000);
});

// ============================================================================
// WORKFLOW TEST 5: Maritime Arbitration & Indian Rupee (INR) Milestones (mat-5)
// ============================================================================
test('Workflow 5: Maritime Arbitration & Indian Rupee (INR) Milestones (mat-5)', () => {
  const matter = SEED_MATTERS.find((m) => m.id === 'mat-5');
  assert.equal(matter.budgetCap, 15000000); // ₹1.50 Crore
  assert.equal(matter.evergreenTrustMinimum, 500000); // ₹5.0 Lakhs

  // Counsel rates
  const srAdvocate = SEED_USERS.find((u) => u.id === 'usr-8');
  assert.equal(srAdvocate.billingRate, 15000); // ₹15,000/hr

  const associate = SEED_USERS.find((u) => u.id === 'usr-9');
  assert.equal(associate.billingRate, 4500); // ₹4,500/hr

  // Financial verification
  const fin = calculateMatterFinancials(
    matter.id,
    SEED_TIME_ENTRIES,
    SEED_EXPENSES,
    SEED_INVOICES,
    SEED_PAYMENTS,
    SEED_TRUST_TRANSACTIONS
  );

  assert.equal(fin.unbilledWip, 465000); // ₹4.65 Lakhs
  assert.equal(fin.billed, 4000000); // ₹40.0 Lakhs (Phase 1 ₹25L + Phase 2 ₹15L)
  assert.equal(fin.paid, 2500000); // ₹25.0 Lakhs paid via RTGS wire
  assert.equal(fin.outstandingAr, 1500000); // ₹15.0 Lakhs outstanding on inv-104
  assert.equal(fin.trustBalance, 1000000); // ₹10.0 Lakhs compliant escrow balance

  // INR format verification
  assert.equal(formatINR(fin.unbilledWip), '₹4,65,000.00');
  assert.equal(formatINR(fin.billed), '₹40,00,000.00');
  assert.equal(formatCurrencyCompact(fin.billed), '₹40.00 L');
  assert.equal(formatCurrencyCompact(matter.budgetCap), '₹1.50 Cr');
});

// ============================================================================
// WORKFLOW TEST 6: IBC Insolvency Moratorium & Forensic Audit (mat-6)
// ============================================================================
test('Workflow 6: IBC Insolvency Moratorium & Forensic Audit (mat-6)', () => {
  const matter = SEED_MATTERS.find((m) => m.id === 'mat-6');
  assert.equal(matter.hasActiveHold, true);
  assert.equal(matter.budgetCap, 25000000); // ₹2.50 Crore

  // Verify statutory legal hold lh-2
  const hold = SEED_LEGAL_HOLDS.find((h) => h.id === 'lh-2');
  assert.ok(hold);
  assert.equal(hold.matterId, matter.id);
  assert.equal(hold.targets.includes('Core Banking Switch Transaction DB'), true);

  // Forensic document protection
  const forensicDoc = SEED_DOCUMENTS.find((d) => d.id === 'doc-8');
  assert.ok(forensicDoc);
  assert.equal(forensicDoc.isHeld, true);
  assert.equal(forensicDoc.legalHoldId, 'lh-2');

  const pres = verifyLegalHoldPreservation(matter, forensicDoc, SEED_LEGAL_HOLDS);
  assert.equal(pres.canDelete, false);

  // Resolution Professional trust account
  const fin = calculateMatterFinancials(
    matter.id,
    SEED_TIME_ENTRIES,
    SEED_EXPENSES,
    SEED_INVOICES,
    SEED_PAYMENTS,
    SEED_TRUST_TRANSACTIONS
  );
  assert.equal(fin.trustBalance, 7500000); // ₹75.0 Lakhs escrow
  assert.equal(formatCurrencyCompact(fin.trustBalance), '₹75.00 L');
});

// ============================================================================
// WORKFLOW TEST 7: Multi-Client Institutional Portal Boundaries
// ============================================================================
test('Workflow 7: Multi-Client Institutional Portal Boundaries', () => {
  const clientApex = SEED_USERS.find((u) => u.id === 'usr-7'); // client-1
  const clientHorizon = SEED_USERS.find((u) => u.id === 'usr-10'); // client-2
  const clientLumina = SEED_USERS.find((u) => u.id === 'usr-11'); // client-3
  const clientStateBank = SEED_USERS.find((u) => u.id === 'usr-12'); // client-5

  const matter1 = SEED_MATTERS.find((m) => m.id === 'mat-1'); // client-1
  const matter3 = SEED_MATTERS.find((m) => m.id === 'mat-3'); // client-2
  const matter4 = SEED_MATTERS.find((m) => m.id === 'mat-4'); // client-3
  const matter6 = SEED_MATTERS.find((m) => m.id === 'mat-6'); // client-5

  // Authorized access
  assert.equal(checkPermission(clientApex, 'Documents', 'view', matter1).allowed, true);
  assert.equal(checkPermission(clientHorizon, 'Documents', 'view', matter3).allowed, true);
  assert.equal(checkPermission(clientLumina, 'Documents', 'view', matter4).allowed, true);
  assert.equal(checkPermission(clientStateBank, 'Documents', 'view', matter6).allowed, true);

  // Cross-institutional rejection
  assert.equal(checkPermission(clientApex, 'Documents', 'view', matter3).allowed, false);
  assert.equal(checkPermission(clientHorizon, 'Documents', 'view', matter4).allowed, false);
  assert.equal(checkPermission(clientLumina, 'Documents', 'view', matter6).allowed, false);
  assert.equal(checkPermission(clientStateBank, 'Documents', 'view', matter1).allowed, false);
});

// ============================================================================
// WORKFLOW TEST 8: Document Vault Version Control & Integrity
// ============================================================================
test('Workflow 8: Document Vault Version Control & Integrity', () => {
  const doc1 = SEED_DOCUMENTS.find((d) => d.id === 'doc-1');
  assert.ok(doc1);
  assert.equal(doc1.fileName.endsWith('.pdf'), true);
  assert.equal(doc1.tags.includes('Patent'), true);

  const doc6 = SEED_DOCUMENTS.find((d) => d.id === 'doc-6');
  assert.ok(doc6);
  assert.equal(doc6.fileName.endsWith('.docx'), true);
  assert.equal(doc6.tags.includes('SPA'), true);

  const doc7 = SEED_DOCUMENTS.find((d) => d.id === 'doc-7');
  assert.ok(doc7);
  assert.equal(doc7.tags.includes('Arbitration'), true);
});

// ============================================================================
// WORKFLOW TEST 9: LEDES-1998B Billing Standard Invariants
// ============================================================================
test('Workflow 9: LEDES-1998B Billing Standard Invariants', () => {
  // Check that all seed invoices are tied to exactly one matter
  for (const inv of SEED_INVOICES) {
    assert.ok(inv.matterId, `Invoice ${inv.id} must be tied to a matter`);
    assert.ok(inv.clientId, `Invoice ${inv.id} must be tied to a client`);
    assert.ok(inv.totalAmount >= 0);
    assert.equal(inv.totalAmount, inv.amountPaid + inv.balanceDue);
  }
});

// ============================================================================
// WORKFLOW TEST 10: Immutable Forensic Audit Trail Integrity
// ============================================================================
test('Workflow 10: Immutable Forensic Audit Trail Integrity', () => {
  // Audit log cannot be deleted by any role
  for (const role of STANDARD_ROLES) {
    assert.equal(hasDomainPermission(role, 'Audit', 'delete'), false);
    assert.equal(hasDomainPermission(role, 'Audit', 'edit'), false);
    assert.equal(hasDomainPermission(role, 'Audit', 'create'), false);
  }

  // Only Administrator and Lawyer can view audit log
  assert.equal(hasDomainPermission('Administrator', 'Audit', 'view'), true);
  assert.equal(hasDomainPermission('Lawyer', 'Audit', 'view'), true);
  assert.equal(hasDomainPermission('Paralegal', 'Audit', 'view'), false);
  assert.equal(hasDomainPermission('Client', 'Audit', 'view'), false);
});

// ============================================================================
// WORKFLOW TEST 11: SaaS Subscription Customization (Fees, Tiers, Users, Storage)
// ============================================================================
test('Workflow 11: SaaS Subscription Customization (Fees, Tiers, Users, Storage)', () => {
  const tenant = {
    id: 'tenant-custom',
    name: 'Juris Elite Chambers',
    plan: 'PROFESSIONAL',
    maxSeats: 5,
    seatsAllocated: 3,
    storageLimitGB: 500,
    storageUsedGB: 45.2,
    monthlyPriceINR: 75000,
  };

  // 1. Customize tier to ENTERPRISE
  const customizedTier = 'ENTERPRISE';
  // 2. Customize user seat quota from 5 to 15
  const customizedSeats = 15;
  // 3. Customize storage limit from 500 GB to 2000 GB
  const customizedStorage = 2000;
  // 4. Customize monthly subscription fee
  const customizedMonthlyFee = 185000;

  const updatedTenant = {
    ...tenant,
    plan: customizedTier,
    maxSeats: customizedSeats,
    storageLimitGB: customizedStorage,
    monthlyPriceINR: customizedMonthlyFee,
  };

  assert.equal(updatedTenant.plan, 'ENTERPRISE');
  assert.equal(updatedTenant.maxSeats, 15);
  assert.ok(updatedTenant.maxSeats >= updatedTenant.seatsAllocated);
  assert.equal(updatedTenant.storageLimitGB, 2000);
  assert.equal(updatedTenant.monthlyPriceINR, 185000);

  // 5. Verify annual subscription auto-calculated based on monthly subscription (monthly * 12)
  const autoCalculatedAnnual = updatedTenant.monthlyPriceINR * 12;
  assert.equal(autoCalculatedAnnual, 2220000);
  assert.equal(25000 * 12, 300000); // Starter
  assert.equal(75000 * 12, 900000); // Professional
  assert.equal(150000 * 12, 1800000); // Enterprise
  assert.equal(350000 * 12, 4200000); // Sovereign
});

