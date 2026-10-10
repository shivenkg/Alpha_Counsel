import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Gavel,
  Plus,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter, MatterTask } from '../../../types';

interface Props {
  matter: Matter;
}

export const TasksTab: React.FC<Props> = ({ matter }) => {
  const { tasks, addTask, users, theme } = useApp();
  const isDark = theme === 'dark';
  const matterTasks = tasks.filter((t) => t.matterId === matter.id);

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('2026-10-30');
  const [assignedTo, setAssignedTo] = useState(users[3]?.id || 'usr-4');
  const [category, setCategory] = useState<MatterTask['category']>('Filing');
  const [courtMandated, setCourtMandated] = useState(true);
  const [priority, setPriority] = useState<MatterTask['priority']>('High');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    addTask({
      matterId: matter.id,
      title,
      dueDate,
      assignedToUserId: assignedTo,
      category,
      status: 'PENDING',
      courtMandated,
      priority,
    });
    setShowAddModal(false);
    setTitle('');
  };

  // Generate and download .ics calendar file for court deadlines
  const handleExportICS = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AlphaCounsel//Legal Calendar//EN\nCALSCALE:GREGORIAN\n`;
    matterTasks.forEach((task) => {
      const dtFormatted = task.dueDate.replace(/-/g, '');
      icsContent += `BEGIN:VEVENT\nSUMMARY:${task.courtMandated ? '[COURT DEADLINE] ' : ''}${task.title}\nDESCRIPTION:Matter: ${matter.matterNumber} - ${matter.title}\\nCategory: ${task.category}\\nPriority: ${task.priority}\nDTSTART;VALUE=DATE:${dtFormatted}\nDTEND;VALUE=DATE:${dtFormatted}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${matter.matterNumber}_court_deadlines.ics`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Gavel className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            Court Deadlines & Case Tasks
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Statutory limitations, filing milestones, and docket deadlines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportICS}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors border ${
              isDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Download className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <span>Export .ICS Calendar</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-semibold rounded hover:bg-amber-400 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deadline</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {matterTasks.map((t) => {
          const assignee = users.find((u) => u.id === t.assignedToUserId);
          const isOverdue = new Date(t.dueDate).getTime() < Date.now();
          return (
            <div
              key={t.id}
              className={`border rounded-xl p-3.5 flex items-center justify-between transition-colors shadow-xs ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                    t.priority === 'High' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{t.title}</span>
                    {t.courtMandated && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase border ${
                        isDark ? 'bg-rose-950/50 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        Court Mandate
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-3 text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className={`font-mono flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Due: {t.dueDate}
                    </span>
                    <span>·</span>
                    <span>{t.category}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      Assigned: {assignee?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                  t.status === 'COMPLETED'
                    ? isDark
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isOverdue
                    ? isDark
                      ? 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                    : isDark
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {t.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Add Court Deadline / Task</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Serve Expert Rebuttal Disclosures"
                  className={`w-full border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Assignee
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className={`w-full border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.slice(0, 10)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={`w-full border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Filing">Filing</option>
                    <option value="Court Hearing">Court Hearing</option>
                    <option value="Statutory Deadline">Statutory Deadline</option>
                    <option value="Discovery Response">Discovery Response</option>
                    <option value="Drafting">Drafting</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className={`w-full border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="courtMandate"
                  checked={courtMandated}
                  onChange={(e) => setCourtMandated(e.target.checked)}
                  className="rounded border-slate-400 text-amber-500 focus:ring-amber-500/30"
                />
                <label htmlFor="courtMandate" className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Statutory or Court-Mandated Order (ECF Filing)
                </label>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded hover:bg-amber-400 shadow-xs transition-colors"
                >
                  Schedule Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
