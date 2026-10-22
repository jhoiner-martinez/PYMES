import React, { useState } from 'react';
import { LogIn, X, Lock, Mail, AlertCircle, Shield } from 'lucide-react';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Credenciales no válidas');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800 bg-slate-800/40 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 border border-blue-400/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Acceso al Servidor NAS</h3>
          <p className="text-xs text-slate-400 mt-0.5">Autenticación en red local PYME</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pyme.local"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Comprobando...' : 'Iniciar Sesión'}</span>
            </button>
          </div>

          {/* Quick Helper Credentials */}
          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Cuentas de Prueba Preconfiguradas:</div>
            <div className="flex justify-between">
              <span>Admin: <code className="text-amber-300 font-mono">admin@pyme.local</code></span>
              <span className="font-mono text-slate-400">admin123</span>
            </div>
            <div className="flex justify-between">
              <span>Colab: <code className="text-blue-300 font-mono">laura@pyme.local</code></span>
              <span className="font-mono text-slate-400">user123</span>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
