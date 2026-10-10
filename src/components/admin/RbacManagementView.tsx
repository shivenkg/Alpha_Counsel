import React, { useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  FolderLock,
  Globe,
  HardDrive,
  History,
  IndianRupee,
  Info,
  Key,
  Landmark,
  Lock,
  Milestone,
  Moon,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sun,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/financials';
import {
  BOUNDED_DOMAINS,
  checkPermission,
  DEFAULT_ROLE_PERMISSIONS,
  normalizeRole,
} from '../../services/rbac';
import {
  BoundedDomain,
  LicenseTier,
  PermissionAction,
  StandardRole,
  User,
  UserRole,
} from '../../types';

export const RbacManagementView: React.FC = () => {
  const {
    users,
    firmUsers,
    currentUser,
    setCurrentUser,
    matters,
    ethicalWalls,
    currentTenant,
    updateTenant,
    licensePlans,
    addFirmUser,
    updateFirmUser,
    toggleUserStatus,
    rolePermissions,
    updateRolePermission,
    resetRolePermissions,
    theme,
    toggleTheme,
    setCurrentView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'simulator'>('matrix');
  const [selectedRole, setSelectedRole] = useState<StandardRole>('Administrator');

  // User Management Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ASSOCIATE');
  const [newRate, setNewRate] = useState(450);
  const [newDept, setNewDept] = useState('Commercial Litigation');
  const [newBar, setNewBar] = useState('');
  const [quotaError, setQuotaError] = useState('');

  // Self-Service Tenant Subscription & Quota Customizer Modal
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [customPlan, setCustomPlan] = useState<LicenseTier>(currentTenant.plan);
  const [customSeats, setCustomSeats] = useState<number>(currentTenant.maxSeats);
  const [customStorageGB, setCustomStorageGB] = useState<number>(currentTenant.storageLimitGB);

  const handleOpenSubscriptionModal = () => {
    setCustomPlan(currentTenant.plan);
    setCustomSeats(currentTenant.maxSeats);
    setCustomStorageGB(currentTenant.storageLimitGB);
    setShowSubscriptionModal(true);
  };

  // Live Policy Simulator state
  const [simUserId, setSimUserId] = useState<string>(users[3]?.id || users[0].id);
  const [simDomain, setSimDomain] = useState<BoundedDomain>('Documents');
  const [simAction, setSimAction] = useState<PermissionAction>('view');
  const [simMatterId, setSimMatterId] = useState<string>(matters[0]?.id || '');
  const [evalResult, setEvalResult] = useState<{
    evaluated: boolean;
    allowed: boolean;
    reason?: string;
  } | null>(null);

  const simUser = users.find((u) => u.id === simUserId) || users[0];
  const simMatter = matters.find((m) => m.id === simMatterId) || null;

  const handleRunSimulation = () => {
    const res = checkPermission(simUser, simDomain, simAction, simMatter, ethicalWalls);
    setEvalResult({
      evaluated: true,
      allowed: res.allowed,
      reason: res.reason,
    });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setQuotaError('');

    const res = addFirmUser({
      name: newName,
      email: newEmail,
      role: newRole,
      billingRate: newRate,
      department: newDept,
      barNumber: newBar || undefined,
      tenantId: currentTenant.id,
      isActive: true,
    });

    if (!res.success) {
      setQuotaError(res.error || 'Failed to add user.');
      return;
    }

    setShowAddUserModal(false);
    setNewName('');
    setNewEmail('');
    setNewBar('');
  };

  const isDark = theme === 'dark';

  const roles: Array<{
    id: StandardRole;
    label: string;
    description: string;
    userCount: number;
    color: string;
    badgeBg: string;
  }> = [
    {
      id: 'Administrator',
      label: 'Portal / Tenant Admin',
      description: 'Managing Partners & General Counsel with tenant-wide administrative authority',
      userCount: users.filter((u) => normalizeRole(u.role) === 'Administrator' && u.tenantId === currentTenant.id).length,
      color: 'text-purple-400',
      badgeBg: 'bg-purple-950/60 border-purple-800/60 text-purple-300',
    },
    {
      id: 'Lawyer',
      label: 'Partner & Associate Counsel',
      description: 'Trial attorneys, corporate partners & associates subject to Ethical Screening Walls',
      userCount: users.filter((u) => normalizeRole(u.role) === 'Lawyer' && u.tenantId === currentTenant.id).length,
      color: 'text-blue-400',
      badgeBg: 'bg-blue-950/60 border-blue-800/60 text-blue-300',
    },
    {
      id: 'Paralegal',
      label: 'Paralegal & Discovery',
      description: 'Litigation support, document discovery & chronology (escrow accounting restricted)',
      userCount: users.filter((u) => normalizeRole(u.role) === 'Paralegal' && u.tenantId === currentTenant.id).length,
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300',
    },
    {
      id: 'Client',
      label: 'Client Contact / Portal',
      description: 'Client representatives with strictly isolated matter access, invoice review, and retainer deposits',
      userCount: users.filter((u) => normalizeRole(u.role) === 'Client').length,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300',
    },
  ];

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-6 font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header & Tenant Admin Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">
            <Building className="w-4 h-4" />
            <span>{currentTenant.name} · Tenant Administration Portal</span>
          </div>
          <h1
            className={`text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Role-Based Access Control (RBAC) & User Management
          </h1>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Controlled by Portal / Tenant Admin. Configure domain permission matrices, firm user seats, and ethical screening boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Light / Dark Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {currentUser.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setCurrentView('super-admin')}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Super Admin Console →</span>
            </button>
          )}

          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Firm User</span>
          </button>
        </div>
      </div>

      {/* Tenant Licensing Status Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col xl:flex-row xl:items-center justify-between gap-5 shadow-xs ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-200'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center font-bold shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-2 flex-wrap">
              <span>SaaS Subscription:</span>
              <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800/60 font-mono text-[10px] uppercase font-bold">
                {currentTenant.plan} Tier
              </span>
              <span className="text-emerald-400 font-num font-semibold text-xs">
                {formatCurrency(currentTenant.monthlyPriceINR)} / mo
              </span>
              <span className="text-slate-400 font-num text-[11px]">
                ({formatCurrency(currentTenant.monthlyPriceINR * 12)} / yr)
              </span>
              <span className="text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60 font-semibold">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              License Key: {currentTenant.licenseKey} · Renews: {currentTenant.renewDate}
            </div>
          </div>
        </div>

        {/* Meters and Customizer Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Seat Quota Meter */}
          <div className="space-y-1 min-w-[140px]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                Seats
              </span>
              <span className="font-bold font-num text-slate-100">
                {currentTenant.seatsAllocated}/{currentTenant.maxSeats}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  currentTenant.seatsAllocated >= currentTenant.maxSeats
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (currentTenant.seatsAllocated / currentTenant.maxSeats) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Cloud Storage Quota Meter */}
          <div className="space-y-1 min-w-[140px]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                Storage
              </span>
              <span className="font-bold font-num text-slate-100">
                {currentTenant.storageUsedGB}/{currentTenant.storageLimitGB} GB
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  (currentTenant.storageUsedGB / currentTenant.storageLimitGB) >= 0.85
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (currentTenant.storageUsedGB / currentTenant.storageLimitGB) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Customise Subscription Button */}
          <button
            onClick={handleOpenSubscriptionModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Customise Plan & Quotas</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        className={`flex items-center gap-2 border-b pb-2 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'matrix'
              ? 'bg-blue-600 text-white shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Role Permissions Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Firm Users & Role Assignment ({firmUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'simulator'
              ? 'bg-blue-600 text-white shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Live Policy Simulator</span>
        </button>
      </div>

      {/* TAB 1: Role Permissions Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Role Pill Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roles.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedRole === r.id
                    ? isDark
                      ? 'border-blue-500/80 bg-blue-950/30 ring-1 ring-blue-500/40'
                      : 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-400'
                    : isDark
                    ? 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${r.color}`}>{r.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badgeBg}`}>
                      {r.userCount} users
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {r.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Matrix Table */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <span>Granular Operations Matrix for:</span>
                  <span className="text-blue-400">{selectedRole}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click checkmarks to grant or revoke specific domain privileges for all users assigned to this role
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetRolePermissions}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark
                        ? 'border-slate-800 text-slate-400 bg-slate-950/60'
                        : 'border-slate-200 text-slate-600 bg-slate-50'
                    }`}
                  >
                    <th className="py-3 px-4">Bounded Legal Domain</th>
                    <th className="py-3 px-4 text-center">View / Read</th>
                    <th className="py-3 px-4 text-center">Create / Submit</th>
                    <th className="py-3 px-4 text-center">Edit / Revise</th>
                    <th className="py-3 px-4 text-center">Delete / Purge</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? 'divide-slate-800/80' : 'divide-slate-100'
                  }`}
                >
                  {BOUNDED_DOMAINS.map((domain) => {
                    const currentActions = rolePermissions[selectedRole][domain.id] || [];
                    const actionsList: PermissionAction[] = ['view', 'create', 'edit', 'delete'];

                    return (
                      <tr
                        key={domain.id}
                        className={`hover:bg-blue-600/5 transition-colors ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-100">
                            {domain.label}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {domain.description}
                          </div>
                        </td>

                        {actionsList.map((action) => {
                          const isAllowed = currentActions.includes(action);
                          return (
                            <td key={action} className="py-3 px-4 text-center">
                              <button
                                onClick={() => updateRolePermission(selectedRole, domain.id, action)}
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                  isAllowed
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : isDark
                                    ? 'bg-slate-950 border border-slate-800 text-slate-600 hover:text-slate-400'
                                    : 'bg-slate-100 border border-slate-300 text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                {isAllowed ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <X className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Firm Users & Role Assignment */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Firm Personnel & Role Assignments
              </h3>
              <p className="text-[11px] text-slate-500">
                Tenant Admins can reassign legal roles, adjust Indian Rupee billing rates, and manage user access.
              </p>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Firm Member</span>
            </button>
          </div>

          <div
            className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark
                        ? 'border-slate-800 text-slate-400 bg-slate-950/60'
                        : 'border-slate-200 text-slate-600 bg-slate-50'
                    }`}
                  >
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role Assignment</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Billing Rate</th>
                    <th className="py-3 px-4">Bar Number</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Switch User</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? 'divide-slate-800/80' : 'divide-slate-100'
                  }`}
                >
                  {firmUsers.map((u) => {
                    const isCurrent = currentUser.id === u.id;
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-blue-600/5 transition-colors ${
                          isCurrent
                            ? isDark
                              ? 'bg-blue-950/20 font-medium'
                              : 'bg-blue-50/50 font-medium'
                            : ''
                        }`}
                      >
                        {/* Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center font-bold text-xs">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isCurrent && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/40">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Selector */}
                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              updateFirmUser(u.id, { role: e.target.value as UserRole })
                            }
                            className={`text-xs rounded-xl px-2.5 py-1 font-semibold border focus:outline-none ${
                              isDark
                                ? 'bg-slate-950 border-slate-800 text-slate-200'
                                : 'bg-slate-100 border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="MANAGING_PARTNER">MANAGING_PARTNER</option>
                            <option value="PARTNER">PARTNER</option>
                            <option value="SENIOR_ASSOCIATE">SENIOR_ASSOCIATE</option>
                            <option value="ASSOCIATE">ASSOCIATE</option>
                            <option value="PARALEGAL">PARALEGAL</option>
                            <option value="BILLING_ADMIN">BILLING_ADMIN</option>
                            <option value="CLIENT_PORTAL">CLIENT_PORTAL</option>
                          </select>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                          {u.department}
                        </td>

                        {/* Rate */}
                        <td className="py-3.5 px-4 font-num font-semibold text-emerald-400">
                          {formatCurrency(u.billingRate)}/hr
                        </td>

                        {/* Bar */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {u.barNumber || '—'}
                        </td>

                        {/* Active Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border transition-all ${
                              u.isActive !== false
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                            }`}
                          >
                            {u.isActive !== false ? 'Active' : 'Deactivated'}
                          </button>
                        </td>

                        {/* Switch persona */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setCurrentUser(u)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                          >
                            Log in as →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Policy Simulator */}
      {activeTab === 'simulator' && (
        <div className="space-y-4">
          <div
            className={`p-5 rounded-2xl border shadow-xs ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                ABA Model Rule 1.10 & RBAC Policy Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Simulate access evaluations against the Tenant Policy Engine. Enforces both role capabilities and active Ethical Screening Walls.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Actor (User)
                </label>
                <select
                  value={simUserId}
                  onChange={(e) => setSimUserId(e.target.value)}
                  className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target Domain
                </label>
                <select
                  value={simDomain}
                  onChange={(e) => setSimDomain(e.target.value as BoundedDomain)}
                  className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {BOUNDED_DOMAINS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Operation (Action)
                </label>
                <select
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value as PermissionAction)}
                  className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="view">view / read</option>
                  <option value="create">create / intake</option>
                  <option value="edit">edit / revise</option>
                  <option value="delete">delete / expunge</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Matter Context
                </label>
                <select
                  value={simMatterId}
                  onChange={(e) => setSimMatterId(e.target.value)}
                  className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {matters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.matterNumber} - {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
            >
              Evaluate Policy Decision
            </button>

            {evalResult && (
              <div
                className={`mt-4 p-4 rounded-xl border flex items-center justify-between ${
                  evalResult.allowed
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {evalResult.allowed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {evalResult.allowed ? 'ACCESS PERMITTED (200 OK)' : 'ACCESS DENIED (403 FORBIDDEN)'}
                    </div>
                    <div className="text-xs mt-0.5 opacity-90">{evalResult.reason}</div>
                  </div>
                </div>

                <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded-full border">
                  {evalResult.allowed ? 'PERMITTED' : 'BLOCKED'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Firm User Modal with Seat Quota Guard */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 text-slate-100">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Add New Firm Member
                </h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {quotaError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{quotaError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rachel Zane"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Firm Email
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rzane@alphacounsel.law"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Role Assignment
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="PARTNER">PARTNER</option>
                    <option value="SENIOR_ASSOCIATE">SENIOR_ASSOCIATE</option>
                    <option value="ASSOCIATE">ASSOCIATE</option>
                    <option value="PARALEGAL">PARALEGAL</option>
                    <option value="BILLING_ADMIN">BILLING_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Hourly Billing Rate (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-num font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Bar Admission # (Optional)
                  </label>
                  <input
                    type="text"
                    value={newBar}
                    onChange={(e) => setNewBar(e.target.value)}
                    placeholder="e.g. NY-591024"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                Seat allocation: <span className="font-semibold text-slate-200">{currentTenant.seatsAllocated} of {currentTenant.maxSeats}</span> seats consumed.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md"
                >
                  Allocate Seat & Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Self-Service Tenant Subscription & Quota Customizer Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-3xl shadow-2xl border w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Header */}
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Customise Firm Subscription & Quotas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Adjust license tier, add team seat licenses, and expand vault storage
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Step 1: Select License Tier */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Base License Tier
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {licensePlans.map((p) => {
                    const isSelected = customPlan === p.tier;
                    return (
                      <div
                        key={p.tier}
                        onClick={() => {
                          setCustomPlan(p.tier);
                          setCustomSeats((prev) =>
                            Math.max(prev, p.maxSeatsIncluded, currentTenant.seatsAllocated)
                          );
                          setCustomStorageGB((prev) =>
                            Math.max(prev, p.storageGB, Math.ceil(currentTenant.storageUsedGB))
                          );
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white shadow-xs ring-1 ring-blue-500'
                            : isDark
                            ? 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                              {p.tier}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </div>
                          <div className="font-bold text-xs mt-1">{p.name}</div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] space-y-0.5">
                          <div className="font-num font-semibold text-emerald-400">
                            {formatCurrency(p.monthlyPriceINR)}/mo
                          </div>
                          <div className="font-num text-[9px] text-slate-400">
                            {formatCurrency(p.monthlyPriceINR * 12)}/yr
                          </div>
                          <div className="text-slate-400">
                            {p.maxSeatsIncluded} seats · {p.storageGB} GB
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Custom Seat & Storage Sliders */}
              {(() => {
                const planObj = licensePlans.find((p) => p.tier === customPlan) || licensePlans[0];
                const extraSeats = Math.max(0, customSeats - planObj.maxSeatsIncluded);
                const extraSeatRate = Math.round((planObj.monthlyPriceINR / planObj.maxSeatsIncluded) * 0.7);
                const extraSeatsCost = extraSeats * extraSeatRate;
                const extraStorage = Math.max(0, customStorageGB - planObj.storageGB);
                const extraStorageCost = Math.ceil(extraStorage / 50) * 1500;
                const totalMonthlyCalculated = planObj.monthlyPriceINR + extraSeatsCost + extraStorageCost;

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* User Seats Customizer */}
                      <div
                        className={`p-4 rounded-2xl border ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            User Seat Quota
                          </label>
                          <span className="text-xs font-bold font-num text-blue-400">
                            {customSeats} Seats
                          </span>
                        </div>
                        <input
                          type="range"
                          min={Math.max(1, currentTenant.seatsAllocated)}
                          max={50}
                          value={customSeats}
                          onChange={(e) => setCustomSeats(parseInt(e.target.value) || 1)}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                          <span>Active users: {currentTenant.seatsAllocated}</span>
                          <span>Base covers: {planObj.maxSeatsIncluded}</span>
                        </div>
                        {extraSeats > 0 && (
                          <div className="text-[10px] text-amber-400 mt-1 font-num">
                            + {extraSeats} add-on seat{extraSeats > 1 ? 's' : ''} ({formatCurrency(extraSeatsCost)}/mo)
                          </div>
                        )}
                      </div>

                      {/* Storage Quota Customizer */}
                      <div
                        className={`p-4 rounded-2xl border ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Vault Storage Quota
                          </label>
                          <span className="text-xs font-bold font-num text-blue-400">
                            {customStorageGB} GB
                          </span>
                        </div>
                        <input
                          type="range"
                          min={Math.max(50, Math.ceil(currentTenant.storageUsedGB))}
                          max={5000}
                          step={50}
                          value={customStorageGB}
                          onChange={(e) => setCustomStorageGB(parseInt(e.target.value) || 50)}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                          <span>Vault used: {currentTenant.storageUsedGB} GB</span>
                          <span>Base covers: {planObj.storageGB} GB</span>
                        </div>
                        {extraStorage > 0 && (
                          <div className="text-[10px] text-amber-400 mt-1 font-num">
                            + {extraStorage} GB extra storage ({formatCurrency(extraStorageCost)}/mo)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Real-Time Pricing Summary */}
                    <div
                      className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Updated Subscription Fee Breakdown
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">
                            {planObj.name} Base Rate ({planObj.maxSeatsIncluded} seats · {planObj.storageGB} GB)
                          </span>
                          <span className="font-num font-semibold text-slate-200">
                            {formatCurrency(planObj.monthlyPriceINR)}
                          </span>
                        </div>
                        {extraSeats > 0 && (
                          <div className="flex items-center justify-between text-amber-400">
                            <span>
                              Additional Seats Quota (+{extraSeats} seats @ {formatCurrency(extraSeatRate)}/seat)
                            </span>
                            <span className="font-num font-semibold">
                              +{formatCurrency(extraSeatsCost)}
                            </span>
                          </div>
                        )}
                        {extraStorage > 0 && (
                          <div className="flex items-center justify-between text-amber-400">
                            <span>Additional Vault Storage (+{extraStorage} GB)</span>
                            <span className="font-num font-semibold">
                              +{formatCurrency(extraStorageCost)}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-800 space-y-1 mt-2">
                          <div className="flex items-center justify-between text-sm font-bold">
                            <span className="text-white">Total Monthly Subscription</span>
                            <span className="font-num text-emerald-400">
                              {formatCurrency(totalMonthlyCalculated)} / month
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-400">Annual Subscription (12 × Monthly)</span>
                            <span className="font-num text-emerald-400">
                              {formatCurrency(totalMonthlyCalculated * 12)} / year
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowSubscriptionModal(false)}
                        className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateTenant(currentTenant.id, {
                            plan: customPlan,
                            maxSeats: customSeats,
                            storageLimitGB: customStorageGB,
                            monthlyPriceINR: totalMonthlyCalculated,
                          });
                          setShowSubscriptionModal(false);
                        }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
                      >
                        Confirm & Apply Subscription Quotas
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
