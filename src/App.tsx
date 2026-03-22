import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { ValidatorDashboard } from './components/validator/ValidatorDashboard';
import { RankingDashboard } from './components/ranking/RankingDashboard';
import { supabase } from './lib/supabaseClient'; 
import { useAuth } from './authContext';
import { AuthStatus } from './components/auth/AuthStatus';
import { LoginSignupForm } from './components/auth/LoginSignupForm';
import { PublicRegistration } from './components/student/PublicRegistration';
import { Clock, ShieldAlert } from 'lucide-react';
import type { StudentTask } from './types';

export default function App() {
  const { user, currentRole, loading } = useAuth();
  const [studentTasks, setStudentTasks] = useState<StudentTask[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Escuchar cambios de ruta
  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Obtener entregas de alumnos
  useEffect(() => {
    const fetchTasks = async () => {
      setFetchError(null);
      if (currentRole === 'unauthenticated') return;
      const { data, error } = await supabase.from('student_tasks').select('*');
      if (error) console.error('Error fetching tasks:', error);
      else setStudentTasks(data || []);
    };
    fetchTasks();
  }, [currentRole, user?.id]);

  if (loading) return <div className="flex justify-center items-center h-screen text-lg italic text-indigo-600 font-bold animate-pulse">Cargando E4C...</div>;

  // --- RUTAS PÚBLICAS ---
  if (currentPath === '/register-student' || currentPath === '/register') {
    return <PublicRegistration />;
  }

  // --- LÓGICA DE AUTENTICACIÓN ---
  if (currentRole === 'unauthenticated' || !user) {
    return <LoginSignupForm />;
  }

  // --- LÓGICA DE USUARIO PENDIENTE ---
  const isPending = user?.user_metadata?.status === 'pending';

  const renderDashboard = () => {
    if (fetchError) return <div className="flex justify-center items-center h-screen text-red-600 font-bold">{fetchError}</div>;

    // Si el usuario está pendiente, solo puede ver el Ranking (Visor General)
    if (isPending) {
      return <RankingDashboard />;
    }

    switch (currentRole) {
      case 'student': return <StudentDashboard studentId={user?.id} />;
      case 'teacher': return <TeacherDashboard teacherId={user?.id} nftRequests={[]} onCreateNFTRequest={() => {}} />;
      case 'admin': return <AdminDashboard />;
      case 'validator': return <ValidatorDashboard validatorId={user?.id} studentTasks={studentTasks} />;
      case 'ranking': return <RankingDashboard />;
      default: return <div className="flex justify-center items-center h-screen text-lg">Rol no reconocido.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {isPending && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-500">
          <Clock size={16} />
          Cuenta en revisión: Tienes acceso como Visor General hasta que el administrador apruebe tu solicitud.
          <button onClick={() => window.location.reload()} className="ml-4 underline hover:no-underline">Verificar Estado</button>
        </div>
      )}
      <Navigation>
        <AuthStatus />
      </Navigation>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {renderDashboard()}
      </main>
    </div>
  );
}