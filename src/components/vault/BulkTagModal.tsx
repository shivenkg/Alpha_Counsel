import React, { useState } from 'react';
import {
  Tag as TagIcon,
  X,
  Check,
  Plus,
  Search,
  CheckSquare,
  Square,
  MinusSquare,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { VaultDocument, CustomDocumentTag, TagColor } from '../../types';
import { COLOR_OPTIONS, TAG_COLOR_PALETTE, getTagColorMeta } from '../../utils/tagColors';

interface BulkTagModalProps {
  selectedDocs: VaultDocument[];
  availableTags: CustomDocumentTag[];
  isDark?: boolean;
  onClose: () => void;
  onAddCustomTag: (tag: Omit<CustomDocumentTag, 'id'>) => CustomDocumentTag;
  onApplyTags: (tagsToAdd: string[], tagsToRemove: string[]) => void;
}

export const BulkTagModal: React.FC<BulkTagModalProps> = ({
  selectedDocs,
  availableTags,
  isDark = true,
  onClose,
  onAddCustomTag,
  onApplyTags,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('blue');
  const [newTagDescription, setNewTagDescription] = useState('');

  // Track state for each tag:
  // 'add' = will be added to all selected files
  // 'remove' = will be removed from all selected files
  // 'neutral' = no change
  const [tagActions, setTagActions] = useState<Record<string, 'add' | 'remove' | 'neutral'>>({});

  // Calculate existing tag coverage among selected documents
  const totalSelected = selectedDocs.length;
  const tagCounts: Record<string, number> = {};
  selectedDocs.forEach((doc) => {
    (doc.tags || []).forEach((t) => {
      const clean = t.startsWith('#') ? t.slice(1) : t;
      tagCounts[clean] = (tagCounts[clean] || 0) + 1;
    });
  });

  const handleToggleTag = (tagName: string) => {
    const clean = tagName.startsWith('#') ? tagName.slice(1) : tagName;
    const currentAction = tagActions[clean];
    const docsWithTag = tagCounts[clean] || 0;

    let nextAction: 'add' | 'remove' | 'neutral' = 'neutral';
    if (!currentAction || currentAction === 'neutral') {
      // If none or some have it, default to 'add'
      // If all have it, default to 'remove'
      nextAction = docsWithTag === totalSelected ? 'remove' : 'add';
    } else if (currentAction === 'add') {
      nextAction = docsWithTag > 0 ? 'remove' : 'neutral';
    } else if (currentAction === 'remove') {
      nextAction = 'neutral';
    }

    setTagActions((prev) => ({
      ...prev,
      [clean]: nextAction,
    }));
  };

  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    const created = onAddCustomTag({
      name: trimmed,
      color: newTagColor,
      description: newTagDescription.trim() || undefined,
    });

    // Mark newly created tag to be added to all selected
    setTagActions((prev) => ({
      ...prev,
      [created.name]: 'add',
    }));

    setNewTagName('');
    setNewTagDescription('');
    setShowCreateTag(false);
  };

  const handleSave = () => {
    const toAdd: string[] = [];
    const toRemove: string[] = [];

    Object.entries(tagActions).forEach(([tagName, action]) => {
      if (action === 'add') toAdd.push(tagName);
      if (action === 'remove') toRemove.push(tagName);
    });

    onApplyTags(toAdd, toRemove);
    onClose();
  };

  // Combine availableTags + any tags currently on selectedDocs that aren't in availableTags
  const allUniqueTagNames = Array.from(
    new Set([
      ...availableTags.map((t) => t.name),
      ...Object.keys(tagCounts),
    ])
  );

  const filteredTagNames = allUniqueTagNames.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalToAdd = Object.values(tagActions).filter((a) => a === 'add').length;
  const totalToRemove = Object.values(tagActions).filter((a) => a === 'remove').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/90'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <TagIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Batch Tag Documents
              </h3>
              <p className="text-xs opacity-70">
                Categorize {selectedDocs.length} selected document(s) with custom labels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Documents Pill Summary */}
        <div
          className={`px-5 py-2.5 border-b text-xs flex items-center justify-between ${
            isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <span className="font-medium">
            Applying changes to <strong className="text-blue-500 font-num">{selectedDocs.length}</strong> files:
          </span>
          <span className="text-[11px] truncate max-w-[200px] opacity-75">
            {selectedDocs.map((d) => d.title).slice(0, 2).join(', ')}
            {selectedDocs.length > 2 && ` +${selectedDocs.length - 2} more`}
          </span>
        </div>

        {/* Search & Add New Tag Trigger */}
        <div className="p-4 pb-2 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search or filter tags..."
                className="w-full bg-transparent outline-none text-xs"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="opacity-50 hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCreateTag(!showCreateTag)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                showCreateTag
                  ? 'bg-purple-600 text-white border-purple-500'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-purple-500/30'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Tag</span>
            </button>
          </div>

          {/* Create Custom Color-Coded Tag Panel */}
          {showCreateTag && (
            <form
              onSubmit={handleCreateNewTag}
              className={`p-3.5 rounded-xl border space-y-3 animate-in fade-in zoom-in-95 ${
                isDark ? 'bg-slate-950 border-purple-800/50' : 'bg-purple-50/50 border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Custom Color Label</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateTag(false)}
                  className="text-[11px] opacity-70 hover:opacity-100"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase opacity-75">Tag Name</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Q4 Priority, Tax Audit, Key Asset..."
                  required
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              {/* Color Palette Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase opacity-75 flex items-center justify-between">
                  <span>Color Theme</span>
                  <span className="text-[10px] capitalize text-purple-400">{newTagColor}</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = newTagColor === c.color;
                    return (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setNewTagColor(c.color)}
                        title={c.label}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-sm'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save & Apply Tag to Selection</span>
              </button>
            </form>
          )}
        </div>

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 min-h-[220px]">
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-60 px-1 mb-1 flex items-center justify-between">
            <span>Available Labels</span>
            <span>Click to toggle Add / Remove</span>
          </div>

          {filteredTagNames.length === 0 ? (
            <div className="p-8 text-center text-xs opacity-60">
              No matching tags found. Click "+ New Tag" to create one.
            </div>
          ) : (
            filteredTagNames.map((tagName) => {
              const meta = getTagColorMeta(tagName, availableTags);
              const clean = tagName.startsWith('#') ? tagName.slice(1) : tagName;
              const action = tagActions[clean] || 'neutral';
              const docsWithTag = tagCounts[clean] || 0;
              const isAllCovered = docsWithTag === totalSelected;
              const isPartialCovered = docsWithTag > 0 && docsWithTag < totalSelected;

              return (
                <div
                  key={clean}
                  onClick={() => handleToggleTag(clean)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    action === 'add'
                      ? 'bg-purple-600/15 border-purple-500 text-purple-300 font-semibold shadow-xs'
                      : action === 'remove'
                      ? 'bg-rose-500/15 border-rose-500 text-rose-300 font-semibold'
                      : isDark
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {/* Left: Tag Badge & Meta */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Checkbox state indicator */}
                    <div className="shrink-0">
                      {action === 'add' ? (
                        <div className="w-4 h-4 rounded bg-purple-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : action === 'remove' ? (
                        <div className="w-4 h-4 rounded bg-rose-600 text-white flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </div>
                      ) : isAllCovered ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : isPartialCovered ? (
                        <MinusSquare className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Square className="w-4 h-4 opacity-40" />
                      )}
                    </div>

                    {/* Color dot & label */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                      <span>{clean}</span>
                    </span>

                    {/* Coverage note */}
                    <span className="text-[10px] opacity-60 truncate">
                      {docsWithTag === 0
                        ? 'Not on selection'
                        : isAllCovered
                        ? 'On all files'
                        : `On ${docsWithTag}/${totalSelected} files`}
                    </span>
                  </div>

                  {/* Right: Action pill indicator */}
                  <div className="shrink-0 text-[11px] font-mono">
                    {action === 'add' && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white font-bold text-[10px]">
                        + ADD
                      </span>
                    )}
                    {action === 'remove' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                        - REMOVE
                      </span>
                    )}
                    {action === 'neutral' && docsWithTag > 0 && (
                      <span className="text-[10px] opacity-50">Keep</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-xs opacity-75 font-mono">
            {totalToAdd > 0 || totalToRemove > 0 ? (
              <span>
                {totalToAdd > 0 && <span className="text-purple-400 font-bold">+{totalToAdd} to add </span>}
                {totalToRemove > 0 && <span className="text-rose-400 font-bold">-{totalToRemove} to remove</span>}
              </span>
            ) : (
              <span>Select tags to update</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={totalToAdd === 0 && totalToRemove === 0}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                totalToAdd > 0 || totalToRemove > 0
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to {selectedDocs.length} Documents</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
