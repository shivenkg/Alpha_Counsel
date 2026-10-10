import React, { useEffect, useState } from 'react';
import {
  FileText,
  FolderLock,
  Lock,
  Receipt,
  Scale,
  Search,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateMatterAccess } from '../../services/matterPolicy';
import { formatCurrency } from '../../services/financials';

export const GlobalSearchModal: React.FC = () => {
  const {
    theme,
    currentView,
    setCurrentView,
    matters,
    documents,
    parties,
    invoices,
    setActiveMatterId,
    setMatterSubTab,
    currentUser,
    ethicalWalls,
  } = useApp();

  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');

  // Handle keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentView === 'search') {
        setCurrentView('dashboard');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCurrentView('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, setCurrentView]);

  if (currentView !== 'search') return null;

  const term = query.toLowerCase().trim();

  // Search Matters (evaluate access)
  const matchedMatters = term
    ? matters.filter((m) => {
        const matches =
          m.matterNumber.toLowerCase().includes(term) ||
          m.title.toLowerCase().includes(term) ||
          m.clientName.toLowerCase().includes(term) ||
          m.practiceArea.toLowerCase().includes(term);
        return matches;
      })
    : [];

  // Search Documents (strictly filter out matters screened by ethical wall)
  const matchedDocs = term
    ? documents.filter((d) => {
        const m = matters.find((item) => item.id === d.matterId);
        if (!m) return false;
        const auth = evaluateMatterAccess(currentUser, m, ethicalWalls);
        if (!auth.isPermitted) return false; // Invariant: Screened matters are not returned in search!

        return (
          d.title.toLowerCase().includes(term) ||
          d.fileName.toLowerCase().includes(term) ||
          (d.ocrExtractedText && d.ocrExtractedText.toLowerCase().includes(term))
        );
      })
    : [];

  // Search Parties
  const matchedParties = term
    ? parties.filter((p) => {
        const m = matters.find((item) => item.id === p.matterId);
        if (m) {
          const auth = evaluateMatterAccess(currentUser, m, ethicalWalls);
          if (!auth.isPermitted) return false;
        }
        return (
          p.name.toLowerCase().includes(term) ||
          (p.organization && p.organization.toLowerCase().includes(term)) ||
          p.role.toLowerCase().includes(term)
        );
      })
    : [];

  // Search Invoices
  const matchedInvoices = term
    ? invoices.filter((i) => {
        const m = matters.find((item) => item.id === i.matterId);
        if (m) {
          const auth = evaluateMatterAccess(currentUser, m, ethicalWalls);
          if (!auth.isPermitted) return false;
        }
        return (
          i.invoiceNumber.toLowerCase().includes(term) ||
          (i.matterNumber && i.matterNumber.toLowerCase().includes(term)) ||
          (m && m.matterNumber.toLowerCase().includes(term))
        );
      })
    : [];

  const handleSelectMatter = (matterId: string) => {
    setActiveMatterId(matterId);
    setMatterSubTab('overview');
    setCurrentView('matters');
  };

  const handleSelectDoc = (docMatterId: string) => {
    setActiveMatterId(docMatterId);
    setMatterSubTab('documents');
    setCurrentView('matters');
  };

  const totalHits =
    matchedMatters.length + matchedDocs.length + matchedParties.length + matchedInvoices.length;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setCurrentView('dashboard');
        }
      }}
      className={`fixed inset-0 backdrop-blur-md flex items-start justify-center pt-20 p-4 z-50 transition-colors ${
        isDark ? 'bg-black/75' : 'bg-slate-900/40'
      }`}
    >
      <div
        className={`border rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/80'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Search Input Bar */}
        <div
          className={`flex items-center px-4 py-3 border-b gap-3 ${
            isDark
              ? 'bg-slate-950/80 border-slate-800'
              : 'bg-slate-50/90 border-slate-200'
          }`}
        >
          <Search className={`w-5 h-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search matters, OCR vault, parties, or invoices..."
            className={`flex-1 bg-transparent text-sm focus:outline-none ${
              isDark
                ? 'text-slate-100 placeholder-slate-500'
                : 'text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`p-1 rounded-md transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
          {!term ? (
            <div className="text-center py-10 text-xs space-y-2">
              <Search className={`w-8 h-8 mx-auto ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                Type keywords to search across Counsel Repos legal database.
              </p>
              <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Ethical walls are actively enforced. Screened matter records are automatically excluded.
              </p>
            </div>
          ) : totalHits === 0 ? (
            <div className={`text-center py-10 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No authorized records match "{query}".
            </div>
          ) : (
            <>
              {/* Matters */}
              {matchedMatters.length > 0 && (
                <div className="space-y-1.5">
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-amber-400' : 'text-amber-600'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Matters ({matchedMatters.length})
                  </div>
                  {matchedMatters.map((m) => {
                    const auth = evaluateMatterAccess(currentUser, m, ethicalWalls);
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleSelectMatter(m.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors text-xs ${
                          isDark
                            ? 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80'
                            : 'bg-slate-50/80 hover:bg-blue-50/70 border-slate-200 hover:border-blue-300 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-semibold ${
                                isDark ? 'text-amber-400' : 'text-blue-600'
                              }`}
                            >
                              {m.matterNumber}
                            </span>
                            <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                              {m.title}
                            </span>
                          </div>
                          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {m.clientName}
                          </span>
                        </div>
                        {!auth.isPermitted && (
                          <span
                            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                              isDark
                                ? 'text-red-400 bg-red-950/50 border-red-800'
                                : 'text-red-700 bg-red-50 border-red-200 font-medium'
                            }`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            Screened
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Documents Vault (OCR) */}
              {matchedDocs.length > 0 && (
                <div className="space-y-1.5">
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-sky-400' : 'text-sky-600'
                    }`}
                  >
                    <FolderLock className="w-3.5 h-3.5" />
                    Document Vault & OCR Index ({matchedDocs.length})
                  </div>
                  {matchedDocs.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleSelectDoc(d.matterId)}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors text-xs ${
                        isDark
                          ? 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80'
                          : 'bg-slate-50/80 hover:bg-sky-50/70 border-slate-200 hover:border-sky-300 shadow-xs'
                      }`}
                    >
                      <div className="max-w-md">
                        <div
                          className={`font-medium flex items-center gap-2 ${
                            isDark ? 'text-slate-200' : 'text-slate-900'
                          }`}
                        >
                          <FileText
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isDark ? 'text-amber-400' : 'text-blue-600'
                            }`}
                          />
                          <span className="truncate">{d.title}</span>
                        </div>
                        {d.ocrExtractedText && (
                          <div
                            className={`text-[11px] line-clamp-1 italic mt-0.5 ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            "{d.ocrExtractedText}"
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isDark
                            ? 'text-slate-400 bg-slate-800/50 border-slate-700/50'
                            : 'text-slate-600 bg-slate-100 border-slate-200'
                        }`}
                      >
                        {d.folder}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Parties */}
              {matchedParties.length > 0 && (
                <div className="space-y-1.5">
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-emerald-400' : 'text-emerald-600'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Parties & Counsel ({matchedParties.length})
                  </div>
                  {matchedParties.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectMatter(p.matterId)}
                      className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isDark
                          ? 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80'
                          : 'bg-slate-50/80 hover:bg-emerald-50/70 border-slate-200 hover:border-emerald-300 shadow-xs'
                      }`}
                    >
                      <div>
                        <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          {p.name}
                        </span>
                        {p.organization && (
                          <span className={`ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            ({p.organization})
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                          isDark
                            ? 'text-amber-300 bg-amber-950/40 border-amber-800/50'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Invoices */}
              {matchedInvoices.length > 0 && (
                <div className="space-y-1.5">
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-amber-400' : 'text-amber-600'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Invoices ({matchedInvoices.length})
                  </div>
                  {matchedInvoices.map((i) => (
                    <div
                      key={i.id}
                      onClick={() => {
                        setActiveMatterId(i.matterId);
                        setMatterSubTab('invoices');
                        setCurrentView('matters');
                      }}
                      className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isDark
                          ? 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80'
                          : 'bg-slate-50/80 hover:bg-amber-50/70 border-slate-200 hover:border-amber-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-semibold ${
                            isDark ? 'text-amber-300' : 'text-amber-700'
                          }`}
                        >
                          {i.invoiceNumber}
                        </span>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          · Matter: {i.matterNumber || matters.find((m) => m.id === i.matterId)?.matterNumber}
                        </span>
                      </div>
                      <span
                        className={`font-num font-semibold ${
                          isDark ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(i.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
