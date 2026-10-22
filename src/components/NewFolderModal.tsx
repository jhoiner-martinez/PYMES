import React, { useState } from 'react';
import { FolderPlus, X, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  currentUser: User;
  onFolderCreated: () => void;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  currentPath,
  currentUser,
  onFolderCreated,
}) => {
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      setError('Por favor escribe un nombre para la carpeta.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          parentDir: currentPath,
          folderName: folderName.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la carpeta');
      }

      setIsLoading(false);
      onFolderCreated();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Error al crear la carpeta');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Nueva Carpeta en el NAS</h3>
              <p className="text-xs text-slate-400">Crear directorio en: {currentPath || 'Raíz (/)'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nombre de la Carpeta:
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Ej: Contabilidad_2026, Facturas_Agosto, Proyectos"
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !folderName.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {isLoading ? 'Creando...' : 'Crear Carpeta'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
