import { useState, useEffect, useCallback } from 'react';
import { Coins, Award, History, CheckCircle, BookOpen } from 'lucide-react';
import { TaskAssignment } from './TaskAssignment';
import { NFTRequestForm } from './NFTRequestForm';
import { SubmissionHistory } from './SubmissionHistory';
import { TaskReview } from './TaskReview';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../authContext';
import type { NFTRequest, Teacher } from '../../types';

interface TeacherDashboardProps {
  teacherId?: string;
  nftRequests?: NFTRequest[];
  onCreateNFTRequest: (request: any) => void;
}

type TabView = 'assign-tasks' | 'review-tasks' | 'nft-request' | 'history';

export function TeacherDashboard({ teacherId, onCreateNFTRequest }: TeacherDashboardProps) {
  const { allTeachers, switchUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabView>('assign-tasks');
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPendingReviewCount = useCallback(async () => {
    if (!teacherId) return;
    const { data: tasks } = await supabase.from('tasks').select('id').eq('teacherid', teacherId);
    if (tasks && tasks.length > 0) {
      const { count } = await supabase
        .from('student_tasks')
        .select('id', { count: 'exact' })
        .eq('status', 'completed')
        .in('task_id', tasks.map(t => t.id));
      setPendingReviewCount(count || 0);
    }
  }, [teacherId]);

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!teacherId) {
        setTeacherData(null);
        return;
      }
      setLoading(true);
      const { data } = await supabase.from('teachers').select('*').eq('id', teacherId).single();
      if (data) {
        setTeacherData(data as Teacher);
        fetchPendingReviewCount();
      }
      setLoading(false);
    };
    fetchTeacherData();
  }, [teacherId, fetchPendingReviewCount]);

  if (allTeachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-orange-100 p-6 rounded-full">
          <BookOpen className="w-12 h-12 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">No existen profesores para mostrar</h2>
        <p className="text-gray-600 max-w-md">
          Por favor cree profesores en el panel de administrador.
        </p>
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-purple-100 p-6 rounded-full">
          <BookOpen className="w-12 h-12 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Panel del Docente</h2>
        <p className="text-gray-600 max-w-md">
          Por favor, selecciona un docente en la lista de la barra superior para gestionar sus tareas y certificados.
        </p>
      </div>
    );
  }

  if (loading || !teacherData) return <div className="text-center p-12">Cargando panel de docente...</div>;

  const tabs = [
    { id: 'assign-tasks' as TabView, label: 'Asignar Tareas', icon: Coins, color: 'indigo' },
    { id: 'review-tasks' as TabView, label: 'Corregir Tareas', icon: CheckCircle, color: 'emerald' },
    { id: 'nft-request' as TabView, label: 'Solicitar NFT', icon: Award, color: 'purple' },
    { id: 'history' as TabView, label: 'Historial', icon: History, color: 'blue' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold">Docente: {teacherData.name}</h2>
        <p className="mt-2 opacity-90">
          {teacherData.subjects?.join(', ')} | {teacherData.escuela}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2 flex gap-2 overflow-x-auto shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? `bg-${tab.color}-100 text-${tab.color}-700 font-bold` : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
            {tab.id === 'review-tasks' && pendingReviewCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {pendingReviewCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[400px]">
        {activeTab === 'assign-tasks' && <TaskAssignment teacherId={teacherId} />}
        {activeTab === 'review-tasks' && <TaskReview teacherId={teacherId} onTasksReviewed={fetchPendingReviewCount} />}
        {activeTab === 'nft-request' && <NFTRequestForm onSubmit={onCreateNFTRequest} teacherId={teacherId} />}
        {activeTab === 'history' && teacherId && <SubmissionHistory teacherId={teacherId} />}
      </div>
    </div>
  );
}
