/**
 * Background Folder Thumbnail Service
 * 
 * Executes an asynchronous background indexing process that generates a 2x2 grid-based
 * preview of the first 4 document icons within each vault folder.
 * Runs non-blocking tasks via requestIdleCallback/setTimeout micro-tasks,
 * yielding to main-thread UI operations and caching composite thumbnails.
 */

import { VaultDocument, FolderThumbnailPreview, FolderThumbnailSlot } from '../types';

// In-memory cache of generated folder thumbnails
const thumbnailCache = new Map<string, FolderThumbnailPreview>();
type Subscriber = (thumbnails: Record<string, FolderThumbnailPreview>, isProcessing: boolean) => void;
const subscribers = new Set<Subscriber>();

let isBackgroundProcessing = false;
let currentProcessingFolder: string | null = null;

function notifySubscribers() {
  const data: Record<string, FolderThumbnailPreview> = {};
  thumbnailCache.forEach((value, key) => {
    data[key] = value;
  });
  subscribers.forEach((sub) => sub(data, isBackgroundProcessing));
}

/**
 * Normalizes file extension and identifies document file type
 */
function extractDocSlot(doc: VaultDocument): FolderThumbnailSlot {
  const ext = (doc.fileName.split('.').pop() || doc.fileType || 'pdf').toLowerCase();
  let normalizedType: FolderThumbnailSlot['fileType'] = 'other';

  if (ext === 'pdf') normalizedType = 'pdf';
  else if (ext === 'docx' || ext === 'doc') normalizedType = 'docx';
  else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') normalizedType = 'xlsx';
  else if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) normalizedType = 'img';
  else if (ext === 'txt') normalizedType = 'txt';

  return {
    id: doc.id,
    docTitle: doc.title,
    fileName: doc.fileName,
    fileType: normalizedType,
    ext,
    fileSize: doc.fileSize,
  };
}

/**
 * Builds the 4-slot thumbnail for a folder from its documents
 */
export function buildThumbnailData(
  folderName: string,
  folderDocs: VaultDocument[]
): FolderThumbnailPreview {
  const firstFour = folderDocs.slice(0, 4);
  const slots: Array<FolderThumbnailSlot | null> = [null, null, null, null];

  for (let i = 0; i < 4; i++) {
    if (firstFour[i]) {
      slots[i] = extractDocSlot(firstFour[i]);
    }
  }

  return {
    folderName,
    itemCount: folderDocs.length,
    status: 'ready',
    generatedAt: Date.now(),
    slots,
  };
}

/**
 * Background Queue Engine
 * Sequentially processes folders in the background without blocking the UI
 */
export const backgroundThumbnailService = {
  /**
   * Subscribe to background thumbnail generation updates
   */
  subscribe(callback: Subscriber) {
    subscribers.add(callback);
    // Send immediate initial cache
    notifySubscribers();
    return () => {
      subscribers.delete(callback);
    };
  },

  /**
   * Get cached thumbnail for a folder (or build fallback if not generated yet)
   */
  getThumbnail(folderName: string, fallbackDocs?: VaultDocument[]): FolderThumbnailPreview {
    if (thumbnailCache.has(folderName)) {
      return thumbnailCache.get(folderName)!;
    }
    if (fallbackDocs) {
      const generated = buildThumbnailData(folderName, fallbackDocs);
      thumbnailCache.set(folderName, generated);
      return generated;
    }
    return {
      folderName,
      itemCount: 0,
      status: 'idle',
      generatedAt: Date.now(),
      slots: [null, null, null, null],
    };
  },

  /**
   * Triggers the background generation process across all given folders
   */
  processFoldersInBackground(
    folders: string[],
    allDocs: VaultDocument[],
    forceRefresh: boolean = false
  ) {
    if (isBackgroundProcessing) return;

    // Filter folders needing generation
    const foldersToProcess = folders.filter((f) => {
      if (f === 'ALL') return false;
      if (forceRefresh) return true;
      return !thumbnailCache.has(f);
    });

    if (foldersToProcess.length === 0) return;

    isBackgroundProcessing = true;
    notifySubscribers();

    let index = 0;

    const runNextTask = () => {
      if (index >= foldersToProcess.length) {
        isBackgroundProcessing = false;
        currentProcessingFolder = null;
        notifySubscribers();
        return;
      }

      const folder = foldersToProcess[index];
      currentProcessingFolder = folder;

      // Extract documents for this folder
      const folderDocs = allDocs.filter((d) => d.folder === folder);
      const thumbnail = buildThumbnailData(folder, folderDocs);

      // Cache the result
      thumbnailCache.set(folder, thumbnail);
      index++;
      notifySubscribers();

      // Yield execution back to the browser event loop
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          setTimeout(runNextTask, 60);
        });
      } else {
        setTimeout(runNextTask, 60);
      }
    };

    // Kick off initial asynchronous task
    setTimeout(runNextTask, 50);
  },

  /**
   * Force invalidate and regenerate a specific folder's thumbnail
   */
  regenerateFolder(folderName: string, allDocs: VaultDocument[]) {
    const folderDocs = allDocs.filter((d) => d.folder === folderName);
    const thumbnail = buildThumbnailData(folderName, folderDocs);
    thumbnailCache.set(folderName, thumbnail);
    notifySubscribers();
  },

  /**
   * Current processing state
   */
  getStatus() {
    return {
      isProcessing: isBackgroundProcessing,
      currentFolder: currentProcessingFolder,
      cachedCount: thumbnailCache.size,
    };
  },
};
