import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  HardDrive,
  Database,
  Users,
  Shield,
  ShieldAlert,
  Server,
  FolderLock,
  Menu,
  X,
  Activity,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { FileExplorer } from './components/FileExplorer';
import { ServerDashboard } from './components/ServerDashboard';
import { BackupManager } from './components/BackupManager';
import { UserManager } from './components/UserManager';
import { UploadModal } from './components/UploadModal';
import { NewFolderModal } from './components/NewFolderModal';
import { LoginModal } from './components/LoginModal';
import { User, StorageItem, SystemMetrics, BackupItem, ActivityItem } from './types';

export default function App() {
  // Active User session (default Carlos Mendoza - Admin)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-admin-1',
    name: 'Carlos Mendoza (TI & Admin)',
    email: 'admin@pyme.local',
    role: 'ADMIN',
    department: 'Sistemas y TI',
  });

  // Current tab
  const [activeTab, setActiveTab] = useState<'explorer' | 'dashboard' | 'backups' | 'users'>('explorer');

  // File explorer state
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<StorageItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  // System telemetry & Backups state
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Fetch Directory items
  const fetchDirectory = useCallback(async (path: string = currentPath) => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch(`/api/files/browse?dir=${encodeURIComponent(path)}`, {
        headers: { 'x-user-id': currentUser.id },
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setCurrentPath(data.currentPath || '');
      }
    } catch (err) {
      console.error('Error fetching directory:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [currentPath, currentUser.id]);

  // Fetch Server Metrics (2TB drive + Mini-PC status)
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/system/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  }, []);

  // Fetch Backups
  const fetchBackups = useCallback(async () => {
    try {
      const response = await fetch('/api/backups');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
    }
  }, []);

  // Fetch Activity Log
  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch('/api/system/activity');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  }, []);

  // Fetch Users (Admin only)
  const fetchUsers = useCallback(async () => {
    if (currentUser.role !== 'ADMIN') return;
    try {
      const response = await fetch('/api/users', {
        headers: { 'x-user-id': currentUser.id },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [currentUser.role, currentUser.id]);

  // Refresh all state
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchDirectory(),
      fetchMetrics(),
      fetchBackups(),
      fetchActivity(),
      fetchUsers(),
    ]);
    setIsRefreshing(false);
  };

  // Initial load and user change effect
  useEffect(() => {
    fetchDirectory('');
    fetchMetrics();
    fetchBackups();
    fetchActivity();
    fetchUsers();

    // If Colaborador is on an Admin-restricted tab, route to explorer
    if (currentUser.role === 'COLABORADOR' && (activeTab === 'dashboard' || activeTab === 'users')) {
      setActiveTab('explorer');
    }
  }, [currentUser]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    fetchDirectory(path);
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setCurrentPath('');
    if (user.role === 'COLABORADOR' && (activeTab === 'dashboard' || activeTab === 'users')) {
      setActiveTab('explorer');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        metrics={metrics}
        onOpenLoginModal={() => setIsLoginOpen(true)}
        onRefreshAll={handleRefreshAll}
        isRefreshing={isRefreshing}
      />

      {/* Main Shell */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 justify-between select-none">
          
          <div className="space-y-6">
            
            {/* Server LAN Info Card */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  <span>Mini-PC Intranet</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Host: <span className="text-slate-200">nas-pyme.lan</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                IP: <span className="text-emerald-400">192.168.1.150:3000</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/60 flex items-center justify-between">
                <span>SMB 445 / NFS</span>
                <span className="text-emerald-400 font-bold">Activo</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Módulos del Sistema
              </div>

              {/* File Explorer Tab */}
              <button
                onClick={() => setActiveTab('explorer')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'explorer'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Folder className="w-4 h-4 text-blue-300" />
                <span>Gestor de Archivos</span>
              </button>

              {/* Server Dashboard Tab (Admin only) */}
              <button
                onClick={() => {
                  if (currentUser.role === 'ADMIN') setActiveTab('dashboard');
                }}
                disabled={currentUser.role !== 'ADMIN'}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  currentUser.role !== 'ADMIN'
                    ? 'text-slate-600 cursor-not-allowed opacity-60'
                    : activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <span>Monitor del Servidor</span>
                </div>
                {currentUser.role !== 'ADMIN' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-bold">
                    ADMIN
                  </span>
                )}
              </button>

              {/* Backups Tab */}
              <button
                onClick={() => setActiveTab('backups')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'backups'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Copias de Seguridad</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                  {backups.length}
                </span>
              </button>

              {/* Users & RBAC Tab (Admin only) */}
              <button
                onClick={() => {
                  if (currentUser.role === 'ADMIN') setActiveTab('users');
                }}
                disabled={currentUser.role !== 'ADMIN'}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  currentUser.role !== 'ADMIN'
                    ? 'text-slate-600 cursor-not-allowed opacity-60'
                    : activeTab === 'users'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Usuarios & Accesos RBAC</span>
                </div>
                {currentUser.role !== 'ADMIN' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-bold">
                    ADMIN
                  </span>
                )}
              </button>
            </div>

            {/* Quick Departments Folders Shortcuts */}
            <div className="space-y-1 pt-4 border-t border-slate-800">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Carpetas Rápidas
              </div>
              {[
                { name: 'Contabilidad', path: 'Contabilidad' },
                { name: 'Ventas', path: 'Ventas' },
                { name: 'Operaciones', path: 'Operaciones' },
                { name: 'General', path: 'General' },
                { name: 'Mi Espacio Privado', path: `Colaboradores/${currentUser.email}` },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    setActiveTab('explorer');
                    handleNavigate(item.path);
                  }}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                    currentPath === item.path && activeTab === 'explorer'
                      ? 'bg-slate-800 text-blue-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              ))}
            </div>

          </div>

          {/* Bottom RBAC Role Badge Footer */}
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Tu Privilegio:</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                currentUser.role === 'ADMIN'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {currentUser.role === 'ADMIN'
                ? 'Acceso irrestricto a todos los módulos y ficheros.'
                : 'Acceso acotado a carpetas públicas y tu espacio privado.'}
            </p>
          </div>

        </aside>

        {/* Mobile Navigation Pills */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-30 px-3 py-2 flex items-center justify-around text-xs">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`p-2 flex flex-col items-center gap-1 rounded-xl ${
              activeTab === 'explorer' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span className="text-[10px]">Archivos</span>
          </button>

          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`p-2 flex flex-col items-center gap-1 rounded-xl ${
                activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span className="text-[10px]">Monitor</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('backups')}
            className={`p-2 flex flex-col items-center gap-1 rounded-xl ${
              activeTab === 'backups' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="text-[10px]">Backups</span>
          </button>

          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`p-2 flex flex-col items-center gap-1 rounded-xl ${
                activeTab === 'users' ? 'text-blue-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px]">Usuarios</span>
            </button>
          )}
        </div>

        {/* Content Viewer Tabs */}
        {activeTab === 'explorer' && (
          <FileExplorer
            currentPath={currentPath}
            items={items}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenUploadModal={() => setIsUploadOpen(true)}
            onOpenNewFolderModal={() => setIsNewFolderOpen(true)}
            onItemDeleted={handleRefreshAll}
            isLoading={isLoadingFiles}
          />
        )}

        {activeTab === 'dashboard' && (
          <ServerDashboard
            metrics={metrics}
            activities={activities}
            onNavigateToExplorer={() => setActiveTab('explorer')}
            onNavigateToBackups={() => setActiveTab('backups')}
          />
        )}

        {activeTab === 'backups' && (
          <BackupManager
            backups={backups}
            currentUser={currentUser}
            onBackupCompleted={handleRefreshAll}
          />
        )}

        {activeTab === 'users' && currentUser.role === 'ADMIN' && (
          <UserManager
            currentUser={currentUser}
            users={users}
            onUserAdded={handleRefreshAll}
            onUserDeleted={handleRefreshAll}
          />
        )}

      </div>

      {/* Global Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentPath={currentPath}
        currentUser={currentUser}
        onUploadSuccess={handleRefreshAll}
      />

      <NewFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        currentPath={currentPath}
        currentUser={currentUser}
        onFolderCreated={handleRefreshAll}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          handleSelectUser(user);
        }}
      />

    </div>
  );
}
