import React from 'react';
import {
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Gavel,
  IndianRupee,
  Lock,
  Scale,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter, MatterStatus } from '../../../types';
import { MatterFinancialStrip } from '../MatterFinancialStrip';

interface Props {
  matter: Matter;
}

const STATUS_STEPS: MatterStatus[] = [
  'INTAKE',
  'CONFLICT_CHECK',
  'APPROVAL',
  'MATTER_OPEN',
  'ACTIVE',
  'CLOSED',
  'ARCHIVED',
];

export const OverviewTab: React.FC<Props> = ({ matter }) => {
  const { users, clients, ethicalWalls, theme } = useApp();

  const isDark = theme === 'dark';

  const client = clients.find((c) => c.id === matter.clientId);
  const leadPartner = users.find((u) => u.id === matter.leadPartnerId);
  const assignedTeam = users.filter((u) => matter.assignedUserIds.includes(u.id));

  // Check if any ethical walls screen personnel from this matter
  const activeWalls = ethicalWalls.filter((w) => w.active && w.matterId === matter.id);

  const currentStepIndex = STATUS_STEPS.indexOf(matter.status);

  return (
    <div className="space-y-6">
      {/* Matter Financial Strip */}
      <MatterFinancialStrip matter={matter} />

      {/* Lifecycle Status Stepper */}
      <div className={`border rounded-xl p-4 shadow-xs ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`text-[11px] uppercase tracking-wider font-semibold mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Matter Lifecycle Status
        </div>
        <div className="flex items-center justify-between relative overflow-x-auto pb-2">
          {STATUS_STEPS.map((step, idx) => {
            const isComplete = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step} className="flex flex-col items-center min-w-[90px] relative z-10">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 font-bold'
                      : isComplete
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                      : isDark
                      ? 'bg-slate-800 text-slate-500 border border-slate-700'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isComplete ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-medium tracking-tight whitespace-nowrap ${
                    isCurrent
                      ? isDark ? 'text-amber-400 font-semibold' : 'text-amber-700 font-bold'
                      : isComplete
                      ? isDark ? 'text-slate-200' : 'text-slate-700'
                      : isDark ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core Matter Attributes & Legal Team */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Case Dossier */}
        <div className={`md:col-span-2 border rounded-xl p-5 space-y-4 shadow-xs ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <Scale className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              Case Dossier & Court Docket
            </h3>
            {matter.hasActiveHold && (
              <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border font-medium ${
                isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                <Lock className="w-3 h-3 text-amber-500" />
                Legal Hold Active
              </span>
            )}
          </div>

          <div className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{matter.description}</div>

          <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t text-xs ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
            <div>
              <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Court / Venue</div>
              <div className={`font-medium mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{matter.courtVenue || 'Private Forum'}</div>
            </div>
            <div>
              <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Presiding Judge</div>
              <div className={`font-medium mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{matter.judge || 'Arbitrator Panel'}</div>
            </div>
            <div>
              <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Docket Number</div>
              <div className={`font-mono mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{matter.caseDocketNumber || 'N/A'}</div>
            </div>
            <div>
              <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fee Arrangement</div>
              <div className={`font-medium mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-700 font-semibold'}`}>{matter.feeArrangement}</div>
            </div>
            <div>
              <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Budget Cap</div>
              <div className={`font-num mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900 font-semibold'}`}>
                {matter.budgetCap ? `₹${matter.budgetCap.toLocaleString('en-IN')}` : 'Uncapped'}
              </div>
            </div>
            <div>
              <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Evergreen Minimum</div>
              <div className={`font-num mt-0.5 ${isDark ? 'text-sky-300' : 'text-blue-700 font-semibold'}`}>
                ₹{matter.evergreenTrustMinimum.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Legal Team & Ethical Walls */}
        <div className={`border rounded-xl p-5 space-y-4 shadow-xs ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <Users className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              Legal Team
            </h3>
            <span className={`text-[10px] font-num ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{assignedTeam.length} Assigned</span>
          </div>

          <div className="space-y-3">
            {leadPartner && (
              <div className={`p-2.5 rounded border ${isDark ? 'bg-slate-950/60 border-amber-500/20' : 'bg-amber-50/70 border-amber-200/80'}`}>
                <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                  Lead Trial Partner
                </div>
                <div className={`text-xs font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{leadPartner.name}</div>
                <div className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {leadPartner.email} · ₹{leadPartner.billingRate}/hr
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Assigned Personnel</div>
              {assignedTeam
                .filter((u) => u.id !== matter.leadPartnerId)
                .map((user) => (
                  <div key={user.id} className={`flex items-center justify-between text-xs py-1.5 border-b ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
                    <div>
                      <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{user.name}</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.role.replace(/_/g, ' ')}</div>
                    </div>
                    <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>₹{user.billingRate}/hr</span>
                  </div>
                ))}
            </div>

            {/* Ethical Walls for this matter */}
            {activeWalls.length > 0 && (
              <div className={`p-2.5 rounded text-[11px] border ${isDark ? 'bg-red-950/30 border-red-800/40 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="flex items-center gap-1.5 font-semibold text-red-500 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Ethical Wall In Effect</span>
                </div>
                {activeWalls.map((w) => (
                  <div key={w.id}>
                    Screened: <span className="font-medium text-red-900 dark:text-white">{w.userName}</span> ({w.reason.slice(0, 60)}...)
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
