/**
 * Mock AES-256-GCM Encryption Service
 * 
 * Provides mock authenticated symmetric encryption (FIPS 140-3 / NIST SP 800-38D)
 * for sensitive client data folders within the AlphaCounsel Firm Vault.
 * Simulates PBKDF2-HMAC-SHA256 key derivation, 96-bit initialization vectors (IV),
 * 128-bit authentication tags, and tamper-proof cryptographic audit tracking.
 */

import { EncryptedFolderRecord } from '../types';

const STORAGE_KEY = 'alphacounsel_vault_encrypted_folders';

// Pre-seeded sensitive folders
const DEFAULT_ENCRYPTED_FOLDERS: Record<string, EncryptedFolderRecord> = {
  Contracts: {
    folderName: 'Contracts',
    isEncrypted: true,
    algorithm: 'AES-256-GCM',
    keyFingerprint: 'SHA256:7f8a9b2c3d4e5f60a1b2c3d4e5f6a7b8',
    cipherIv: '9f82d1c0b3a5e781c49b01ef',
    authTag: 'e3b0c44298fc1c149afbf4c8996fb924',
    encryptedAt: '2026-09-20T08:30:00Z',
    encryptedBy: 'Alexander Sterling (Managing Partner)',
    docCount: 3,
    status: 'ENCRYPTED',
    securityPolicy: 'CLIENT_CONFIDENTIAL',
  },
};

function loadStorage(): Record<string, EncryptedFolderRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ENCRYPTED_FOLDERS));
      return DEFAULT_ENCRYPTED_FOLDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading encrypted folders from localStorage', e);
    return DEFAULT_ENCRYPTED_FOLDERS;
  }
}

function saveStorage(data: Record<string, EncryptedFolderRecord>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Error persisting encrypted folders to localStorage', e);
  }
}

// Generate pseudo-random hex string of specified byte length
function generateHex(bytes: number): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < bytes * 2; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export const mockAES256EncryptionService = {
  /**
   * Check if a folder is currently encrypted
   */
  isFolderEncrypted(folderName: string): boolean {
    if (!folderName || folderName === 'ALL') return false;
    const records = loadStorage();
    return !!records[folderName]?.isEncrypted;
  },

  /**
   * Get encryption metadata for a folder
   */
  getFolderRecord(folderName: string): EncryptedFolderRecord | undefined {
    const records = loadStorage();
    return records[folderName];
  },

  /**
   * Retrieve all encrypted folder records
   */
  getAllRecords(): Record<string, EncryptedFolderRecord> {
    return loadStorage();
  },

  /**
   * Encrypt a sensitive client folder using mock AES-256-GCM
   */
  async encryptFolder(
    folderName: string,
    docCount: number = 0,
    options?: { actor?: string; notes?: string }
  ): Promise<EncryptedFolderRecord> {
    // Simulate cryptographic processing time (key derivation + block ciphering)
    await new Promise((res) => setTimeout(res, 450));

    const records = loadStorage();
    const record: EncryptedFolderRecord = {
      folderName,
      isEncrypted: true,
      algorithm: 'AES-256-GCM',
      keyFingerprint: `SHA256:${generateHex(16)}`,
      cipherIv: generateHex(12),
      authTag: generateHex(16),
      encryptedAt: new Date().toISOString(),
      encryptedBy: options?.actor || 'Managing Partner',
      docCount,
      status: 'ENCRYPTED',
      securityPolicy: 'CLIENT_CONFIDENTIAL',
    };

    records[folderName] = record;
    saveStorage(records);
    return record;
  },

  /**
   * Decrypt a client folder using mock AES-256-GCM
   */
  async decryptFolder(
    folderName: string,
    _options?: { actor?: string }
  ): Promise<{ success: boolean; folderName: string }> {
    // Simulate cryptographic MAC verification and deciphering
    await new Promise((res) => setTimeout(res, 350));

    const records = loadStorage();
    if (records[folderName]) {
      records[folderName] = {
        ...records[folderName],
        isEncrypted: false,
        status: 'DECRYPTED',
      };
      saveStorage(records);
    }
    return { success: true, folderName };
  },

  /**
   * Toggle encryption state for a folder
   */
  async toggleFolderEncryption(
    folderName: string,
    docCount: number = 0,
    options?: { actor?: string; notes?: string }
  ): Promise<{ isEncrypted: boolean; record?: EncryptedFolderRecord }> {
    const currentlyEncrypted = this.isFolderEncrypted(folderName);
    if (currentlyEncrypted) {
      await this.decryptFolder(folderName, options);
      return { isEncrypted: false };
    } else {
      const record = await this.encryptFolder(folderName, docCount, options);
      return { isEncrypted: true, record };
    }
  },
};
