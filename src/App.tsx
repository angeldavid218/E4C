import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { ValidatorDashboard } from './components/validator/ValidatorDashboard';
import { RankingDashboard } from './components/ranking/RankingDashboard';
import { type UserRole, type NFTRequest } from './types';
import { supabase } from './lib/supabaseClient'; // Importar cliente de Supabase
import { useAuth } from './authContext';
import { AuthStatus } from './components/auth/AuthStatus';



export default function App() {

  const { user, currentRole, loading, allStudents, allTeachers } = useAuth();

  const userRole = currentRole;



    const [studentTasks, setStudentTasks] = useState<any[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
  
    // Obtener entregas de alumnos
    useEffect(() => {
      const fetchTasks = async () => {
        setFetchError(null);
        if (userRole === 'unauthenticated') return;
  
        const { data, error } = await supabase.from('student_tasks').select('*');
        if (error) {
          console.error('Error fetching tasks:', error);
        } else {
          setStudentTasks(data || []);
        }
      };
      fetchTasks();
    }, [userRole, user?.id]);
  


  // --- Manejadores de Estado (State Handlers) ---

  const handleCreateStudent = async () => {

    console.log("handleCreateStudent at App.tsx level is now a placeholder.");

  };



  const handleCreateTeacher = async () => {

    console.log("handleCreateTeacher at App.tsx level is now a placeholder.");

  };



  const handleCreateNFTRequest = (request: Omit<NFTRequest, 'id' | 'requestDate' | 'status' | 'teacherSignature' | 'teacherId' | 'teacherName'>) => {

    const dummyTeacher = allTeachers.length > 0 ? allTeachers[0] : { id: 't1', name: 'Profesor Dummy', email: 'dummy@example.com', subjects: [] };

    

    const newRequest: NFTRequest = {

      ...request,

      id: `req${Date.now()}`,

      requestDate: new Date().toISOString(),

      status: 'pending-admin',

      teacherId: dummyTeacher.id,

      teacherName: dummyTeacher.name,

      teacherSignature: {

        name: dummyTeacher.name,

        timestamp: new Date().toISOString(),

      },

    };

    setNftRequests(prev => [newRequest, ...prev]);

  };



  const handleValidatorApprove = (requestId: string) => {

    setNftRequests(prev =>

      prev.map(req =>

        req.id === requestId

          ? {

              ...req,

              status: 'blockchain-pending' as const,

              validatorSignature: {

                name: 'Validador Técnico',

                timestamp: new Date().toISOString(),

              },

            }

          : req

      )

    );



    setTimeout(() => {

      setNftRequests(prev =>

        prev.map(req =>

          req.id === requestId

            ? {

                ...req,

                status: 'approved' as const,

                blockchainHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,

              }

            : req

        )

      );

    }, 3000);

  };



  const handleValidatorReject = (requestId: string, reason: string) => {

    setNftRequests(prev =>

      prev.map(req =>

        req.id === requestId

          ? {

              ...req,

              status: 'rejected' as const,

              rejectionReason: reason,

            }

          : req

      )

    );

  };



    const renderDashboard = () => {
      if (loading) {
        return (
          <div className="flex justify-center items-center h-screen text-lg">
            Cargando datos...
          </div>
        );
      }
  
          // Si no hay un rol definido (caso raro con el default en admin)
          if (userRole === 'unauthenticated') {
      
        return (
          <div className="flex flex-col justify-center items-center h-[60vh] text-center space-y-4">
            <div className="bg-indigo-100 p-6 rounded-full">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Bienvenido a Edu-Chain</h2>
            <p className="text-gray-600 max-w-md">
              Por favor, selecciona un rol en la barra superior para acceder a las funciones del sistema.
            </p>
          </div>
        );
      }
  



    if (fetchError) {

      return (

        <div className="flex justify-center items-center h-screen text-lg text-red-600">

          <p>{fetchError}</p>

        </div>

      );

    }



        switch (userRole) {
          case 'student':
            return (
              <StudentDashboard
                studentId={user?.id}
              />
            );
          case 'teacher':
            return (
              <TeacherDashboard
                teacherId={user?.id}
                onCreateNFTRequest={handleCreateNFTRequest}
              />
            );
    

            case 'admin':

              return (

                <AdminDashboard />

              );

            case 'validator':
              return (
                <ValidatorDashboard
                  validatorId={user?.id}
                  studentTasks={studentTasks}
                  onApproveRequest={handleValidatorApprove}
                  onRejectRequest={handleValidatorReject}
                />
              );
      

      case 'ranking':

        return <RankingDashboard />;

      default:

        return (

            <div className="flex justify-center items-center h-screen text-lg">

                Rol no reconocido o sin selección.

            </div>

        );

    }

  };



  return (

    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">

      <Navigation>

        <AuthStatus />

      </Navigation>

      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {renderDashboard()}

      </main>

    </div>

  );

}