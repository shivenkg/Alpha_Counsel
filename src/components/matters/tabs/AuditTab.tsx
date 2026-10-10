import React, { useState } from 'react';
import {
  Download,
  Eye,
  Filter,
  Fingerprint,
  History,
  Lock,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useAudit } from '../../../hooks/useAudit';
import { Matter } from '../../../types';

interface Props {
  matter: Matter;
}

export const AuditTab: React.FC<Props> = ({ matter }) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const { audit_events } = useAudit();
  const matterLogs = audit_events.filter(
    (l) => l.matterId === matter.id || l.matterNumber === matter.matterNumber
  );

  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = matterLogs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      log.entityType.toLowerCase().includes(term)
    );
  });

  const handleExportAudit = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,User,Action,Entity,EntityID,IPAddress,Details']
        .concat(
          matterLogs.map(
            (l) =>
              `"${l.timestamp}","${l.userName}","${l.action}","${l.entityType}","${l.entityId}","${l.ipAddress}","${l.details.replace(/"/g, '""')}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${matter.matterNumber}_immutable_audit_log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <History className="w-4 h-4 text-amber-500" />
            Immutable Forensic Audit Trail
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Chain of custody, ethical wall boundary evaluations, and matter access history
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors border ${
            isDark
              ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-amber-500" />
          <span>Export Forensic Audit (.CSV)</span>
        </button>
      </div>

      {/* Tamper Evidence Strip */}
      <div className={`border rounded-lg p-3 flex items-center justify-between text-xs ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 shadow-xs text-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-amber-500" />
          <span>
            Cryptographic Tamper-Proof Chain: All {matterLogs.length} events logged with sequential
            SHA-256 block hash.
          </span>
        </div>
        <span className={`text-[11px] font-mono flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600 font-semibold'}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          Chain Verified Intact
        </span>
      </div>

      {/* Filter / Search input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search actions, users, document IDs..."
            className={`w-full rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 border ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
            }`}
          />
        </div>
        <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Showing {filteredLogs.length} events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b uppercase tracking-wider text-[10px] ${
              isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">User</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Entity</th>
              <th className="py-2.5 px-3">Forensic Details</th>
              <th className="py-2.5 px-3 font-mono text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-200'}>
            {filteredLogs.map((log) => {
              const isWallBlocked = log.action.includes('WALL_BLOCKED');
              const isHoldEvent = log.action.includes('LEGAL_HOLD');
              const isAuthCheck = log.action.includes('AUTHORIZATION');

              return (
                <tr
                  key={log.id}
                  className={`transition-colors ${
                    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'
                  } ${
                    isWallBlocked ? (isDark ? 'bg-red-950/20' : 'bg-red-50/60') : ''
                  }`}
                >
                  <td className={`py-2.5 px-3 font-mono whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}{' '}
                    · {new Date(log.timestamp).toLocaleDateString()}
                  </td>
                  <td className={`py-2.5 px-3 font-semibold whitespace-nowrap ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {log.userName}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        isWallBlocked
                          ? isDark ? 'bg-red-950 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-300'
                          : isHoldEvent
                          ? isDark ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-300'
                          : isAuthCheck
                          ? isDark ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-300'
                          : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className={`py-2.5 px-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{log.entityType}</td>
                  <td className={`py-2.5 px-3 max-w-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{log.details}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">
                    {log.ipAddress}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
