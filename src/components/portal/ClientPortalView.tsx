import React, { useState } from 'react';
import {
  AlertCircle,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileCheck,
  FileCheck2,
  FileText,
  FolderLock,
  Globe,
  HardDrive,
  History,
  IndianRupee,
  KeyRound,
  Landmark,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateMatterFinancials, formatCurrency } from '../../services/financials';
import { ClientCredential, Invoice, VaultDocument } from '../../types';

// Pre-configured client credentials for the portal
const DEMO_CLIENT_CREDENTIALS: ClientCredential[] = [
  {
    id: 'cred-1',
    clientId: 'client-1',
    clientName: 'Apex Dynamics Corp.',
    email: 'sjenkins@apexdynamics.io',
    name: 'Sarah Jenkins',
    title: 'General Counsel & VP of Legal',
    passwordHint: 'Apex2026! (Auto-filled)',
    twoFactorEnabled: true,
  },
  {
    id: 'cred-2',
    clientId: 'client-2',
    clientName: 'Nexus Robotics Inc.',
    email: 'mroth@nexusrobotics.ai',
    name: 'Michael Roth',
    title: 'Chief Financial Officer',
    passwordHint: 'NexusEscrow#88 (Auto-filled)',
    twoFactorEnabled: true,
  },
];

export const ClientPortalView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    clients,
    matters,
    invoices,
    timeEntries,
    expenses,
    payments,
    trustTransactions,
    documents,
    tasks,
    recordDirectPayment,
    addTrustTransaction,
    addDocument,
    logAudit,
  } = useApp();

  // Client Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    currentUser.role === 'CLIENT_PORTAL' || currentUser.role === 'CLIENT_CONTACT'
  );
  const [authEmail, setAuthEmail] = useState<string>(DEMO_CLIENT_CREDENTIALS[0].email);
  const [authPassword, setAuthPassword] = useState<string>('Apex2026!');
  const [auth2FaCode, setAuth2FaCode] = useState<string>('849201');
  const [authError, setAuthError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'matters' | 'documents' | 'billing' | 'trust'>(
    'overview'
  );

  // Modals
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'ACH' | 'WIRE'>('CARD');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<{
    reference: string;
    invoiceNumber: string;
    amount: number;
    method: string;
    date: string;
  } | null>(null);

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadMatterId, setUploadMatterId] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadFolder, setUploadFolder] = useState<VaultDocument['folder']>('Correspondence');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('Disclosures_Exhibit_Signed.pdf');
  const [uploadConfidentiality, setUploadConfidentiality] = useState<VaultDocument['confidentialityLevel']>(
    'Firm Confidential'
  );

  const [showReplenishModal, setShowReplenishModal] = useState<boolean>(false);
  const [replenishMatterId, setReplenishMatterId] = useState<string>('');
  const [replenishAmount, setReplenishAmount] = useState<number>(25000);

  // Resolve current active client
  const activeCredential =
    DEMO_CLIENT_CREDENTIALS.find((c) => c.email === authEmail) || DEMO_CLIENT_CREDENTIALS[0];

  const client =
    clients.find((c) => c.id === activeCredential.clientId) || clients[0];

  // Filter matters strictly belonging to this client entity (RBAC security boundary)
  const clientMatters = matters.filter((m) => m.clientId === client.id);

  // Client tasks / upcoming deadlines
  const clientTasks = tasks.filter((t) =>
    clientMatters.some((m) => m.id === t.matterId)
  );
  const upcomingDeadlines = clientTasks
    .filter((t) => t.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Client invoices
  const clientInvoices = invoices.filter((i) =>
    clientMatters.some((m) => m.id === i.matterId)
  );
  const unpaidInvoices = clientInvoices.filter((i) => i.balanceDue > 0);

  // Client shared documents
  const clientDocs = documents.filter((d) =>
    clientMatters.some((m) => m.id === d.matterId)
  );

  // Aggregate client financials
  let totalBilled = 0;
  let totalPaid = 0;
  let totalTrust = 0;
  let totalEvergreenMinimum = 0;

  clientMatters.forEach((m) => {
    const f = calculateMatterFinancials(
      m.id,
      timeEntries,
      expenses,
      invoices,
      payments,
      trustTransactions
    );
    totalBilled += f.billed;
    totalPaid += f.paid;
    totalTrust += f.trustBalance;
    totalEvergreenMinimum += m.evergreenTrustMinimum || 0;
  });

  const totalOutstandingAr = Math.max(0, totalBilled - totalPaid);

  // Client Login Handler
  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const matched = DEMO_CLIENT_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === authEmail.toLowerCase().trim()
    );

    if (!matched) {
      setAuthError('Invalid credentials. Please select one of the authorized institutional client accounts.');
      return;
    }

    // Set authenticated client persona
    setIsAuthenticated(true);
    logAudit(
      'MATTER_ACCESS_GRANTED',
      'ClientPortal',
      matched.clientId,
      `Client General Counsel ${matched.name} (${matched.clientName}) authenticated to Client Portal with 2FA.`
    );
  };

  const handleClientLogout = () => {
    setIsAuthenticated(false);
  };

  // Secure Payment Gateway Execution
  const handleAuthorizePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || payAmount <= 0) return;

    const ref = `PORTAL-${paymentMethod}-${Date.now().toString().slice(-6)}`;
    const methodLabel =
      paymentMethod === 'CARD'
        ? 'Credit Card'
        : paymentMethod === 'ACH'
        ? 'ACH'
        : 'Wire';

    recordDirectPayment(payingInvoice.id, payAmount, methodLabel, ref);

    setPaymentSuccessReceipt({
      reference: ref,
      invoiceNumber: payingInvoice.invoiceNumber,
      amount: payAmount,
      method: methodLabel,
      date: new Date().toISOString().split('T')[0],
    });

    setPayingInvoice(null);
  };

  // Secure Document Download
  const handleDownloadDocument = (doc: VaultDocument) => {
    const matter = matters.find((m) => m.id === doc.matterId);
    logAudit(
      'DOCUMENT_DOWNLOADED_WATERMARKED',
      'Document',
      doc.id,
      `Client ${activeCredential.name} downloaded shared file "${doc.fileName}". Embedded cryptographic watermark: CLIENT-PORTAL-${activeCredential.clientId}.`,
      doc.matterId,
      matter?.matterNumber
    );

    // Simulated file download
    const blob = new Blob(
      [
        `VANCE & STERLING LLP — CONFIDENTIAL CLIENT WORK PRODUCT\n` +
          `File: ${doc.fileName}\n` +
          `Document Title: ${doc.title}\n` +
          `Matter Reference: ${matter?.matterNumber || 'N/A'}\n` +
          `Authorized Recipient: ${activeCredential.name} (${activeCredential.clientName})\n` +
          `Timestamp: ${new Date().toISOString()}\n` +
          `Security Watermark: ${doc.confidentialityLevel} [ENCRYPTED SHA-256]\n\n` +
          `EXTRACTED DOCUMENT CONTENT:\n${doc.ocrExtractedText || doc.summary || 'Official filing version on record.'}`,
      ],
      { type: 'text/plain' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.fileName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Client Document Upload
  const handleClientUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMatter = clientMatters.find((m) => m.id === uploadMatterId) || clientMatters[0];
    if (!targetMatter || !uploadTitle) return;

    addDocument({
      matterId: targetMatter.id,
      folder: uploadFolder,
      title: uploadTitle,
      fileName: uploadFileName,
      fileType: 'pdf',
      fileSize: `${(Math.random() * 2 + 0.4).toFixed(1)} MB`,
      createdBy: `${activeCredential.name} (Client)`,
      isHeld: false,
      ocrExtractedText: `Client uploaded production: ${uploadNotes || uploadTitle}. Transmitted via secure TLS 1.3 portal link.`,
      tags: ['Client Upload', uploadFolder, 'Disclosures'],
      confidentialityLevel: uploadConfidentiality,
      summary: uploadNotes || 'Client uploaded disclosure document for attorney review.',
    });

    setShowUploadModal(false);
    setUploadTitle('');
    setUploadNotes('');
  };

  // Retainer Replenishment
  const handleReplenishTrust = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMatter = clientMatters.find((m) => m.id === replenishMatterId) || clientMatters[0];
    if (!targetMatter || replenishAmount <= 0) return;

    const ref = `IOLTA-WIRE-${Math.floor(100000 + Math.random() * 900000)}`;
    addTrustTransaction({
      matterId: targetMatter.id,
      date: new Date().toISOString().split('T')[0],
      type: 'DEPOSIT',
      amount: replenishAmount,
      description: 'Client portal electronic wire retainer deposit',
      reference: ref,
      cleared: true,
      recordedBy: `${activeCredential.name} (Client Portal)`,
      authorizedBy: activeCredential.name,
    });

    setShowReplenishModal(false);
  };

  // -------------------------------------------------------------
  // Unauthenticated Login Screen
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <h1 className="font-legal-heading text-xl font-bold text-slate-100">
              Vance & Sterling LLP
            </h1>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Institutional Client Portal
            </p>
            <p className="text-xs text-slate-400">
              Secure, end-to-end encrypted access to matters, court filings, and fiduciary trust accounts.
            </p>
          </div>

          {/* Demo Account Quick Switcher */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
              Authorized Institutional Profiles (Click to Load)
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_CLIENT_CREDENTIALS.map((cred) => (
                <button
                  key={cred.id}
                  type="button"
                  onClick={() => {
                    setAuthEmail(cred.email);
                    setAuthPassword(cred.id === 'cred-1' ? 'Apex2026!' : 'NexusEscrow#88');
                    setAuthError('');
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all border ${
                    authEmail === cred.email
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-200">{cred.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {cred.clientName} · {cred.title}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/80">Select</span>
                </button>
              ))}
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleClientLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Corporate Email Address
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Two-Factor Token (MFA)
                </label>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> TOTP Active
                </span>
              </div>
              <input
                type="text"
                required
                value={auth2FaCode}
                onChange={(e) => setAuth2FaCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/50 text-center tracking-widest text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Authenticate to Secure Portal</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center justify-center gap-3">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> TLS 1.3 256-Bit
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-400" /> SOC2 Type II
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-purple-400" /> PCI-DSS L1
              </span>
            </div>
            <div>Protected by institutional single-client RBAC boundaries.</div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Authenticated Client Dashboard
  // -------------------------------------------------------------
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950">
      {/* Client Identity Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">{client.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono font-semibold">
                Client Portal Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <strong className="text-slate-200">{activeCredential.name}</strong> (
              {activeCredential.title}) · {activeCredential.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setUploadMatterId(clientMatters[0]?.id || '');
              setShowUploadModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => {
              setReplenishMatterId(clientMatters[0]?.id || '');
              setShowReplenishModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-800/60 text-xs font-semibold text-sky-300 hover:bg-sky-900/60 transition-colors"
          >
            <Landmark className="w-3.5 h-3.5 text-sky-400" />
            <span>Replenish Retainer</span>
          </button>
          <button
            onClick={handleClientLogout}
            title="Log out of Client Portal"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Matters */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Retained Matters</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-num text-slate-100">
            {clientMatters.length}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {clientMatters.filter((m) => m.status === 'ACTIVE' || m.status === 'MATTER_OPEN').length} active litigation files
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Outstanding A/R</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-num text-emerald-400">
            {formatCurrency(totalOutstandingAr)}
          </div>
          <div className="text-[11px] text-slate-400">
            {unpaidInvoices.length} unpaid bill{unpaidInvoices.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Fiduciary IOLTA Trust Balance */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Escrow Trust Balance</span>
            <Landmark className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-num text-sky-300">
            {formatCurrency(totalTrust)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            {totalTrust >= totalEvergreenMinimum ? (
              <span className="text-emerald-400">● Evergreen buffer healthy</span>
            ) : (
              <span className="text-amber-400">● Replenishment recommended</span>
            )}
          </div>
        </div>

        {/* Upcoming Court Deadlines */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Next Calendar Deadline</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 truncate">
            {upcomingDeadlines[0]?.title || 'No pending deadlines'}
          </div>
          <div className="text-[11px] text-purple-300 font-mono">
            {upcomingDeadlines[0] ? `Due: ${upcomingDeadlines[0].dueDate}` : 'Dockets current'}
          </div>
        </div>
      </div>

      {/* Payment Success Digital Receipt Banner */}
      {paymentSuccessReceipt && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between gap-4 text-xs text-emerald-200 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-300">
                Payment Authorized & Applied: {formatCurrency(paymentSuccessReceipt.amount)}
              </div>
              <div className="text-[11px] text-emerald-400/90 font-mono">
                Invoice {paymentSuccessReceipt.invoiceNumber} · Ref: {paymentSuccessReceipt.reference} · Method: {paymentSuccessReceipt.method}
              </div>
            </div>
          </div>
          <button
            onClick={() => setPaymentSuccessReceipt(null)}
            className="text-emerald-400 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Deadlines
        </button>
        <button
          onClick={() => setActiveTab('matters')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'matters'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Matters ({clientMatters.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'documents'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Shared Documents & Disclosures ({clientDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'billing'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Invoices & Payments ({clientInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('trust')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'trust'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          IOLTA Escrow Trust ({formatCurrency(totalTrust)})
        </button>
      </div>

      {/* Tab 1: Overview & Deadlines */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Deadlines & Court Filings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Upcoming Court Dates & Statutory Deadlines
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {upcomingDeadlines.length} Pending
              </span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center italic">
                No pending court hearings or discovery cutoff deadlines.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.slice(0, 5).map((task) => {
                  const targetMatter = clientMatters.find((m) => m.id === task.matterId);
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          <span>{task.title}</span>
                          {task.courtMandated && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800/60 font-mono">
                              Court Order
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {targetMatter ? `${targetMatter.matterNumber} — ${targetMatter.title}` : ''}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-amber-400 font-semibold text-xs">
                          {task.dueDate}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outstanding Invoices Quick Settle */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Outstanding Invoices Awaiting Settlement
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                {formatCurrency(totalOutstandingAr)} Due
              </span>
            </div>

            {unpaidInvoices.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center italic">
                All client invoices are fully paid and settled.
              </div>
            ) : (
              <div className="space-y-2.5">
                {unpaidInvoices.map((inv) => {
                  const targetMatter = clientMatters.find((m) => m.id === inv.matterId);
                  return (
                    <div
                      key={inv.id}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-300">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Due: {inv.dueDate}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {targetMatter?.title}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-num font-bold text-slate-100">
                            {formatCurrency(inv.balanceDue)}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {inv.status}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setPayingInvoice(inv);
                            setPayAmount(inv.balanceDue);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
                        >
                          Pay Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Active Matters */}
      {activeTab === 'matters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientMatters.map((m) => {
            const f = calculateMatterFinancials(
              m.id,
              timeEntries,
              expenses,
              invoices,
              payments,
              trustTransactions
            );

            return (
              <div
                key={m.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3.5 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {m.matterNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {m.practiceArea}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                    {m.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100">{m.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Forum / Jurisdiction:</span>
                    <span>{m.courtVenue || 'Commercial Arbitration'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Docket Reference:</span>
                    <span className="font-mono">{m.caseDocketNumber || 'Pre-Litigation'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Escrow Trust Ledger:</span>
                    <span className="font-num text-sky-400 font-semibold">
                      {formatCurrency(f.trustBalance)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Shared Documents & Disclosures */}
      {activeTab === 'documents' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Shared Filings, Evidence & Client Disclosures
              </h3>
              <p className="text-xs text-slate-400">
                Authorized documents available for cryptographic watermarked download.
              </p>
            </div>
            <button
              onClick={() => {
                setUploadMatterId(clientMatters[0]?.id || '');
                setShowUploadModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-mono uppercase">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Matter</th>
                  <th className="py-3 px-3">Folder</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Confidentiality</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {clientDocs.map((doc) => {
                  const targetMatter = clientMatters.find((m) => m.id === doc.matterId);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-100">{doc.title}</span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {doc.fileName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {targetMatter?.matterNumber}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{doc.folder}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{doc.fileSize}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {doc.confidentialityLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Invoices & Payments */}
      {activeTab === 'billing' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Billing Statements & A/R Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Standard single-matter billing statements compliant with UTBMS and LEDES 1998B standards.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Total Balance Outstanding</span>
              <span className="font-num font-bold text-sm text-emerald-400">
                {formatCurrency(totalOutstandingAr)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-mono uppercase">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Matter</th>
                  <th className="py-3 px-3">Issued Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {clientInvoices.map((inv) => {
                  const targetMatter = clientMatters.find((m) => m.id === inv.matterId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {targetMatter?.matterNumber}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{inv.issuedDate}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{inv.dueDate}</td>
                      <td className="py-3 px-3 text-right font-num text-slate-200">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-num font-bold text-emerald-400">
                        {formatCurrency(inv.balanceDue)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                              : 'bg-amber-950/60 border-amber-800/60 text-amber-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.balanceDue > 0 ? (
                          <button
                            onClick={() => {
                              setPayingInvoice(inv);
                              setPayAmount(inv.balanceDue);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors"
                          >
                            Pay Online
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-xs font-medium">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: IOLTA Trust Escrow */}
      {activeTab === 'trust' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-sky-400" />
                Segregated Client Escrow Trust Accounts (IOLTA)
              </h3>
              <p className="text-xs text-slate-400">
                Strict segregation under State Bar Rule 1.15. Retainer funds remain client property until earned.
              </p>
            </div>
            <button
              onClick={() => {
                setReplenishMatterId(clientMatters[0]?.id || '');
                setShowReplenishModal(true);
              }}
              className="px-3 py-1.5 bg-sky-600 text-white font-semibold text-xs rounded-lg hover:bg-sky-500 transition-colors shadow-sm"
            >
              Replenish Retainer Deposit
            </button>
          </div>

          <div className="space-y-3">
            {clientMatters.map((m) => {
              const matterTxs = trustTransactions.filter((t) => t.matterId === m.id);
              const balance = matterTxs.reduce((sum, t) => sum + t.amount, 0);
              const minimum = m.evergreenTrustMinimum || 0;

              return (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {m.matterNumber}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{m.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Escrow Ref: Chase Bank IOLTA Trust Account #***-9182
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold font-num text-sky-300">
                        {formatCurrency(balance)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Evergreen Threshold: {formatCurrency(minimum)}
                      </span>
                    </div>
                  </div>

                  {/* Transaction History for Matter */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Recent Escrow Transactions
                    </span>
                    {matterTxs.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">No transactions recorded.</div>
                    ) : (
                      matterTxs.slice(-3).reverse().map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-900/60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-mono">{tx.date}</span>
                            <span className="text-slate-200">{tx.description}</span>
                          </div>
                          <span
                            className={`font-num font-semibold ${
                              tx.amount > 0 ? 'text-emerald-400' : 'text-slate-300'
                            }`}
                          >
                            {tx.amount > 0 ? '+' : ''}
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          Modal: Secure Payment Gateway
         ------------------------------------------------------------- */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Secure Payment Gateway (LawPay / Stripe)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Settling Invoice {payingInvoice.invoiceNumber} · Matter {payingInvoice.matterNumber || 'Litigation'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                PCI-DSS Level 1
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Credit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('ACH')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'ACH'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>ACH Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('WIRE')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'WIRE'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Direct Wire</span>
              </button>
            </div>

            <form onSubmit={handleAuthorizePayment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Payment Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingInvoice.balanceDue}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-num font-bold text-emerald-300 focus:outline-none focus:border-emerald-500/50"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Remaining Invoice Balance: {formatCurrency(payingInvoice.balanceDue)}
                </span>
              </div>

              {paymentMethod === 'CARD' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      required
                      defaultValue="4242 •••• •••• 9102"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Exp Date
                      </label>
                      <input
                        type="text"
                        required
                        defaultValue="09/28"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        CVC Security Code
                      </label>
                      <input
                        type="text"
                        required
                        defaultValue="819"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === 'ACH' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Bank Routing Number (ABA 9-Digit)
                    </label>
                    <input
                      type="text"
                      required
                      defaultValue="021000021"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Checking Account Number
                    </label>
                    <input
                      type="text"
                      required
                      defaultValue="8941029410"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'WIRE' && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1 leading-relaxed">
                  <div className="font-semibold text-slate-100">Vance & Sterling Operating Account</div>
                  <div>Bank: JPMorgan Chase Bank, N.A.</div>
                  <div>ABA Routing: 021000021</div>
                  <div>Account: 9481029410</div>
                  <div>Remittance Code: INV-{payingInvoice.invoiceNumber}</div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Authorize Payment ({formatCurrency(payAmount)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          Modal: Upload Client Document
         ------------------------------------------------------------- */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                Transmit Document to Legal Team
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Encrypted TLS</span>
            </div>

            <form onSubmit={handleClientUpload} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target Matter
                </label>
                <select
                  value={uploadMatterId}
                  onChange={(e) => setUploadMatterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                >
                  {clientMatters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.matterNumber} — {m.title.slice(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Commercial Contract Amendments"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Folder Category
                  </label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value as VaultDocument['folder'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="Correspondence">Correspondence</option>
                    <option value="Discovery">Discovery</option>
                    <option value="Contracts">Contracts</option>
                    <option value="Exhibits">Exhibits</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Notes & Context for Counsel
                </label>
                <textarea
                  rows={2}
                  placeholder="Context regarding document origin or confidentiality..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition-colors shadow-md"
                >
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          Modal: Replenish Escrow Retainer
         ------------------------------------------------------------- */}
      {showReplenishModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-sky-400" />
                Replenish Escrow Retainer Deposit
              </h3>
              <span className="text-[10px] text-sky-400 font-mono">Segregated IOLTA</span>
            </div>

            <form onSubmit={handleReplenishTrust} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target Matter
                </label>
                <select
                  value={replenishMatterId}
                  onChange={(e) => setReplenishMatterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  {clientMatters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.matterNumber} — {m.title.slice(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Deposit Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={replenishAmount}
                  onChange={(e) => setReplenishAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-num font-bold text-sky-300 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
                Funds deposited will be credited immediately to Vance & Sterling LLP's segregated
                IOLTA Escrow Trust Account. An automated electronic receipt will be generated.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplenishModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors shadow-md"
                >
                  Confirm Wire Deposit ({formatCurrency(replenishAmount)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
