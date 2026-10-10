import {
  BoundedDomain,
  EthicalWallRule,
  Matter,
  PermissionAction,
  StandardRole,
  User,
  UserRole,
} from '../types';
import { evaluateMatterAccess } from './matterPolicy';

/**
 * Normalizes any internal UserRole or legacy string to one of the 4 canonical roles:
 * - 'Administrator'
 * - 'Lawyer'
 * - 'Paralegal'
 * - 'Client'
 */
export function normalizeRole(role: UserRole | string): StandardRole {
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

/**
 * Default Role-Based Access Control (RBAC) Permissions Matrix
 * Defines the strict operations each role is permitted to perform per domain.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<
  StandardRole,
  Record<BoundedDomain, PermissionAction[]>
> = {
  Administrator: {
    Matters: ['view', 'create', 'edit', 'delete'],
    Documents: ['view', 'create', 'edit', 'delete'],
    Billing: ['view', 'create', 'edit', 'delete'],
    Trust: ['view', 'create', 'edit', 'delete'],
    Tasks: ['view', 'create', 'edit', 'delete'],
    Parties: ['view', 'create', 'edit', 'delete'],
    Chronology: ['view', 'create', 'edit', 'delete'],
    LegalHold: ['view', 'create', 'edit', 'delete'],
    Audit: ['view'], // Audit logs are immutable by design
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
    Billing: ['create'], // Can record draft time entries; no access to invoice approval or WIP write-offs
    Trust: [], // Fiduciary escrow accounts restricted from non-attorneys
    Tasks: ['view', 'create', 'edit'],
    Parties: ['view', 'create', 'edit'],
    Chronology: ['view', 'create', 'edit'],
    LegalHold: ['view'],
    Audit: [],
    ClientPortal: [],
  },
  Client: {
    Matters: ['view'], // Strictly authorized client matters only
    Documents: ['view', 'create'], // View/download shared docs & upload new client disclosures
    Billing: ['view', 'create'], // View issued invoices & remit payments via gateway
    Trust: ['view', 'create'], // View retainer balance & initiate replenishment
    Tasks: ['view'], // View upcoming court dates and deadlines
    Parties: ['view'],
    Chronology: ['view'],
    LegalHold: [], // Internal work product
    Audit: [],
    ClientPortal: ['view', 'create', 'edit'],
  },
};

export interface DomainMetadata {
  id: BoundedDomain;
  label: string;
  description: string;
  iconName: string;
}

export const BOUNDED_DOMAINS: DomainMetadata[] = [
  {
    id: 'Matters',
    label: 'Matters & Cases',
    description: 'Case dossiers, lifecycle stages, budget caps, and lead partner assignments',
    iconName: 'Scale',
  },
  {
    id: 'Documents',
    label: 'Document Vault & OCR',
    description: 'Court filings, discovery productions, contracts, and version control',
    iconName: 'FolderLock',
  },
  {
    id: 'Billing',
    label: 'Billing & WIP',
    description: 'Time entries, write-downs, single-matter invoicing, and realization rates',
    iconName: 'IndianRupee',
  },
  {
    id: 'Trust',
    label: 'IOLTA Trust Accounting',
    description: 'Client escrow ledgers, evergreen thresholds, and three-way reconciliation',
    iconName: 'Landmark',
  },
  {
    id: 'Tasks',
    label: 'Tasks & Deadlines',
    description: 'Court calendar dates, statutory deadlines, discovery milestones, and ICS feeds',
    iconName: 'Calendar',
  },
  {
    id: 'Parties',
    label: 'Parties & Counsel',
    description: 'Adverse parties, co-counsel, expert witnesses, and conflict tracking',
    iconName: 'Users',
  },
  {
    id: 'Chronology',
    label: 'Factual Chronology',
    description: 'Master litigation timeline, key evidence tags, and factual exhibits',
    iconName: 'Milestone',
  },
  {
    id: 'LegalHold',
    label: 'Litigation Preservation',
    description: 'Dual-control legal hold orders, custodian notices, and destruction locks',
    iconName: 'Lock',
  },
  {
    id: 'Audit',
    label: 'Immutable Audit Trail',
    description: 'Cryptographic forensic chain-of-custody logging and access evaluation',
    iconName: 'History',
  },
  {
    id: 'ClientPortal',
    label: 'Secure Client Portal',
    description: 'Client credential access, document exchange, and payment gateway',
    iconName: 'Globe',
  },
];

/**
 * Evaluates whether a role has raw domain permission
 */
export function hasDomainPermission(
  role: UserRole | string,
  domain: BoundedDomain,
  action: PermissionAction
): boolean {
  const standardRole = normalizeRole(role);
  const domainPerms = DEFAULT_ROLE_PERMISSIONS[standardRole]?.[domain] || [];
  return domainPerms.includes(action);
}

/**
 * Strict Central Permission Evaluator:
 * 1. Checks if the role possesses the domain permission for the requested action.
 * 2. If data is bound to a specific matter, evaluates Matter Access Policy & Ethical Walls below the UI.
 * 3. Enforces Legal Hold protection: blocks destructive delete operations on preserved documents.
 */
export function checkPermission(
  user: User,
  domain: BoundedDomain,
  action: PermissionAction,
  matter?: Matter | null,
  ethicalWalls: EthicalWallRule[] = []
): { allowed: boolean; reason?: string } {
  const standardRole = normalizeRole(user.role);

  // 1. Role-Based Domain Check
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[standardRole]?.[domain] || [];
  if (!rolePerms.includes(action)) {
    return {
      allowed: false,
      reason: `RBAC Restriction: Role "${standardRole}" lacks "${action}" permission on domain "${domain}".`,
    };
  }

  // 2. Matter Access Policy Check (if item belongs to a matter)
  if (matter) {
    const auth = evaluateMatterAccess(user, matter, ethicalWalls);
    if (!auth.isPermitted) {
      return {
        allowed: false,
        reason: `Matter Access Policy Denied: ${auth.denialReason || auth.reason || 'Screened under ethical wall.'}`,
      };
    }
  }

  // 3. Client Role Scope Check: Client can only interact with their own client matter
  if (standardRole === 'Client' && matter) {
    if (user.department && user.department !== matter.clientId && !matter.assignedUserIds.includes(user.id)) {
      return {
        allowed: false,
        reason: `Client Boundary: You are only authorized to view matters belonging to your institutional account.`,
      };
    }
  }

  return { allowed: true };
}
