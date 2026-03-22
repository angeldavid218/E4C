import { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, RefreshCcw } from 'lucide-react';
import { LeaderboardTokens } from './LeaderboardTokens';
import { LeaderboardNFTs } from './LeaderboardNFTs';
import { GeneralStats } from './GeneralStats';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../authContext'; // Import useAuth
import type { Student, StudentTask, Task, NFTRequest } from '../../types';

type RankingView = 'tokens' | 'nfts' | 'stats';

export function RankingDashboard() {
  const { allStudents, refreshUsers } = useAuth();
  const [activeView, setActiveView] = useState<RankingView>('tokens');
  const [studentTasks, setStudentTasks] = useState<StudentTask[]>([]);
  const [nftRequests, setNftRequests] = useState<NFTRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsRefreshing(true);
    await refreshUsers(); 
    
    const { data: stData } = await supabase.from('student_tasks').select('*');
    const { data: tData } = await supabase.from('tasks').select('*');
    const { data: nftData } = await supabase.from('nft_requests').select('*');
    
    setStudentTasks(stData || []);
    setTasks(tData || []);
    setNftRequests(nftData || []);
    
    setIsRefreshing(false);
    setLoading(false);
  }, [refreshUsers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: 'tokens' as RankingView, label: 'Ranking por Tokens', icon: Trophy, color: 'yellow' },
    { id: 'nfts' as RankingView, label: 'Ranking por NFTs', icon: Medal, color: 'purple' },
    { id: 'stats' as RankingView, label: 'Estadísticas Generales', icon: TrendingUp, color: 'blue' },
  ];

  const totalStudents = allStudents.length;
  const totalTokens = allStudents.reduce((sum, s) => sum + (s.tokens || 0), 0);
  
  const approvedNFTs = nftRequests.filter(r => r.status === 'approved' || r.status === 'blockchain-confirmed').length;
  const avgTokensPerStudent = totalStudents > 0 ? Math.round(totalTokens / totalStudents) : 0;

  if (loading && !isRefreshing) return <div className="p-12 text-center italic text-indigo-600 animate-pulse">Cargando estadísticas globales...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Cuadro de Honor</h2>
              <p className="mt-1 opacity-90 font-medium">Reconociendo el mérito y compromiso estudiantil</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all disabled:opacity-50 shadow-lg"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Refrescar Datos'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Estudiantes</p>
          <p className="text-3xl font-black text-gray-900">{totalStudents}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Tokens E4C</p>
          <p className="text-3xl font-black text-indigo-600">{totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">NFTs Emitidos</p>
          <p className="text-3xl font-black text-purple-600">{approvedNFTs}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Promedio E4C</p>
          <p className="text-3xl font-black text-emerald-600">{avgTokensPerStudent}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-2 flex gap-2 overflow-x-auto shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all whitespace-nowrap ${
              activeView === tab.id 
                ? `bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold` 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 min-h-[400px] shadow-sm">
        {activeView === 'tokens' && <LeaderboardTokens students={allStudents} />}
        {activeView === 'nfts' && <LeaderboardNFTs nftRequests={nftRequests} students={allStudents} />}
        {activeView === 'stats' && <GeneralStats students={allStudents} studentTasks={studentTasks} tasks={tasks} />}
      </div>
    </div>
  );
}
