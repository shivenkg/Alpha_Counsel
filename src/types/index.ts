/**
 * AlphaCounsel v1 - Comprehensive Domain & Data Types
 * Enterprise-grade legal practice management & security boundary
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'MANAGING_PARTNER'
  | 'PARTNER'
  | 'SENIOR_ASSOCIATE'
  | 'ASSOCIATE'
  | 'PARALEGAL'
  | 'BILLING_ADMIN'
  | 'CLIENT_PORTAL'
  | 'CLIENT_CONTACT'
  | 'Administrator'
  | 'Lawyer'
  | 'Paralegal'
  | 'Client';

export type StandardRole = 'Administrator' | 'Lawyer' | 'Paralegal' | 'Client';

export type LicenseTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'SOVEREIGN';
export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'PAST_DUE';

export interface TenantFeatures {
  aiDrafting: boolean;
  legalHolds: boolean;
  trustAccounting: boolean;
  ethicalWalls: boolean;
  forensicOcr: boolean;
  clientPortal: boolean;
  customDomain: boolean;
  auditLogs: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: TenantStatus;
  plan: LicenseTier;
  licenseKey: string;
  seatsAllocated: number;
  maxSeats: number;
  storageUsedGB: number;
  storageLimitGB: number;
  monthlyPriceINR: number;
  renewDate: string;
  adminEmail: string;
  features: TenantFeatures;
  createdAt: string;
}

export interface LicensePlanDetails {
  tier: LicenseTier;
  name: string;
  monthlyPriceINR: number;
  annualPriceINR: number;
  maxSeatsIncluded: number;
  storageGB: number;
  description: string;
  popular?: boolean;
}

export type ThemeMode = 'dark' | 'light';

export type BoundedDomain =
  | 'Matters'
  | 'Documents'
  | 'Billing'
  | 'Trust'
  | 'Tasks'
  | 'Parties'
  | 'Chronology'
  | 'LegalHold'
  | 'Audit'
  | 'ClientPortal';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface DomainPermissionConfig {
  domain: BoundedDomain;
  label: string;
  description: string;
  allowedActions: PermissionAction[];
}

export interface ClientCredential {
  id: string;
  clientId: string;
  clientName: string;
  email: string;
  name: string;
  title: string;
  passwordHint: string;
  twoFactorEnabled: boolean;
  avatarUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  billingRate: number; // hourly rate
  barNumber?: string;
  department: string;
  tenantId?: string;
  isActive?: boolean;
}

export type MatterStatus =
  | 'INTAKE'
  | 'CONFLICT_CHECK'
  | 'APPROVAL'
  | 'MATTER_OPEN'
  | 'ACTIVE'
  | 'CLOSED'
  | 'ARCHIVED';

export type PracticeArea =
  | 'Commercial Litigation'
  | 'Litigation'
  | 'Intellectual Property'
  | 'Corporate & M&A'
  | 'Corporate / M&A'
  | 'Antitrust & Competition'
  | 'Employment & Labor'
  | 'Securities & Regulatory'
  | 'Restructuring'
  | 'White Collar Defense';

export type FeeArrangement =
  | 'Hourly Standard'
  | 'Capped Hourly'
  | 'Fixed / Flat Fee'
  | 'Contingency'
  | 'Blended Rate';

export interface MatterParty {
  id: string;
  matterId: string;
  name: string;
  role:
    | 'Client'
    | 'Opposing Party'
    | 'Co-Counsel'
    | 'Opposing Counsel'
    | 'Judge'
    | 'Arbitrator'
    | 'Key Witness'
    | 'Expert Witness';
  organization?: string;
  conflictStatus: 'CLEARED' | 'FLAGGED' | 'RESOLVED';
  email?: string;
  phone?: string;
  notes?: string;
}

export interface ChronologyEvent {
  id: string;
  matterId: string;
  date: string;
  title: string;
  description: string;
  category: 'Pleading' | 'Discovery' | 'Hearing' | 'Factual Event' | 'Deposition' | 'Settlement';
  significance: 'Critical' | 'Major' | 'Routine';
  linkedDocumentId?: string;
  author: string;
}

export interface MatterTask {
  id: string;
  matterId: string;
  title: string;
  dueDate: string;
  assignedToUserId: string;
  category: 'Filing' | 'Court Hearing' | 'Statutory Deadline' | 'Discovery Response' | 'Drafting';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  courtMandated: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

export interface DocumentSummaryResult {
  executiveOverview: string;
  keyProvisionsOrClaims: string[];
  criticalRisksOrObligations: string[];
  evidentiaryImpact: string;
  recommendedAction: string;
  keyEntities: string[];
  governingLawOrJurisdiction?: string;
  rawSummaryText: string;
  source: 'gemini-3.8-flash' | 'legal-rule-engine';
  generatedAt: string;
  // Convenience aliases for UI consumption
  keyProvisions?: string[];
  criticalRisks?: string[];
  evidentiaryValue?: string;
  actionPlan?: string;
  identifiedEntities?: string[];
  governingLaw?: string;
}

export interface DocumentVersion {
  versionNumber: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
  notes?: string;
  fileName?: string;
  snapshotContent?: string;
  revertedFrom?: string;
  hash?: string;
}

export interface EncryptedFolderRecord {
  folderName: string;
  isEncrypted: boolean;
  algorithm: 'AES-256-GCM';
  keyFingerprint: string;
  cipherIv: string;
  authTag: string;
  encryptedAt: string;
  encryptedBy: string;
  docCount: number;
  status: 'ENCRYPTED' | 'DECRYPTED';
  securityPolicy: 'CLIENT_CONFIDENTIAL' | 'RESTRICTED_ACCESS';
}

export interface FolderThumbnailSlot {
  id: string;
  docTitle: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'txt' | 'img' | 'other';
  ext: string;
  fileSize?: string;
}

export interface LegalTagSuggestion {
  tag: string;
  confidence: number; // 0.0 to 1.0 (e.g. 0.95 = 95%)
  category: 'Domain' | 'Procedural' | 'Privilege' | 'Clause' | 'Regulatory' | 'Evidentiary';
  rationale: string;
}

export interface AutoTagAnalysisResult {
  docId?: string;
  fileName: string;
  title: string;
  detectedDocType: string;
  summaryExcerpt: string;
  suggestedTags: LegalTagSuggestion[];
  analyzedAt: string;
  modelUsed: string;
}

export interface FolderThumbnailPreview {
  folderName: string;
  itemCount: number;
  status: 'idle' | 'generating' | 'ready';
  generatedAt: number;
  slots: Array<FolderThumbnailSlot | null>; // 4 slots for 2x2 grid
}

export interface VaultDocument {
  id: string;
  matterId: string;
  folder: 'Pleadings' | 'Discovery' | 'Correspondence' | 'Contracts' | 'Exhibits' | 'Drafts' | (string & {});
  title: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'txt';
  fileSize: string;
  createdAt: string;
  createdBy: string;
  currentVersion: string;
  versions: DocumentVersion[];
  isHeld: boolean; // Subject to legal hold (destructive operations blocked)
  legalHoldId?: string;
  ocrExtractedText?: string;
  tags: string[];
  confidentialityLevel: 'Public' | 'Firm Confidential' | 'Highly Confidential - Attorneys Eyes Only';
  summary?: string;
  aiSummary?: DocumentSummaryResult;
}

export interface LegalHold {
  id: string;
  matterId: string;
  holdTitle: string;
  createdAt: string;
  createdBy: string;
  status: 'ACTIVE' | 'PENDING_RELEASE' | 'RELEASED';
  scopeDescription: string;
  custodians: string[];
  dateRangeStart: string;
  dateRangeEnd: string;
  targets: string[]; // e.g. ["Email Archives", "Vault Folder: Discovery", "Slack Channels"]
  firstApproverId: string;
  secondApproverId?: string; // Dual-control release requirement
  releaseJustification?: string;
  tamperProofHash: string;
}

export type UTBMSCode =
  | 'A101 - Plan and prepare for'
  | 'A102 - Research'
  | 'A103 - Draft/revise'
  | 'A104 - Review/analyze'
  | 'A105 - Communicate (in firm)'
  | 'A106 - Communicate (with client)'
  | 'A107 - Communicate (other)'
  | 'A108 - Attend proceeding'
  | 'L110 - Fact Investigation/Development'
  | 'L120 - Analysis/Strategy'
  | 'L240 - Dispositive Motions';

export type TimeEntryStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'WIP'
  | 'PARTNER_APPROVED'
  | 'HELD'
  | 'WRITTEN_OFF'
  | 'INVOICED';

export interface TimeEntry {
  id: string;
  matterId: string;
  userId: string;
  userName?: string;
  date: string;
  hours: number;
  rate: number;
  total: number; // hours * rate
  utbmsCode: UTBMSCode;
  narrative: string;
  status: TimeEntryStatus;
  invoiceId?: string;
  writtenDownAmount?: number;
  writeOffReason?: string;
}

export interface ExpenseEntry {
  id: string;
  matterId: string;
  userId: string;
  date: string;
  category: 'Court Filing Fees' | 'Expert Witness Fees' | 'Transcript / Court Reporter' | 'Travel' | 'Process Server';
  amount: number;
  description: string;
  billable: boolean;
  status: 'UNBILLED' | 'INVOICED';
  invoiceId?: string;
}

export type InvoiceStatus =
  | 'DRAFT'
  | 'INTERNAL_APPROVAL'
  | 'ISSUED'
  | 'PART_PAID'
  | 'PAID'
  | 'VOID'
  | 'CREDIT_NOTE';

export interface InvoiceLineItem {
  id: string;
  type: 'TIME' | 'EXPENSE' | 'FIXED_FEE';
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
  utbmsCode?: string;
  date: string;
  attorneyName?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  matterId: string; // Enforces: Invoice -> exactly one Matter!
  matterNumber?: string;
  clientId: string;
  clientName?: string;
  issuedDate: string;
  dueDate: string;
  subtotalTime: number;
  subtotalExpenses: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  lines: InvoiceLineItem[];
  paymentTerms: string;
  notes?: string;
  approvedBy?: string;
  paidAt?: string;
  ledesFormatString?: string;
}

export interface PaymentAllocation {
  id: string;
  invoiceId: string;
  matterId: string;
  amount: number;
  paymentDate: string;
  method: 'Trust Transfer' | 'Wire' | 'ACH' | 'Credit Card' | 'Check';
  reference: string;
  recordedBy: string;
}

export type TrustTransactionType =
  | 'RETAINER_DEPOSIT'
  | 'DEPOSIT'
  | 'TRUST_APPLIED_TO_INVOICE'
  | 'APPLIED_TO_INVOICE'
  | 'DISBURSEMENT_REFUND'
  | 'DISBURSEMENT'
  | 'INTEREST_ADJUSTMENT';

export interface TrustTransaction {
  id: string;
  matterId: string; // Enforces: TrustTransaction -> exactly one Matter!
  date: string;
  type: TrustTransactionType;
  amount: number; // positive for deposit, negative for applied/refund
  runningBalance: number;
  description: string;
  relatedInvoiceId?: string;
  authorizedBy: string;
  bankAccountRef?: string;
  reference?: string;
  cleared?: boolean;
  recordedBy?: string;
}

export interface Matter {
  id: string;
  matterNumber: string;
  title: string;
  clientId: string;
  clientName: string;
  status: MatterStatus;
  practiceArea: PracticeArea;
  leadPartnerId: string;
  assignedUserIds: string[];
  description: string;
  courtVenue?: string;
  judge?: string;
  caseDocketNumber?: string;
  openDate: string;
  closeDate?: string;
  feeArrangement: FeeArrangement | string;
  budgetCap?: number;
  evergreenTrustMinimum: number; // Evergreen retainer threshold (e.g. ₹10,000)
  hasActiveHold: boolean;
  billingModel?: string;
}

export interface Client {
  id: string;
  name: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactTitle?: string;
  phone: string;
  address: string;
  industry: string;
  billingTier?: string;
  portalEnabled: boolean;
  notes?: string;
  createdAt: string;
}

export interface EthicalWallRule {
  id: string;
  userId: string;
  userName: string;
  matterId: string;
  matterNumber: string;
  matterTitle?: string;
  reason: string;
  establishedAt?: string;
  screenedDate?: string;
  authorizedBy: string;
  active: boolean;
}

export type EthicalWall = EthicalWallRule;

export type MatterSubTab =
  | 'overview'
  | 'parties'
  | 'chronology'
  | 'tasks'
  | 'documents'
  | 'ai-drafting'
  | 'legal-hold'
  | 'time'
  | 'expenses'
  | 'wip'
  | 'invoices'
  | 'payments'
  | 'trust'
  | 'audit'
  | 'activity';

export type AuditActionType =
  | 'MATTER_VIEWED'
  | 'MATTER_ACCESS_GRANTED'
  | 'ETHICAL_WALL_DENIED'
  | 'ETHICAL_WALL_BLOCKED'
  | 'CONFLICT_CHECK_RUN'
  | 'LEGAL_HOLD_CREATED'
  | 'LEGAL_HOLD_PRESERVATION_FROZEN'
  | 'LEGAL_HOLD_RELEASE_REQUESTED'
  | 'LEGAL_HOLD_RELEASED'
  | 'TIME_RECORDED'
  | 'WIP_WRITEOFF'
  | 'INVOICE_ISSUED'
  | 'TRUST_DEPOSIT'
  | 'TRUST_TRANSACTION'
  | 'TRUST_DISBURSEMENT'
  | 'TRUST_APPLIED_TO_INVOICE'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_MODIFIED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DOWNLOADED_WATERMARKED'
  | 'DOCUMENT_MOVED'
  | 'DOCUMENT_COPIED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENTS_BULK_MOVED'
  | 'DOCUMENTS_BULK_COPIED'
  | 'DOCUMENTS_BULK_DELETED'
  | 'DOCUMENTS_AUTO_TAGGED'
  | 'FOLDER_CREATED'
  | 'FOLDER_ENCRYPTED'
  | 'FOLDER_DECRYPTED'
  | 'AI_DRAFT_REQUESTED'
  | 'AI_DRAFT_COMMITTED'
  | (string & {});

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole | string;
  matterId?: string;
  matterNumber?: string;
  action: AuditActionType;
  entityType:
    | 'Matter'
    | 'Document'
    | 'Folder'
    | 'Invoice'
    | 'TimeEntry'
    | 'Trust'
    | 'LegalHold'
    | 'AI'
    | 'System'
    | 'ClientPortal'
    | (string & {});
  entityId: string;
  ipAddress: string;
  details: string; // Action description
  metadata?: Record<string, any>;
}

export interface MatterFinancialSnapshot {
  unbilledWip: number; // Unbilled time + billable expenses
  billed: number; // Issued invoice totals
  paid: number; // Allocated payments
  outstandingAr: number; // Issued - allocated payments/credits
  trustBalance: number; // Current matter trust balance
  realizationRate: number; // Billed / (WIP + Billed) or Billed / Recorded
  collectionRealizationRate: number; // Collected / Billed
}

export interface AIDraftRequest {
  documentType:
    | 'Motion for Summary Judgment'
    | 'Non-Disclosure Agreement'
    | 'Demand Letter'
    | 'Engagement Letter'
    | 'Client Legal Opinion'
    | 'Notice of Deposition';
  matterId: string;
  jurisdiction: string;
  clientPosition: string;
  keyLegalArguments: string;
  selectedDocumentIds: string[];
  includeWatermark: boolean;
}

export interface AIDraftResult {
  id: string;
  documentType: string;
  matterId: string;
  title: string;
  content: string;
  citations: Array<{
    citationNumber: number;
    sourceDocTitle: string;
    sourceDocId: string;
    quotedText: string;
    relevance: string;
  }>;
  generatedAt: string;
  tokenCount: number;
  watermark: boolean;
}
