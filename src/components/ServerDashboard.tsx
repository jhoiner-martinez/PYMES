import React from 'react';
import {
  HardDrive,
  Cpu,
  Activity,
  Server,
  Wifi,
  ShieldCheck,
  Thermometer,
  Clock,
  Layers,
  ArrowUpRight,
  Database,
  FileText,
  AlertCircle,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { SystemMetrics, ActivityItem } from '../types';

interface ServerDashboardProps {
  metrics: SystemMetrics | null;
  activities: ActivityItem[];
  onNavigateToExplorer: () => void;
  onNavigateToBackups: () => void;
}

export const ServerDashboard: React.FC<ServerDashboardProps> = ({
  metrics,
  activities,
  onNavigateToExplorer,
  onNavigateToBackups,
}) => {
  const formatGb = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1);
  };

  const formatTb = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getActionBadge = (action: ActivityItem['action']) => {
    switch (action) {
      case 'UPLOAD':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">SUBIDA</span>;
      case 'BACKUP':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">RESPALDO</span>;
      case 'DELETE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">ELIMINADO</span>;
      case 'FOLDER_CREATE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">CARPETA</span>;
      case 'LOGIN':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">ACCESO</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">INFO</span>;
    }
  };

  if (!metrics) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Obteniendo telemetría del servidor Mini-PC...</span>
        </div>
      </div>
    );
  }

  const freePercent = (100 - metrics.usedPercent).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 bg-slate-950">
      
      {/* Top Banner / Hardware Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
                Servidor Mini-PC NAS • Estado Saludable
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Monitor de Almacenamiento & Red LAN
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Panel de control en tiempo real para la unidad de 2 TB de almacenamiento local, rendimiento de la CPU del Mini-PC, servicio Samba/SMB y seguridad interna.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToBackups}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition shadow-sm flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Ver Copias de Seguridad</span>
            </button>
            <button
              onClick={onNavigateToExplorer}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-lg shadow-blue-500/25 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Explorar Archivos</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Primary 2 TB Disk Visual Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Storage Capacity Gauge Card */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Volumen Primario NAS (2.0 TB NVMe)</h3>
                <p className="text-xs text-slate-400">{metrics.driveModel}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{metrics.healthStatus}</span>
              </span>
              <span className="text-[11px] text-slate-400">SMART Health Check OK</span>
            </div>
          </div>

          {/* Big Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-white">
                  {formatGb(metrics.usedBytes)} GB
                </span>
                <span className="text-sm text-slate-400 font-medium ml-2">
                  utilizados de {formatTb(metrics.totalBytes)} TB ({metrics.usedPercent}%)
                </span>
              </div>
              <div className="text-sm font-semibold text-emerald-400">
                {formatGb(metrics.freeBytes)} GB libres ({freePercent}%)
              </div>
            </div>

            {/* Gradient Bar with segment dividers */}
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-700 relative"
                style={{ width: `${Math.max(4, metrics.usedPercent)}%` }}
              />
            </div>
          </div>

          {/* Segment breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Archivos Subidos</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {(metrics.physicalUploadsBytes / 1024).toFixed(1)} KB (Pruebas)
              </span>
              <span className="text-[10px] text-blue-400 font-medium mt-0.5 block">Documentos PYME</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Copias de Respaldo</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {(metrics.backupsBytes / (1024 * 1024)).toFixed(1)} MB
              </span>
              <span className="text-[10px] text-emerald-400 font-medium mt-0.5 block">Volumen /backups</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sistema NAS & Base</span>
              <span className="text-sm font-bold text-white mt-1 block">142.6 GB</span>
              <span className="text-[10px] text-indigo-400 font-medium mt-0.5 block">SO + SQLite + Logs</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Archivos</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {metrics.filesCount.toLocaleString()} items
              </span>
              <span className="text-[10px] text-cyan-400 font-medium mt-0.5 block">{metrics.foldersCount} carpetas</span>
            </div>
          </div>
        </div>

        {/* Mini-PC Hardware Health Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>Mini-PC Hardware Telemetría</span>
            </h3>

            <div className="space-y-3 text-xs">
              
              {/* CPU */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Procesador Intel Quad-Core</div>
                  <div className="text-[10px] text-slate-400">Bajo consumo (15W TDP)</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-400 font-bold">12% Carga</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                    <Thermometer className="w-3 h-3 text-amber-400" />
                    <span>{metrics.temperature}</span>
                  </div>
                </div>
              </div>

              {/* RAM */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Memoria RAM DDR4</div>
                  <div className="text-[10px] text-slate-400">Total 16 GB instalados</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-blue-400 font-bold">1.8 GB / 16 GB</div>
                  <div className="text-[10px] text-slate-400">11% en uso</div>
                </div>
              </div>

              {/* LAN Interface */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Interfaz de Red Ethernet</div>
                  <div className="text-[10px] text-slate-400">IP LAN: {metrics.lanIp}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-400 font-bold">1.0 Gbps</div>
                  <div className="text-[10px] text-slate-400">Full Duplex</div>
                </div>
              </div>

              {/* Protocols */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Protocolos Activos</div>
                  <div className="text-[10px] text-slate-400">SMB 3.0 / NFS / Web Intranet</div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                  ESCUCHANDO
                </span>
              </div>

            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-800">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Tiempo de actividad del servidor (Uptime): 14 días, 6 horas</span>
          </div>
        </div>

      </div>

      {/* Recent Activity Audit Trail */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registro de Actividad Reciente del Servidor</h3>
              <p className="text-xs text-slate-400">Auditoría en tiempo real de operaciones de archivos y accesos</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {activities.length} eventos registrados
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No hay actividades registradas en este período.
            </div>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  {getActionBadge(act.action)}
                  <div>
                    <div className="text-slate-200 font-medium">{act.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Operador: <span className="text-slate-300 font-semibold">{act.userName}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono flex-shrink-0">
                  {formatDate(act.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
