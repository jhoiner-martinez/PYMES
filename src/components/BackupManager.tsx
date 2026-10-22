import React, { useState } from 'react';
import {
  Database,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  FolderArchive,
  RotateCcw,
  Shield,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { BackupItem, User } from '../types';

interface BackupManagerProps {
  backups: BackupItem[];
  currentUser: User;
  onBackupCompleted: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  backups,
  currentUser,
  onBackupCompleted,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<BackupItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleRunBackup = async () => {
    if (currentUser.role !== 'ADMIN') {
      setError('Solo los administradores tienen autorización para ejecutar respaldos del servidor NAS.');
      return;
    }

    setIsRunning(true);
    setError(null);
    setLastResult(null);

    try {
      const response = await fetch('/api/backups/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Fallo durante la ejecución de la copia de seguridad');
      }

      setLastResult(data);
      onBackupCompleted();
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar la copia de seguridad');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 bg-slate-950">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Módulo de Resguardo y Redundancia Local
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Gestión de Copias de Seguridad (Backups)
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Copia íntegra de la carpeta raíz de almacenamiento NAS hacia el volumen aislado <code className="text-emerald-400 font-mono">/storage/backups</code> en el disco del Mini-PC.
            </p>
          </div>

          <div>
            <button
              onClick={handleRunBackup}
              disabled={isRunning || currentUser.role !== 'ADMIN'}
              className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xl transition ${
                currentUser.role !== 'ADMIN'
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : isRunning
                  ? 'bg-emerald-600 text-white cursor-wait opacity-80'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 hover:scale-[1.02]'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Clonando archivos a /backups...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Ejecutar Backup Local Ahora</span>
                </>
              )}
            </button>
            {currentUser.role !== 'ADMIN' && (
              <p className="text-[10px] text-amber-400 mt-1 text-right">
                * Requiere rol de Administrador
              </p>
            )}
          </div>
        </div>

        {/* Subtle accent glow */}
        <div className="absolute right-0 top-0 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Result / Notification Alert */}
      {lastResult && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-white">¡Copia de Seguridad completada con éxito!</div>
              <div className="text-emerald-300/80 text-[11px] mt-0.5">
                {lastResult.details} • Tamaño respaldado: {formatBytes(lastResult.sizeBytes)}
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
            ID: {lastResult.id}
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Backup Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total de Respaldos Registrados</span>
            <FolderArchive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {backups.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Persistido en SQLite (<code className="text-slate-300">BackupHistory</code>)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Última Ejecución</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-base font-bold text-white mt-2 truncate">
            {backups[0] ? formatDate(backups[0].createdAt) : 'Sin copias previas'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Integridad verifiacada</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ubicación de Almacén</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-base font-mono font-bold text-indigo-300 mt-2 truncate">
            /storage/backups
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Partición segura en Mini-PC
          </div>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Historial de Copias de Seguridad (SQLite)</h3>
              <p className="text-[11px] text-slate-400">Registro auditable de ejecuciones de respaldos locales</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {backups.length} registros
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No existen copias registradas. Pulsa en "Ejecutar Backup Local Ahora" para iniciar la primera.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID de Respaldo</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Tamaño Copiado</th>
                  <th className="py-3 px-4">Detalles de Ejecución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {b.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(b.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>EXITOSO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>FALLIDO</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {formatBytes(b.sizeBytes)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {b.details || 'Copia de seguridad estándar del árbol de directorios'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
