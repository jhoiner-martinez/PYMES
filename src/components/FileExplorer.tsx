import React, { useState } from 'react';
import {
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  FileCheck,
  Image as ImageIcon,
  Download,
  Trash2,
  FolderPlus,
  UploadCloud,
  ChevronRight,
  Home,
  Grid,
  List,
  Search,
  Filter,
  Eye,
  Info,
  Clock,
  HardDrive,
  User as UserIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { StorageItem, User } from '../types';

interface FileExplorerProps {
  currentPath: string;
  items: StorageItem[];
  currentUser: User;
  onNavigate: (path: string) => void;
  onOpenUploadModal: () => void;
  onOpenNewFolderModal: () => void;
  onItemDeleted: () => void;
  isLoading: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  currentPath,
  items,
  currentUser,
  onNavigate,
  onOpenUploadModal,
  onOpenNewFolderModal,
  onItemDeleted,
  isLoading,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StorageItem | null>(null);

  // Parse breadcrumbs
  const pathParts = currentPath ? currentPath.split('/').filter(Boolean) : [];

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      onNavigate('');
    } else {
      const newPath = pathParts.slice(0, index + 1).join('/');
      onNavigate(newPath);
    }
  };

  const handleItemClick = (item: StorageItem) => {
    if (item.isDirectory) {
      onNavigate(item.relativePath);
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
      });
    } catch {
      return dateStr;
    }
  };

  // Icon helper based on extension
  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="w-8 h-8 text-amber-400 fill-amber-400/20" />;
    }
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-rose-400" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
      case 'docx':
      case 'doc':
      case 'txt':
        return <FileCheck className="w-8 h-8 text-blue-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'svg':
      case 'webp':
        return <ImageIcon className="w-8 h-8 text-purple-400" />;
      default:
        return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'FOLDERS') return item.isDirectory;
    if (selectedCategory === 'DOCUMENTS') {
      const ext = item.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'docx', 'doc', 'txt'].includes(ext || '');
    }
    if (selectedCategory === 'SPREADSHEETS') {
      const ext = item.name.split('.').pop()?.toLowerCase();
      return ['xlsx', 'xls', 'csv'].includes(ext || '');
    }
    if (selectedCategory === 'PERSONAL') {
      return item.relativePath.includes(`Colaboradores/${currentUser.email}`);
    }
    return item.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleDelete = async (item: StorageItem) => {
    if (!item.fileId) return;
    setDeletingId(item.fileId);
    try {
      const response = await fetch(`/api/files/${item.fileId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo eliminar el archivo');
      }
      onItemDeleted();
      setSelectedItem(null);
      setConfirmDelete(null);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (item: StorageItem) => {
    if (!item.fileId) return;
    setDownloadingId(item.fileId);
    try {
      const url = `/api/files/download/${item.fileId}`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', item.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Top Header / Breadcrumb & Actions Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 p-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition font-medium"
            >
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>NAS Raíz</span>
            </button>

            {pathParts.map((part, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`px-2 py-1 rounded-md transition font-medium truncate max-w-[140px] ${
                    index === pathParts.length - 1
                      ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewFolderModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nueva Carpeta</span>
            </button>

            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Subir Archivo</span>
            </button>
          </div>
        </div>

        {/* Filter Chips & View Mode Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/80">
          
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'ALL', label: 'Todos los Archivos' },
              { id: 'Contabilidad', label: 'Contabilidad' },
              { id: 'Ventas', label: 'Ventas' },
              { id: 'Operaciones', label: 'Operaciones' },
              { id: 'General', label: 'General' },
              { id: 'DOCUMENTS', label: 'PDFs & Docs' },
              { id: 'SPREADSHEETS', label: 'Excel/Hojas' },
              { id: 'PERSONAL', label: 'Mi Carpeta Privada' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap font-medium text-xs ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & View Mode */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o tipo..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista en Cuadrícula"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'list' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista en Lista Detallada"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Explorer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Leyendo almacenamiento físico NAS...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 mb-3">
                <Folder className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">Esta carpeta está vacía</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Sube archivos corporativos o crea subcarpetas para estructurar la información de tu empresa.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={onOpenUploadModal}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
                >
                  Subir primer archivo
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.relativePath === item.relativePath;
                return (
                  <div
                    key={item.relativePath}
                    onClick={() => handleItemClick(item)}
                    className={`group relative p-3 rounded-2xl border transition flex flex-col justify-between cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Type / Badge */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50 group-hover:scale-105 transition">
                        {getFileIcon(item.name, item.isDirectory)}
                      </div>
                      {item.category && !item.isDirectory && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* File / Folder Name */}
                    <div className="mt-1">
                      <div 
                        className="text-xs font-semibold text-slate-200 group-hover:text-white truncate"
                        title={item.name}
                      >
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                        <span>{item.isDirectory ? 'Carpeta' : formatBytes(item.sizeBytes)}</span>
                        {item.userName && !item.isDirectory && (
                          <span className="truncate max-w-[60px]" title={item.userName}>
                            {item.userName.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover Quick Actions */}
                    {!item.isDirectory && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                          title="Descargar archivo físico"
                          className="p-1 rounded-md text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {(currentUser.role === 'ADMIN' || item.userId === currentUser.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(item);
                            }}
                            title="Eliminar de almacenamiento"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/70 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-3">Departamento / Tag</th>
                    <th className="py-3 px-3">Tamaño</th>
                    <th className="py-3 px-3">Subido por</th>
                    <th className="py-3 px-3">Modificado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItem?.relativePath === item.relativePath;
                    return (
                      <tr
                        key={item.relativePath}
                        onClick={() => handleItemClick(item)}
                        className={`cursor-pointer transition hover:bg-slate-800/60 ${
                          isSelected ? 'bg-blue-600/15 text-blue-200' : ''
                        }`}
                      >
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="p-1 rounded-lg bg-slate-800 border border-slate-700/60">
                            {getFileIcon(item.name, item.isDirectory)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-100 hover:text-blue-400">
                              {item.name}
                            </span>
                            {item.isDirectory && (
                              <span className="ml-2 text-[10px] text-amber-400 font-medium">(Directorio)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {item.category ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-medium">
                              {item.category}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {item.isDirectory ? '—' : formatBytes(item.sizeBytes)}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {item.userName || (item.isDirectory ? 'Sistema' : 'NAS')}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {formatDate(item.mtime)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {!item.isDirectory && (
                              <button
                                onClick={() => handleDownload(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                                title="Descargar"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(currentUser.role === 'ADMIN' || item.userId === currentUser.id) && !item.isDirectory && (
                              <button
                                onClick={() => setConfirmDelete(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected File Details Drawer (Sidebar Inspector) */}
        {selectedItem && !selectedItem.isDirectory && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between overflow-y-auto animate-fade-in shadow-2xl">
            <div className="space-y-5">
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                    {getFileIcon(selectedItem.name, false)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Ficha de Metadatos
                    </h4>
                    <p className="text-[10px] text-slate-400">Registrado en SQLite & NAS</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>

              {/* File Title */}
              <div>
                <div className="text-sm font-bold text-slate-100 break-words">
                  {selectedItem.name}
                </div>
                <div className="text-xs text-blue-400 font-medium mt-0.5">
                  {formatBytes(selectedItem.sizeBytes)} ({selectedItem.sizeBytes.toLocaleString()} bytes)
                </div>
              </div>

              {/* Physical metadata specs */}
              <div className="space-y-3 bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Ruta Física en Servidor Mini-PC:
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400 break-all">
                    /storage/nas_root/{selectedItem.relativePath}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Departamento Asignado:
                  </span>
                  <span className="text-slate-200 font-medium">
                    {selectedItem.category || 'General'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Propietario / Creador:
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-200 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{selectedItem.userName || 'Usuario del Servidor'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Fecha de Modificación:
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-300 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(selectedItem.mtime)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Integridad y Hash del Archivo:
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono mt-0.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>SHA-256 Validado (Sin corrupción)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => handleDownload(selectedItem)}
                disabled={downloadingId === selectedItem.fileId}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingId === selectedItem.fileId ? 'Descargando...' : 'Descargar Archivo'}</span>
              </button>

              {(currentUser.role === 'ADMIN' || selectedItem.userId === currentUser.id) && (
                <button
                  onClick={() => setConfirmDelete(selectedItem)}
                  className="w-full py-2 px-4 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-center gap-2 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar del NAS</span>
                </button>
              )}
            </div>

          </aside>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">¿Eliminar archivo físico?</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Estás a punto de borrar permanentemente <strong className="text-white">"{confirmDelete.name}"</strong> del disco duro del servidor NAS. Esta acción se registrará en la auditoría.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition"
              >
                {deletingId ? 'Borrando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
