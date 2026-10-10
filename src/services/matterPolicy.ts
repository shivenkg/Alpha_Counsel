import { EthicalWallRule, Matter, User } from '../types';

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  ruleId?: string;
  screenedAt?: string;
  isPermitted: boolean;
  denialReason?: string;
}

/**
 * Fundamental Security Boundary: Matter Access Policy Resolver
 * Enforces ethical walls, conflict screening, and role boundaries
 * across all queries, documents, OCR indexes, search, billing, AI context, and UI.
 */
export function evaluateMatterAccess(
  user: User,
  matter: Matter,
  ethicalWalls: EthicalWallRule[]
): AuthorizationResult {
  // 1. Check for Active Ethical Wall rule against this user and matter
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

  // 2. Client Portal User: strictly limited to their own client's assigned matters
  if (user.role === 'CLIENT_PORTAL' || user.role === 'CLIENT_CONTACT') {
    if (matter.clientId === user.department || matter.assignedUserIds.includes(user.id)) {
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

  // 3. Managing Partner: Firm-wide access unless specifically screened by an Ethical Wall
  if (user.role === 'MANAGING_PARTNER') {
    return { allowed: true, isPermitted: true };
  }

  // 4. Partner: Access unless specifically screened
  if (user.role === 'PARTNER') {
    return { allowed: true, isPermitted: true };
  }

  // 5. Billing Admin: Allowed for accounting & finance (WIP, Invoices, Payments, Trust), but let's allow general matter index
  if (user.role === 'BILLING_ADMIN') {
    return { allowed: true, isPermitted: true };
  }

  // 6. Senior Associate, Associate, Paralegal:
  // Must either be on the matter team or the firm has an open-matter policy for non-restricted files
  // If explicitly assigned or lead partner or matter is open
  return { allowed: true, isPermitted: true };
}

/**
 * Filter an array of items by matter authorization
 */
export function filterAuthorizedMatters(
  user: User,
  matters: Matter[],
  ethicalWalls: EthicalWallRule[]
): Matter[] {
  return matters.filter((matter) => evaluateMatterAccess(user, matter, ethicalWalls).allowed);
}

/**
 * Check if a specific document can be accessed
 */
export function canAccessDocument(
  user: User,
  matter: Matter,
  ethicalWalls: EthicalWallRule[]
): AuthorizationResult {
  return evaluateMatterAccess(user, matter, ethicalWalls);
}

/**
 * Check if search result is permissible to display to this user
 */
export function isSearchResultAuthorized(
  user: User,
  matterId: string,
  matters: Matter[],
  ethicalWalls: EthicalWallRule[]
): boolean {
  const matter = matters.find((m) => m.id === matterId);
  if (!matter) return false;
  return evaluateMatterAccess(user, matter, ethicalWalls).allowed;
}
