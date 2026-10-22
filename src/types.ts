export type UserRole = 'ADMIN' | 'COLABORADOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  createdAt?: string;
}

export interface StorageItem {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  sizeBytes: number;
  category?: string;
  mtime: string;
  fileId?: string;
  userId?: string;
  userName?: string;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  storedName: string;
  filePath: string;
  sizeBytes: number;
  category: string;
  userId: string;
  userName?: string;
  createdAt: string;
}

export interface BackupItem {
  id: string;
  status: 'SUCCESS' | 'FAILED';
  sizeBytes: number;
  details?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  action: 'UPLOAD' | 'DELETE' | 'FOLDER_CREATE' | 'BACKUP' | 'LOGIN';
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface SystemMetrics {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPercent: number;
  filesCount: number;
  foldersCount: number;
  physicalUploadsBytes: number;
  backupsBytes: number;
  driveModel: string;
  healthStatus: string;
  temperature: string;
  lanStatus: string;
  lanIp: string;
}
