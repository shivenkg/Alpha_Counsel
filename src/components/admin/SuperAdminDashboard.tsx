import React, { useState } from 'react';
import {
  AlertCircle,
  Building,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  HardDrive,
  IndianRupee,
  Key,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/financials';
import { LicensePlanDetails, LicenseTier, Tenant, TenantFeatures, TenantStatus } from '../../types';

export const SuperAdminDashboard: React.FC = () => {
  const {
    tenants,
    currentTenantId,
    setCurrentTenantId,
    updateTenant,
    addTenant,
    regenerateLicenseKey,
    toggleTenantFeature,
    licensePlans,
    updateLicensePlan,
    currentUser,
    theme,
    setCurrentView,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TenantStatus>('ALL');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Plan Tier Customizer State
  const [editingPlan, setEditingPlan] = useState<LicensePlanDetails | null>(null);
  const [showPlanEditModal, setShowPlanEditModal] = useState(false);

  // New Tenant Provisioning Form State
  const [newFirmName, setNewFirmName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newPlan, setNewPlan] = useState<LicenseTier>('ENTERPRISE');
  const [newMaxSeats, setNewMaxSeats] = useState(10);
  const [newMonthlyPriceINR, setNewMonthlyPriceINR] = useState(150000);
  const [newStorageLimitGB, setNewStorageLimitGB] = useState(1000);
  const [newFeatures, setNewFeatures] = useState<TenantFeatures>({
    aiDrafting: true,
    legalHolds: true,
    trustAccounting: true,
    ethicalWalls: true,
    forensicOcr: true,
    clientPortal: true,
    customDomain: false,
    auditLogs: true,
  });

  // Aggregate SaaS Metrics
  const totalTenantsCount = tenants.length;
  const activeTenantsCount = tenants.filter((t) => t.status === 'ACTIVE').length;
  const totalSeatsAllocated = tenants.reduce((sum, t) => sum + t.seatsAllocated, 0);
  const totalMaxSeats = tenants.reduce((sum, t) => sum + t.maxSeats, 0);
  const totalMrrINR = tenants
    .filter((t) => t.status === 'ACTIVE')
    .reduce((sum, t) => sum + t.monthlyPriceINR, 0);
  const totalStorageGB = tenants.reduce((sum, t) => sum + t.storageUsedGB, 0);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard?.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handlePlanChange = (planTier: LicenseTier) => {
    setNewPlan(planTier);
    const plan = licensePlans.find((p) => p.tier === planTier);
    if (plan) {
      setNewMaxSeats(plan.maxSeatsIncluded);
      setNewMonthlyPriceINR(plan.monthlyPriceINR);
      setNewStorageLimitGB(plan.storageGB);
      if (planTier === 'STARTER') {
        setNewFeatures({
          aiDrafting: false,
          legalHolds: false,
          trustAccounting: true,
          ethicalWalls: false,
          forensicOcr: false,
          clientPortal: false,
          customDomain: false,
          auditLogs: true,
        });
      } else if (planTier === 'PROFESSIONAL') {
        setNewFeatures({
          aiDrafting: true,
          legalHolds: true,
          trustAccounting: true,
          ethicalWalls: false,
          forensicOcr: true,
          clientPortal: true,
          customDomain: false,
          auditLogs: true,
        });
      } else {
        setNewFeatures({
          aiDrafting: true,
          legalHolds: true,
          trustAccounting: true,
          ethicalWalls: true,
          forensicOcr: true,
          clientPortal: true,
          customDomain: true,
          auditLogs: true,
        });
      }
    }
  };

  const handleProvisionTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmName || !newAdminEmail) return;

    const prefix = newPlan.substring(0, 3);
    const rand1 = Math.floor(1000 + Math.random() * 9000);
    const rand2 = Math.floor(1000 + Math.random() * 9000);
    const licenseKey = `CR-${prefix}-2026-${rand1}-${rand2}`;

    addTenant({
      name: newFirmName,
      domain:
        newDomain ||
        newFirmName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.counselrepos.io',
      adminEmail: newAdminEmail,
      plan: newPlan,
      licenseKey,
      status: 'ACTIVE',
      seatsAllocated: 1,
      maxSeats: newMaxSeats,
      storageUsedGB: 0.1,
      storageLimitGB: newStorageLimitGB,
      monthlyPriceINR: newMonthlyPriceINR,
      renewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      features: newFeatures,
    });

    setShowProvisionModal(false);
    setNewFirmName('');
    setNewDomain('');
    setNewAdminEmail('');
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-6 font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>SaaS Platform Operations · Multi-Tenant Authority</span>
          </div>
          <h1
            className={`text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Super Admin & Licensing Engine
          </h1>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Manage subscriber law firm tenants, per-seat license quotas, cryptographically hashed keys, and feature bundles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProvisionModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Tenant Firm</span>
          </button>
        </div>
      </div>

      {/* High-Level SaaS Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Tenant Firms
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/40 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-num ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {totalTenantsCount}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{activeTenantsCount} active subscribers</span>
          </div>
        </div>

        {/* Allocated Seats */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Licensed Seats
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/40 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-num ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {totalSeatsAllocated} / {totalMaxSeats}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-num">
            {Math.round((totalSeatsAllocated / totalMaxSeats) * 100)}% quota capacity
          </div>
        </div>

        {/* Monthly Recurring Revenue in INR */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Monthly Recurring (MRR)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-num text-emerald-400">
            {formatCurrency(totalMrrINR)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ARR: {formatCurrency(totalMrrINR * 12)}
          </div>
        </div>

        {/* Total Cloud Storage */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Cloud Storage Used
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/40 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-num ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {totalStorageGB.toFixed(1)} GB
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across encrypted forensic vaults
          </div>
        </div>
      </div>

      {/* SaaS Licensing Plans Strip */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              SaaS Subscription Tiers & Feature Matrix
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              Configurable Catalog
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingPlan(licensePlans[0]);
                setShowPlanEditModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customise Tiers & Pricing</span>
            </button>
            <span className="text-xs text-blue-400 font-semibold font-num hidden md:inline">
              All prices in Indian Rupees (₹ INR)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {licensePlans.map((plan) => (
            <div
              key={plan.tier}
              className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                plan.popular
                  ? isDark
                    ? 'border-blue-500/80 bg-blue-950/20'
                    : 'border-blue-400 bg-blue-50/40 shadow-sm'
                  : isDark
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      {plan.tier}
                    </span>
                    {plan.popular && (
                      <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        Popular
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingPlan({
                        ...plan,
                        annualPriceINR: plan.monthlyPriceINR * 12,
                      });
                      setShowPlanEditModal(true);
                    }}
                    title="Configure this tier's fees, users, and storage"
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-base font-bold ${
                        isDark ? 'text-white' : 'text-black'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <span className={`text-[11px] font-num font-semibold ${isDark ? 'text-slate-400' : 'text-black'}`}>
                      {plan.maxSeatsIncluded} Seats
                    </span>
                  </div>
                  <div className={`text-lg font-bold font-num ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {formatCurrency(plan.monthlyPriceINR)}
                    <span className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-700'}`}> / mo</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className={`pt-3 border-t mt-3 text-[11px] space-y-1.5 ${
                isDark
                  ? 'border-slate-800/80 text-slate-400'
                  : 'border-slate-300 text-black'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-black'}`}>Storage:</span>
                  <span className={`font-bold font-num ${isDark ? 'text-slate-200' : 'text-black'}`}>
                    {plan.storageGB} GB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-black'}`}>Annual Billing:</span>
                  <span className={`font-bold font-num ${isDark ? 'text-slate-200' : 'text-black'}`}>
                    {formatCurrency(plan.monthlyPriceINR * 12)}/yr
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriber Law Firm Tenants Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Subscribed Law Firm Tenants ({filteredTenants.length})
          </h2>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search firm, domain, license..."
                className={`w-full text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 border ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`text-xs rounded-xl px-2.5 py-1.5 focus:outline-none border ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Tenants Table */}
        <div
          className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200'
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
                  <th className="py-3 px-4">Firm / Tenant</th>
                  <th className="py-3 px-4">License Tier</th>
                  <th className="py-3 px-4">Seats Allocated</th>
                  <th className="py-3 px-4">Storage Quota</th>
                  <th className="py-3 px-4">License Key</th>
                  <th className="py-3 px-4">Monthly Rate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-100 text-slate-700'
                }`}
              >
                {filteredTenants.map((t) => {
                  const isCurrentActiveTenant = currentTenantId === t.id;
                  const isSuspended = t.status === 'SUSPENDED';

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-blue-600/5 transition-colors ${
                        isCurrentActiveTenant
                          ? isDark
                            ? 'bg-blue-950/30 font-medium'
                            : 'bg-blue-50/60 font-medium'
                          : ''
                      }`}
                    >
                      {/* Firm & Domain */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isDark
                                ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-black'}`}>
                              <span>{t.name}</span>
                              {isCurrentActiveTenant && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/40">
                                  Current Tenant
                                </span>
                              )}
                            </div>
                            <div className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                              {t.domain} · {t.adminEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* License Tier */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            t.plan === 'SOVEREIGN'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                              : t.plan === 'ENTERPRISE'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                              : t.plan === 'PROFESSIONAL'
                              ? 'bg-sky-950/80 text-sky-300 border-sky-800/60'
                              : isDark
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-100 text-black border-slate-300'
                          }`}
                        >
                          {t.plan}
                        </span>
                      </td>

                      {/* Seats Allocated / Max */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className={`font-num font-bold ${isDark ? 'text-slate-200' : 'text-black'}`}>
                            {t.seatsAllocated}
                          </span>
                          <span className={`font-num ${isDark ? 'text-slate-400' : 'text-slate-700'}`}> / {t.maxSeats} seats</span>
                        </div>
                        <div className={`w-24 h-1.5 rounded-full overflow-hidden mt-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div
                            className={`h-full rounded-full ${
                              t.seatsAllocated >= t.maxSeats ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (t.seatsAllocated / t.maxSeats) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Storage Quota */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className={`font-num font-bold ${isDark ? 'text-slate-200' : 'text-black'}`}>
                            {t.storageUsedGB}
                          </span>
                          <span className={`font-num ${isDark ? 'text-slate-400' : 'text-slate-700'}`}> / {t.storageLimitGB} GB</span>
                        </div>
                        <div className={`w-24 h-1.5 rounded-full overflow-hidden mt-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div
                            className={`h-full rounded-full transition-all ${
                              (t.storageUsedGB / t.storageLimitGB) >= 0.85
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (t.storageUsedGB / t.storageLimitGB) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* License Key */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-1 rounded border font-semibold ${
                            isDark
                              ? 'text-slate-300 bg-slate-950 border-slate-800'
                              : 'text-black bg-slate-100 border-slate-300'
                          }`}>
                            {t.licenseKey}
                          </span>
                          <button
                            onClick={() => handleCopyKey(t.licenseKey, t.id)}
                            title="Copy License Key"
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedKeyId === t.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Monthly Subscription */}
                      <td className="py-3.5 px-4 font-num font-semibold text-emerald-400">
                        {formatCurrency(t.monthlyPriceINR)}
                        <span className="text-[10px] text-slate-500 font-normal"> /mo</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                              : t.status === 'TRIAL'
                              ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                              : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTenant(t)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                          >
                            Manage Features
                          </button>
                          <button
                            onClick={() => {
                              setCurrentTenantId(t.id);
                              setCurrentView('dashboard');
                            }}
                            title="Switch Context to this Tenant"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                          >
                            Switch Tenant →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Feature Toggles & Plan Manager Modal for Selected Tenant */}
      {selectedTenant && (
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
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">
                    Tenant Control: {selectedTenant.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedTenant.id} · Domain: {selectedTenant.domain}
                </p>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Plan & License Key Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={selectedTenant.plan}
                    onChange={(e) => {
                      const newTier = e.target.value as LicenseTier;
                      const plan = licensePlans.find((p) => p.tier === newTier);
                      const updates = {
                        plan: newTier,
                        monthlyPriceINR: plan?.monthlyPriceINR || selectedTenant.monthlyPriceINR,
                        maxSeats: plan?.maxSeatsIncluded || selectedTenant.maxSeats,
                        storageLimitGB: plan?.storageGB || selectedTenant.storageLimitGB,
                      };
                      updateTenant(selectedTenant.id, updates);
                      setSelectedTenant((prev) =>
                        prev ? { ...prev, ...updates } : null
                      );
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    {licensePlans.map((p) => (
                      <option key={p.tier} value={p.tier}>
                        {p.name} ({formatCurrency(p.monthlyPriceINR)}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Custom Monthly Subscription Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={selectedTenant.monthlyPriceINR}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      updateTenant(selectedTenant.id, { monthlyPriceINR: price });
                      setSelectedTenant((prev) =>
                        prev ? { ...prev, monthlyPriceINR: price } : null
                      );
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-num font-bold focus:outline-none border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-emerald-400'
                        : 'bg-slate-50 border-slate-200 text-emerald-600'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Active Rate: {formatCurrency(selectedTenant.monthlyPriceINR)} / mo (Annual: {formatCurrency(selectedTenant.monthlyPriceINR * 12)} / yr)
                  </span>
                </div>
              </div>

              {/* User Seats & Storage Quotas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Max User Seats Quota
                  </label>
                  <input
                    type="number"
                    min={selectedTenant.seatsAllocated}
                    value={selectedTenant.maxSeats}
                    onChange={(e) => {
                      const max = parseInt(e.target.value) || selectedTenant.seatsAllocated;
                      updateTenant(selectedTenant.id, { maxSeats: max });
                      setSelectedTenant((prev) => (prev ? { ...prev, maxSeats: max } : null));
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-num font-bold focus:outline-none border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Allocated: {selectedTenant.seatsAllocated} of {selectedTenant.maxSeats} seats
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Storage Quota Limit (GB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="25"
                    value={selectedTenant.storageLimitGB}
                    onChange={(e) => {
                      const storage = parseInt(e.target.value) || 10;
                      updateTenant(selectedTenant.id, { storageLimitGB: storage });
                      setSelectedTenant((prev) =>
                        prev ? { ...prev, storageLimitGB: storage } : null
                      );
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-num font-bold focus:outline-none border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Vault Utilization: {selectedTenant.storageUsedGB} GB of {selectedTenant.storageLimitGB} GB
                  </span>
                </div>
              </div>

              {/* License Key Generator */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Active License Key
                  </div>
                  <div className="font-mono text-xs font-bold text-blue-400 mt-0.5">
                    {selectedTenant.licenseKey}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newKey = regenerateLicenseKey(selectedTenant.id);
                    setSelectedTenant((prev) =>
                      prev ? { ...prev, licenseKey: newKey } : null
                    );
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Regenerate Key</span>
                </button>
              </div>

              {/* Status Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const nextStatus =
                      selectedTenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                    updateTenant(selectedTenant.id, { status: nextStatus });
                    setSelectedTenant((prev) =>
                      prev ? { ...prev, status: nextStatus } : null
                    );
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    selectedTenant.status === 'ACTIVE'
                      ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-800'
                      : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {selectedTenant.status === 'ACTIVE' ? 'Suspend Tenant Access' : 'Activate Tenant'}
                </button>
              </div>

              {/* Feature Flags Checklist */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Entitled Feature Modules
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    Object.keys(selectedTenant.features) as Array<
                      keyof TenantFeatures
                    >
                  ).map((feat) => {
                    const isEnabled = selectedTenant.features[feat];
                    return (
                      <div
                        key={feat}
                        onClick={() => {
                          toggleTenantFeature(selectedTenant.id, feat);
                          setSelectedTenant((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  features: {
                                    ...prev.features,
                                    [feat]: !prev.features[feat],
                                  },
                                }
                              : null
                          );
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isEnabled
                            ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="text-xs font-semibold capitalize">
                          {feat.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-xs ${
                            isEnabled ? 'bg-blue-600 text-white' : 'bg-slate-800'
                          }`}
                        >
                          {isEnabled && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
              <button
                onClick={() => setSelectedTenant(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision New Law Firm Tenant Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 text-slate-100">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Provision New Law Firm Tenant
                </h3>
              </div>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProvisionTenant} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Law Firm Name
                </label>
                <input
                  type="text"
                  required
                  value={newFirmName}
                  onChange={(e) => setNewFirmName(e.target.value)}
                  placeholder="e.g. Apex Legal Partners LLP"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Custom Subdomain
                  </label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="apexlegal.counselrepos.io"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Primary Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@apexlegal.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => handlePlanChange(e.target.value as LicenseTier)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    {licensePlans.map((p) => (
                      <option key={p.tier} value={p.tier}>
                        {p.name} ({p.tier})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Max User Seats Quota
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMaxSeats}
                    onChange={(e) => setNewMaxSeats(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-num font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Monthly Subscription Rate (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={newMonthlyPriceINR}
                    onChange={(e) => setNewMonthlyPriceINR(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-num font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Formatted: {formatCurrency(newMonthlyPriceINR)} / month (Annual: {formatCurrency(newMonthlyPriceINR * 12)} / year)
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Storage Quota Limit (GB)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="50"
                    value={newStorageLimitGB}
                    onChange={(e) => setNewStorageLimitGB(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-num font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Capacity: {newStorageLimitGB} GB Encrypted Vault
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Provision Law Firm & Issue License Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Tier Customization Modal */}
      {showPlanEditModal && editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`rounded-3xl shadow-2xl border w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold">
                    Customise SaaS Plan: {editingPlan.name} ({editingPlan.tier})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update base platform pricing, included user seats, and storage quotas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPlanEditModal(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateLicensePlan(editingPlan.tier, {
                  ...editingPlan,
                  annualPriceINR: editingPlan.monthlyPriceINR * 12,
                });
                setShowPlanEditModal(false);
              }}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Plan Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, name: e.target.value })
                    }
                    className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Tier Identifier
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingPlan.tier}
                    className="w-full rounded-xl px-3 py-2 text-xs font-mono font-bold bg-slate-800/50 text-slate-400 border border-slate-700/50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-black'}`}>
                    Monthly Subscription Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={editingPlan.monthlyPriceINR}
                    onChange={(e) => {
                      const monthly = parseFloat(e.target.value) || 0;
                      // Auto-calculate annual subscription based on monthly subscription: monthly * 12
                      const annual = monthly * 12;
                      setEditingPlan({
                        ...editingPlan,
                        monthlyPriceINR: monthly,
                        annualPriceINR: annual,
                      });
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-num font-bold focus:outline-none border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-emerald-400'
                        : 'bg-white border-slate-300 text-black'
                    }`}
                  />
                  <span className={`text-[10px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>
                    Formatted: {formatCurrency(editingPlan.monthlyPriceINR)} / mo
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-black'}`}>
                      Annual Subscription Fee (₹ INR)
                    </label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      Auto-Calculated (12 × Monthly)
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    readOnly
                    value={editingPlan.monthlyPriceINR * 12}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-num font-bold focus:outline-none border cursor-not-allowed opacity-90 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-emerald-400'
                        : 'bg-slate-100 border-slate-300 text-black'
                    }`}
                  />
                  <span className={`text-[10px] mt-1 block font-medium ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>
                    Formatted: {formatCurrency(editingPlan.monthlyPriceINR * 12)} / yr (12 × {formatCurrency(editingPlan.monthlyPriceINR)}/mo)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-black'}`}>
                    Base User Seats Included
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingPlan.maxSeatsIncluded}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxSeatsIncluded: parseInt(e.target.value) || 1,
                      })
                    }
                    className={`w-full rounded-xl px-3 py-2 text-xs font-num font-bold focus:outline-none border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-white border-slate-300 text-black'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-black'}`}>
                    Base Storage Included (GB)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="50"
                    value={editingPlan.storageGB}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        storageGB: parseInt(e.target.value) || 50,
                      })
                    }
                    className={`w-full rounded-xl px-3 py-2 text-xs font-num font-bold focus:outline-none border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-white border-slate-300 text-black'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-black'}`}>
                  Plan Description & Value Proposition
                </label>
                <textarea
                  rows={3}
                  value={editingPlan.description}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, description: e.target.value })
                  }
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-white border-slate-300 text-black'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowPlanEditModal(false)}
                  className={`px-4 py-2 text-xs cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-black font-semibold'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save Tier Customizations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
