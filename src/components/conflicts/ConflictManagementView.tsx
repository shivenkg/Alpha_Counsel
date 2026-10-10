import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building,
  CheckCircle2,
  FileCheck,
  Plus,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EthicalWall } from '../../types';

export const ConflictManagementView: React.FC = () => {
  const {
    ethicalWalls,
    addEthicalWall,
    toggleEthicalWall,
    parties,
    matters,
    clients,
    users,
    logAudit,
    currentUser,
    theme,
  } = useApp();

  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { type: string; name: string; matter: string; role: string; risk: 'HIGH' | 'MEDIUM' | 'CLEAR' }[]
  >([]);
  const [hasSearched, setHasSearched] = useState(false);

  // New Wall Modal
  const [showAddWallModal, setShowAddWallModal] = useState(false);
  const [selectedMatterId, setSelectedMatterId] = useState(matters[0]?.id || '');
  const [selectedUserId, setSelectedUserId] = useState(users[2]?.id || '');
  const [reason, setReason] = useState(
    'Prior direct representation of opposing party while at previous law firm (Model Rule 1.10)'
  );

  const handleRunSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const term = searchQuery.toLowerCase();
    const hits: typeof searchResults = [];

    // Search parties
    parties.forEach((p) => {
      if (
        p.name.toLowerCase().includes(term) ||
        (p.organization && p.organization.toLowerCase().includes(term))
      ) {
        const m = matters.find((item) => item.id === p.matterId);
        const isAdverse = p.role.includes('Opposing') || p.role.includes('Adverse');
        hits.push({
          type: 'Party / Entity',
          name: p.name,
          matter: m ? `[${m.matterNumber}] ${m.title}` : 'General Record',
          role: p.role,
          risk: isAdverse ? 'HIGH' : 'MEDIUM',
        });
      }
    });

    // Search clients
    clients.forEach((c) => {
      if (c.name.toLowerCase().includes(term)) {
        hits.push({
          type: 'Current Client',
          name: c.name,
          matter: 'Existing Institutional Account',
          role: 'Client',
          risk: 'HIGH',
        });
      }
    });

    setSearchResults(hits);
    setHasSearched(true);

    logAudit(
      'CONFLICT_CHECK_RUN',
      'System',
      'conflicts',
      `Conflict clearance query executed for "${searchQuery}" (${hits.length} hits identified).`
    );
  };

  const handleCreateWall = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMatter = matters.find((m) => m.id === selectedMatterId);
    const targetUser = users.find((u) => u.id === selectedUserId);
    if (!targetMatter || !targetUser) return;

    addEthicalWall({
      matterId: targetMatter.id,
      matterNumber: targetMatter.matterNumber,
      userId: targetUser.id,
      userName: targetUser.name,
      reason,
      active: true,
      screenedDate: new Date().toISOString().split('T')[0],
      authorizedBy: currentUser.name,
    });

    setShowAddWallModal(false);
  };

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 space-y-6 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-xl font-bold font-legal-heading flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <Shield className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
            Conflict Management & Ethical Wall Architecture
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Real-time adverse party clearing, ABA Model Rule 1.10 screening, and forensic audit logs
          </p>
        </div>

        <button
          onClick={() => setShowAddWallModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Erect New Ethical Wall</span>
        </button>
      </div>

      {/* Real-time Conflict Search Engine Box */}
      <div
        className={`rounded-xl p-5 space-y-4 border ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Search className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
            <h3
              className={`text-sm font-semibold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              Universal Conflict Clearance Query Engine
            </h3>
          </div>
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Searches: Active Parties, Adverse Entities, Former Clients, Witnesses, Judges
          </span>
        </div>

        <form onSubmit={handleRunSearch} className="flex gap-2">
          <input
            type="text"
            required
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prospective party, corporation, executive or counsel (e.g. 'Synthex', 'Horizon', 'Vance')..."
            className={`flex-1 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Execute Conflict Check</span>
          </button>
        </form>

        {hasSearched && (
          <div className="pt-2 space-y-3">
            <div
              className={`text-xs font-semibold uppercase tracking-wider flex items-center justify-between ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <span>Query Results for "{searchQuery}"</span>
              <span className={`font-num ${isDark ? 'text-amber-400' : 'text-blue-600'}`}>
                {searchResults.length} Matches Found
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div
                className={`rounded-lg p-4 flex items-center gap-3 text-xs border ${
                  isDark
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong>No Conflicts Detected:</strong> The queried entity "{searchQuery}" has no
                  active adverse engagements or prior representation conflicts on file. Ready for
                  formal partner intake clearance.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((hit, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg flex items-center justify-between text-xs border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          {hit.name}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                            isDark
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {hit.type}
                        </span>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          · {hit.role}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {hit.matter}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        hit.risk === 'HIGH'
                          ? isDark
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                          : isDark
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {hit.risk} Conflict Risk
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Ethical Walls Manager */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            className={`text-sm font-semibold flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
            Active Ethical Screening Walls (Firm Security Ceiling)
          </h2>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            System enforces isolation across search, documents, time entries, and AI processing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ethicalWalls.map((wall) => (
            <div
              key={wall.id}
              className={`rounded-xl p-5 space-y-3 transition-colors border ${
                isDark
                  ? `bg-slate-900/90 ${
                      wall.active ? 'border-amber-900/60' : 'border-slate-800 opacity-60'
                    }`
                  : `bg-white shadow-xs ${
                      wall.active
                        ? 'border-amber-300 ring-1 ring-amber-100'
                        : 'border-slate-200 opacity-60'
                    }`
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                        isDark
                          ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                          : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}
                    >
                      {wall.matterNumber}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        wall.active
                          ? isDark
                            ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          : isDark
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {wall.active ? 'SCREEN IN EFFECT' : 'INACTIVE'}
                    </span>
                  </div>
                  <h3
                    className={`text-sm font-bold mt-1 ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    Screened Attorney: {wall.userName}
                  </h3>
                </div>

                <button
                  onClick={() => toggleEthicalWall(wall.id)}
                  className={`text-xs underline font-mono ${
                    isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {wall.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>

              <div
                className={`text-xs p-2.5 rounded border ${
                  isDark
                    ? 'text-slate-300 bg-slate-950/60 border-slate-800/80'
                    : 'text-slate-700 bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Legal Justification:{' '}
                </span>
                {wall.reason}
              </div>

              <div
                className={`pt-2 border-t flex items-center justify-between text-[11px] font-mono ${
                  isDark
                    ? 'border-slate-800/80 text-slate-400'
                    : 'border-slate-100 text-slate-500'
                }`}
              >
                <span>Authorized By: {wall.authorizedBy}</span>
                <span>Screened Since: {wall.screenedDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Erect New Wall Modal */}
      {showAddWallModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h3
              className={`text-sm font-semibold flex items-center gap-2 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
              Erect New Ethical Screening Barrier
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Isolates the designated individual from all matter records, searches, vault documents,
              financial items, and AI context.
            </p>

            <form onSubmit={handleCreateWall} className="space-y-3">
              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Target Matter to Screen
                </label>
                <select
                  value={selectedMatterId}
                  onChange={(e) => setSelectedMatterId(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {matters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.matterNumber} — {m.title.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Screened Personnel
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {users
                    .filter((u) => u.role !== 'CLIENT_CONTACT')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.replace(/_/g, ' ')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Model Rule 1.10 Ethical Wall Justification
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Attorney previously participated in opposing counsel discussions at prior firm..."
                  className={`w-full rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border resize-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWallModal(false)}
                  className={`px-3 py-1.5 text-xs ${
                    isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition-colors shadow"
                >
                  Confirm & Seal Ethical Wall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
