import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { StudentTask, Task, Student, Teacher } from '../../types';
import { CheckCircle, Clock, XCircle, User, BookOpen, Filter, Search } from 'lucide-react';

interface TaskReviewProps {
  teacherId: string;
  onTasksReviewed?: () => void;
}

export function TaskReview({ teacherId, onTasksReviewed }: TaskReviewProps) {
  const [studentTasksToReview, setStudentTasksToReview] = useState<StudentTask[]>([]);
  const [tasksDetails, setTasksDetails] = useState<Map<string, Task>>(new Map());
  const [studentsDetails, setStudentsDetails] = useState<Map<string, Student>>(new Map());
  const [teacherDetail, setTeacherDetail] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Filtro
  const [filterEscuela, setFilterEscuela] = useState('');
  const [filterCurso, setFilterCurso] = useState('');
  const [searchTerm, setSearchQuery] = useState('');

  const fetchTasksForReview = useCallback(async () => {
    setLoading(true);
    try {
      const { data: currentTeacher } = await supabase.from('teachers').select('*').eq('id', teacherId).single();
      setTeacherDetail(currentTeacher as Teacher);

      // Obtener todas las tareas del profesor para filtrar las entregas
      const { data: teacherTasks } = await supabase.from('tasks').select('id').eq('teacherid', teacherId);
      const teacherTaskIds = new Set(teacherTasks?.map(t => t.id) || []);

      const { data: studentTasksData } = await supabase
        .from('student_tasks')
        .select('*')
        .eq('status', 'completed');

      const filteredByTeacher = studentTasksData?.filter(st => teacherTaskIds.has(st.task_id)) || [];
      setStudentTasksToReview(filteredByTeacher);

      // Detalles de tareas y alumnos
      const uniqueTaskIds = [...new Set(filteredByTeacher.map(st => st.task_id))];
      const uniqueStudentIds = [...new Set(filteredByTeacher.map(st => st.student_id))];

      const [tasksRes, studentsRes] = await Promise.all([
        supabase.from('tasks').select('*').in('id', uniqueTaskIds),
        supabase.from('students').select('*').in('id', uniqueStudentIds)
      ]);

      const tMap = new Map();
      tasksRes.data?.forEach(t => tMap.set(t.id, t));
      setTasksDetails(tMap);

      const sMap = new Map();
      studentsRes.data?.forEach(s => sMap.set(s.id, s));
      setStudentsDetails(sMap);

    } catch (err) {
      console.error(err);
      setError('Error cargando tareas');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { fetchTasksForReview(); }, [fetchTasksForReview]);

  // Lógica de Filtrado y Ordenado
  const processedTasks = useMemo(() => {
    return studentTasksToReview
      .map(st => ({
        ...st,
        task: tasksDetails.get(st.task_id),
        student: studentsDetails.get(st.student_id)
      }))
      .filter(item => {
        if (!item.student || !item.task) return false;
        const matchEscuela = filterEscuela ? item.student.escuela === filterEscuela : true;
        const matchCurso = filterCurso ? item.student.curso === filterCurso : true;
        const matchSearch = item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.task.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchEscuela && matchCurso && matchSearch;
      })
      .sort((a, b) => {
        const studentNameA = a.student?.name || '';
        const studentNameB = b.student?.name || '';
        const taskTitleA = a.task?.title || '';
        const taskTitleB = b.task?.title || '';

        const studentNameCompare = studentNameA.localeCompare(studentNameB);
        if (studentNameCompare !== 0) {
          return studentNameCompare;
        }
        return taskTitleA.localeCompare(taskTitleB);
      });
  }, [studentTasksToReview, tasksDetails, studentsDetails, filterEscuela, filterCurso, searchTerm]);

  const handleApproveTask = async (st: any) => {
    try {
      await supabase.from('student_tasks').update({ status: 'teacher_approved' }).eq('id', st.id);
      
      const newNFTRequest = {
        id: crypto.randomUUID(),
        studentId: st.student.id,
        studentName: st.student.name,
        achievementName: `Tarea Completada: ${st.task.title}`,
        description: st.task.description,
        evidence: `Tarea #${st.task.id} corregida y aprobada por el docente. Recompensa: ${st.task.points} E4C.`,
        requestDate: new Date().toISOString(),
        teacherName: teacherDetail?.name,
        teacherId: teacherDetail?.id,
        status: 'pending-validator',
        teacherSignature: { name: teacherDetail?.name, timestamp: new Date().toISOString() },
      };

      await supabase.from('nft_requests').insert([newNFTRequest]);
      alert('Aprobada y enviada al validador');
      fetchTasksForReview();
      onTasksReviewed?.();
    } catch (err) {
      alert('Error al aprobar');
    }
  };

  const schools = useMemo(() => [...new Set(Array.from(studentsDetails.values()).map(s => s.escuela).filter(Boolean))], [studentsDetails]);

  if (loading) return <div className="p-8 text-center">Cargando tareas pendientes...</div>;

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Nombre o tarea..." 
              value={searchTerm}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 p-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Escuela</label>
          <select value={filterEscuela} onChange={e => setFilterEscuela(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Todas las escuelas</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label>
          <select value={filterCurso} onChange={e => setFilterCurso(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Todos</option>
            <option value="primero">Primero</option>
            <option value="segundo">Segundo</option>
            <option value="tercero">Tercero</option>
            <option value="cuarto">Cuarto</option>
            <option value="quinto">Quinto</option>
            <option value="sexto">Sexto</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {processedTasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
            No hay entregas que coincidan con los filtros.
          </div>
        ) : (
          processedTasks.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">{item.student?.escuela}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">{item.student?.curso}° "{item.student?.division}"</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{item.task?.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <User size={14} className="text-gray-400" /> {item.student?.name}
                  </p>
                  <p className="text-xs text-gray-500 italic">Materia: {item.task?.subject} • Recompensa: {item.task?.points} E4C</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleApproveTask(item)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2">
                    <CheckCircle size={16} /> Aprobar
                  </button>
                  <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex items-center gap-2">
                    <XCircle size={16} /> Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
