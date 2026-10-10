import React, { useState } from 'react';
import { Calendar, Clock, FileText, Filter, Milestone, Plus, Tag } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ChronologyEvent, Matter } from '../../../types';

interface Props {
  matter: Matter;
}

export const ChronologyTab: React.FC<Props> = ({ matter }) => {
  const { chronology, addChronology, documents, theme } = useApp();
  const isDark = theme === 'dark';
  const matterEvents = chronology
    .filter((e) => e.matterId === matter.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ChronologyEvent['category']>('Factual Event');
  const [significance, setSignificance] = useState<ChronologyEvent['significance']>('Major');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    addChronology({
      matterId: matter.id,
      title,
      date,
      category,
      significance,
      description,
      author: 'Lead Counsel',
    });
    setShowAddModal(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3
            className={`text-sm font-semibold flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <Milestone className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
            Evidentiary & Procedural Chronology
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Factual timeline of pivotal events, pleadings, and sworn depositions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Chronology Event</span>
        </button>
      </div>

      {/* Timeline Stream */}
      <div
        className={`relative border-l ml-4 pl-6 space-y-6 py-2 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        {matterEvents.map((evt) => {
          const linkedDoc = documents.find((d) => d.id === evt.linkedDocumentId);
          return (
            <div key={evt.id} className="relative group">
              {/* Node Indicator */}
              <div
                className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                  isDark ? 'border-slate-950' : 'border-slate-100'
                } ${
                  evt.significance === 'Critical'
                    ? 'bg-rose-500 ring-4 ring-rose-500/20'
                    : evt.significance === 'Major'
                    ? 'bg-amber-400 ring-2 ring-amber-400/20'
                    : 'bg-slate-400'
                }`}
              />

              <div
                className={`rounded-lg p-4 transition-colors space-y-2 border ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div
                      className={`flex items-center gap-2 text-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`font-mono font-semibold ${
                          isDark ? 'text-amber-300' : 'text-blue-700'
                        }`}
                      >
                        {evt.date}
                      </span>
                      <span>·</span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        {evt.category}
                      </span>
                      <span>·</span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                          evt.significance === 'Critical'
                            ? isDark
                              ? 'text-rose-400 bg-rose-950/40 border-rose-800/40'
                              : 'text-rose-700 bg-rose-50 border-rose-200'
                            : isDark
                            ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                            : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {evt.significance}
                      </span>
                    </div>
                    <h4
                      className={`text-sm font-semibold ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      {evt.title}
                    </h4>
                  </div>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    By {evt.author}
                  </span>
                </div>

                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {evt.description}
                </p>

                {linkedDoc && (
                  <div
                    className={`pt-2 border-t flex items-center gap-2 text-xs ${
                      isDark
                        ? 'border-slate-800/80 text-amber-300'
                        : 'border-slate-100 text-blue-700'
                    }`}
                  >
                    <FileText
                      className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-blue-600'}`}
                    />
                    <span>Linked Vault Document:</span>
                    <span
                      className={`underline cursor-pointer ${
                        isDark ? 'hover:text-amber-200' : 'hover:text-blue-900'
                      }`}
                    >
                      {linkedDoc.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h3
              className={`text-sm font-semibold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              Add Chronology Event
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Defendant served First Set of Requests for Production"
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
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                    Significance
                  </label>
                  <select
                    value={significance}
                    onChange={(e) => setSignificance(e.target.value as any)}
                    className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Major">Major</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className={`w-full rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Pleading">Pleading</option>
                  <option value="Discovery">Discovery</option>
                  <option value="Hearing">Hearing</option>
                  <option value="Factual Event">Factual Event</option>
                  <option value="Deposition">Deposition</option>
                  <option value="Settlement">Settlement</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Evidentiary Summary
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the legal significance and impact on claims..."
                  className={`w-full rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border resize-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  Save to Chronology
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
