import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { createFileRecord, getFiles, deleteFileRecord, createBackupRecord, logActivity } from './db.js';

export const NAS_ROOT = path.resolve(process.cwd(), 'storage', 'nas_root');
export const BACKUPS_ROOT = path.resolve(process.cwd(), 'storage', 'backups');
export const TOTAL_DISK_CAPACITY_BYTES = 2 * 1024 * 1024 * 1024 * 1024; // 2 TB simulated NAS hard drive

export interface StorageNode {
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

// Ensure base directories exist and seed sample files
export async function initStorage() {
  await fsp.mkdir(NAS_ROOT, { recursive: true });
  await fsp.mkdir(BACKUPS_ROOT, { recursive: true });

  const baseFolders = ['Contabilidad', 'Ventas', 'Operaciones', 'General', 'Colaboradores'];
  for (const folder of baseFolders) {
    const fullPath = path.join(NAS_ROOT, folder);
    await fsp.mkdir(fullPath, { recursive: true });
  }

  // Create personal directories for default users
  await fsp.mkdir(path.join(NAS_ROOT, 'Colaboradores', 'laura@pyme.local'), { recursive: true });
  await fsp.mkdir(path.join(NAS_ROOT, 'Colaboradores', 'diego@pyme.local'), { recursive: true });

  // Seed initial sample documents if empty
  const existingFiles = await getFiles();
  if (existingFiles.length === 0) {
    const seedFiles = [
      {
        folder: 'Contabilidad',
        name: 'Balance_Financiero_Anual_2026.xlsx',
        content: 'Reporte Financiero y Balance de Resultados PYME 2026.\nIngresos Totales: $320,400 USD\nGastos Operativos: $198,200 USD\nUtilidad Neta: $122,200 USD',
        category: 'Contabilidad',
        userId: 'usr-colab-2',
      },
      {
        folder: 'Contabilidad',
        name: 'Facturas_Emitidas_Q3_2026.pdf',
        content: '%PDF-1.4\n1 0 obj\n<< /Title (Facturación Q3) /Creator (Sistema Contable) >>\nendobj\n%%EOF',
        category: 'Contabilidad',
        userId: 'usr-colab-2',
      },
      {
        folder: 'Ventas',
        name: 'Catalogo_Productos_Servicios_2026.pdf',
        content: '%PDF-1.4\n1 0 obj\n<< /Title (Catálogo Oficial PYME) /Author (Dpto Ventas) >>\nendobj\n%%EOF',
        category: 'Ventas',
        userId: 'usr-colab-1',
      },
      {
        folder: 'Ventas',
        name: 'Propuesta_Comercial_Cliente_Estrategico.docx',
        content: 'Propuesta de Servicios y Suministros Tecnológicos para Cliente Estratégico.\nVigencia: 30 días.\nContacto: laura@pyme.local',
        category: 'Ventas',
        userId: 'usr-colab-1',
      },
      {
        folder: 'Operaciones',
        name: 'Manual_Operativo_Servidor_NAS.pdf',
        content: '%PDF-1.4\n1 0 obj\n<< /Title (Manual de Usuario NAS Mini-PC) /Author (TI) >>\nendobj\n%%EOF',
        category: 'Operaciones',
        userId: 'usr-admin-1',
      },
      {
        folder: 'Operaciones',
        name: 'Inventario_Equipos_Oficina.csv',
        content: 'ID,Equipo,Marca,Modelo,Responsable,Estado\n1,Mini-PC NAS,Intel N100,16GB RAM 2TB SSD,Admin TI,Activo\n2,Switch Gigabit,TP-Link,TL-SG108E,Admin TI,Activo\n3,Router Balanceador,MikroTik,hEX S,Admin TI,Activo',
        category: 'Operaciones',
        userId: 'usr-admin-1',
      },
      {
        folder: 'General',
        name: 'Politica_Seguridad_Informacion.pdf',
        content: '%PDF-1.4\n1 0 obj\n<< /Title (Políticas de Seguridad y Respaldos) >>\nendobj\n%%EOF',
        category: 'General',
        userId: 'usr-admin-1',
      },
      {
        folder: 'Colaboradores/laura@pyme.local',
        name: 'Notas_Reuniones_Semanal.txt',
        content: 'Notas de seguimiento comercial:\n- Llamar a proveedor de insumos el viernes.\n- Presentar cotización a gerencia.',
        category: 'Ventas',
        userId: 'usr-colab-1',
      },
      {
        folder: 'Colaboradores/diego@pyme.local',
        name: 'Comprobantes_Impuestos_Borrador.txt',
        content: 'Planilla de retenciones tributarias pendientes de liquidar el día 25.',
        category: 'Contabilidad',
        userId: 'usr-colab-2',
      }
    ];

    for (const item of seedFiles) {
      const folderPath = path.join(NAS_ROOT, item.folder);
      await fsp.mkdir(folderPath, { recursive: true });
      const targetPath = path.join(folderPath, item.name);
      await fsp.writeFile(targetPath, item.content, 'utf-8');

      const stat = await fsp.stat(targetPath);
      const relPath = path.relative(NAS_ROOT, targetPath).replace(/\\/g, '/');

      await createFileRecord({
        originalName: item.name,
        storedName: item.name,
        filePath: relPath,
        sizeBytes: stat.size,
        category: item.category,
        userId: item.userId
      });
    }
  }
}

// Validate that a path stays inside NAS_ROOT to prevent path traversal attacks
export function resolveSafePath(userRelativePath: string): { fullPath: string; relPath: string } {
  const sanitized = path.normalize(userRelativePath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.resolve(NAS_ROOT, sanitized);

  if (!fullPath.startsWith(NAS_ROOT)) {
    throw new Error('Acceso no permitido: intento de escape fuera del volumen de almacenamiento NAS.');
  }

  const relPath = path.relative(NAS_ROOT, fullPath).replace(/\\/g, '/');
  return { fullPath, relPath };
}

// Scan a folder and return list of folders and files with DB metadata
export async function listDirectory(relativeDir: string, user: { id: string; role: string; email: string }) {
  await initStorage();
  const { fullPath, relPath } = resolveSafePath(relativeDir);

  if (!fs.existsSync(fullPath)) {
    return { currentPath: relPath, items: [] };
  }

  const entries = await fsp.readdir(fullPath, { withFileTypes: true });
  const dbFiles = await getFiles(user.id, user.role === 'ADMIN');
  const dbFileMap = new Map<string, typeof dbFiles[0]>();
  for (const f of dbFiles) {
    dbFileMap.set(f.filePath, f);
  }

  const items: StorageNode[] = [];

  for (const entry of entries) {
    const itemFullPath = path.join(fullPath, entry.name);
    const itemRelPath = path.relative(NAS_ROOT, itemFullPath).replace(/\\/g, '/');

    // Access control check for Colaborador:
    // If inside Colaboradores, only show own email folder unless admin
    if (user.role !== 'ADMIN') {
      if (itemRelPath.startsWith('Colaboradores/')) {
        const parts = itemRelPath.split('/');
        const ownerEmail = parts[1];
        if (ownerEmail && ownerEmail !== user.email) {
          continue; // Hidden from this collaborator
        }
      }
    }

    try {
      const stats = await fsp.stat(itemFullPath);
      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          relativePath: itemRelPath,
          isDirectory: true,
          sizeBytes: 0,
          mtime: stats.mtime.toISOString(),
        });
      } else {
        const matched = dbFileMap.get(itemRelPath);
        items.push({
          name: entry.name,
          relativePath: itemRelPath,
          isDirectory: false,
          sizeBytes: stats.size,
          category: matched?.category || getCategoryFromPath(itemRelPath),
          mtime: stats.mtime.toISOString(),
          fileId: matched?.id,
          userId: matched?.userId,
          userName: matched?.userName || 'Servidor NAS',
        });
      }
    } catch {
      // Skip broken symlinks or locked files
    }
  }

  // Sort: directories first, then files alphabetically
  items.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    currentPath: relPath,
    items,
  };
}

function getCategoryFromPath(relPath: string): string {
  const parts = relPath.split('/');
  if (parts.length > 1) {
    return parts[0];
  }
  return 'General';
}

// Duplicate handling and saving file
export async function storeUploadedFile(
  file: Express.Multer.File,
  targetRelativeDir: string,
  user: { id: string; name: string; role: string; email: string },
  overwrite = false
) {
  await initStorage();
  let sanitizedDir = targetRelativeDir || '';

  // Collaborator permission check: If target is inside Colaboradores, must be their own
  if (user.role !== 'ADMIN' && sanitizedDir.startsWith('Colaboradores')) {
    if (!sanitizedDir.startsWith(`Colaboradores/${user.email}`)) {
      sanitizedDir = `Colaboradores/${user.email}`;
    }
  }

  const { fullPath: targetDirFullPath } = resolveSafePath(sanitizedDir);
  await fsp.mkdir(targetDirFullPath, { recursive: true });

  let finalFileName = file.originalname;
  let targetFilePath = path.join(targetDirFullPath, finalFileName);

  // Check duplicate
  const fileExists = fs.existsSync(targetFilePath);
  if (fileExists && !overwrite) {
    // Generate unique numbered name: file (1).ext
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    let counter = 1;
    while (fs.existsSync(path.join(targetDirFullPath, `${base} (${counter})${ext}`))) {
      counter++;
    }
    finalFileName = `${base} (${counter})${ext}`;
    targetFilePath = path.join(targetDirFullPath, finalFileName);
  }

  // Move uploaded temp file or write buffer
  if (file.path) {
    await fsp.copyFile(file.path, targetFilePath);
    await fsp.unlink(file.path).catch(() => {});
  } else if (file.buffer) {
    await fsp.writeFile(targetFilePath, file.buffer);
  }

  const stats = await fsp.stat(targetFilePath);
  const relPath = path.relative(NAS_ROOT, targetFilePath).replace(/\\/g, '/');
  const category = getCategoryFromPath(relPath);

  // Check if existing DB entry exists for this path, update or insert
  const existingFiles = await getFiles();
  const existing = existingFiles.find(f => f.filePath === relPath);
  let record;
  if (existing) {
    await deleteFileRecord(existing.id);
  }

  record = await createFileRecord({
    originalName: file.originalname,
    storedName: finalFileName,
    filePath: relPath,
    sizeBytes: stats.size,
    category,
    userId: user.id,
  });

  await logActivity({
    action: 'UPLOAD',
    description: `Archivo subido: "${finalFileName}" (${formatBytes(stats.size)}) en "${sanitizedDir || 'Raíz'}"`,
    userId: user.id,
    userName: user.name,
  });

  return {
    record,
    renamed: finalFileName !== file.originalname,
    finalFileName,
  };
}

// Create new folder
export async function createFolder(
  relativeDir: string,
  folderName: string,
  user: { id: string; name: string; role: string; email: string }
) {
  await initStorage();
  const cleanFolderName = folderName.replace(/[<>:"/\\|?*]/g, '_').trim();
  if (!cleanFolderName) {
    throw new Error('El nombre de la carpeta no es válido');
  }

  const { fullPath: parentDirFullPath, relPath: parentRelPath } = resolveSafePath(relativeDir);
  const newFolderFullPath = path.join(parentDirFullPath, cleanFolderName);

  // Permission check for Colaborador: cannot create folders at root or other's personal folders
  if (user.role !== 'ADMIN') {
    if (!parentRelPath || parentRelPath === '.') {
      throw new Error('Los colaboradores no tienen permisos para crear carpetas en el directorio raíz.');
    }
  }

  if (fs.existsSync(newFolderFullPath)) {
    throw new Error(`La carpeta "${cleanFolderName}" ya existe en esta ubicación.`);
  }

  await fsp.mkdir(newFolderFullPath, { recursive: true });

  await logActivity({
    action: 'FOLDER_CREATE',
    description: `Carpeta creada: "${cleanFolderName}" en "${parentRelPath || 'Raíz'}"`,
    userId: user.id,
    userName: user.name,
  });

  return {
    name: cleanFolderName,
    relativePath: path.relative(NAS_ROOT, newFolderFullPath).replace(/\\/g, '/'),
  };
}

// Delete file
export async function deleteStorageFile(
  fileId: string,
  user: { id: string; name: string; role: string; email: string }
) {
  const dbFiles = await getFiles();
  const file = dbFiles.find(f => f.id === fileId);
  if (!file) {
    throw new Error('El archivo no fue encontrado en el catálogo');
  }

  // Permission check: Collaborators can only delete their own files
  if (user.role !== 'ADMIN' && file.userId !== user.id) {
    throw new Error('No tienes permisos para eliminar este archivo.');
  }

  const { fullPath } = resolveSafePath(file.filePath);
  if (fs.existsSync(fullPath)) {
    await fsp.unlink(fullPath);
  }

  await deleteFileRecord(file.id);

  await logActivity({
    action: 'DELETE',
    description: `Archivo eliminado: "${file.originalName}" de "${file.filePath}"`,
    userId: user.id,
    userName: user.name,
  });

  return { success: true };
}

// Recursive directory copy for backup
async function copyDirRecursive(src: string, dest: string): Promise<number> {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  let totalBytes = 0;

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      totalBytes += await copyDirRecursive(srcPath, destPath);
    } else {
      await fsp.copyFile(srcPath, destPath);
      const stat = await fsp.stat(destPath);
      totalBytes += stat.size;
    }
  }

  return totalBytes;
}

// Run Local NAS Backup
export async function executeBackup(user: { id: string; name: string; role: string }) {
  if (user.role !== 'ADMIN') {
    throw new Error('Solo los administradores pueden ejecutar copias de seguridad del NAS.');
  }

  await initStorage();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFolder = `backup_nas_${timestamp}`;
  const backupDest = path.join(BACKUPS_ROOT, backupFolder);

  try {
    const totalCopiedBytes = await copyDirRecursive(NAS_ROOT, backupDest);
    const record = await createBackupRecord({
      status: 'SUCCESS',
      sizeBytes: totalCopiedBytes,
      details: `Respaldo completo de la unidad NAS en ${backupFolder}`,
    });

    await logActivity({
      action: 'BACKUP',
      description: `Copia de seguridad ejecutada con éxito (${formatBytes(totalCopiedBytes)})`,
      userId: user.id,
      userName: user.name,
    });

    return record;
  } catch (err: any) {
    const record = await createBackupRecord({
      status: 'FAILED',
      sizeBytes: 0,
      details: `Error en la copia: ${err.message || 'Falla de I/O en disco'}`,
    });
    return record;
  }
}

// Calculate total physical storage consumed and simulated 2TB metrics
export async function getStorageMetrics() {
  await initStorage();

  async function getDirSize(dirPath: string): Promise<{ size: number; files: number; folders: number }> {
    let size = 0;
    let files = 0;
    let folders = 0;

    try {
      const entries = await fsp.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const itemPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          folders++;
          const sub = await getDirSize(itemPath);
          size += sub.size;
          files += sub.files;
          folders += sub.folders;
        } else {
          files++;
          const stat = await fsp.stat(itemPath);
          size += stat.size;
        }
      }
    } catch {
      // Ignored
    }

    return { size, files, folders };
  }

  const nasStats = await getDirSize(NAS_ROOT);
  const backupStats = await getDirSize(BACKUPS_ROOT);

  // We simulate a realistic base used by NAS OS/Firmware and enterprise assets (e.g. 142.6 GB) + actual dynamic uploaded files
  const simulatedBaseOSBytes = 142.6 * 1024 * 1024 * 1024;
  const usedBytes = simulatedBaseOSBytes + nasStats.size + backupStats.size;
  const freeBytes = Math.max(0, TOTAL_DISK_CAPACITY_BYTES - usedBytes);
  const usedPercent = Math.min(100, (usedBytes / TOTAL_DISK_CAPACITY_BYTES) * 100);

  return {
    totalBytes: TOTAL_DISK_CAPACITY_BYTES,
    usedBytes,
    freeBytes,
    usedPercent: Number(usedPercent.toFixed(2)),
    filesCount: nasStats.files + 12480, // adding simulated system and media file count
    foldersCount: nasStats.folders + 340,
    physicalUploadsBytes: nasStats.size,
    backupsBytes: backupStats.size,
    driveModel: 'Crucial T500 2TB NVMe PCIe 4.0 M.2 SSD (Mini-PC)',
    healthStatus: 'Óptimo (100% SMART Sano)',
    temperature: '41°C',
    lanStatus: 'En línea (1.0 Gbps Full Duplex - LAN)',
    lanIp: '192.168.1.150:3000',
  };
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
