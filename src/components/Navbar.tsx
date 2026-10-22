import React, { useState } from 'react';
import { 
  HardDrive, 
  ShieldCheck, 
  User as UserIcon, 
  ChevronDown, 
  Wifi, 
  LogOut, 
  FolderLock, 
  Server,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { User, SystemMetrics } from '../types';

interface NavbarProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  metrics: SystemMetrics | null;
  onOpenLoginModal: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  metrics,
  onOpenLoginModal,
  onRefreshAll,
  isRefreshing
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Pre-configured demo profiles for quick testing of RBAC roles
  const demoUsers: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Carlos Mendoza (TI & Admin)',
      email: 'admin@pyme.local',
      role: 'ADMIN',
      department: 'Sistemas y TI',
    },
    {
      id: 'usr-colab-1',
      name: 'Laura Gómez (Ventas)',
      email: 'laura@pyme.local',
      role: 'COLABORADOR',
      department: 'Ventas',
    },
    {
      id: 'usr-colab-2',
      name: 'Diego Ramos (Contabilidad)',
      email: 'diego@pyme.local',
      role: 'COLABORADOR',
      department: 'Contabilidad',
    },
  ];

  const formatGb = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand / Server identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                MiniNAS
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                PYME v1.0
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px] text-emerald-400">LAN: 192.168.1.150</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Mini-PC Intranet</span>
            </div>
          </div>
        </div>

        {/* Storage Quick Pill (from 2TB metrics) */}
        {metrics && (
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-200">Unidad NVMe 2TB:</span>
                <span className="font-mono text-slate-300">{formatGb(metrics.usedBytes)} GB / 2,000 GB</span>
                <span className="text-xs text-blue-400 font-semibold">({metrics.usedPercent}%)</span>
              </div>
              <div className="w-36 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${Math.max(5, metrics.usedPercent)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right Action & RBAC Profile Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            title="Recargar datos del NAS"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* User selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 transition shadow-sm text-left"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                currentUser.role === 'ADMIN'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {currentUser.name.charAt(0)}
              </div>
              
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 leading-none">
                  <span>{currentUser.name.split(' ')[0]}</span>
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-none">
                  {currentUser.department || 'General'}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowUserMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-40">
                  <div className="px-3 py-2 border-b border-slate-700 text-xs">
                    <div className="font-semibold text-slate-200">Sesión Actual en el NAS</div>
                    <div className="text-slate-400 text-[11px] truncate">{currentUser.email}</div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                      {currentUser.role === 'ADMIN' ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Rol Administrador (Acceso Completo)</span>
                        </>
                      ) : (
                        <>
                          <FolderLock className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-blue-300">Rol Colaborador (Restringido)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Cambio Rápido de Rol (Simulación RBAC):
                  </div>

                  {demoUsers.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/60 transition ${
                          isSelected ? 'bg-blue-600/20 text-blue-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            u.role === 'ADMIN' ? 'bg-amber-400' : 'bg-blue-400'
                          }`} />
                          <div>
                            <div>{u.name}</div>
                            <div className="text-[10px] text-slate-400">{u.department} • {u.role}</div>
                          </div>
                        </div>
                        {isSelected && <UserCheck className="w-4 h-4 text-blue-400" />}
                      </button>
                    );
                  })}

                  <div className="border-t border-slate-700 mt-2 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenLoginModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/60 flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ingresar con otras credenciales...</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
