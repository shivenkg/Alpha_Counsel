import React, { useState } from 'react';
import { CheckCircle2, Flag, Mail, Phone, Plus, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter, MatterParty } from '../../../types';

interface Props {
  matter: Matter;
}

export const PartiesTab: React.FC<Props> = ({ matter }) => {
  const { parties, theme } = useApp();
  const isDark = theme === 'dark';
  const matterParties = parties.filter((p) => p.matterId === matter.id);

  const [filterRole, setFilterRole] = useState<string>('ALL');

  const filteredParties = filterRole === 'ALL'
    ? matterParties
    : matterParties.filter((p) => p.role === filterRole);

  const rolesList = ['ALL', 'Client', 'Opposing Party', 'Co-Counsel', 'Opposing Counsel', 'Judge', 'Expert Witness'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Users className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            Matter Parties, Witnesses & Counsel
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Factual entities, adverse parties, experts and conflict check verification records
          </p>
        </div>

        {/* Filter controls */}
        <div className={`flex items-center gap-1 p-1 rounded-md border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {rolesList.map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterRole === role
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.map((party) => {
          const isConflictCleared = party.conflictStatus === 'CLEARED';
          return (
            <div
              key={party.id}
              className={`border rounded-xl p-4 space-y-3 transition-colors shadow-xs ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold block ${
                    isDark ? 'text-amber-400' : 'text-amber-700'
                  }`}>
                    {party.role}
                  </span>
                  <h4 className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{party.name}</h4>
                  {party.organization && (
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{party.organization}</div>
                  )}
                </div>

                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${
                    isConflictCleared
                      ? isDark
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                      : isDark
                      ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                      : 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {party.conflictStatus}
                </span>
              </div>

              {(party.email || party.phone) && (
                <div className={`pt-2 border-t space-y-1 text-xs ${isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                  {party.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className={`font-mono text-[11px] truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{party.email}</span>
                    </div>
                  )}
                  {party.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className={`font-mono text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{party.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {party.notes && (
                <div className={`text-[11px] p-2 rounded border italic ${
                  isDark ? 'text-slate-400 bg-slate-950/60 border-slate-800/60' : 'text-slate-600 bg-slate-50 border-slate-200'
                }`}>
                  "{party.notes}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
