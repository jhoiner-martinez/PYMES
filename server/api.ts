import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getUserByEmail,
  getUserById,
  getUsers,
  createUser,
  deleteUser,
  getFiles,
  getFileById,
  getBackupHistory,
  getRecentActivity,
  logActivity,
  UserRecord
} from './db.js';
import {
  listDirectory,
  storeUploadedFile,
  createFolder,
  deleteStorageFile,
  executeBackup,
  getStorageMetrics,
  resolveSafePath,
  NAS_ROOT,
  formatBytes
} from './storage.js';

export const apiRouter = Router();

// Configure multer temp storage
const upload = multer({
  dest: path.resolve(process.cwd(), 'storage', 'temp'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max file size for prototype
  },
});

// Middleware to parse mock/bearer or query user auth
function extractUserFromRequest(req: Request): UserRecord | null {
  const authHeader = req.headers['x-user-id'] || req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    // In our prototype, token contains userId or email
    const users = (req as any)._cachedUsers || [];
    const matched = users.find((u: UserRecord) => u.id === token || u.email === token);
    if (matched) return matched;
  }
  return null;
}

// Global middleware to populate req.user if header present
apiRouter.use(async (req: any, _res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      const user = await getUserById(userId);
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Continue
  }
  next();
});

// Helper for default user fallback
async function getEffectiveUser(req: any): Promise<UserRecord> {
  if (req.user) return req.user;
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    const user = await getUserById(userId);
    if (user) return user;
  }
  // Fallback to Admin for ease of use or demonstration if not provided
  const users = await getUsers();
  return users[0] || {
    id: 'usr-admin-1',
    name: 'Carlos Mendoza (TI & Admin)',
    email: 'admin@pyme.local',
    password: '',
    role: 'ADMIN',
    department: 'Sistemas y TI',
    createdAt: '',
    updatedAt: ''
  };
}

// -------------------------------------------------------------
// 1. AUTH & ROLES (RBAC)
// -------------------------------------------------------------

// POST /api/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña requeridos' });
  }

  const user = await getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
  }

  await logActivity({
    action: 'LOGIN',
    description: `Inicio de sesión exitoso [${user.role}]`,
    userId: user.id,
    userName: user.name,
  });

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    token: user.id,
  });
});

// GET /api/auth/me
apiRouter.get('/auth/me', async (req: any, res: Response) => {
  const user = await getEffectiveUser(req);
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

// GET /api/users (ADMIN ONLY)
apiRouter.get('/users', async (req: any, res: Response) => {
  const currentUser = await getEffectiveUser(req);
  if (currentUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado: solo administradores pueden ver la lista de usuarios.' });
  }
  const users = await getUsers();
  return res.json({ users });
});

// POST /api/users (ADMIN ONLY)
apiRouter.post('/users', async (req: any, res: Response) => {
  const currentUser = await getEffectiveUser(req);
  if (currentUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado: solo administradores pueden dar de alta usuarios.' });
  }

  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para registrar al usuario.' });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Ya existe un usuario con este correo electrónico.' });
  }

  const newUser = await createUser({
    name,
    email,
    password,
    role: role === 'ADMIN' ? 'ADMIN' : 'COLABORADOR',
    department: department || 'General',
  });

  // Ensure collaborator personal folder is prepared
  if (newUser.role === 'COLABORADOR') {
    const userFolder = path.join(NAS_ROOT, 'Colaboradores', newUser.email);
    await fs.promises.mkdir(userFolder, { recursive: true }).catch(() => {});
  }

  return res.status(201).json({ user: newUser });
});

// DELETE /api/users/:id (ADMIN ONLY)
apiRouter.delete('/users/:id', async (req: any, res: Response) => {
  const currentUser = await getEffectiveUser(req);
  if (currentUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  if (req.params.id === currentUser.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador en uso.' });
  }

  await deleteUser(req.params.id);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// 2. EXPLORADOR Y GESTIÓN DE ARCHIVOS
// -------------------------------------------------------------

// GET /api/files/browse?dir=...
apiRouter.get('/files/browse', async (req: any, res: Response) => {
  try {
    const user = await getEffectiveUser(req);
    const requestedDir = (req.query.dir as string) || '';
    const result = await listDirectory(requestedDir, user);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Error al explorar el directorio' });
  }
});

// GET /api/files/all (Metadata list with search/filter)
apiRouter.get('/files/all', async (req: any, res: Response) => {
  try {
    const user = await getEffectiveUser(req);
    const files = await getFiles(user.id, user.role === 'ADMIN');
    return res.json({ files });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/files/upload
apiRouter.post('/files/upload', upload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo para almacenar.' });
    }

    const user = await getEffectiveUser(req);
    const targetDir = req.body.targetDir || '';
    const overwrite = req.body.overwrite === 'true' || req.body.overwrite === true;

    const result = await storeUploadedFile(req.file, targetDir, user, overwrite);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error guardando archivo en almacenamiento físico NAS' });
  }
});

// GET /api/files/download/:id
apiRouter.get('/files/download/:id', async (req: any, res: Response) => {
  try {
    const fileId = req.params.id;
    const fileRecord = await getFileById(fileId);
    if (!fileRecord) {
      return res.status(404).json({ error: 'Archivo no encontrado en la base de datos' });
    }

    const user = await getEffectiveUser(req);
    // RBAC check: Colaborador cannot download other collaborator's private folder files
    if (user.role !== 'ADMIN' && fileRecord.filePath.startsWith('Colaboradores/')) {
      const parts = fileRecord.filePath.split('/');
      if (parts[1] && parts[1] !== user.email) {
        return res.status(403).json({ error: 'No tienes permisos para descargar este archivo privado.' });
      }
    }

    const { fullPath } = resolveSafePath(fileRecord.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'El archivo físico no existe en el disco del NAS' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileRecord.originalName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const readStream = fs.createReadStream(fullPath);
    readStream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al descargar archivo' });
  }
});

// POST /api/folders
apiRouter.post('/folders', async (req: any, res: Response) => {
  try {
    const user = await getEffectiveUser(req);
    const { parentDir, folderName } = req.body;
    if (!folderName) {
      return res.status(400).json({ error: 'El nombre de la carpeta es requerido.' });
    }

    const result = await createFolder(parentDir || '', folderName, user);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Error al crear carpeta' });
  }
});

// DELETE /api/files/:id
apiRouter.delete('/files/:id', async (req: any, res: Response) => {
  try {
    const user = await getEffectiveUser(req);
    const result = await deleteStorageFile(req.params.id, user);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Error al eliminar archivo' });
  }
});

// -------------------------------------------------------------
// 3. MONITOR DE SERVIDOR NAS (SIMULACIÓN 2TB + HARDWARE REAL-TIME)
// -------------------------------------------------------------

// GET /api/system/metrics
apiRouter.get('/system/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getStorageMetrics();
    return res.json(metrics);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/system/activity
apiRouter.get('/system/activity', async (_req: Request, res: Response) => {
  try {
    const activities = await getRecentActivity(20);
    return res.json({ activities });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. BACKUPS Y COPIAS DE SEGURIDAD
// -------------------------------------------------------------

// GET /api/backups
apiRouter.get('/backups', async (_req: Request, res: Response) => {
  try {
    const backups = await getBackupHistory();
    return res.json({ backups });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/backups/run
apiRouter.post('/backups/run', async (req: any, res: Response) => {
  try {
    const user = await getEffectiveUser(req);
    const result = await executeBackup(user);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Fallo al ejecutar la copia de seguridad' });
  }
});
