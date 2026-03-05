import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, AlertCircle, Clock, Award, Fingerprint, Search, Filter, Hourglass, Users, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../authContext';
import type { Validator, Student, Task, StudentTask } from '../../types';

interface ValidatorDashboardProps {
  validatorId?: string;
  studentTasks: StudentTask[];
}

export function ValidatorDashboard({ validatorId: propValidatorId, studentTasks }: ValidatorDashboardProps) {
  const { allValidators } = useAuth();
  const [validatorData, setValidatorData] = useState<Validator | null>(null);
  const [tasksCache, setTasksCache] = useState<Map<string, Task>>(new Map());
  const [studentsCache, setStudentsCache] = useState<Map<string, Student>>(new Map());
  const [loading, setLoading] = useState(false);

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEscuela, setFilterEscuela] = useState('');

  // Estados para el modal de rechazo
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [taskToReject, setTaskToReject] = useState<StudentTask & { student: Student } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      if (!propValidatorId) return;
      setLoading(true);

      const [vRes, sRes, tRes] = await Promise.all([
        supabase.from('validators').select('*').eq('id', propValidatorId).single(),
        supabase.from('students').select('*'),
        supabase.from('tasks').select('*')
      ]);

      if (vRes.data) setValidatorData(vRes.data as Validator);

      const sMap = new Map();
      sRes.data?.forEach(s => sMap.set(s.id, s));
      setStudentsCache(sMap);

      const tMap = new Map();
      tRes.data?.forEach(t => tMap.set(t.id, t));
      setTasksCache(tMap);

      setLoading(false);
    };
    fetchContext();
  }, [propValidatorId]);

  // Lógica de Filtrado y Ordenado basada en student_tasks
  const filteredAndSorted = useMemo(() => {
    return studentTasks
      .map(st => ({
        ...st,
        student: studentsCache.get(st.student_id),
        task: tasksCache.get(st.task_id)
      }))
      .filter(item => {
        if (!validatorData || !item.student || !item.task) return false;

        // 1. Solo tareas aprobadas por docente
        if (item.status !== 'teacher_approved') return false;

        // 2. Solo de las escuelas del validador
        const isMySchool = validatorData.escuelas?.includes(item.student.escuela || '');
        if (!isMySchool) return false;

        // 3. Filtros manuales
        const matchSearch = item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEscuela = filterEscuela ? item.student.escuela === filterEscuela : true;

        return matchSearch && matchEscuela;
      })
      .sort((a, b) => {
        const esc = (a.student?.escuela || '').localeCompare(b.student?.escuela || '');
        if (esc !== 0) return esc;
        const mat = (a.task?.subject || '').localeCompare(b.task?.subject || '');
        if (mat !== 0) return mat;
        return (a.student?.name || '').localeCompare(b.student?.name || '');
      });
  }, [studentTasks, validatorData, studentsCache, tasksCache, searchTerm, filterEscuela]);

  const [isValidating, setIsValidating] = useState<string | null>(null);

  const handleValidateAndPay = async (item: any) => {
    setIsValidating(item.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-e4c-tokens', {
        body: {
          studentId: item.student_id,
          amount: item.task.points.toString(),
          studentTaskId: item.id
        },
      });

      if (error) throw error;

      alert(`¡Validación Exitosa! Se han enviado ${item.task.points} E4C a ${item.student.name}.`);

      window.location.reload();
    } catch (err: any) {
      console.error("Error en validación:", err);
      alert(`Fallo en la transferencia: ${err.message}`);
    } finally {
      setIsValidating(null);
    }
  };

  const handleRejectTask = async () => {
    if (!taskToReject || !rejectionReason.trim()) {
      alert("Por favor, proporciona un motivo de rechazo.");
      return;
    }

    setIsRejecting(true);
    try {
      const { error } = await supabase
        .from('student_tasks')
        .update({ status: 'validator_rejected', rejection_reason: rejectionReason.trim() })
        .eq('id', taskToReject.id);

      if (error) throw error;

      alert(`Tarea de ${taskToReject.student?.name || 'Alumno Desconocido'} rechazada con éxito.`);

      window.location.reload();
    } catch (err: any) {
      console.error("Error al rechazar tarea:", err);
      alert(`Fallo al rechazar la tarea: ${err.message}`);
    } finally {
      setIsRejecting(false);
      setIsRejectModalOpen(false);
      setTaskToReject(null);
      setRejectionReason('');
    }
  };

  // Early returns for loading/empty states
  if (allValidators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-orange-100 p-6 rounded-full"><Fingerprint className="w-12 h-12 text-orange-600" /></div>
        <h2 className="text-2xl font-bold text-gray-800">No existen validadores para mostrar</h2>
        <p className="text-gray-600">Por favor cree validadores en el panel de administrador.</p>
      </div>
    );
  }

  if (!propValidatorId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-green-100 p-6 rounded-full"><Fingerprint className="w-12 h-12 text-green-600" /></div>
        <h2 className="text-2xl font-bold text-gray-800">Centro de Validación</h2>
        <p className="text-gray-600">Selecciona un perfil de validador en la barra superior.</p>
      </div>
    );
  }

  if (loading || !validatorData) return <div className="p-12 text-center text-gray-500 italic text-lg animate-pulse">Cargando contexto institucional...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold">Validador: {validatorData.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {validatorData.escuelas?.map((esc, i) => (
                <span key={i} className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">{esc}</span>
              ))}
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 text-center">
            <p className="text-[10px] uppercase font-bold opacity-80">Por Validar</p>
            <p className="text-2xl font-bold">{filteredAndSorted.length}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Buscar Alumno o Tarea</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ej: TP 1 o Juan..." className="w-full pl-9 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
          </div>
        </div>
        <div className="w-64">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Filtrar por Escuela</label>
          <select value={filterEscuela} onChange={e => setFilterEscuela(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Todas tus escuelas</option>
            {validatorData.escuelas?.map(esc => <option key={esc} value={esc}>{esc}</option>)}
          </select>
        </div>
      </div>

      {/* Lista de Tareas para Validar */}
      <div className="space-y-4">
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 italic">
            No hay tareas pendientes de validación en tus escuelas asignadas.
          </div>
        ) : (
          filteredAndSorted.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">{item.student?.escuela}</span>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase">Aprobado por Docente</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{item.task?.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Users size={14} className="text-gray-400" /> {item.student?.name} ({item.student?.curso}° "{item.student?.division}")
                  </p>
                  <p className="text-xs text-gray-500">Materia: {item.task?.subject} • <span className="font-bold text-indigo-600">Recompensa: {item.task?.points} E4C</span></p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleValidateAndPay(item)}
                    disabled={!!isValidating}
                    className={`px-4 py-2 rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 ${isValidating === item.id
                        ? 'bg-green-400 text-white cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                  >
                    {isValidating === item.id ? (
                      <><Hourglass className="animate-spin" size={16} /> Procesando...</>
                    ) : (
                      'Aprobar y Pagar'
                    )}
                  </button>
                  <button
                    onClick={() => { setTaskToReject(item); setIsRejectModalOpen(true); }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    <XCircle size={16} /> Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Rechazo */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Rechazar Tarea de {taskToReject?.student?.name || 'Alumno Desconocido'}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Por favor, explica claramente el motivo del rechazo para que el alumno y el docente puedan entender y corregir.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo del rechazo..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectTask}
                disabled={isRejecting || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isRejecting ? <><Hourglass className="animate-spin" size={16} /> Rechazando...</> : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
