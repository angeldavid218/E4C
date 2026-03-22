import React from 'react';
import { User, BookText, Fingerprint, Trophy, LogOut } from 'lucide-react';
import type { UserRole, Student, Teacher } from '../types'; // Importar UserRole, Student, Teacher
import { useAuth } from '../authContext';
import { AuthStatus } from './auth/AuthStatus'; // Importar AuthStatus


interface NavigationProps {
  children: React.ReactNode;
}

export function Navigation({ children }: NavigationProps) {
  const { user, switchUserRole, signOut, allStudents, allTeachers, allValidators } = useAuth();
  const userRole = user?.user_metadata.role as UserRole || 'unauthenticated';
  const isPending = user?.user_metadata?.status === 'pending';

  const roles: { id: UserRole; label: string, icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'admin', label: 'Admin', icon: User },
    { id: 'teacher', label: 'Docente', icon: BookText },
    { id: 'validator', label: 'Validador', icon: Fingerprint },
    { id: 'student', label: 'Estudiante', icon: User },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
  ];

  // Si está pendiente, solo mostrar el botón de Ranking
  const visibleRoles = isPending ? roles.filter(r => r.id === 'ranking') : roles;

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-xl font-bold">
              E4C
            </h1>
            
            {/* Selector de Estudiante - Ocultar si está pendiente */}
            {!isPending && allStudents.length > 0 && userRole === 'student' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Alumno:</span>
                <select
                  value={user?.id || ''}
                  onChange={(e) => switchUserRole('student', e.target.value)}
                  className="px-3 py-1 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50/50 text-sm outline-none"
                >
                  <option value="" disabled>Seleccionar...</option>
                  {allStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.curso}° "{s.division}")</option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Docente - Ocultar si está pendiente */}
            {!isPending && allTeachers.length > 0 && userRole === 'teacher' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Docente:</span>
                <select
                  value={user?.id || ''}
                  onChange={(e) => switchUserRole('teacher', e.target.value)}
                  className="px-3 py-1 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50/50 text-sm outline-none"
                >
                  <option value="" disabled>Seleccionar...</option>
                  {allTeachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Validador - Ocultar si está pendiente */}
            {!isPending && allValidators && allValidators.length > 0 && userRole === 'validator' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Validador:</span>
                <select
                  value={user?.id || ''}
                  onChange={(e) => switchUserRole('validator', e.target.value)}
                  className="px-3 py-1 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50/50 text-sm outline-none"
                >
                  <option value="" disabled>Seleccionar validador...</option>
                  {allValidators.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {visibleRoles.map(role => {
              const Icon = role.icon;
              const isActive = userRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => !isPending && switchUserRole(role.id)}
                  disabled={isPending && role.id !== 'ranking'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? '' : 'text-gray-500'}`} />
                  <span>{role.label}</span>
                </button>
              );
            })}
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
              <span>Cerrar Sesión</span>
            </button>
            <AuthStatus />
          </div>
        </div>
      </div>
    </nav>
  );
}