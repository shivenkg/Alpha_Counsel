import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_AUDIT_LOG,
  INITIAL_CHRONOLOGY,
  INITIAL_CLIENTS,
  INITIAL_DOCUMENTS,
  INITIAL_ETHICAL_WALLS,
  INITIAL_EXPENSES,
  INITIAL_INVOICES,
  INITIAL_LEGAL_HOLDS,
  INITIAL_MATTERS,
  INITIAL_PARTIES,
  INITIAL_PAYMENTS,
  INITIAL_TASKS,
  INITIAL_TIME_ENTRIES,
  INITIAL_TRUST_TRANSACTIONS,
  INITIAL_USERS,
} from '../data/mockData';
import {
  INITIAL_TENANTS,
  LICENSE_PLANS,
  SUPER_ADMIN_USER,
} from '../data/saasData';
import { DEFAULT_ROLE_PERMISSIONS } from '../services/rbac';
import {
  AuditEvent,
  BoundedDomain,
  ChronologyEvent,
  Client,
  EthicalWallRule,
  ExpenseEntry,
  Invoice,
  LegalHold,
  LicensePlanDetails,
  LicenseTier,
  Matter,
  MatterParty,
  MatterTask,
  PaymentAllocation,
  PermissionAction,
  StandardRole,
  Tenant,
  TenantFeatures,
  ThemeMode,
  TimeEntry,
  TrustTransaction,
  User,
  UTBMSCode,
  VaultDocument,
  DocumentVersion,
} from '../types';

export type MainNavView =
  | 'dashboard'
  | 'matters'
  | 'matter-detail'
  | 'clients'
  | 'conflicts'
  | 'vault'
  | 'search'
  | 'billing'
  | 'trust'
  | 'portal'
  | 'calendar'
  | 'precedents'
  | 'admin'
  | 'client-portal'
  | 'super-admin';

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

interface AppContextType {
  // Theme & Auth State
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isAuthenticated: boolean;
  login: (user: User, tenantId?: string) => void;
  logout: () => void;

  // SaaS Multi-Tenant & Licensing (Super Admin)
  tenants: Tenant[];
  currentTenantId: string;
  currentTenant: Tenant;
  setCurrentTenantId: (id: string) => void;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => void;
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>) => void;
  regenerateLicenseKey: (tenantId: string) => string;
  toggleTenantFeature: (tenantId: string, feature: keyof TenantFeatures) => void;
  licensePlans: LicensePlanDetails[];
  updateLicensePlan: (tier: LicenseTier, updates: Partial<LicensePlanDetails>) => void;
  addLicensePlan: (plan: LicensePlanDetails) => void;

  // Tenant / Portal Admin & RBAC
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  firmUsers: User[];
  addFirmUser: (user: Omit<User, 'id'>) => { success: boolean; error?: string };
  updateFirmUser: (userId: string, updates: Partial<User>) => void;
  toggleUserStatus: (userId: string) => void;
  rolePermissions: Record<StandardRole, Record<BoundedDomain, PermissionAction[]>>;
  updateRolePermission: (role: StandardRole, domain: BoundedDomain, action: PermissionAction) => void;
  resetRolePermissions: () => void;

  // Navigation
  currentView: MainNavView;
  setCurrentView: (view: MainNavView) => void;
  activeMatterId: string | null;
  setActiveMatterId: (id: string | null) => void;
  matterSubTab: MatterSubTab;
  setMatterSubTab: (tab: MatterSubTab) => void;

  // Domain Collections
  matters: Matter[];
  clients: Client[];
  documents: VaultDocument[];
  timeEntries: TimeEntry[];
  expenses: ExpenseEntry[];
  invoices: Invoice[];
  payments: PaymentAllocation[];
  trustTransactions: TrustTransaction[];
  legalHolds: LegalHold[];
  ethicalWalls: EthicalWallRule[];
  chronology: ChronologyEvent[];
  tasks: MatterTask[];
  parties: MatterParty[];
  auditLog: AuditEvent[];
  auditLogs: AuditEvent[];
  audit_events: AuditEvent[];
  setAuditLog: React.Dispatch<React.SetStateAction<AuditEvent[]>>;

  // Live Timer
  isTimerRunning: boolean;
  timerSeconds: number;
  timerMatterId: string;
  timerNarrative: string;
  timerUtbms: UTBMSCode;
  startTimer: (matterId?: string) => void;
  pauseTimer: () => void;
  setTimerMatterId: (id: string) => void;
  setTimerNarrative: (narrative: string) => void;
  setTimerUtbms: (code: UTBMSCode) => void;
  saveTimerEntry: () => void;
  discardTimer: () => void;

  // Actions
  openMatter: (matterId: string, subTab?: MatterSubTab) => void;
  addMatter: (matter: Omit<Matter, 'id'>) => void;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'status'>) => void;
  updateTimeEntryStatus: (
    entryId: string,
    status: TimeEntry['status'],
    writtenDownAmount?: number,
    reason?: string
  ) => void;
  addExpense: (expense: Omit<ExpenseEntry, 'id' | 'status'>) => void;
  createInvoiceFromWip: (
    matterId: string,
    timeEntryIds: string[],
    expenseIds: string[],
    notes?: string
  ) => Invoice;
  applyTrustToInvoice: (invoiceId: string, amount: number) => boolean;
  recordDirectPayment: (
    invoiceId: string,
    amount: number,
    method: PaymentAllocation['method'],
    reference: string
  ) => void;
  depositTrust: (matterId: string, amount: number, notes: string) => void;
  addTrustTransaction: (tx: Omit<TrustTransaction, 'id' | 'runningBalance'>) => void;
  addDocument: (doc: Omit<VaultDocument, 'id' | 'createdAt' | 'currentVersion' | 'versions'> | VaultDocument) => void;
  updateDocument: (docId: string, updates: Partial<VaultDocument>) => void;
  deleteDocument: (docId: string) => boolean;
  deleteDocuments: (docIds: string[]) => { deletedCount: number; blockedCount: number };
  bulkMoveDocuments: (docIds: string[], targetFolder: string) => void;
  bulkCopyDocuments: (docIds: string[], targetFolder: string) => void;
  addDocumentVersion: (
    docId: string,
    versionData: {
      versionNumber?: string;
      notes?: string;
      fileSize?: string;
      fileName?: string;
      ocrExtractedText?: string;
      summary?: string;
    }
  ) => void;
  revertDocumentVersion: (
    docId: string,
    targetVersionNumber: string,
    reason?: string
  ) => boolean;
  toggleEthicalWall: (ruleId: string) => void;
  addEthicalWall: (rule: Omit<EthicalWallRule, 'id'>) => void;
  createLegalHold: (hold: Omit<LegalHold, 'id' | 'createdAt' | 'status' | 'tamperProofHash'>) => void;
  requestReleaseLegalHold: (holdId: string, secondApproverId: string, justification: string) => void;
  approveLegalHoldRelease: (holdId: string) => void;
  addTask: (task: Omit<MatterTask, 'id'>) => void;
  addChronology: (item: Omit<ChronologyEvent, 'id'>) => void;
  logAudit: (
    action: AuditEvent['action'],
    entityType: AuditEvent['entityType'],
    entityId: string,
    details: string,
    matterId?: string,
    matterNumber?: string
  ) => void;

  // Upload Modal State
  isUploadModalOpen: boolean;
  uploadModalMatterId?: string;
  uploadModalFolder?: string;
  openUploadModal: (matterId?: string, folder?: string) => void;
  closeUploadModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('counsel_repos_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('counsel_repos_theme', newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // SaaS Tenants & Licensing State
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [currentTenantId, setCurrentTenantId] = useState<string>('tenant-1');

  const currentTenant = tenants.find((t) => t.id === currentTenantId) || tenants[0];

  // Users State (including Super Admin + tenant-allocated users)
  const [users, setUsers] = useState<User[]>(() => [
    SUPER_ADMIN_USER,
    ...INITIAL_USERS.map((u) => ({
      ...u,
      tenantId: u.role === 'CLIENT_PORTAL' ? 'tenant-1' : 'tenant-1',
      isActive: true,
    })),
  ]);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    // Default to Marcus Sterling (Tenant Admin / Managing Partner)
    return INITIAL_USERS[0];
  });

  // Login & Logout
  const login = (user: User, tenantId?: string) => {
    setCurrentUser(user);
    if (tenantId) {
      setCurrentTenantId(tenantId);
    } else if (user.tenantId && user.tenantId !== 'platform-saas') {
      setCurrentTenantId(user.tenantId);
    }
    setIsAuthenticated(true);
    if (user.role === 'SUPER_ADMIN') {
      setCurrentView('super-admin');
    } else {
      setCurrentView('dashboard');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // Role Permissions Matrix
  const [rolePermissions, setRolePermissions] = useState<
    Record<StandardRole, Record<BoundedDomain, PermissionAction[]>>
  >(DEFAULT_ROLE_PERMISSIONS);

  const updateRolePermission = (
    role: StandardRole,
    domain: BoundedDomain,
    action: PermissionAction
  ) => {
    setRolePermissions((prev) => {
      const currentActions = prev[role][domain] || [];
      const updatedActions = currentActions.includes(action)
        ? currentActions.filter((a) => a !== action)
        : [...currentActions, action];

      return {
        ...prev,
        [role]: {
          ...prev[role],
          [domain]: updatedActions,
        },
      };
    });
  };

  const resetRolePermissions = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
  };

  // Firm Users (all users belonging to the active tenant)
  const firmUsers = users.filter(
    (u) => u.tenantId === currentTenantId && u.role !== 'SUPER_ADMIN'
  );

  // Add Firm User (enforcing SaaS seat allocation limit!)
  const addFirmUser = (newUser: Omit<User, 'id'>) => {
    // Check quota against tenant's maxSeats
    if (currentTenant.seatsAllocated >= currentTenant.maxSeats) {
      return {
        success: false,
        error: `License quota limit reached (${currentTenant.seatsAllocated}/${currentTenant.maxSeats} seats). Please contact Super Admin to upgrade your firm's license tier.`,
      };
    }

    const created: User = {
      ...newUser,
      id: 'usr-' + Date.now(),
      tenantId: currentTenantId,
      isActive: true,
    };

    setUsers((prev) => [...prev, created]);

    // Increment tenant's allocated seats count
    setTenants((prev) =>
      prev.map((t) =>
        t.id === currentTenantId ? { ...t, seatsAllocated: t.seatsAllocated + 1 } : t
      )
    );

    return { success: true };
  };

  const updateFirmUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
  };

  // SaaS Tenant Management Actions (Super Admin)
  const updateTenant = (tenantId: string, updates: Partial<Tenant>) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, ...updates } : t))
    );
  };

  const addTenant = (newTenantData: Omit<Tenant, 'id' | 'createdAt'>) => {
    const id = 'tenant-' + (tenants.length + 1);
    const created: Tenant = {
      ...newTenantData,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTenants((prev) => [...prev, created]);
  };

  const regenerateLicenseKey = (tenantId: string): string => {
    const t = tenants.find((item) => item.id === tenantId);
    const prefix = t ? t.plan.substring(0, 3) : 'ENT';
    const rand1 = Math.floor(1000 + Math.random() * 9000);
    const rand2 = Math.floor(1000 + Math.random() * 9000);
    const newKey = `CR-${prefix}-2026-${rand1}-${rand2}`;

    updateTenant(tenantId, { licenseKey: newKey });
    return newKey;
  };

  const toggleTenantFeature = (tenantId: string, feature: keyof TenantFeatures) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== tenantId) return t;
        return {
          ...t,
          features: {
            ...t.features,
            [feature]: !t.features[feature],
          },
        };
      })
    );
  };

  const [licensePlans, setLicensePlans] = useState<LicensePlanDetails[]>(LICENSE_PLANS);

  const updateLicensePlan = (tier: LicenseTier, updates: Partial<LicensePlanDetails>) => {
    setLicensePlans((prev) =>
      prev.map((p) => {
        if (p.tier !== tier) return p;
        const updated = { ...p, ...updates };
        // Annual subscription is calculated directly based on monthly subscription (monthly * 12)
        if (updates.monthlyPriceINR !== undefined) {
          updated.annualPriceINR = updates.monthlyPriceINR * 12;
        }
        return updated;
      })
    );
  };

  const addLicensePlan = (plan: LicensePlanDetails) => {
    setLicensePlans((prev) => [...prev, plan]);
  };

  // Views & Routing State
  const [currentView, setCurrentView] = useState<MainNavView>('dashboard');
  const [activeMatterId, setActiveMatterId] = useState<string | null>('mat-1');
  const [matterSubTab, setMatterSubTab] = useState<MatterSubTab>('overview');

  // Collections
  const [matters, setMatters] = useState<Matter[]>(INITIAL_MATTERS);
  const [clients] = useState<Client[]>(INITIAL_CLIENTS);
  const [documents, setDocuments] = useState<VaultDocument[]>(INITIAL_DOCUMENTS);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(INITIAL_TIME_ENTRIES);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(INITIAL_EXPENSES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [payments, setPayments] = useState<PaymentAllocation[]>(INITIAL_PAYMENTS);
  const [trustTransactions, setTrustTransactions] = useState<TrustTransaction[]>(INITIAL_TRUST_TRANSACTIONS);
  const [legalHolds, setLegalHolds] = useState<LegalHold[]>(INITIAL_LEGAL_HOLDS);
  const [ethicalWalls, setEthicalWalls] = useState<EthicalWallRule[]>(INITIAL_ETHICAL_WALLS);
  const [chronology, setChronology] = useState<ChronologyEvent[]>(INITIAL_CHRONOLOGY);
  const [tasks, setTasks] = useState<MatterTask[]>(INITIAL_TASKS);
  const [parties, setParties] = useState<MatterParty[]>(INITIAL_PARTIES);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>(INITIAL_AUDIT_LOG);

  // Live Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerMatterId, setTimerMatterId] = useState('mat-1');
  const [timerNarrative, setTimerNarrative] = useState('');
  const [timerUtbms, setTimerUtbms] = useState<UTBMSCode>('A103 - Draft/revise');

  // Timer Tick Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Global Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalMatterId, setUploadModalMatterId] = useState<string | undefined>(undefined);
  const [uploadModalFolder, setUploadModalFolder] = useState<string | undefined>(undefined);

  const openUploadModal = (matterId?: string, folder?: string) => {
    setUploadModalMatterId(matterId);
    setUploadModalFolder(folder);
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadModalMatterId(undefined);
    setUploadModalFolder(undefined);
  };

  const logAudit = (
    action: AuditEvent['action'],
    entityType: AuditEvent['entityType'],
    entityId: string,
    details: string,
    matterId?: string,
    matterNumber?: string
  ) => {
    const event: AuditEvent = {
      id: 'aud-' + Date.now() + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      matterId,
      matterNumber,
      action,
      entityType,
      entityId,
      ipAddress: '192.168.1.104',
      details,
    };
    setAuditLog((prev) => [event, ...prev]);
  };

  const openMatter = (matterId: string, subTab: MatterSubTab = 'overview') => {
    setActiveMatterId(matterId);
    setMatterSubTab(subTab);
    setCurrentView('matters');
  };

  const addMatter = (matterData: Omit<Matter, 'id'>) => {
    const newMatter: Matter = {
      ...matterData,
      id: 'mat-' + (matters.length + 1),
    };
    setMatters((prev) => [newMatter, ...prev]);
    logAudit(
      'MATTER_ACCESS_GRANTED',
      'Matter',
      newMatter.id,
      `Matter ${newMatter.matterNumber} created by ${currentUser.name}`,
      newMatter.id,
      newMatter.matterNumber
    );
  };

  const addTimeEntry = (entryData: Omit<TimeEntry, 'id' | 'status'>) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: 'te-' + (timeEntries.length + 1),
      status: 'WIP',
    };
    setTimeEntries((prev) => [newEntry, ...prev]);
    const m = matters.find((item) => item.id === newEntry.matterId);
    logAudit(
      'TIME_RECORDED',
      'TimeEntry',
      newEntry.id,
      `${newEntry.hours}h logged by ${currentUser.name} (₹${newEntry.total})`,
      newEntry.matterId,
      m?.matterNumber
    );
  };

  const updateTimeEntryStatus = (
    entryId: string,
    status: TimeEntry['status'],
    writtenDownAmount?: number,
    reason?: string
  ) => {
    setTimeEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === entryId) {
          return {
            ...entry,
            status,
            writtenDownAmount: writtenDownAmount !== undefined ? writtenDownAmount : entry.writtenDownAmount,
            writeOffReason: reason || entry.writeOffReason,
          };
        }
        return entry;
      })
    );
  };

  const addExpense = (expenseData: Omit<ExpenseEntry, 'id' | 'status'>) => {
    const newExpense: ExpenseEntry = {
      ...expenseData,
      id: 'exp-' + (expenses.length + 1),
      status: 'UNBILLED',
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const createInvoiceFromWip = (
    matterId: string,
    timeEntryIds: string[],
    expenseIds: string[],
    notes?: string
  ): Invoice => {
    const matter = matters.find((m) => m.id === matterId);
    const selectedTime = timeEntries.filter((t) => timeEntryIds.includes(t.id));
    const selectedExp = expenses.filter((e) => expenseIds.includes(e.id));

    const lineItems = [
      ...selectedTime.map((t) => ({
        id: 'li-' + t.id,
        type: 'TIME' as const,
        description: `${t.utbmsCode}: ${t.narrative}`,
        hours: t.hours,
        rate: t.rate,
        amount: t.writtenDownAmount !== undefined ? t.writtenDownAmount : t.total,
        timeEntryId: t.id,
      })),
      ...selectedExp.map((e) => ({
        id: 'li-' + e.id,
        type: 'EXPENSE' as const,
        description: `${e.category}: ${e.description}`,
        amount: e.amount,
        expenseId: e.id,
      })),
    ];

    const subtotal = lineItems.reduce((acc, li) => acc + li.amount, 0);
    const taxRate = 0.0825;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    const invoiceNumber = `INV-2026-${String(invoices.length + 1).padStart(4, '0')}`;
    const invoiceId = 'inv-' + (invoices.length + 1);

    const timeSubtotal = selectedTime.reduce(
      (acc, t) => acc + (t.writtenDownAmount !== undefined ? t.writtenDownAmount : t.total),
      0
    );
    const expSubtotal = selectedExp.reduce((acc, e) => acc + e.amount, 0);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      matterId,
      matterNumber: matter?.matterNumber || 'UNKNOWN',
      clientId: matter?.clientId || 'UNKNOWN',
      clientName: matter?.clientName || 'Client',
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'DRAFT',
      subtotalTime: timeSubtotal,
      subtotalExpenses: expSubtotal,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      lines: lineItems.map((li) => ({
        id: li.id,
        type: li.type,
        description: li.description,
        hours: 'hours' in li ? li.hours : undefined,
        rate: 'rate' in li ? li.rate : undefined,
        amount: li.amount,
        date: new Date().toISOString().split('T')[0],
      })),
      paymentTerms: 'Net 30 Days',
      notes: notes || 'Legal services rendered.',
      approvedBy: currentUser.name,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    setTimeEntries((prev) =>
      prev.map((t) => (timeEntryIds.includes(t.id) ? { ...t, invoiceId, status: 'INVOICED' } : t))
    );
    setExpenses((prev) =>
      prev.map((e) => (expenseIds.includes(e.id) ? { ...e, invoiceId, status: 'INVOICED' } : e))
    );

    logAudit(
      'INVOICE_ISSUED',
      'Invoice',
      invoiceId,
      `Draft Invoice ${invoiceNumber} created by ${currentUser.name} for ₹${totalAmount}`,
      matterId,
      matter?.matterNumber
    );

    return newInvoice;
  };

  const applyTrustToInvoice = (invoiceId: string, amount: number): boolean => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return false;

    const matterTrust = trustTransactions.filter((tx) => tx.matterId === inv.matterId);
    const currentBalance = matterTrust.reduce((sum, tx) => sum + tx.amount, 0);

    if (currentBalance < amount) {
      return false; // Insufficient trust funds
    }

    const txId = 'tx-' + (trustTransactions.length + 1);
    const newTx: TrustTransaction = {
      id: txId,
      matterId: inv.matterId,
      date: new Date().toISOString().split('T')[0],
      type: 'TRUST_APPLIED_TO_INVOICE',
      amount: -amount,
      runningBalance: currentBalance - amount,
      description: `Disbursement applied to Invoice #${inv.invoiceNumber}`,
      relatedInvoiceId: inv.id,
      authorizedBy: currentUser.name,
    };

    setTrustTransactions((prev) => [...prev, newTx]);

    const payId = 'pay-' + (payments.length + 1);
    const newPay: PaymentAllocation = {
      id: payId,
      invoiceId: inv.id,
      matterId: inv.matterId,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      method: 'Trust Transfer',
      reference: `IOLTA-DISBURSEMENT-${inv.invoiceNumber}`,
      recordedBy: currentUser.id,
    };

    setPayments((prev) => [...prev, newPay]);

    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id === invoiceId) {
          const newBalance = Math.max(0, i.balanceDue - amount);
          return {
            ...i,
            balanceDue: newBalance,
            status: newBalance === 0 ? 'PAID' : 'PART_PAID',
          };
        }
        return i;
      })
    );

    logAudit(
      'TRUST_APPLIED_TO_INVOICE',
      'Trust',
      txId,
      `Applied ₹${amount} from IOLTA Trust to Invoice #${inv.invoiceNumber}`,
      inv.matterId,
      inv.matterNumber
    );

    return true;
  };

  const recordDirectPayment = (
    invoiceId: string,
    amount: number,
    method: PaymentAllocation['method'],
    reference: string
  ) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const payId = 'pay-' + (payments.length + 1);
    const newPay: PaymentAllocation = {
      id: payId,
      invoiceId: inv.id,
      matterId: inv.matterId,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      method,
      reference,
      recordedBy: currentUser.id,
    };

    setPayments((prev) => [...prev, newPay]);

    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id === invoiceId) {
          const newBalance = Math.max(0, i.balanceDue - amount);
          return {
            ...i,
            balanceDue: newBalance,
            status: newBalance === 0 ? 'PAID' : 'PART_PAID',
          };
        }
        return i;
      })
    );
  };

  const depositTrust = (matterId: string, amount: number, notes: string) => {
    const matterTrust = trustTransactions.filter((tx) => tx.matterId === matterId);
    const currentBalance = matterTrust.reduce((sum, tx) => sum + tx.amount, 0);

    const txId = 'tx-' + (trustTransactions.length + 1);
    const newTx: TrustTransaction = {
      id: txId,
      matterId,
      date: new Date().toISOString().split('T')[0],
      type: 'RETAINER_DEPOSIT',
      amount,
      runningBalance: currentBalance + amount,
      description: notes || 'Client retainer deposit',
      authorizedBy: currentUser.name,
    };

    setTrustTransactions((prev) => [...prev, newTx]);
    const m = matters.find((item) => item.id === matterId);
    logAudit(
      'TRUST_DEPOSIT',
      'Trust',
      txId,
      `Retainer deposit of ₹${amount} received for Matter ${m?.matterNumber}`,
      matterId,
      m?.matterNumber
    );
  };

  const addTrustTransaction = (txData: Omit<TrustTransaction, 'id' | 'runningBalance'>) => {
    const matterTrust = trustTransactions.filter((tx) => tx.matterId === txData.matterId);
    const currentBalance = matterTrust.reduce((sum, tx) => sum + tx.amount, 0);

    const newTx: TrustTransaction = {
      ...txData,
      id: 'tx-' + (trustTransactions.length + 1),
      runningBalance: currentBalance + txData.amount,
    };

    setTrustTransactions((prev) => [...prev, newTx]);
  };

  const addDocument = (
    docData: Omit<VaultDocument, 'id' | 'createdAt' | 'currentVersion' | 'versions'> | VaultDocument
  ) => {
    if ('id' in docData && docData.id) {
      setDocuments((prev) => [docData as VaultDocument, ...prev.filter((d) => d.id !== docData.id)]);
      return;
    }
    const newDoc: VaultDocument = {
      ...docData,
      id: 'doc-' + (documents.length + 1),
      createdAt: new Date().toISOString().split('T')[0],
      currentVersion: 'v1.0',
      versions: [
        {
          versionNumber: 'v1.0',
          uploadedAt: new Date().toISOString().split('T')[0],
          uploadedBy: currentUser.name,
          fileSize: docData.fileSize,
          notes: 'Initial upload',
        },
      ],
    };
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const updateDocument = (docId: string, updates: Partial<VaultDocument>) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return { ...doc, ...updates };
        }
        return doc;
      })
    );
  };

  const deleteDocument = (docId: string): boolean => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return false;
    if (doc.isHeld) {
      logAudit(
        'SECURITY_ALERT',
        'Document',
        docId,
        `Attempted deletion of document "${doc.title}" blocked by active Litigation Preservation Hold. Custodian: ${currentUser.name}`,
        doc.matterId
      );
      return false;
    }

    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    const m = matters.find((item) => item.id === doc.matterId);
    logAudit(
      'DOCUMENT_DELETED',
      'Document',
      doc.id,
      `Document "${doc.title}" (${doc.fileName}) deleted from folder "${doc.folder}" by ${currentUser.name}`,
      doc.matterId,
      m?.matterNumber
    );
    return true;
  };

  const deleteDocuments = (docIds: string[]): { deletedCount: number; blockedCount: number } => {
    const toDeleteSet = new Set(docIds);
    let deletedCount = 0;
    let blockedCount = 0;
    const deletedTitles: string[] = [];

    const remaining = documents.filter((doc) => {
      if (toDeleteSet.has(doc.id)) {
        if (doc.isHeld) {
          blockedCount++;
          return true; // Keep held documents
        }
        deletedCount++;
        deletedTitles.push(doc.title);
        return false; // Remove permitted documents
      }
      return true;
    });

    setDocuments(remaining);

    if (deletedCount > 0) {
      logAudit(
        'DOCUMENTS_BULK_DELETED',
        'Document',
        'batch-purge',
        `Bulk deleted ${deletedCount} document(s) [${deletedTitles.slice(0, 3).join(', ')}${deletedTitles.length > 3 ? '...' : ''}] by ${currentUser.name}.${blockedCount > 0 ? ` ${blockedCount} items retained due to active Litigation Hold.` : ''}`
      );
    }
    if (blockedCount > 0) {
      logAudit(
        'SECURITY_ALERT',
        'Document',
        'batch-purge-hold-block',
        `Blocked deletion of ${blockedCount} item(s) protected by mandatory legal hold during bulk purge.`
      );
    }

    return { deletedCount, blockedCount };
  };

  const bulkMoveDocuments = (docIds: string[], targetFolder: string) => {
    const idSet = new Set(docIds);
    setDocuments((prev) =>
      prev.map((doc) => {
        if (idSet.has(doc.id)) {
          return { ...doc, folder: targetFolder as any };
        }
        return doc;
      })
    );

    logAudit(
      'DOCUMENTS_BULK_MOVED',
      'Document',
      targetFolder,
      `Moved ${docIds.length} document(s) to folder "${targetFolder}" by ${currentUser.name}`
    );
  };

  const bulkCopyDocuments = (docIds: string[], targetFolder: string) => {
    const idSet = new Set(docIds);
    const copies: VaultDocument[] = [];

    documents.forEach((doc) => {
      if (idSet.has(doc.id)) {
        const copyDoc: VaultDocument = {
          ...doc,
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: `${doc.title} (Copy)`,
          folder: targetFolder as any,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: currentUser.name,
          currentVersion: 'v1.0',
          versions: [
            {
              versionNumber: 'v1.0',
              uploadedAt: new Date().toISOString().split('T')[0],
              uploadedBy: currentUser.name,
              fileSize: doc.fileSize,
              notes: `Duplicate copy of ${doc.title}`,
            },
          ],
        };
        copies.push(copyDoc);
      }
    });

    if (copies.length > 0) {
      setDocuments((prev) => [...copies, ...prev]);
      logAudit(
        'DOCUMENTS_BULK_COPIED',
        'Document',
        targetFolder,
        `Duplicated and placed ${copies.length} document(s) into folder "${targetFolder}" by ${currentUser.name}`
      );
    }
  };

  const addDocumentVersion = (
    docId: string,
    versionData: {
      versionNumber?: string;
      notes?: string;
      fileSize?: string;
      fileName?: string;
      ocrExtractedText?: string;
      summary?: string;
    }
  ) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    // Calculate next version number (e.g. v1.1 -> v1.2, or v1.0 -> v1.1)
    let nextVer = versionData.versionNumber;
    if (!nextVer) {
      const match = (doc.currentVersion || 'v1.0').match(/v?(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10) + 1;
        nextVer = `v${major}.${minor}`;
      } else {
        nextVer = `v${(doc.versions?.length || 1) + 1}.0`;
      }
    }

    const newVersionObj: DocumentVersion = {
      versionNumber: nextVer,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      fileSize: versionData.fileSize || doc.fileSize,
      notes: versionData.notes || `Version update ${nextVer}`,
      fileName: versionData.fileName || doc.fileName,
      snapshotContent: versionData.ocrExtractedText || doc.ocrExtractedText,
      hash: 'sha256:' + Math.random().toString(36).substring(2, 12),
    };

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            currentVersion: nextVer!,
            fileSize: versionData.fileSize || d.fileSize,
            fileName: versionData.fileName || d.fileName,
            ocrExtractedText: versionData.ocrExtractedText || d.ocrExtractedText,
            summary: versionData.summary || d.summary,
            versions: [newVersionObj, ...(d.versions || [])],
          };
        }
        return d;
      })
    );

    const m = matters.find((item) => item.id === doc.matterId);
    logAudit(
      'DOCUMENT_MODIFIED',
      'Document',
      doc.id,
      `New version ${nextVer} uploaded for "${doc.title}" by ${currentUser.name}. Notes: ${versionData.notes || 'None'}`,
      doc.matterId,
      m?.matterNumber
    );
  };

  const revertDocumentVersion = (
    docId: string,
    targetVersionNumber: string,
    reason?: string
  ): boolean => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return false;

    const targetVer = doc.versions?.find((v) => v.versionNumber === targetVersionNumber);
    if (!targetVer) return false;

    // Calculate new active version (e.g. if current is v1.2, next is v2.0 or v1.3 with rollback note)
    const match = (doc.currentVersion || 'v1.0').match(/v?(\d+)\.(\d+)/);
    let nextVerNumber = '';
    if (match) {
      const major = parseInt(match[1], 10) + 1;
      nextVerNumber = `v${major}.0`;
    } else {
      nextVerNumber = `v${(doc.versions?.length || 1) + 1}.0`;
    }

    const revertVersionObj: DocumentVersion = {
      versionNumber: nextVerNumber,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      fileSize: targetVer.fileSize || doc.fileSize,
      notes: reason
        ? `Rollback to ${targetVersionNumber}: ${reason}`
        : `Reverted to previous version ${targetVersionNumber} ("${targetVer.notes || 'Original archive'}")`,
      revertedFrom: targetVersionNumber,
      snapshotContent: targetVer.snapshotContent || doc.ocrExtractedText,
      fileName: targetVer.fileName || doc.fileName,
      hash: targetVer.hash,
    };

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            currentVersion: nextVerNumber,
            fileSize: targetVer.fileSize || d.fileSize,
            fileName: targetVer.fileName || d.fileName,
            ocrExtractedText: targetVer.snapshotContent || d.ocrExtractedText,
            versions: [revertVersionObj, ...(d.versions || [])],
          };
        }
        return d;
      })
    );

    const m = matters.find((item) => item.id === doc.matterId);
    logAudit(
      'DOCUMENT_MODIFIED',
      'Document',
      doc.id,
      `Version rollback executed on "${doc.title}": reverted from ${doc.currentVersion} to ${targetVersionNumber} as ${nextVerNumber}. ${reason ? `Reason: ${reason}` : ''}`,
      doc.matterId,
      m?.matterNumber
    );

    return true;
  };

  const toggleEthicalWall = (ruleId: string) => {
    setEthicalWalls((prev) =>
      prev.map((w) => (w.id === ruleId ? { ...w, active: !w.active } : w))
    );
  };

  const addEthicalWall = (ruleData: Omit<EthicalWallRule, 'id'>) => {
    const newRule: EthicalWallRule = {
      ...ruleData,
      id: 'wall-' + (ethicalWalls.length + 1),
    };
    setEthicalWalls((prev) => [...prev, newRule]);
    logAudit(
      'ETHICAL_WALL_BLOCKED',
      'System',
      newRule.id,
      `Ethical screen erected isolating ${newRule.userName} from Matter ${newRule.matterNumber}`,
      newRule.matterId,
      newRule.matterNumber
    );
  };

  const createLegalHold = (
    holdData: Omit<LegalHold, 'id' | 'createdAt' | 'status' | 'tamperProofHash'>
  ) => {
    const newHold: LegalHold = {
      ...holdData,
      id: 'hold-' + (legalHolds.length + 1),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      tamperProofHash: 'sha256-' + Math.random().toString(36).substring(2, 12),
    };

    setLegalHolds((prev) => [...prev, newHold]);

    // Update matter active hold flag
    setMatters((prev) =>
      prev.map((m) => (m.id === holdData.matterId ? { ...m, hasActiveHold: true } : m))
    );

    // Lock all associated documents
    setDocuments((prev) =>
      prev.map((d) => (d.matterId === holdData.matterId ? { ...d, isHeld: true } : d))
    );

    const m = matters.find((item) => item.id === holdData.matterId);
    logAudit(
      'LEGAL_HOLD_CREATED',
      'LegalHold',
      newHold.id,
      `Legal Hold "${newHold.holdTitle}" issued by ${currentUser.name} across ${newHold.custodians.length} custodians`,
      holdData.matterId,
      m?.matterNumber
    );
  };

  const requestReleaseLegalHold = (
    holdId: string,
    secondApproverId: string,
    justification: string
  ) => {
    setLegalHolds((prev) =>
      prev.map((h) => {
        if (h.id === holdId) {
          return {
            ...h,
            status: 'PENDING_RELEASE',
            secondApproverId,
            releaseJustification: justification,
          };
        }
        return h;
      })
    );
  };

  const approveLegalHoldRelease = (holdId: string) => {
    const hold = legalHolds.find((h) => h.id === holdId);
    if (!hold) return;

    setLegalHolds((prev) =>
      prev.map((h) => (h.id === holdId ? { ...h, status: 'RELEASED' } : h))
    );

    // If no other active holds on matter, unlock matter & docs
    const remainingActive = legalHolds.filter(
      (h) => h.matterId === hold.matterId && h.id !== holdId && h.status === 'ACTIVE'
    );

    if (remainingActive.length === 0) {
      setMatters((prev) =>
        prev.map((m) => (m.id === hold.matterId ? { ...m, hasActiveHold: false } : m))
      );
      setDocuments((prev) =>
        prev.map((d) => (d.matterId === hold.matterId ? { ...d, isHeld: false } : d))
      );
    }

    const m = matters.find((item) => item.id === hold.matterId);
    logAudit(
      'LEGAL_HOLD_RELEASED',
      'LegalHold',
      holdId,
      `Dual-authorized release of Legal Hold "${hold.holdTitle}" approved by ${currentUser.name}`,
      hold.matterId,
      m?.matterNumber
    );
  };

  const addTask = (taskData: Omit<MatterTask, 'id'>) => {
    const newTask: MatterTask = {
      ...taskData,
      id: 'task-' + (tasks.length + 1),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const addChronology = (itemData: Omit<ChronologyEvent, 'id'>) => {
    const newItem: ChronologyEvent = {
      ...itemData,
      id: 'chrono-' + (chronology.length + 1),
    };
    setChronology((prev) => [...prev, newItem]);
  };

  // Timer actions
  const startTimer = (matterId?: string) => {
    if (matterId) setTimerMatterId(matterId);
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const saveTimerEntry = () => {
    if (timerSeconds < 30) {
      alert('Time entries must be at least 30 seconds.');
      return;
    }
    const hours = Math.round((timerSeconds / 3600) * 10) / 10 || 0.1;
    const rate = currentUser.billingRate || 450;
    const total = Math.round(hours * rate);

    addTimeEntry({
      matterId: timerMatterId,
      userId: currentUser.id,
      userName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      hours,
      rate,
      total,
      utbmsCode: timerUtbms,
      narrative: timerNarrative || 'Professional legal services rendered.',
    });

    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerNarrative('');
  };

  const discardTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerNarrative('');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isAuthenticated,
        login,
        logout,

        tenants,
        currentTenantId,
        currentTenant,
        setCurrentTenantId,
        updateTenant,
        addTenant,
        regenerateLicenseKey,
        toggleTenantFeature,
        licensePlans,
        updateLicensePlan,
        addLicensePlan,

        currentUser,
        setCurrentUser,
        users,
        firmUsers,
        addFirmUser,
        updateFirmUser,
        toggleUserStatus,
        rolePermissions,
        updateRolePermission,
        resetRolePermissions,

        currentView,
        setCurrentView,
        activeMatterId,
        setActiveMatterId,
        matterSubTab,
        setMatterSubTab,

        matters,
        clients,
        documents,
        timeEntries,
        expenses,
        invoices,
        payments,
        trustTransactions,
        legalHolds,
        ethicalWalls,
        chronology,
        tasks,
        parties,
        auditLog,
        auditLogs: auditLog,
        audit_events: auditLog,
        setAuditLog,

        isTimerRunning,
        timerSeconds,
        timerMatterId,
        timerNarrative,
        timerUtbms,
        startTimer,
        pauseTimer,
        setTimerMatterId,
        setTimerNarrative,
        setTimerUtbms,
        saveTimerEntry,
        discardTimer,

        openMatter,
        addMatter,
        addTimeEntry,
        updateTimeEntryStatus,
        addExpense,
        createInvoiceFromWip,
        applyTrustToInvoice,
        recordDirectPayment,
        depositTrust,
        addTrustTransaction,
        addDocument,
        updateDocument,
        deleteDocument,
        deleteDocuments,
        bulkMoveDocuments,
        bulkCopyDocuments,
        addDocumentVersion,
        revertDocumentVersion,
        toggleEthicalWall,
        addEthicalWall,
        createLegalHold,
        requestReleaseLegalHold,
        approveLegalHoldRelease,
        addTask,
        addChronology,
        logAudit,

        isUploadModalOpen,
        uploadModalMatterId,
        uploadModalFolder,
        openUploadModal,
        closeUploadModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
