import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Folder, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { User } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  currentUser: User;
  onUploadSuccess: (info: any) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  currentPath,
  currentUser,
  onUploadSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [targetDir, setTargetDir] = useState<string>(currentPath);
  const [overwrite, setOverwrite] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('General');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona un archivo para subir al servidor NAS.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    // Simulate progressive network LAN transfer
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 120);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetDir', targetDir);
      formData.append('overwrite', String(overwrite));
      formData.append('category', category);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id,
        },
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al almacenar el archivo');
      }

      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(data);
        onClose();
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      setError(err.message || 'Error inesperado durante la subida');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Subir Archivo al Servidor NAS</h3>
              <p className="text-xs text-slate-400">Almacenamiento físico en Mini-PC de la red local</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              isDragging
                ? 'border-blue-400 bg-blue-500/10'
                : file
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</div>
                  <div className="text-xs text-slate-400">{formatBytes(file.size)}</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                  <UploadCloud className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Arrastra tu archivo aquí o <span className="text-blue-400 underline">haz clic para examinar</span>
                </div>
                <div className="text-xs text-slate-400">
                  Soporta documentos PDF, Excel, Word, imágenes, planos, etc. (Hasta 100 MB)
                </div>
              </div>
            )}
          </div>

          {/* Destination Folder Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-400" />
              <span>Carpeta de Destino en el Servidor:</span>
            </label>
            <select
              value={targetDir}
              onChange={(e) => setTargetDir(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Raíz del NAS (/)</option>
              <option value="Contabilidad">📁 Contabilidad (Departamento)</option>
              <option value="Ventas">📁 Ventas (Departamento)</option>
              <option value="Operaciones">📁 Operaciones (Departamento)</option>
              <option value="General">📁 General (Público PYME)</option>
              <option value={`Colaboradores/${currentUser.email}`}>
                🔒 Mi Carpeta Privada (Colaboradores/{currentUser.email})
              </option>
              {currentUser.role === 'ADMIN' && (
                <option value="Colaboradores">📁 Directorio Completo de Colaboradores (Admin)</option>
              )}
            </select>
          </div>

          {/* Department / Category Tag */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Etiqueta o Área Asignada:</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Contabilidad', 'Ventas', 'Operaciones', 'General'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                    category === cat
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Duplicate Prevention Strategy */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-2 text-xs">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Control de Duplicados en Disco:</span>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-900"
                />
                <span>Sobrescribir si ya existe un archivo con este nombre</span>
              </label>
            </div>
            {!overwrite && (
              <p className="text-[11px] text-slate-400 leading-tight">
                * Prevención activa: Se renombrará automáticamente añadiendo un correlativo <code className="text-blue-300">(1).ext</code> si el archivo ya existe.
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <span>Enviando por LAN Gigabit (98.4 MB/s)...</span>
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition ${
                !file || isUploading
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
              }`}
            >
              <span>{isUploading ? 'Guardando en NAS...' : 'Subir Archivo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
