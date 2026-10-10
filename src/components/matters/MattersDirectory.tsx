import React, { useState } from 'react';
import {
  AlertCircle,
  Building,
  Calendar,
  Filter,
  IndianRupee,
  Lock,
  Plus,
  Scale,
  Search,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAudit } from '../../hooks/useAudit';
import { evaluateMatterAccess } from '../../services/matterPolicy';
import { formatINR } from '../../utils/currency';
import { Matter, PracticeArea } from '../../types';
import { MatterFinancialStrip } from './MatterFinancialStrip';

export const MattersDirectory: React.FC = () => {
  const {
    matters,
    setActiveMatterId,
    setCurrentView,
    setMatterSubTab,
    currentUser,
    ethicalWalls,
    addMatter,
    clients,
    users,
    theme,
  } = useApp();
  const isDark = theme === 'dark';
  const { logMatterView } = useAudit();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Matter Form
  const [matterNumber, setMatterNumber] = useState('M-2024-004');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [practiceArea, setPracticeArea] = useState<PracticeArea>('Litigation');
  const [description, setDescription] = useState('');
  const [courtVenue, setCourtVenue] = useState('Delaware Court of Chancery');
  const [caseDocketNumber, setCaseDocketNumber] = useState('C.A. No. 2026-0811');
  const [budgetCap, setBudgetCap] = useState(250000);
  const [evergreenTrustMinimum, setEvergreenTrustMinimum] = useState(25000);

  const practiceAreas = [
    'ALL',
    'Intellectual Property',
    'Corporate / M&A',
    'Litigation',
    'Antitrust & Competition',
    'Employment & Labor',
    'Restructuring',
  ];

  const filteredMatters = matters.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.matterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedPracticeArea === 'ALL' || m.practiceArea === selectedPracticeArea;
    return matchesSearch && matchesArea;
  });

  const handleCreateMatter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    const client = clients.find((c) => c.id === clientId);

    addMatter({
      matterNumber,
      title,
      clientId,
      clientName: client?.name || 'Client Corp',
      practiceArea,
      status: 'MATTER_OPEN',
      leadPartnerId: currentUser.id,
      assignedUserIds: [currentUser.id, users[1]?.id || 'usr-2'],
      billingModel: 'HOURLY',
      feeArrangement: `Standard Partner Rates (${formatINR(850)}/hr)`,
      budgetCap,
      evergreenTrustMinimum,
      courtVenue,
      caseDocketNumber,
      openDate: new Date().toISOString().split('T')[0],
      description,
      hasActiveHold: false,
    });

    setShowAddModal(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-6 font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2.5 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Scale className="w-6 h-6 text-blue-500" />
            Active Matters Directory
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Firm matters portfolio, ethical wall screening status, and single-source-of-truth ledgers
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Intake New Matter</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 border rounded-2xl p-3 shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by matter number, title, or client..."
            className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* Practice Area Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {practiceAreas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedPracticeArea(area)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                selectedPracticeArea === area
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Matters List with Financial Strips */}
      <div className="space-y-4">
        {filteredMatters.map((matter) => {
          const auth = evaluateMatterAccess(currentUser, matter, ethicalWalls);
          const isScreened = !auth.isPermitted;

          return (
            <div
              key={matter.id}
              className={`border rounded-2xl p-5 space-y-4 transition-all shadow-xs ${
                isScreened
                  ? isDark
                    ? 'border-red-900/40 bg-red-950/20'
                    : 'border-red-200 bg-red-50/40'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 hover:border-blue-500/40 hover:shadow-md'
                  : 'bg-white border-slate-200 hover:border-blue-400/60 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isDark
                        ? 'text-blue-300 bg-blue-950/80 border-blue-800/60'
                        : 'text-blue-700 bg-blue-50 border-blue-200'
                    }`}>
                      {matter.matterNumber}
                    </span>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {matter.clientName}
                    </span>
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      {matter.practiceArea}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        matter.status === 'ACTIVE' || matter.status === 'MATTER_OPEN'
                          ? isDark
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isDark
                          ? 'bg-slate-950 text-slate-400 border-slate-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {matter.status}
                    </span>
                  </div>

                  <h3
                    onClick={() => {
                      setActiveMatterId(matter.id);
                      setMatterSubTab('overview');
                      setCurrentView('matters');
                    }}
                    className={`text-base font-bold transition-colors cursor-pointer ${
                      isDark ? 'text-white hover:text-blue-400' : 'text-slate-900 hover:text-blue-600'
                    }`}
                  >
                    {matter.title}
                  </h3>
                  <div className={`text-xs line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {matter.description}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {matter.hasActiveHold && (
                    <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-medium ${
                      isDark
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                      <span>Legal Hold</span>
                    </span>
                  )}

                  {isScreened ? (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      isDark
                        ? 'bg-red-950/80 text-red-300 border-red-800/80'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <span>Screened Under Ethical Wall</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        logMatterView(matter.id, matter.title, matter.matterNumber);
                        setActiveMatterId(matter.id);
                        setMatterSubTab('overview');
                        setCurrentView('matters');
                      }}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 ${
                        isDark
                          ? 'bg-slate-950 hover:bg-blue-600 text-slate-300 hover:text-white border-slate-800 hover:border-blue-500'
                          : 'bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white border-slate-200 hover:border-blue-500 shadow-xs'
                      }`}
                    >
                      Enter Matter Workspace →
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Strip */}
              {!isScreened ? (
                <MatterFinancialStrip matter={matter} />
              ) : (
                <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-3 text-xs text-red-300/90 italic flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    Financial metrics and ledger transactions isolated from {currentUser.name} by
                    Ethical Wall.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Intake New Matter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`rounded-3xl border shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-6 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>New Matter Intake</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-1 rounded-full transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatter} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Matter Number
                  </label>
                  <input
                    type="text"
                    required
                    value={matterNumber}
                    onChange={(e) => setMatterNumber(e.target.value)}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'} px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Client Account
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'} px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500`}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Matter Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. In re Apex Global Acquisition & Antitrust Review"
                  className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'} px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Practice Area
                  </label>
                  <select
                    value={practiceArea}
                    onChange={(e) => setPracticeArea(e.target.value as PracticeArea)}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'} px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500`}
                  >
                    {practiceAreas
                      .filter((a) => a !== 'ALL')
                      .map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Court / Venue
                  </label>
                  <input
                    type="text"
                    value={courtVenue}
                    onChange={(e) => setCourtVenue(e.target.value)}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'} px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Matter Budget Cap (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={budgetCap}
                    onChange={(e) => setBudgetCap(parseFloat(e.target.value) || 0)}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'} px-3 py-2 text-xs font-num font-bold text-slate-200 focus:outline-none focus:border-blue-500`}
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Formatted: {formatINR(budgetCap)}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Evergreen Trust Minimum (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={evergreenTrustMinimum}
                    onChange={(e) => setEvergreenTrustMinimum(parseFloat(e.target.value) || 0)}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'} px-3 py-2 text-xs font-num font-bold text-slate-200 focus:outline-none focus:border-blue-500`}
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Formatted: {formatINR(evergreenTrustMinimum)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Matter Description & Scope
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize claims, legal objectives, and key milestones..."
                  className={`w-full ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'} p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
                >
                  Confirm Intake & Provision Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
