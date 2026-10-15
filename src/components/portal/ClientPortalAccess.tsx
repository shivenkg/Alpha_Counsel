import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileLock2,
  FileText,
  Filter,
  Globe,
  HardDrive,
  History,
  KeyRound,
  Link,
  Lock,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
  User,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientPortalShare, Matter, VaultDocument } from '../../types';

interface ClientPortalAccessProps {
  matter?: Matter;
  preselectedDocId?: string;
  onClose?: () => void;
  embedded?: boolean;
}

export const ClientPortalAccess: React.FC<ClientPortalAccessProps> = ({
  matter: propMatter,
  preselectedDocId,
  onClose,
  embedded = false,
}) => {
  const {
    matters,
    activeMatterId,
    documents,
    clients,
    currentUser,
    clientPortalShares,
    createPortalShare,
    revokePortalShare,
    extendPortalShare,
    theme,
    ethicalWalls,
  } = useApp();

  const isDark = theme === 'dark';

  // Resolved active matter
  const activeMatter =
    propMatter || matters.find((m) => m.id === activeMatterId) || matters[0];

  // Documents belonging to this matter
  const matterDocs = useMemo(() => {
    return documents.filter((d) => d.matterId === activeMatter?.id);
  }, [documents, activeMatter?.id]);

  // Shares for this matter
  const activeShares = useMemo(() => {
    return clientPortalShares.filter((s) => s.matterId === activeMatter?.id);
  }, [clientPortalShares, activeMatter?.id]);

  // View Mode: 'create' or 'active-shares'
  const [activeTab, setActiveTab] = useState<'create' | 'shares'>(
    preselectedDocId ? 'create' : activeShares.length > 0 ? 'shares' : 'create'
  );

  // Form State: Document Selection
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(() => {
    if (preselectedDocId && matterDocs.some((d) => d.id === preselectedDocId)) {
      return [preselectedDocId];
    }
    return matterDocs.slice(0, 1).map((d) => d.id);
  });

  // Form State: Recipient Contact
  const [recipientType, setRecipientType] = useState<'existing' | 'new'>('existing');
  const [selectedContactEmail, setSelectedContactEmail] = useState<string>('sjenkins@apexdynamics.io');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactCompany, setNewContactCompany] = useState(activeMatter?.clientName || '');
  const [newContactTitle, setNewContactTitle] = useState('Outside Legal Counsel');
  const [shareNotes, setShareNotes] = useState('');

  // Form State: Expiration Settings
  const [durationHours, setDurationHours] = useState<number>(72);
  const [customDays, setCustomDays] = useState<number>(3);
  const [maxAccessLimit, setMaxAccessLimit] = useState<number>(10);
  const [isSingleUse, setIsSingleUse] = useState<boolean>(false);

  // Form State: Security Settings
  const [permissionScope, setPermissionScope] = useState<ClientPortalShare['permissionScope']>(
    'VIEW_DOWNLOAD_WATERMARKED'
  );
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true);
  const [pinProtected, setPinProtected] = useState<boolean>(true);
  const [customPin, setCustomPin] = useState<string>('849201');

  // Success Feedback
  const [newlyCreatedShare, setNewlyCreatedShare] = useState<ClientPortalShare | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [inspectAuditShare, setInspectAuditShare] = useState<ClientPortalShare | null>(null);

  // Toggle document selection
  const handleToggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  // Pre-configured Known Client Contacts
  const knownClientContacts = useMemo(() => {
    return [
      {
        name: 'Sarah Jenkins',
        email: 'sjenkins@apexdynamics.io',
        company: 'Apex Dynamics Corp.',
        title: 'General Counsel & VP Legal',
      },
      {
        name: 'Michael Roth',
        email: 'mroth@nexusrobotics.ai',
        company: 'Nexus Robotics Inc.',
        title: 'Chief Financial Officer',
      },
      {
        name: 'Vikram Malhotra',
        email: 'vmalhotra@indusfin.com',
        company: 'Indus FinTech Global',
        title: 'Managing Director & Legal Custodian',
      },
      {
        name: 'David Sterling',
        email: 'dsterling@techinvest.vc',
        company: 'Sterling Capital Partners',
        title: 'Lead Partner, Corporate Due Diligence',
      },
    ];
  }, []);

  // Handle Share Creation Submit
  const handleCreateShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocIds.length === 0) {
      alert('Please select at least one matter document to share.');
      return;
    }

    const selectedDocs = matterDocs.filter((d) => selectedDocIds.includes(d.id));
    const docTitles = selectedDocs.map((d) => d.title);

    let contactName = '';
    let contactEmail = '';
    let contactCompany = activeMatter.clientName;

    if (recipientType === 'existing') {
      const found = knownClientContacts.find((c) => c.email === selectedContactEmail);
      contactName = found ? found.name : 'Client Contact';
      contactEmail = selectedContactEmail;
      contactCompany = found?.company || activeMatter.clientName;
    } else {
      if (!newContactEmail || !newContactName) {
        alert('Please provide contact name and valid email.');
        return;
      }
      contactName = newContactName;
      contactEmail = newContactEmail;
      contactCompany = newContactCompany;
    }

    // Calculate Expiry ISO
    const hours = durationHours === -1 ? customDays * 24 : durationHours;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    const created = createPortalShare({
      matterId: activeMatter.id,
      matterNumber: activeMatter.matterNumber,
      documentIds: selectedDocIds,
      documentTitles: docTitles,
      recipientContactName: contactName,
      recipientEmail: contactEmail,
      recipientCompany: contactCompany,
      clientId: activeMatter.clientId,
      createdBy: currentUser.name,
      expiresAt,
      durationHours: hours,
      maxAccessLimit: isSingleUse ? 1 : maxAccessLimit,
      permissionScope,
      watermarkEnabled,
      pinProtected,
      accessPin: pinProtected ? customPin || '123456' : undefined,
      notes: shareNotes || `Shared for client review on ${new Date().toLocaleDateString()}`,
    });

    setNewlyCreatedShare(created);
    setActiveTab('shares');
  };

  // Helper: Copy share URL
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedShareId(id);
    setTimeout(() => setCopiedShareId(null), 2000);
  };

  // Helper: Format countdown
  const getExpiryCountdown = (expiresAt: string, status: ClientPortalShare['status']) => {
    if (status === 'REVOKED') {
      return { text: 'REVOKED', color: 'text-red-400 bg-red-950/60 border-red-800/60' };
    }
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0 || status === 'EXPIRED') {
      return { text: 'EXPIRED', color: 'text-slate-400 bg-slate-900 border-slate-700' };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return {
        text: `Expires in ${diffHours}h`,
        color: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
      };
    }
    return {
      text: `Expires in ${diffDays}d ${diffHours % 24}h`,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
    };
  };

  return (
    <div
      className={`space-y-6 ${
        embedded
          ? ''
          : isDark
          ? 'p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl'
          : 'p-6 bg-white border border-slate-200 rounded-3xl shadow-xl'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">
            <Share2 className="w-4 h-4" />
            <span>Secure Client Portal Document Gateway</span>
          </div>
          <h3
            className={`text-xl font-bold tracking-tight flex items-center gap-2.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <span>Client Portal Access & Expiration Settings</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono border font-semibold ${
                isDark
                  ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              Matter {activeMatter.matterNumber}
            </span>
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Securely grant time-limited, forensic watermarked access to authorized external corporate client contacts and outside co-counsel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div
            className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setActiveTab('shares')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'shares'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Active Shares ({activeShares.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share New Documents</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Success Notification if link just created */}
      {newlyCreatedShare && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-white text-xs">
                Portal Access Link Generated Successfully!
              </div>
              <div className="text-[11px] text-emerald-300/90 truncate">
                Shared {newlyCreatedShare.documentTitles.length} document(s) with {newlyCreatedShare.recipientContactName} ({newlyCreatedShare.recipientEmail}).
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="font-mono text-[11px] bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 select-all max-w-[200px] truncate">
              {newlyCreatedShare.shareUrl}
            </div>

            <button
              onClick={() => handleCopyLink(newlyCreatedShare.shareUrl, newlyCreatedShare.id)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              {copiedShareId === newlyCreatedShare.id ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => setNewlyCreatedShare(null)}
              className="text-emerald-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: CREATE NEW PORTAL SHARE */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateShare} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Columns: Document Selection */}
            <div
              className={`lg:col-span-6 rounded-2xl p-5 border space-y-4 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2 border-slate-800/60">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Select Matter Vault Documents
                  </span>
                </div>
                <span className="text-[11px] text-blue-400 font-bold">
                  {selectedDocIds.length} Selected
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {matterDocs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No documents currently found in Matter Vault.
                  </div>
                ) : (
                  matterDocs.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleToggleDoc(doc.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? isDark
                              ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/40 text-white'
                              : 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-300'
                            : isDark
                            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleDoc(doc.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold truncate text-xs">{doc.title}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{doc.fileName}</span>
                              <span>·</span>
                              <span>{doc.fileSize}</span>
                              <span>·</span>
                              <span className="font-semibold">{doc.folder}</span>
                            </div>
                          </div>
                        </div>

                        {doc.isHeld && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60 shrink-0"
                            title="Active legal hold preservation lock"
                          >
                            Preserved
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Recipient Selection */}
              <div className="pt-3 border-t border-slate-800/60 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recipient External Client Contact
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="recipientType"
                      checked={recipientType === 'existing'}
                      onChange={() => setRecipientType('existing')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Authorized Client Representative</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="recipientType"
                      checked={recipientType === 'new'}
                      onChange={() => setRecipientType('new')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Invite New External Contact</span>
                  </label>
                </div>

                {recipientType === 'existing' ? (
                  <div>
                    <select
                      value={selectedContactEmail}
                      onChange={(e) => setSelectedContactEmail(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      {knownClientContacts.map((c) => (
                        <option key={c.email} value={c.email}>
                          {c.name} ({c.title} — {c.company}) · {c.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Contact Full Name"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300'
                        }`}
                      />
                      <input
                        type="email"
                        placeholder="contact@company.com"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Organization / Company"
                        value={newContactCompany}
                        onChange={(e) => setNewContactCompany(e.target.value)}
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Title / Capacity"
                        value={newContactTitle}
                        onChange={(e) => setNewContactTitle(e.target.value)}
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 6 Columns: Access Expiration & Security Safeguards */}
            <div
              className={`lg:col-span-6 rounded-2xl p-5 border space-y-4 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 border-b pb-2 border-slate-800/60">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Access Expiration & Security Protocols
                </span>
              </div>

              {/* Expiration Settings */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Access Window / Expiration Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '24 Hours', hours: 24, desc: 'Urgent Review' },
                    { label: '48 Hours', hours: 48, desc: 'Standard Prep' },
                    { label: '72 Hours', hours: 72, desc: 'Firm Standard' },
                    { label: '7 Days', hours: 168, desc: 'Briefing Window' },
                    { label: '30 Days', hours: 720, desc: 'Due Diligence' },
                    { label: 'Custom Days', hours: -1, desc: 'Custom Date' },
                  ].map((preset) => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => setDurationHours(preset.hours)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        durationHours === preset.hours
                          ? isDark
                            ? 'bg-amber-950/40 border-amber-500/80 text-amber-300 font-bold ring-1 ring-amber-500/30'
                            : 'bg-amber-50 border-amber-400 text-amber-800 font-bold ring-1 ring-amber-300'
                          : isDark
                          ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <div className="text-xs">{preset.label}</div>
                      <div className="text-[10px] opacity-75">{preset.desc}</div>
                    </button>
                  ))}
                </div>

                {durationHours === -1 && (
                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="text-xs text-slate-400">Expire after:</span>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={customDays}
                      onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                      className={`w-20 px-2.5 py-1 text-xs rounded-lg border font-mono font-bold ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                    <span className="text-xs text-slate-400">calendar days</span>
                  </div>
                )}
              </div>

              {/* View / Download Limits */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  View & Download Limits
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSingleUse(false);
                      setMaxAccessLimit(10);
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold ${
                      !isSingleUse && maxAccessLimit === 10
                        ? 'bg-blue-600 text-white border-blue-500'
                        : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    10 Accesses
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSingleUse(true);
                      setMaxAccessLimit(1);
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold ${
                      isSingleUse
                        ? 'bg-red-600 text-white border-red-500'
                        : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    1-Time Self-Destruct
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSingleUse(false);
                      setMaxAccessLimit(999);
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold ${
                      !isSingleUse && maxAccessLimit === 999
                        ? 'bg-blue-600 text-white border-blue-500'
                        : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    Unlimited in Window
                  </button>
                </div>
              </div>

              {/* Permission Scopes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Client Permission Scope
                </label>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'VIEW_DOWNLOAD_WATERMARKED',
                      label: 'View & Watermarked Download',
                      desc: 'Client may read and download copy with embedded forensic custody seal.',
                    },
                    {
                      id: 'VIEW_ONLY',
                      label: 'Browser Canvas Protected (View Only)',
                      desc: 'Document rendered in encrypted viewer. Direct downloads locked.',
                    },
                    {
                      id: 'COMMENT_APPROVAL',
                      label: 'Client Approval & Signature Clearance',
                      desc: 'Allows client to mark approved or suggest inline revisions.',
                    },
                  ].map((scope) => (
                    <label
                      key={scope.id}
                      className={`p-2.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                        permissionScope === scope.id
                          ? isDark
                            ? 'bg-blue-950/40 border-blue-500/80 text-white'
                            : 'bg-blue-50 border-blue-400 text-blue-900'
                          : isDark
                          ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="permissionScope"
                        checked={permissionScope === scope.id}
                        onChange={() => setPermissionScope(scope.id as any)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold">{scope.label}</div>
                        <div className="text-[11px] opacity-75">{scope.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Security Toggles: Watermark & PIN */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">Forensic Watermark</span>
                    <span className="text-[10px] text-slate-400">Embed IP & Email</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={watermarkEnabled}
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">6-Digit Access PIN</span>
                    <span className="text-[10px] text-slate-400">Two-factor pass</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pinProtected}
                    onChange={(e) => setPinProtected(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              {pinProtected && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Access PIN Code:</span>
                  <input
                    type="text"
                    maxLength={8}
                    value={customPin}
                    onChange={(e) => setCustomPin(e.target.value)}
                    className={`w-32 px-3 py-1 font-mono text-center font-bold text-xs rounded-lg border ${
                      isDark ? 'bg-slate-900 border-slate-800 text-amber-300' : 'bg-white border-slate-300 text-amber-800'
                    }`}
                  />
                  <span className="text-[11px] text-slate-400">Deliver via SMS / Secure Call</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                All grants logged sequentially into Immutable Forensic Audit Trail with client IP tracking.
              </span>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Generate Secure Client Portal Share Link</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: ACTIVE SHARES DIRECTORY & EXPIRATION MANAGEMENT */}
      {activeTab === 'shares' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Active & Historical Matter Document Shares</h4>
              <p className="text-xs text-slate-400">
                Manage live expiration timers, review client download counts, or revoke links immediately.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('create')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share More Documents</span>
            </button>
          </div>

          {activeShares.length === 0 ? (
            <div
              className={`p-12 text-center rounded-2xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Share2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <div className="text-sm font-bold">No Client Portal Shares Yet for Matter {activeMatter.matterNumber}</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select matter documents above and configure expiration windows to share securely with corporate contacts.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                Create First Document Share
              </button>
            </div>
          ) : (
            <div
              className={`rounded-2xl border overflow-hidden transition-colors ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <th className="py-3 px-4">Shared Document(s)</th>
                    <th className="py-3 px-4">Recipient Contact</th>
                    <th className="py-3 px-4">Expiration Status</th>
                    <th className="py-3 px-4">Security Rules</th>
                    <th className="py-3 px-4">Views / Accesses</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? 'divide-slate-800/80' : 'divide-slate-200'
                  }`}
                >
                  {activeShares.map((share) => {
                    const expiry = getExpiryCountdown(share.expiresAt, share.status);
                    const isRevoked = share.status === 'REVOKED';
                    const isExpired = share.status === 'EXPIRED' || new Date(share.expiresAt).getTime() <= Date.now();

                    return (
                      <tr
                        key={share.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Documents */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-0.5">
                            {share.documentTitles.map((title, i) => (
                              <div
                                key={i}
                                className="font-bold text-xs flex items-center gap-1.5 truncate max-w-[220px]"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>{title}</span>
                              </div>
                            ))}
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              Granted by: {share.createdBy}
                            </div>
                          </div>
                        </td>

                        {/* Recipient */}
                        <td className="py-3.5 px-4 align-top">
                          <div>
                            <div className="font-semibold text-xs">{share.recipientContactName}</div>
                            <div className="text-[11px] text-blue-400 font-mono">{share.recipientEmail}</div>
                            {share.recipientCompany && (
                              <div className="text-[10px] text-slate-400">{share.recipientCompany}</div>
                            )}
                          </div>
                        </td>

                        {/* Expiration Status */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${expiry.color}`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{expiry.text}</span>
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Until {new Date(share.expiresAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Security Rules */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="font-semibold text-slate-300">
                              {share.permissionScope === 'VIEW_DOWNLOAD_WATERMARKED'
                                ? 'Watermarked Download'
                                : share.permissionScope === 'VIEW_ONLY'
                                ? 'View Only (Canvas Lock)'
                                : 'Approval Workflow'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              {share.watermarkEnabled && (
                                <span className="text-blue-400 font-semibold flex items-center gap-0.5">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Watermarked</span>
                                </span>
                              )}
                              {share.pinProtected && (
                                <span className="text-amber-400 font-mono font-semibold flex items-center gap-0.5">
                                  <KeyRound className="w-3 h-3" />
                                  <span>PIN: {share.accessPin}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Views */}
                        <td className="py-3.5 px-4 align-top">
                          <div>
                            <span className="font-bold font-mono text-xs">
                              {share.accessCount} / {share.maxAccessLimit || '∞'} views
                            </span>
                            {share.lastAccessedAt && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Last: {new Date(share.lastAccessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopyLink(share.shareUrl, share.id)}
                              className="p-1.5 rounded-lg border text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Copy secure share URL"
                            >
                              {copiedShareId === share.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-300" />
                              )}
                            </button>

                            {!isRevoked && !isExpired && (
                              <button
                                onClick={() => extendPortalShare(share.id, 24)}
                                className="px-2 py-1 rounded-lg border text-[11px] font-semibold hover:bg-slate-800 transition-colors text-amber-300"
                                title="Extend expiration window by +24 hours"
                              >
                                +24h
                              </button>
                            )}

                            {!isRevoked && (
                              <button
                                onClick={() => revokePortalShare(share.id)}
                                className="p-1.5 rounded-lg border border-red-800/80 text-red-400 hover:bg-red-950/60 transition-colors"
                                title="Revoke access immediately"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
