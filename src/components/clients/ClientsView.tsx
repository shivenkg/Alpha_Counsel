import React, { useState } from 'react';
import {
  Building,
  IndianRupee,
  Landmark,
  Mail,
  Phone,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateMatterFinancials, formatCurrency } from '../../services/financials';
import { Client } from '../../types';

export const ClientsView: React.FC = () => {
  const {
    clients,
    matters,
    timeEntries,
    expenses,
    invoices,
    payments,
    trustTransactions,
    setActiveMatterId,
    setCurrentView,
    theme,
  } = useApp();

  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.primaryContactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 space-y-6 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-xl font-bold font-legal-heading flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <Building className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
            Corporate Clients & Institutional Accounts
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Client relationship dossiers, billing agreements, and aggregated account balances
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by client name, industry, or contact..."
          className={`w-full rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-amber-500/50'
              : 'bg-white border-slate-300 text-slate-900 shadow-xs'
          }`}
        />
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredClients.map((client) => {
          const clientMatters = matters.filter((m) => m.clientId === client.id);

          // Aggregate financials across all matters of this client
          let totalWip = 0;
          let totalBilled = 0;
          let totalPaid = 0;
          let totalTrust = 0;

          clientMatters.forEach((m) => {
            const f = calculateMatterFinancials(
              m.id,
              timeEntries,
              expenses,
              invoices,
              payments,
              trustTransactions
            );
            totalWip += f.unbilledWip;
            totalBilled += f.billed;
            totalPaid += f.paid;
            totalTrust += f.trustBalance;
          });

          const totalAr = Math.max(0, totalBilled - totalPaid);

          return (
            <div
              key={client.id}
              className={`rounded-xl p-5 space-y-4 border transition-all ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-[10px] uppercase font-semibold tracking-wider ${
                      isDark ? 'text-amber-400' : 'text-blue-600'
                    }`}
                  >
                    {client.industry} · Tier: {client.billingTier}
                  </span>
                  <h3
                    className={`text-base font-bold mt-0.5 ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    {client.name}
                  </h3>
                  <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {client.address}
                  </div>
                </div>

                <span
                  className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    isDark
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Conflict Cleared
                </span>
              </div>

              {/* Primary Contact */}
              <div
                className={`border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ${
                  isDark
                    ? 'bg-slate-950/60 border-slate-800/80'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div
                  className={`flex items-center gap-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{client.primaryContactName}</span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ({client.primaryContactTitle})
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 font-mono text-[11px] ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{client.primaryContactEmail}</span>
                </div>
              </div>

              {/* Aggregate Financial Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div
                  className={`border rounded p-2 ${
                    isDark
                      ? 'bg-slate-950/40 border-slate-800/60'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Unbilled WIP
                  </div>
                  <div
                    className={`text-sm font-semibold font-num mt-0.5 ${
                      isDark ? 'text-amber-300' : 'text-amber-600'
                    }`}
                  >
                    {formatCurrency(totalWip)}
                  </div>
                </div>

                <div
                  className={`border rounded p-2 ${
                    isDark
                      ? 'bg-slate-950/40 border-slate-800/60'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Outstanding A/R
                  </div>
                  <div
                    className={`text-sm font-semibold font-num mt-0.5 ${
                      isDark ? 'text-rose-300' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(totalAr)}
                  </div>
                </div>

                <div
                  className={`border rounded p-2 ${
                    isDark
                      ? 'bg-slate-950/40 border-slate-800/60'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Escrow Trust
                  </div>
                  <div
                    className={`text-sm font-semibold font-num mt-0.5 ${
                      isDark ? 'text-sky-300' : 'text-blue-600'
                    }`}
                  >
                    {formatCurrency(totalTrust)}
                  </div>
                </div>
              </div>

              {/* Active Matters List */}
              <div
                className={`pt-2 border-t space-y-1.5 ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}
              >
                <div
                  className={`text-[10px] uppercase font-semibold tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Active Client Matters ({clientMatters.length})
                </div>
                {clientMatters.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setActiveMatterId(m.id);
                      setCurrentView('matters');
                    }}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs border ${
                      isDark
                        ? 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/50'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[10px] font-semibold ${
                          isDark ? 'text-amber-400' : 'text-blue-700'
                        }`}
                      >
                        {m.matterNumber}
                      </span>
                      <span
                        className={`font-medium truncate max-w-[280px] ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      >
                        {m.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {m.practiceArea}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
