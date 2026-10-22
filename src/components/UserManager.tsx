import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Trash2,
  FolderLock,
  Mail,
  Building,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { User } from '../types';

interface UserManagerProps {
  currentUser: User;
  users: User[];
  onUserAdded: () => void;
  onUserDeleted: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({
  currentUser,
  users,
  onUserAdded,
  onUserDeleted,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'COLABORADOR' | 'ADMIN'>('COLABORADOR');
  const [department, setDepartment] = useState('Ventas');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el usuario');
      }

      setName('');
      setEmail('');
      setPassword('');
      setShowAddModal(false);
      onUserAdded();
    } catch (err: any) {
      setError(err.message || 'Error al crear el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser.id) {
      alert('No puedes eliminar tu propia cuenta en uso.');
      return;
    }

    if (!confirm(`¿Estás seguro de revocar y eliminar el acceso de "${user.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar el usuario');
      }

      onUserDeleted();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 bg-slate-950">
      
      {/* Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Shield className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
              Control de Accesos Basado en Roles (RBAC)
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gestión de Usuarios y Colaboradores
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Asigna permisos de lectura y escritura para carpetas corporativas y espacios privados en el servidor NAS.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-lg shadow-blue-500/25 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Nuevo Usuario</span>
        </button>
      </div>

      {/* RBAC Role Matrix Explanation Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-md">
          <div className="flex items-center gap-2 font-bold text-amber-300 mb-2">
            <Shield className="w-4 h-4" />
            <span>Rol: ADMINISTRADOR (ADMIN)</span>
          </div>
          <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
            <li>Acceso total a todos los directorios del NAS (incluyendo carpetas de otros colaboradores).</li>
            <li>Autorización para ejecutar y restaurar Copias de Seguridad (Backups).</li>
            <li>Monitoreo de telemetría de hardware (CPU, temperatura, 2TB SSD SMART).</li>
            <li>Creación y revocación de usuarios y permisos.</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/20 shadow-md">
          <div className="flex items-center gap-2 font-bold text-blue-300 mb-2">
            <FolderLock className="w-4 h-4" />
            <span>Rol: COLABORADOR (COLABORADOR)</span>
          </div>
          <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
            <li>Acceso a carpetas públicas de la empresa (Contabilidad, Ventas, Operaciones, General).</li>
            <li>Acceso exclusivo a su propia carpeta personal (<code className="text-blue-300 font-mono">Colaboradores/{'{email}'}</code>).</li>
            <li>Restricción total para ver carpetas privadas de otros colaboradores.</li>
            <li>Bloqueado de backups del sistema y configuración de usuarios.</li>
          </ul>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-blue-400 border border-slate-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Directorio de Cuentas en el NAS</h3>
              <p className="text-[11px] text-slate-400">Almacenado localmente en SQLite</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {users.length} usuarios activos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">Carpeta Personal NAS</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            (Tu sesión)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Shield className="w-3 h-3" />
                          <span>ADMINISTRADOR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <FolderLock className="w-3 h-3" />
                          <span>COLABORADOR</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {u.department || 'General'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-emerald-400">
                      {u.role === 'ADMIN' ? (
                        <span className="text-slate-400">Acceso a todas (/)</span>
                      ) : (
                        <span>/Colaboradores/{u.email}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isCurrent && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Registrar Usuario en el NAS</h3>
                  <p className="text-xs text-slate-400">Crear credenciales y carpeta asignada</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sofía Herrera"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sofia@pyme.local"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña de Acceso:</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rol en el NAS:</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="COLABORADOR">COLABORADOR</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Departamento:</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Ventas">Ventas</option>
                    <option value="Contabilidad">Contabilidad</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Sistemas y TI">Sistemas y TI</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
                >
                  {isLoading ? 'Registrando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
