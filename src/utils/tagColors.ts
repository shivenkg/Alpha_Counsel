import { CustomDocumentTag, TagColor } from '../types';

export interface TagColorMeta {
  color: TagColor;
  label: string;
  hex: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderLight: string;
  borderDark: string;
  dotClass: string;
  ringClass: string;
  badgeClass: string;
}

export const TAG_COLOR_PALETTE: Record<TagColor, TagColorMeta> = {
  emerald: {
    color: 'emerald',
    label: 'Emerald',
    hex: '#10b981',
    bgLight: 'bg-emerald-50',
    bgDark: 'bg-emerald-950/40',
    textLight: 'text-emerald-700',
    textDark: 'text-emerald-300',
    borderLight: 'border-emerald-200',
    borderDark: 'border-emerald-800/60',
    dotClass: 'bg-emerald-500',
    ringClass: 'ring-emerald-500/30',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  },
  amber: {
    color: 'amber',
    label: 'Amber',
    hex: '#f59e0b',
    bgLight: 'bg-amber-50',
    bgDark: 'bg-amber-950/40',
    textLight: 'text-amber-700',
    textDark: 'text-amber-300',
    borderLight: 'border-amber-200',
    borderDark: 'border-amber-800/60',
    dotClass: 'bg-amber-500',
    ringClass: 'ring-amber-500/30',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  },
  rose: {
    color: 'rose',
    label: 'Rose',
    hex: '#f43f5e',
    bgLight: 'bg-rose-50',
    bgDark: 'bg-rose-950/40',
    textLight: 'text-rose-700',
    textDark: 'text-rose-300',
    borderLight: 'border-rose-200',
    borderDark: 'border-rose-800/60',
    dotClass: 'bg-rose-500',
    ringClass: 'ring-rose-500/30',
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  },
  blue: {
    color: 'blue',
    label: 'Blue',
    hex: '#3b82f6',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-950/40',
    textLight: 'text-blue-700',
    textDark: 'text-blue-300',
    borderLight: 'border-blue-200',
    borderDark: 'border-blue-800/60',
    dotClass: 'bg-blue-500',
    ringClass: 'ring-blue-500/30',
    badgeClass:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
  },
  purple: {
    color: 'purple',
    label: 'Purple',
    hex: '#a855f7',
    bgLight: 'bg-purple-50',
    bgDark: 'bg-purple-950/40',
    textLight: 'text-purple-700',
    textDark: 'text-purple-300',
    borderLight: 'border-purple-200',
    borderDark: 'border-purple-800/60',
    dotClass: 'bg-purple-500',
    ringClass: 'ring-purple-500/30',
    badgeClass:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
  },
  indigo: {
    color: 'indigo',
    label: 'Indigo',
    hex: '#6366f1',
    bgLight: 'bg-indigo-50',
    bgDark: 'bg-indigo-950/40',
    textLight: 'text-indigo-700',
    textDark: 'text-indigo-300',
    borderLight: 'border-indigo-200',
    borderDark: 'border-indigo-800/60',
    dotClass: 'bg-indigo-500',
    ringClass: 'ring-indigo-500/30',
    badgeClass:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
  },
  teal: {
    color: 'teal',
    label: 'Teal',
    hex: '#14b8a6',
    bgLight: 'bg-teal-50',
    bgDark: 'bg-teal-950/40',
    textLight: 'text-teal-700',
    textDark: 'text-teal-300',
    borderLight: 'border-teal-200',
    borderDark: 'border-teal-800/60',
    dotClass: 'bg-teal-500',
    ringClass: 'ring-teal-500/30',
    badgeClass:
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
  },
  cyan: {
    color: 'cyan',
    label: 'Cyan',
    hex: '#06b6d4',
    bgLight: 'bg-cyan-50',
    bgDark: 'bg-cyan-950/40',
    textLight: 'text-cyan-700',
    textDark: 'text-cyan-300',
    borderLight: 'border-cyan-200',
    borderDark: 'border-cyan-800/60',
    dotClass: 'bg-cyan-500',
    ringClass: 'ring-cyan-500/30',
    badgeClass:
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60',
  },
  pink: {
    color: 'pink',
    label: 'Pink',
    hex: '#ec4899',
    bgLight: 'bg-pink-50',
    bgDark: 'bg-pink-950/40',
    textLight: 'text-pink-700',
    textDark: 'text-pink-300',
    borderLight: 'border-pink-200',
    borderDark: 'border-pink-800/60',
    dotClass: 'bg-pink-500',
    ringClass: 'ring-pink-500/30',
    badgeClass:
      'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60',
  },
  orange: {
    color: 'orange',
    label: 'Orange',
    hex: '#f97316',
    bgLight: 'bg-orange-50',
    bgDark: 'bg-orange-950/40',
    textLight: 'text-orange-700',
    textDark: 'text-orange-300',
    borderLight: 'border-orange-200',
    borderDark: 'border-orange-800/60',
    dotClass: 'bg-orange-500',
    ringClass: 'ring-orange-500/30',
    badgeClass:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
  },
  slate: {
    color: 'slate',
    label: 'Slate',
    hex: '#64748b',
    bgLight: 'bg-slate-100',
    bgDark: 'bg-slate-800/60',
    textLight: 'text-slate-700',
    textDark: 'text-slate-300',
    borderLight: 'border-slate-300',
    borderDark: 'border-slate-700',
    dotClass: 'bg-slate-500',
    ringClass: 'ring-slate-500/30',
    badgeClass:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
  },
};

export const COLOR_OPTIONS: TagColorMeta[] = Object.values(TAG_COLOR_PALETTE);

export const INITIAL_CUSTOM_TAGS: CustomDocumentTag[] = [
  { id: 'tag-1', name: 'Approved', color: 'emerald', description: 'Formally vetted and signed off' },
  { id: 'tag-2', name: 'Under Review', color: 'amber', description: 'Pending stakeholder review' },
  { id: 'tag-3', name: 'Confidential', color: 'rose', description: 'Internal sensitive document' },
  { id: 'tag-4', name: 'Contract', color: 'indigo', description: 'Legal & commercial agreements' },
  { id: 'tag-5', name: 'Financial', color: 'blue', description: 'Budget, accounting & invoices' },
  { id: 'tag-6', name: 'Urgent', color: 'orange', description: 'High priority item requiring fast turnaround' },
  { id: 'tag-7', name: 'Draft', color: 'slate', description: 'Work in progress iteration' },
  { id: 'tag-8', name: 'Strategy', color: 'purple', description: 'Executive & product roadmaps' },
  { id: 'tag-9', name: 'External Shared', color: 'cyan', description: 'Distributed to client portal' },
];

/**
 * Deterministically get color metadata for any tag string, matching
 * registered custom tags or hashing to a palette color.
 */
export function getTagColorMeta(
  tagName: string,
  customTags: CustomDocumentTag[] = []
): TagColorMeta {
  const clean = tagName.startsWith('#') ? tagName.slice(1) : tagName;
  const lower = clean.toLowerCase();

  // 1. Direct match by custom tag name
  const match = customTags.find((t) => t.name.toLowerCase() === lower);
  if (match && TAG_COLOR_PALETTE[match.color]) {
    return TAG_COLOR_PALETTE[match.color];
  }

  // 2. Keyword heuristic matches
  if (lower.includes('approved') || lower.includes('complete') || lower.includes('final') || lower.includes('filed')) {
    return TAG_COLOR_PALETTE.emerald;
  }
  if (lower.includes('review') || lower.includes('pending') || lower.includes('wip') || lower.includes('draft')) {
    return TAG_COLOR_PALETTE.amber;
  }
  if (lower.includes('urgent') || lower.includes('priority') || lower.includes('critical')) {
    return TAG_COLOR_PALETTE.orange;
  }
  if (lower.includes('confidential') || lower.includes('restricted') || lower.includes('privilege') || lower.includes('hold')) {
    return TAG_COLOR_PALETTE.rose;
  }
  if (lower.includes('contract') || lower.includes('spa') || lower.includes('agreement') || lower.includes('nda')) {
    return TAG_COLOR_PALETTE.indigo;
  }
  if (lower.includes('finance') || lower.includes('audit') || lower.includes('invoice') || lower.includes('report')) {
    return TAG_COLOR_PALETTE.blue;
  }
  if (lower.includes('patent') || lower.includes('tech') || lower.includes('code') || lower.includes('strategy')) {
    return TAG_COLOR_PALETTE.purple;
  }

  // 3. String hash fallback for consistent deterministic palette color
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const keys = Object.keys(TAG_COLOR_PALETTE) as TagColor[];
  const key = keys[Math.abs(hash) % keys.length];
  return TAG_COLOR_PALETTE[key];
}
