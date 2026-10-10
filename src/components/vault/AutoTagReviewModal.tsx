import React, { useState } from 'react';
import {
  Sparkles,
  Tag,
  Check,
  X,
  FileText,
  Percent,
  CheckCheck,
  Brain,
  Info,
  Layers,
} from 'lucide-react';
import { AutoTagAnalysisResult, LegalTagSuggestion, VaultDocument } from '../../types';

interface AutoTagReviewModalProps {
  results: Record<string, AutoTagAnalysisResult>;
  documents: VaultDocument[];
  isDark?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onApplyTags: (docTagsMap: Record<string, string[]>) => void;
}

export const AutoTagReviewModal: React.FC<AutoTagReviewModalProps> = ({
  results,
  documents,
  isDark = true,
  isLoading = false,
  onClose,
  onApplyTags,
}) => {
  const docIds = Object.keys(results);
  const [selectedDocId, setSelectedDocId] = useState<string>(docIds[0] || '');

  // Track which suggested tags are selected for each document: docId -> Set of tag strings
  const [selectedTagsByDoc, setSelectedTagsByDoc] = useState<Record<string, Set<string>>>(() => {
    const initial: Record<string, Set<string>> = {};
    for (const [id, res] of Object.entries(results)) {
      initial[id] = new Set(res.suggestedTags.map((t) => t.tag));
    }
    return initial;
  });

  const activeResult = results[selectedDocId] || results[docIds[0]];
  const activeDoc = documents.find((d) => d.id === selectedDocId);

  const toggleTag = (docId: string, tag: string) => {
    setSelectedTagsByDoc((prev) => {
      const currentSet = new Set(prev[docId] || []);
      if (currentSet.has(tag)) {
        currentSet.delete(tag);
      } else {
        currentSet.add(tag);
      }
      return { ...prev, [docId]: currentSet };
    });
  };

  const selectAllForDoc = (docId: string) => {
    const res = results[docId];
    if (!res) return;
    setSelectedTagsByDoc((prev) => ({
      ...prev,
      [docId]: new Set(res.suggestedTags.map((t) => t.tag)),
    }));
  };

  const deselectAllForDoc = (docId: string) => {
    setSelectedTagsByDoc((prev) => ({
      ...prev,
      [docId]: new Set(),
    }));
  };

  const handleApplyAll = () => {
    const finalMap: Record<string, string[]> = {};
    for (const id of docIds) {
      const currentSelected = selectedTagsByDoc[id];
      if (currentSelected && currentSelected.size > 0) {
        finalMap[id] = Array.from(currentSelected);
      }
    }
    onApplyTags(finalMap);
  };

  const getCategoryColor = (category: LegalTagSuggestion['category']) => {
    switch (category) {
      case 'Privilege':
        return isDark
          ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
          : 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Regulatory':
        return isDark
          ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
          : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Clause':
        return isDark
          ? 'bg-blue-950/40 text-blue-300 border-blue-800/60'
          : 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Procedural':
        return isDark
          ? 'bg-purple-950/40 text-purple-300 border-purple-800/60'
          : 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Evidentiary':
        return isDark
          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return isDark
          ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  // Count total tags selected across all documents
  const totalTagsSelected = Object.values(selectedTagsByDoc).reduce(
    (sum, set) => sum + set.size,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/90'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  ML Auto-Tagging & Content Analysis
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs opacity-70">
                Machine learning semantic classification of provisions, covenants, and docket categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center animate-pulse">
              <Brain className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Analyzing Legal Content...</h4>
              <p className="text-xs opacity-70 max-w-sm mt-1">
                Parsing document OCR transcripts, extracting covenants, and matching practice area taxonomies.
              </p>
            </div>
          </div>
        ) : docIds.length === 0 ? (
          <div className="p-12 text-center text-xs opacity-70">
            No document analysis data available.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Sidebar if multiple documents */}
            {docIds.length > 1 && (
              <div
                className={`w-full md:w-56 border-b md:border-b-0 md:border-r border-inherit p-3 space-y-1.5 overflow-y-auto max-h-40 md:max-h-none shrink-0 ${
                  isDark ? 'bg-slate-950/40' : 'bg-slate-50'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 px-2 py-1">
                  Selected Files ({docIds.length})
                </div>
                {docIds.map((id) => {
                  const res = results[id];
                  const doc = documents.find((d) => d.id === id);
                  const isCurrent = selectedDocId === id;
                  const selectedCount = selectedTagsByDoc[id]?.size || 0;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedDocId(id)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between text-xs ${
                        isCurrent
                          ? isDark
                            ? 'bg-purple-950/40 border border-purple-500/60 text-purple-200'
                            : 'bg-purple-50 border border-purple-300 text-purple-900 font-semibold shadow-xs'
                          : isDark
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="font-medium truncate">{doc?.title || res.title}</div>
                        <div className="text-[10px] opacity-60 truncate">{res.fileName}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 shrink-0">
                        {selectedCount} tags
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Document Analysis & Suggested Tags Details */}
            {activeResult && (
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Document Information Box */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm leading-tight">
                        {activeDoc?.title || activeResult.title}
                      </div>
                      <div className="text-[11px] opacity-70 flex items-center gap-2 mt-0.5">
                        <span>{activeResult.fileName}</span>
                        <span>•</span>
                        <span className="text-purple-400 font-medium">
                          {activeResult.detectedDocType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => selectAllForDoc(activeResult.docId || selectedDocId)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => deselectAllForDoc(activeResult.docId || selectedDocId)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                {/* Excerpt / Summary */}
                {activeResult.summaryExcerpt && (
                  <div className="text-[11px] opacity-80 italic px-1 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>{activeResult.summaryExcerpt}</span>
                  </div>
                )}

                {/* Suggested Tags List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-75 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-400" />
                      <span>Suggested Legal Matter Tags ({activeResult.suggestedTags.length})</span>
                    </label>
                    <span className="text-[10px] font-mono opacity-60">
                      Click to toggle approval
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeResult.suggestedTags.map((suggestion) => {
                      const isChecked = selectedTagsByDoc[
                        activeResult.docId || selectedDocId
                      ]?.has(suggestion.tag);

                      return (
                        <div
                          key={suggestion.tag}
                          onClick={() =>
                            toggleTag(activeResult.docId || selectedDocId, suggestion.tag)
                          }
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            isChecked
                              ? isDark
                                ? 'bg-purple-950/30 border-purple-500/70 shadow-xs'
                                : 'bg-purple-50/70 border-purple-400 shadow-xs'
                              : isDark
                              ? 'bg-slate-900 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                              : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isChecked
                                  ? 'bg-purple-600 border-purple-600 text-white'
                                  : isDark
                                  ? 'border-slate-700 bg-slate-800'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm font-mono text-purple-400">
                                  {suggestion.tag}
                                </span>
                                <span
                                  className={`px-2 py-0.2 rounded-md text-[10px] font-semibold border ${getCategoryColor(
                                    suggestion.category
                                  )}`}
                                >
                                  {suggestion.category}
                                </span>
                                <span className="px-2 py-0.2 rounded-md text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                                  <Percent className="w-2.5 h-2.5" />
                                  <span>{Math.round(suggestion.confidence * 100)}% Confidence</span>
                                </span>
                              </div>

                              <p className="text-[11px] opacity-80 mt-1 leading-relaxed">
                                {suggestion.rationale}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-inherit">
          <div className="text-xs opacity-75">
            <span className="font-bold">{totalTagsSelected}</span> tags ready to apply
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={totalTagsSelected === 0}
              onClick={handleApplyAll}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center gap-1.5 ${
                totalTagsSelected === 0
                  ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>Apply {totalTagsSelected} Approved Tags</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
