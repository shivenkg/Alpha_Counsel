import React, { useState } from 'react';
import {
  Tag as TagIcon,
  X,
  Check,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { VaultDocument, CustomDocumentTag, TagColor } from '../../types';
import { COLOR_OPTIONS, getTagColorMeta } from '../../utils/tagColors';

interface DocumentTagEditorProps {
  document: VaultDocument;
  availableTags: CustomDocumentTag[];
  isDark?: boolean;
  onClose: () => void;
  onToggleTag: (docId: string, tagName: string) => void;
  onAddCustomTag: (tag: Omit<CustomDocumentTag, 'id'>) => CustomDocumentTag;
}

export const DocumentTagEditor: React.FC<DocumentTagEditorProps> = ({
  document: doc,
  availableTags,
  isDark = true,
  onClose,
  onToggleTag,
  onAddCustomTag,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('blue');

  const docTags = new Set((doc.tags || []).map((t) => (t.startsWith('#') ? t.slice(1) : t)));

  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    const created = onAddCustomTag({
      name: trimmed,
      color: newTagColor,
    });

    onToggleTag(doc.id, created.name);
    setNewTagName('');
    setShowCreateTag(false);
  };

  const filteredTags = availableTags.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-72 p-3 rounded-2xl border shadow-2xl z-50 text-xs space-y-2.5 animate-in fade-in zoom-in-95 select-none ${
        isDark
          ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/90'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-inherit">
        <div className="flex items-center gap-1.5 min-w-0">
          <TagIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="font-bold truncate">Labels for "{doc.title}"</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded opacity-70 hover:opacity-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Input */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <Search className="w-3 h-3 opacity-50 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter or add labels..."
          className="w-full bg-transparent outline-none text-[11px]"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="opacity-50 hover:opacity-100">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Available Labels Checklist */}
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
        {filteredTags.length === 0 ? (
          <div className="py-3 text-center text-[11px] opacity-60">
            No labels match "{searchTerm}"
          </div>
        ) : (
          filteredTags.map((tag) => {
            const meta = getTagColorMeta(tag.name, availableTags);
            const isAssigned = docTags.has(tag.name);

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggleTag(doc.id, tag.name)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  isAssigned
                    ? isDark
                      ? 'bg-purple-950/40 text-purple-200'
                      : 'bg-purple-50 text-purple-800'
                    : isDark
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`} />
                  <span className="truncate text-xs font-medium">{tag.name}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    isAssigned
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : isDark
                      ? 'border-slate-700'
                      : 'border-slate-300'
                  }`}
                >
                  {isAssigned && <Check className="w-3 h-3" />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Create New Custom Tag Toggle / Form */}
      <div className="pt-2 border-t border-inherit">
        {!showCreateTag ? (
          <button
            type="button"
            onClick={() => setShowCreateTag(true)}
            className="w-full py-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Create New Label</span>
          </button>
        ) : (
          <form onSubmit={handleCreateNewTag} className="space-y-2 pt-1">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New label name..."
              required
              autoFocus
              className={`w-full px-2.5 py-1 rounded border text-[11px] outline-none ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            />

            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {COLOR_OPTIONS.slice(0, 8).map((c) => {
                const isSelected = newTagColor === c.color;
                return (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setNewTagColor(c.color)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      isSelected ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105 opacity-80'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowCreateTag(false)}
                className="w-1/2 py-1 rounded text-[11px] opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
