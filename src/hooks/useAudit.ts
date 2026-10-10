import { useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import { AuditActionType, AuditEvent } from '../types';

export interface LogEventOptions {
  action: AuditActionType;
  entityType: AuditEvent['entityType'];
  entityId: string;
  details: string; // Action description
  matterId?: string;
  matterNumber?: string;
  metadata?: Record<string, any>;
}

export type DocumentActionType =
  | 'view'
  | 'modify'
  | 'upload'
  | 'download'
  | 'delete'
  | 'hold'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_MODIFIED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DOWNLOADED_WATERMARKED'
  | (string & {});

export type TrustActionType =
  | 'DEPOSIT'
  | 'DISBURSEMENT'
  | 'APPLIED_TO_INVOICE'
  | 'RECONCILIATION';

const MOCK_DB_KEY = 'counsel_repos_audit_events_db';

/**
 * useAudit Hook
 * 
 * Centralized audit logging hook for recording every user-triggered business event
 * (viewing matters, modifying documents, trust transactions, uploads, and billing operations)
 * into the central `audit_events` state and persistent mock database.
 * 
 * Guarantees every event includes:
 * - timestamp (ISO 8601 UTC)
 * - userId & userName
 * - userRole
 * - action code and action description (details)
 * - entity target & metadata
 */
export function useAudit() {
  const {
    audit_events,
    setAuditLog,
    currentUser,
    matters,
  } = useApp();

  /**
   * Primary audit logger function
   * Records a user-triggered business event to central state & mock storage
   */
  const logEvent = useCallback(
    ({
      action,
      entityType,
      entityId,
      details,
      matterId,
      matterNumber,
      metadata,
    }: LogEventOptions): AuditEvent => {
      // Auto-lookup matterNumber if not provided
      let resolvedMatterNumber = matterNumber;
      if (!resolvedMatterNumber && matterId) {
        const found = matters.find((m) => m.id === matterId);
        if (found) resolvedMatterNumber = found.matterNumber;
      }

      const newEvent: AuditEvent = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'usr-anon',
        userName: currentUser?.name || 'Anonymous User',
        userRole: currentUser?.role || 'Lawyer',
        matterId,
        matterNumber: resolvedMatterNumber,
        action,
        entityType,
        entityId,
        ipAddress: '192.168.1.104',
        details,
        metadata,
      };

      setAuditLog((prev) => {
        const updated = [newEvent, ...prev];
        // Persist to mock database in localStorage
        try {
          localStorage.setItem(MOCK_DB_KEY, JSON.stringify(updated.slice(0, 200)));
        } catch (e) {
          console.warn('Audit events mock DB storage warning:', e);
        }
        return updated;
      });

      return newEvent;
    },
    [currentUser, matters, setAuditLog]
  );

  /**
   * Helper: Log matter dossier view
   * Tracks when a user opens, switches to, or inspects a legal matter
   */
  const logMatterView = useCallback(
    (matterId: string, matterTitle?: string, matterNumber?: string) => {
      let resolvedTitle = matterTitle;
      let resolvedNumber = matterNumber;

      if (!resolvedTitle || !resolvedNumber) {
        const m = matters.find((item) => item.id === matterId);
        if (m) {
          resolvedTitle = resolvedTitle || m.title;
          resolvedNumber = resolvedNumber || m.matterNumber;
        }
      }

      const titlePart = resolvedTitle ? ` "${resolvedTitle}"` : '';
      const numberPart = resolvedNumber ? ` (${resolvedNumber})` : '';

      return logEvent({
        action: 'MATTER_VIEWED',
        entityType: 'Matter',
        entityId: matterId,
        matterId,
        matterNumber: resolvedNumber,
        details: `${currentUser.name} viewed matter dossier${titlePart}${numberPart}.`,
        metadata: {
          matterTitle: resolvedTitle,
          matterNumber: resolvedNumber,
          viewedAt: new Date().toISOString(),
        },
      });
    },
    [currentUser.name, logEvent, matters]
  );

  /**
   * Helper: Log document action (viewing, modifying, uploading, downloading, holding)
   */
  const logDocumentAction = useCallback(
    (
      actionType: DocumentActionType,
      docId: string,
      docTitle: string,
      matterId?: string,
      matterNumberOrDetails?: string,
      metadata?: Record<string, any>
    ) => {
      let action: AuditActionType = 'DOCUMENT_VIEWED';
      let defaultDesc = '';

      switch (actionType) {
        case 'view':
        case 'DOCUMENT_VIEWED':
          action = 'DOCUMENT_VIEWED';
          defaultDesc = `${currentUser.name} viewed document "${docTitle}".`;
          break;
        case 'modify':
        case 'DOCUMENT_MODIFIED':
          action = 'DOCUMENT_MODIFIED';
          defaultDesc = `${currentUser.name} modified document metadata / versions for "${docTitle}".`;
          break;
        case 'upload':
        case 'DOCUMENT_UPLOADED':
          action = 'DOCUMENT_UPLOADED';
          defaultDesc = `${currentUser.name} uploaded new file "${docTitle}" to vault.`;
          break;
        case 'download':
        case 'DOCUMENT_DOWNLOADED_WATERMARKED':
          action = 'DOCUMENT_DOWNLOADED_WATERMARKED';
          defaultDesc = `${currentUser.name} downloaded forensic watermarked copy of "${docTitle}".`;
          break;
        case 'hold':
        case 'LEGAL_HOLD_PRESERVATION_FROZEN':
          action = 'LEGAL_HOLD_PRESERVATION_FROZEN';
          defaultDesc = `${currentUser.name} applied litigation preservation freeze to "${docTitle}".`;
          break;
        case 'delete':
          action = 'DOCUMENT_MODIFIED';
          defaultDesc = `${currentUser.name} archived document "${docTitle}".`;
          break;
        default:
          action = actionType as AuditActionType;
          defaultDesc = `${currentUser.name} performed action on document "${docTitle}".`;
          break;
      }

      let resolvedMatterNumber: string | undefined = undefined;
      let resolvedDetails = defaultDesc;

      if (matterNumberOrDetails) {
        if (matterNumberOrDetails.startsWith('M-') || !matterNumberOrDetails.includes(' ')) {
          resolvedMatterNumber = matterNumberOrDetails;
        } else {
          resolvedDetails = matterNumberOrDetails;
        }
      }

      return logEvent({
        action,
        entityType: 'Document',
        entityId: docId,
        matterId,
        matterNumber: resolvedMatterNumber,
        details: resolvedDetails,
        metadata: {
          docTitle,
          actionType,
          ...metadata,
        },
      });
    },
    [currentUser.name, logEvent]
  );

  /**
   * Helper: Log trust accounting transactions
   * Ensures every retainer deposit, disbursement, or invoice allocation is recorded with timestamp and user ID
   */
  const logTrustTransaction = useCallback(
    (
      type: TrustActionType | string,
      amount: number,
      matterId: string,
      description: string,
      invoiceNumber?: string
    ) => {
      let action: AuditActionType = 'TRUST_TRANSACTION';
      if (type === 'DEPOSIT') action = 'TRUST_DEPOSIT';
      else if (type === 'DISBURSEMENT') action = 'TRUST_DISBURSEMENT';
      else if (type === 'APPLIED_TO_INVOICE') action = 'TRUST_APPLIED_TO_INVOICE';

      const formattedAmount = formatINR(amount);
      const invoiceRef = invoiceNumber ? ` (Inv #${invoiceNumber})` : '';

      return logEvent({
        action,
        entityType: 'Trust',
        entityId: `tx-${Date.now()}`,
        matterId,
        details: `${currentUser.name} executed trust ${type} of ${formattedAmount}${invoiceRef}: "${description}".`,
        metadata: {
          type,
          amount,
          invoiceNumber,
          description,
        },
      });
    },
    [currentUser.name, logEvent]
  );

  /**
   * Filter events by matter ID
   */
  const getEventsForMatter = useCallback(
    (matterId: string) => {
      return audit_events.filter((e) => e.matterId === matterId);
    },
    [audit_events]
  );

  /**
   * Filter events by entity
   */
  const getEventsForEntity = useCallback(
    (entityType: string, entityId: string) => {
      return audit_events.filter(
        (e) => e.entityType.toLowerCase() === entityType.toLowerCase() && e.entityId === entityId
      );
    },
    [audit_events]
  );

  /**
   * Clear or reset audit events
   */
  const clearAuditLog = useCallback(() => {
    setAuditLog([]);
    try {
      localStorage.removeItem(MOCK_DB_KEY);
    } catch (e) {
      console.warn(e);
    }
  }, [setAuditLog]);

  return useMemo(
    () => ({
      audit_events,
      auditEvents: audit_events,
      logEvent,
      logMatterView,
      logDocumentAction,
      logTrustTransaction,
      getEventsForMatter,
      getEventsForEntity,
      clearAuditLog,
    }),
    [
      audit_events,
      logEvent,
      logMatterView,
      logDocumentAction,
      logTrustTransaction,
      getEventsForMatter,
      getEventsForEntity,
      clearAuditLog,
    ]
  );
}

export default useAudit;
