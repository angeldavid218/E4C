import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { StudentTask, Task } from '../../types';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface MyTasksProps {
  studentId: string;
}

export function MyTasks({ studentId }: MyTasksProps) {
  const [studentTasks, setStudentTasks] = useState<StudentTask[]>([]);
  const [tasksDetails, setTasksDetails] = useState<Map<string, Task>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentTasks = async () => {
      setLoading(true);
      setError(null);
      if (!studentId || studentId.startsWith('mock-')) {
        setStudentTasks([]);
        setTasksDetails(new Map());
        setLoading(false);
        return;
      }
      
      try {
        const { data: studentTasksData, error: studentTasksError } = await supabase
          .from('student_tasks')
          .select('*')
          .eq('student_id', studentId);

        if (studentTasksError) throw studentTasksError;

        setStudentTasks(studentTasksData || []);

        // Fetch details for each unique task
        const uniqueTaskIds = [...new Set(studentTasksData.map(st => st.task_id))];
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .in('id', uniqueTaskIds);

        if (tasksError) throw tasksError;

        const detailsMap = new Map<string, Task>();
        tasksData.forEach(task => detailsMap.set(task.id, task as Task));
        setTasksDetails(detailsMap);

      } catch (err: unknown) {
        console.error('Error fetching student tasks:', err);
        setError('Error al cargar tus tareas.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentTasks();
  }, [studentId]);

  const handleMarkAsCompleted = async (studentTaskId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('student_tasks')
        .update({ status: 'completed', completed_date: new Date().toISOString() })
        .eq('id', studentTaskId);

      if (updateError) throw updateError;

      // Update local state
      setStudentTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === studentTaskId ? { ...task, status: 'completed', completed_date: new Date().toISOString() } : task
        )
      );
      alert('Tarea marcada como completada. Esperando aprobación del docente.');
    } catch (err: unknown) {
      console.error('Error marking task as completed:', err);
      setError('Error al marcar la tarea como completada.');
    }
  };

  const getStatusBadge = (status: StudentTask['status']) => {
    switch (status) {
      case 'assigned':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
            <Clock className="inline w-3 h-3 mr-1" />
            Asignada
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
            <CheckCircle className="inline w-3 h-3 mr-1" />
            Completada (Pendiente Docente)
          </span>
        );
      case 'teacher_approved':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
            <CheckCircle className="inline w-3 h-3 mr-1" />
            Aprobada por Docente
          </span>
        );
      case 'rejected_by_teacher':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
            <XCircle className="inline w-3 h-3 mr-1" />
            Rechazada por Docente
          </span>
        );
      case 'validator_approved':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
            <CheckCircle className="inline w-3 h-3 mr-1" />
            Validada (Finalizada)
          </span>
        );
      case 'rejected_by_validator':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
            <XCircle className="inline w-3 h-3 mr-1" />
            Rechazada por Validador
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="text-center py-4">Cargando tareas...</div>;
  if (error) return <div className="text-center py-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      {studentTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tienes tareas asignadas en este momento.
        </div>
      ) : (
        studentTasks.map(st => {
          const taskDetail = tasksDetails.get(st.task_id);
          if (!taskDetail) return null;

          const isAssigned = st.status === 'assigned';

          return (
            <div key={st.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{taskDetail.title}</h3>
                {getStatusBadge(st.status)}
              </div>
              <p className="text-gray-600 mb-2">{taskDetail.subject} - {taskDetail.points} E4C</p>
              <p className="text-sm text-gray-500 mb-3">
                Fecha Límite: {taskDetail.duedate ? new Date(taskDetail.duedate).toLocaleDateString() : 'N/A'}
              </p>
              
              {(isAssigned || st.status === 'rejected_by_teacher') && (
                <button
                  onClick={() => handleMarkAsCompleted(st.id)}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Marcar como Completada
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
