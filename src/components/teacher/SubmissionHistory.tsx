import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Clock, CheckCircle, XCircle, User, BookOpen, Search, Filter } from 'lucide-react';
import type { StudentTask, Task, Student } from '../../types';

interface SubmissionHistoryProps {
  teacherId: string;
}

export function SubmissionHistory({ teacherId }: SubmissionHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 1. Obtener tareas del profesor
      const { data: tasks } = await supabase.from('tasks').select('*').eq('teacherid', teacherId);
      const taskIds = tasks?.map(t => t.id) || [];
      const tasksMap = new Map(tasks?.map(t => [t.id, t]));

      // 2. Obtener entregas de esas tareas
      const { data: studentTasks } = await supabase
        .from('student_tasks')
        .select('*')
        .in('task_id', taskIds)
        .order('assigned_date', { ascending: false });

      // 3. Obtener alumnos involucrados
      const studentIds = [...new Set(studentTasks?.map(st => st.student_id) || [])];
      const { data: students } = await supabase.from('students').select('*').in('id', studentIds);
      const studentsMap = new Map(students?.map(s => [s.id, s]));

      // 4. Combinar datos
      const combined = studentTasks?.map(st => ({
        ...st,
        task: tasksMap.get(st.task_id),
        student: studentsMap.get(st.student_id)
      })) || [];

      setHistory(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [teacherId]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchSearch = item.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.task?.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' ? true : item.status === filterStatus;
      return matchSearch && matchStatus;
    }).sort((a, b) => {
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
  }, [history, searchTerm, filterStatus]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned':
        return { label: 'Asignada', color: 'blue', icon: Clock };
      case 'completed':
        return { label: 'Entregada (Pendiente)', color: 'orange', icon: Clock };
      case 'teacher_approved':
        return { label: 'Aprobada (En Validación)', color: 'amber', icon: CheckCircle };
      case 'validator_approved':
        return { label: 'Finalizada (Tokens Enviados)', color: 'green', icon: CheckCircle };
      case 'rejected_by_teacher':
      case 'rejected_by_validator':
        return { label: 'Rechazada', color: 'red', icon: XCircle };
      default:
        return { label: status, color: 'gray', icon: Clock };
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Cargando historial de tareas...</div>;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Buscar</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Alumno o Tarea..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 p-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estado</label>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="all">Todos los estados</option>
            <option value="assigned">Asignadas</option>
            <option value="completed">Para Corregir</option>
            <option value="teacher_approved">En Validación</option>
            <option value="validator_approved">Finalizadas</option>
            <option value="rejected_by_teacher">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Lista de Historial */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-bold text-gray-600">Alumno</th>
              <th className="p-4 font-bold text-gray-600">Tarea / Materia</th>
              <th className="p-4 font-bold text-gray-600">Estado</th>
              <th className="p-4 font-bold text-gray-600 text-right">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-900">
            {filteredHistory.length === 0 ? (
              <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">No hay registros con estos filtros</td></tr>
            ) : (
              filteredHistory.map(item => {
                const config = getStatusConfig(item.status);
                const Icon = config.icon;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-${config.color}-100 flex items-center justify-center text-${config.color}-600`}>
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-bold">{item.student?.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{item.student?.curso}° "{item.student?.division}"</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-indigo-600">{item.task?.title}</p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1"><BookOpen size={10}/> {item.task?.subject}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-${config.color}-50 text-${config.color}-700 border border-${config.color}-100`}>
                        <Icon size={12} />
                        {config.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-gray-600">{new Date(item.assigned_date).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{new Date(item.assigned_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
