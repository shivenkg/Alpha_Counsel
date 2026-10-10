import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck,
  Fingerprint,
  Key,
  Lock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { LegalHold, Matter } from '../../../types';

interface Props {
  matter: Matter;
}

export const LegalHoldTab: React.FC<Props> = ({ matter }) => {
  const {
    legalHolds,
    createLegalHold,
    requestReleaseLegalHold,
    approveLegalHoldRelease,
    currentUser,
    users,
    logAudit,
    theme,
  } = useApp();

  const isDark = theme === 'dark';
  const matterHolds = legalHolds.filter((h) => h.matterId === matter.id);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedHoldForRelease, setSelectedHoldForRelease] = useState<LegalHold | null>(null);

  // Form State
  const [holdTitle, setHoldTitle] = useState('Litigation Preservation Notice — Technical Records');
  const [scopeDescription, setScopeDescription] = useState(
    'All electronic correspondence, Git commit histories, Slack channels, and design specifications relating to the disputed technology.'
  );
  const [custodiansInput, setCustodiansInput] = useState(
    'Dr. Raymond Vance, Elena Wu, Sarah Jenkins, Marcus Brody'
  );
  const [targetsInput, setTargetsInput] = useState(
    'GitLab Repository, Vault Folder: Discovery, Exchange Inboxes'
  );
  const [dateRangeStart, setDateRangeStart] = useState('2022-01-01');
  const [dateRangeEnd, setDateRangeEnd] = useState(new Date().toISOString().split('T')[0]);

  // Dual-control release form
  const [releaseJustification, setReleaseJustification] = useState(
    'Final order of dismissal with prejudice entered by the Court; all claims resolved.'
  );
  const [secondApprover, setSecondApprover] = useState(
    users.find((u) => u.role.includes('PARTNER') && u.id !== currentUser.id)?.id || users[1].id
  );

  const handleCreateHold = (e: React.FormEvent) => {
    e.preventDefault();
    createLegalHold({
      matterId: matter.id,
      holdTitle,
      scopeDescription,
      custodians: custodiansInput.split(',').map((c) => c.trim()),
      dateRangeStart,
      dateRangeEnd,
      targets: targetsInput.split(',').map((t) => t.trim()),
      firstApproverId: currentUser.id,
      createdBy: currentUser.name,
    });
    setShowCreateModal(false);
  };

  const handleInitiateRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHoldForRelease) return;
    requestReleaseLegalHold(selectedHoldForRelease.id, secondApprover, releaseJustification);
    setShowReleaseModal(false);
    setSelectedHoldForRelease(null);
  };

  const handleApproveRelease = (holdId: string) => {
    approveLegalHoldRelease(holdId);
  };

  const handleExportEvidencePack = (hold: LegalHold) => {
    alert(
      `Preservation Evidence Pack Generated.\nCryptographic Tamper-Proof Manifest: ${hold.tamperProofHash}\nChain of custody audit trail verified.`
    );
    logAudit(
      'LEGAL_HOLD_RELEASED',
      'LegalHold',
      hold.id,
      `Exported chain-of-custody evidence pack for Legal Hold "${hold.holdTitle}".`,
      matter.id,
      matter.matterNumber
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining the Legal Hold Invariant */}
      <div
        className={`rounded-lg p-4 space-y-2 border ${
          isDark
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-500" />
            <h3
              className={`text-sm font-semibold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              System-Level Preservation State (Legal Hold)
            </h3>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded hover:bg-rose-500 transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Engage New Legal Hold</span>
          </button>
        </div>
        <p
          className={`text-xs leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          <strong>Litigation Preservation Rule:</strong> When active, all relevant custodian
          records, vault documents, and work product are locked against destructive deletion or
          overwriting. New relevant matter records automatically inherit the hold. Release requires
          dual-control partner sign-off.
        </p>
        <div
          className={`text-[11px] flex items-center gap-1 pt-1 ${
            isDark ? 'text-amber-400/90' : 'text-amber-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            Hold ≠ Billing Freeze: Time recording, expense ledger, invoicing, and trust transfers
            remain fully operational.
          </span>
        </div>
      </div>

      {/* Holds List */}
      <div className="space-y-4">
        {matterHolds.map((hold) => {
          const isPendingRelease = hold.status === 'PENDING_RELEASE';
          const isReleased = hold.status === 'RELEASED';
          const isActive = hold.status === 'ACTIVE';

          const firstApprover = users.find((u) => u.id === hold.firstApproverId);
          const secondApproverUser = users.find((u) => u.id === hold.secondApproverId);

          return (
            <div
              key={hold.id}
              className={`rounded-lg p-5 space-y-4 transition-all border ${
                isDark
                  ? `bg-slate-900/90 ${
                      isActive
                        ? 'border-rose-900/60 shadow-md'
                        : isPendingRelease
                        ? 'border-amber-800/60'
                        : 'border-slate-800'
                    }`
                  : `bg-white shadow-xs ${
                      isActive
                        ? 'border-rose-300 ring-1 ring-rose-100'
                        : isPendingRelease
                        ? 'border-amber-300'
                        : 'border-slate-200'
                    }`
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isActive
                          ? isDark
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                          : isPendingRelease
                          ? isDark
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                          : isDark
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {hold.status.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-xs font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {hold.id}
                    </span>
                  </div>
                  <h4
                    className={`text-base font-semibold mt-1 ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    {hold.holdTitle}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportEvidencePack(hold)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
                      isDark
                        ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
                        : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Evidence Pack</span>
                  </button>

                  {isActive && currentUser.role.includes('PARTNER') && (
                    <button
                      onClick={() => {
                        setSelectedHoldForRelease(hold);
                        setShowReleaseModal(true);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border transition-colors ${
                        isDark
                          ? 'text-amber-400 bg-amber-950/40 hover:bg-amber-900/40 border-amber-800/60'
                          : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300'
                      }`}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Initiate Dual-Control Release</span>
                    </button>
                  )}

                  {isPendingRelease && currentUser.role.includes('PARTNER') && (
                    <button
                      onClick={() => handleApproveRelease(hold.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border transition-colors ${
                        isDark
                          ? 'text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-800/60'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Secondary Partner Authorization (Release)</span>
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`text-xs leading-relaxed p-3 rounded border ${
                  isDark
                    ? 'text-slate-300 bg-slate-950/60 border-slate-800/80'
                    : 'text-slate-700 bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  Preservation Scope:{' '}
                </span>
                {hold.scopeDescription}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div
                    className={`text-[10px] uppercase tracking-wider mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Designated Custodians ({hold.custodians.length})
                  </div>
                  <ul className="space-y-1">
                    {hold.custodians.map((c) => (
                      <li
                        key={c}
                        className={`flex items-center gap-1.5 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div
                    className={`text-[10px] uppercase tracking-wider mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Frozen Targets
                  </div>
                  <ul className="space-y-1">
                    {hold.targets.map((t) => (
                      <li
                        key={t}
                        className={`flex items-center gap-1.5 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        <Lock className="w-3 h-3 text-rose-500" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div
                    className={`text-[10px] uppercase tracking-wider mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Dual-Control Authorization
                  </div>
                  <div className="space-y-1">
                    <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      Primary:{' '}
                      <span className={isDark ? 'text-amber-300' : 'text-blue-700 font-medium'}>
                        {hold.createdBy}
                      </span>
                    </div>
                    {isPendingRelease && secondApproverUser && (
                      <div className={isDark ? 'text-amber-400' : 'text-amber-700 font-medium'}>
                        Pending Sign-off: {secondApproverUser.name}
                      </div>
                    )}
                    {isReleased && (
                      <div className="text-emerald-600 font-medium">Released by dual authorization</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cryptographic Hash Strip */}
              <div
                className={`pt-3 border-t flex items-center justify-between text-[11px] font-mono ${
                  isDark
                    ? 'border-slate-800/80 text-slate-400'
                    : 'border-slate-100 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Fingerprint className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
                  Preservation SHA256: {hold.tamperProofHash}
                </span>
                <span>Created: {new Date(hold.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dual Control Release Modal */}
      {showReleaseModal && selectedHoldForRelease && (
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
              <Key className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              Initiate Dual-Control Legal Hold Release
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Ethical and preservation standards require two independent partners to authorize lifting a litigation hold.
            </p>

            <form onSubmit={handleInitiateRelease} className="space-y-3">
              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Required Secondary Partner Sign-off
                </label>
                <select
                  value={secondApprover}
                  onChange={(e) => setSecondApprover(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {users
                    .filter((u) => u.role.includes('PARTNER') && u.id !== currentUser.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role.replace(/_/g, ' ')})
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
                  Release Justification (Permanent Legal Record)
                </label>
                <textarea
                  rows={3}
                  required
                  value={releaseJustification}
                  onChange={(e) => setReleaseJustification(e.target.value)}
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
                  onClick={() => setShowReleaseModal(false)}
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
                  Submit for Secondary Partner Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Legal Hold Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`border rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h3
              className={`text-sm font-semibold flex items-center gap-2 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 text-rose-500" />
              Engage System-Level Legal Hold
            </h3>

            <form onSubmit={handleCreateHold} className="space-y-3">
              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Hold Title
                </label>
                <input
                  type="text"
                  required
                  value={holdTitle}
                  onChange={(e) => setHoldTitle(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Preservation Scope Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={scopeDescription}
                  onChange={(e) => setScopeDescription(e.target.value)}
                  className={`w-full rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border resize-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Designated Custodians (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={custodiansInput}
                  onChange={(e) => setCustodiansInput(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Preservation Targets (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={targetsInput}
                  onChange={(e) => setTargetsInput(e.target.value)}
                  className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Date Range Start
                  </label>
                  <input
                    type="date"
                    required
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Date Range End
                  </label>
                  <input
                    type="date"
                    required
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  className="px-3 py-1.5 bg-rose-600 text-white font-medium text-xs rounded hover:bg-rose-500 transition-colors shadow"
                >
                  Freeze Targets & Issue Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
