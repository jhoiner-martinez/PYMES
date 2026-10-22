import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'COLABORADOR';
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileRecord {
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

export interface BackupRecord {
  id: string;
  status: 'SUCCESS' | 'FAILED';
  sizeBytes: number;
  details?: string;
  createdAt: string;
}

export interface ActivityRecord {
  id: string;
  action: 'UPLOAD' | 'DELETE' | 'FOLDER_CREATE' | 'BACKUP' | 'LOGIN';
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'dev.db');

let dbInstance: Database | null = null;

function saveDbToFile() {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch {
      dbInstance = new SQL.Database();
    }
  } else {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbInstance = new SQL.Database();
  }

  // Initialize SQLite tables matching the Prisma schema & additional metadata
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'COLABORADOR',
      department TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS File (
      id TEXT PRIMARY KEY,
      originalName TEXT NOT NULL,
      storedName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      sizeBytes INTEGER NOT NULL,
      category TEXT,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS BackupHistory (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      sizeBytes INTEGER NOT NULL,
      details TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ActivityLog (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // Check if users exist, otherwise seed initial users
  const userCountResult = dbInstance.exec('SELECT COUNT(*) as count FROM User;');
  const userCount = userCountResult[0]?.values[0]?.[0] as number || 0;

  if (userCount === 0) {
    const now = new Date().toISOString();
    // Seed Admin
    dbInstance.run(
      `INSERT INTO User (id, name, email, password, role, department, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr-admin-1',
        'Carlos Mendoza (TI & Admin)',
        'admin@pyme.local',
        'admin123',
        'ADMIN',
        'Sistemas y TI',
        now,
        now
      ]
    );

    // Seed Colaborador 1 - Ventas
    dbInstance.run(
      `INSERT INTO User (id, name, email, password, role, department, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr-colab-1',
        'Laura Gómez (Ventas)',
        'laura@pyme.local',
        'user123',
        'COLABORADOR',
        'Ventas',
        now,
        now
      ]
    );

    // Seed Colaborador 2 - Contabilidad
    dbInstance.run(
      `INSERT INTO User (id, name, email, password, role, department, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr-colab-2',
        'Diego Ramos (Contabilidad)',
        'diego@pyme.local',
        'user123',
        'COLABORADOR',
        'Contabilidad',
        now,
        now
      ]
    );

    // Seed initial backup record
    dbInstance.run(
      `INSERT INTO BackupHistory (id, status, sizeBytes, details, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'bck-init-01',
        'SUCCESS',
        14857600,
        'Copia de seguridad inicial del sistema NAS (Mini-PC)',
        new Date(Date.now() - 86400000 * 2).toISOString()
      ]
    );

    // Seed initial activity log
    dbInstance.run(
      `INSERT INTO ActivityLog (id, action, description, userId, userName, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'act-init-1',
        'LOGIN',
        'Sistema MiniNAS PYME inicializado correctamente',
        'usr-admin-1',
        'Carlos Mendoza (TI & Admin)',
        now
      ]
    );

    saveDbToFile();
  }

  return dbInstance;
}

// User CRUD Helpers
export async function getUsers(): Promise<UserRecord[]> {
  const db = await getDb();
  const res = db.exec('SELECT id, name, email, role, department, createdAt, updatedAt FROM User ORDER BY role ASC, name ASC');
  if (!res[0]) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const item: any = {};
    cols.forEach((c, idx) => { item[c] = row[idx]; });
    return item as UserRecord;
  });
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM User WHERE email = :email LIMIT 1');
  stmt.bind({ ':email': email });
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    return row as UserRecord;
  }
  stmt.free();
  return null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT id, name, email, role, department, createdAt, updatedAt FROM User WHERE id = :id LIMIT 1');
  stmt.bind({ ':id': id });
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    return row as UserRecord;
  }
  stmt.free();
  return null;
}

export async function createUser(data: { name: string; email: string; password: string; role: 'ADMIN' | 'COLABORADOR'; department?: string }): Promise<UserRecord> {
  const db = await getDb();
  const id = 'usr-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO User (id, name, email, password, role, department, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.email, data.password, data.role, data.department || 'General', now, now]
  );
  saveDbToFile();
  return {
    id,
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    department: data.department || 'General',
    createdAt: now,
    updatedAt: now
  };
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await getDb();
  db.run('DELETE FROM User WHERE id = ?', [id]);
  saveDbToFile();
  return true;
}

// File CRUD Helpers
export async function getFiles(filterUserId?: string, isAdmin?: boolean): Promise<FileRecord[]> {
  const db = await getDb();
  let query = `
    SELECT f.id, f.originalName, f.storedName, f.filePath, f.sizeBytes, f.category, f.userId, f.createdAt, u.name as userName
    FROM File f
    LEFT JOIN User u ON f.userId = u.id
  `;

  if (!isAdmin && filterUserId) {
    // Colaborador only sees public/shared categories OR files inside their own user folder
    query += ` WHERE f.userId = '${filterUserId}' OR f.filePath NOT LIKE 'Colaboradores/%' OR f.filePath LIKE 'Colaboradores/${filterUserId}/%'`;
  }

  query += ' ORDER BY f.createdAt DESC';

  const res = db.exec(query);
  if (!res[0]) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const item: any = {};
    cols.forEach((c, idx) => { item[c] = row[idx]; });
    return item as FileRecord;
  });
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  const db = await getDb();
  const stmt = db.prepare(`
    SELECT f.id, f.originalName, f.storedName, f.filePath, f.sizeBytes, f.category, f.userId, f.createdAt, u.name as userName
    FROM File f
    LEFT JOIN User u ON f.userId = u.id
    WHERE f.id = :id
    LIMIT 1
  `);
  stmt.bind({ ':id': id });
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    return row as FileRecord;
  }
  stmt.free();
  return null;
}

export async function createFileRecord(data: {
  id?: string;
  originalName: string;
  storedName: string;
  filePath: string;
  sizeBytes: number;
  category?: string;
  userId: string;
}): Promise<FileRecord> {
  const db = await getDb();
  const id = data.id || 'fil-' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO File (id, originalName, storedName, filePath, sizeBytes, category, userId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.originalName, data.storedName, data.filePath, data.sizeBytes, data.category || 'General', data.userId, now]
  );
  saveDbToFile();
  return {
    id,
    originalName: data.originalName,
    storedName: data.storedName,
    filePath: data.filePath,
    sizeBytes: data.sizeBytes,
    category: data.category || 'General',
    userId: data.userId,
    createdAt: now
  };
}

export async function deleteFileRecord(id: string): Promise<boolean> {
  const db = await getDb();
  db.run('DELETE FROM File WHERE id = ?', [id]);
  saveDbToFile();
  return true;
}

// Backup History Helpers
export async function getBackupHistory(): Promise<BackupRecord[]> {
  const db = await getDb();
  const res = db.exec('SELECT id, status, sizeBytes, details, createdAt FROM BackupHistory ORDER BY createdAt DESC');
  if (!res[0]) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const item: any = {};
    cols.forEach((c, idx) => { item[c] = row[idx]; });
    return item as BackupRecord;
  });
}

export async function createBackupRecord(data: {
  status: 'SUCCESS' | 'FAILED';
  sizeBytes: number;
  details?: string;
}): Promise<BackupRecord> {
  const db = await getDb();
  const id = 'bck-' + Date.now().toString(36);
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO BackupHistory (id, status, sizeBytes, details, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.status, data.sizeBytes, data.details || null, now]
  );
  saveDbToFile();
  return {
    id,
    status: data.status,
    sizeBytes: data.sizeBytes,
    details: data.details,
    createdAt: now
  };
}

// Activity Log Helpers
export async function logActivity(data: {
  action: 'UPLOAD' | 'DELETE' | 'FOLDER_CREATE' | 'BACKUP' | 'LOGIN';
  description: string;
  userId: string;
  userName: string;
}): Promise<void> {
  try {
    const db = await getDb();
    const id = 'act-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO ActivityLog (id, action, description, userId, userName, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.action, data.description, data.userId, data.userName, now]
    );
    saveDbToFile();
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

export async function getRecentActivity(limit = 20): Promise<ActivityRecord[]> {
  const db = await getDb();
  const res = db.exec(`SELECT id, action, description, userId, userName, createdAt FROM ActivityLog ORDER BY createdAt DESC LIMIT ${limit}`);
  if (!res[0]) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const item: any = {};
    cols.forEach((c, idx) => { item[c] = row[idx]; });
    return item as ActivityRecord;
  });
}
