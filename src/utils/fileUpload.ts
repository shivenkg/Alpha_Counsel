/**
 * Utility for scanning dropped files and folders via HTML5 Drag & Drop and FileSystem API.
 * Accurately extracts files inside dropped directories/folders recursively.
 */

export interface ScannedUploadItem {
  file: File;
  folderName: string;
  relativePath: string;
  sizeFormatted: string;
}

/**
 * Format bytes to readable string (e.g., 2.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Recursively read files from a FileSystemEntry (WebKit API)
 */
async function readEntry(
  entry: any,
  parentFolder: string = '',
  currentPath: string = ''
): Promise<ScannedUploadItem[]> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file(
        (file: File) => {
          resolve([
            {
              file,
              folderName: parentFolder || 'Root',
              relativePath: currentPath ? `${currentPath}/${file.name}` : file.name,
              sizeFormatted: formatFileSize(file.size),
            },
          ]);
        },
        () => resolve([])
      );
    } else if (entry.isDirectory) {
      const folderName = parentFolder || entry.name;
      const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      const dirReader = entry.createReader();
      const items: ScannedUploadItem[] = [];

      const readBatch = () => {
        dirReader.readEntries(
          async (entries: any[]) => {
            if (entries.length === 0) {
              resolve(items);
            } else {
              for (const childEntry of entries) {
                const childItems = await readEntry(childEntry, folderName, nextPath);
                items.push(...childItems);
              }
              // readEntries might need multiple batches according to specs
              readBatch();
            }
          },
          () => resolve(items)
        );
      };

      readBatch();
    } else {
      resolve([]);
    }
  });
}

/**
 * Scan items dropped into dataTransfer or selected via folder/file input
 */
export async function scanDroppedItems(
  dataTransfer: DataTransfer,
  defaultFolder: string = 'Discovery'
): Promise<ScannedUploadItem[]> {
  const items = dataTransfer.items;
  const results: ScannedUploadItem[] = [];

  // Check if webkitGetAsEntry is available
  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
    const promises: Promise<ScannedUploadItem[]>[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          promises.push(readEntry(entry, entry.isDirectory ? entry.name : defaultFolder));
        }
      }
    }
    const nested = await Promise.all(promises);
    return nested.flat();
  }

  // Fallback to standard files list
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      let folderName = defaultFolder;

      // In modern browsers, webkitRelativePath contains "foldername/filename.ext"
      if (file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          folderName = parts[0];
        }
      }

      results.push({
        file,
        folderName,
        relativePath: file.webkitRelativePath || file.name,
        sizeFormatted: formatFileSize(file.size),
      });
    }
  }

  return results;
}

/**
 * Scan standard HTML input change event with files
 */
export function scanInputFiles(
  fileList: FileList,
  defaultFolder: string = 'Discovery'
): ScannedUploadItem[] {
  const results: ScannedUploadItem[] = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    let folderName = defaultFolder;

    if (file.webkitRelativePath) {
      const parts = file.webkitRelativePath.split('/');
      if (parts.length > 1) {
        folderName = parts[0];
      }
    }

    results.push({
      file,
      folderName,
      relativePath: file.webkitRelativePath || file.name,
      sizeFormatted: formatFileSize(file.size),
    });
  }
  return results;
}
