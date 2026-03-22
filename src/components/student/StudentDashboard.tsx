import { useState, useEffect } from 'react';
import { Coins, ShoppingBag, Trophy, ClipboardList, Users, User, Hourglass } from 'lucide-react';
import { MyTokens } from './MyTokens';
import { MyNFTs } from './MyNFTs';
import { Marketplace } from './Marketplace';
import { MyTasks } from './MyTasks';
import { StudentProfileSettings } from './StudentProfileSettings';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../authContext';
import type { Student, NFTRequest } from '../../types';
import * as StellarSdk from '@stellar/stellar-sdk';

interface StudentDashboardProps {
  studentId?: string;
  nftRequests?: NFTRequest[];
}

type StudentView = 'tokens' | 'nfts' | 'marketplace' | 'my-tasks' | 'profile-settings';

export function StudentDashboard({ studentId }: StudentDashboardProps) {
  const { allStudents } = useAuth();
  const [activeView, setActiveView] = useState<StudentView>('my-tasks');
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [e4cBalance, setE4cBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [studentNFTs, setStudentNFTs] = useState<NFTRequest[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setStudentData(null);
        setE4cBalance(null);
        setStudentNFTs([]);
        return;
      }

      setLoading(true);
      try {
        const { data: fetchedStudent, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', studentId)
          .single();
        
        if (error) throw error;
        
        const student = fetchedStudent as Student;
        setStudentData(student);

        // Obtener NFTs aprobados/confirmados del alumno
        const { data: nftData } = await supabase
          .from('nft_requests')
          .select('*')
          .eq('student_id', studentId);
        
        setStudentNFTs(nftData?.filter(n => ['approved', 'blockchain-confirmed'].includes(n.status)) || []);

        if (student.stellar_public_key) {
          try {
            const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
            const account = await server.accounts().accountId(student.stellar_public_key).call();
            
            const { data: issuerWallet } = await supabase
              .from('stellar_wallets')
              .select('public_key')
              .eq('role', 'issuer')
              .limit(1)
              .single();

            const e4c = account.balances.find(
              (b: any) => b.asset_code === 'E4C' && b.asset_issuer === issuerWallet?.public_key
            );
            
            setE4cBalance(e4c ? e4c.balance : '0');
          } catch (e) {
            setE4cBalance('0');
          }
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const tabs = [
    { id: 'my-tasks' as StudentView, label: 'Mis Tareas', icon: ClipboardList, color: 'emerald' },
    { id: 'tokens' as StudentView, label: 'Mis Tokens', icon: Coins, color: 'indigo' },
    { id: 'nfts' as StudentView, label: 'Mis Logros NFT', icon: Trophy, color: 'purple' },
    { id: 'marketplace' as StudentView, label: 'Marketplace', icon: ShoppingBag, color: 'pink' },
    { id: 'profile-settings' as StudentView, label: 'Configuración de Perfil', icon: User, color: 'gray' },
  ];

  if (allStudents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-orange-100 p-6 rounded-full">
          <Users className="w-12 h-12 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">No existen alumnos para mostrar</h2>
        <p className="text-gray-600 max-w-md">
          Por favor cree alumnos en el panel de administrador.
        </p>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="bg-indigo-100 p-6 rounded-full">
          <Coins className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Panel del Estudiante</h2>
        <p className="text-gray-600 max-w-md">
          Por favor, selecciona un alumno en la lista de la barra superior para ver su progreso y billetera Stellar.
        </p>
      </div>
    );
  }

  if (loading || !studentData) return <div className="text-center p-12 italic text-indigo-600 animate-pulse">Cargando datos del estudiante...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold">¡Hola, {studentData.name}! 👋</h2>
        <p className="mt-2 opacity-90 text-indigo-100 font-medium">
          ID: {studentId} | {studentData.curso}° "{studentData.division}" - {studentData.escuela}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-sm font-bold mb-1">Tokens E4C</p>
          <p className="text-3xl font-black text-indigo-600">
            {e4cBalance ? parseFloat(e4cBalance).toLocaleString('es-ES', { maximumFractionDigits: 0 }) : '0'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-sm font-bold mb-1">Logros Obtenidos</p>
          <p className="text-3xl font-black text-purple-600">0</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-sm font-bold mb-1">Tareas Finalizadas</p>
          <p className="text-3xl font-black text-emerald-600">{studentData.tasks_completed || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2 flex gap-2 overflow-x-auto snap-x">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap snap-start ${
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

      <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[400px] shadow-sm">
        {activeView === 'tokens' && <MyTokens studentId={studentId} />}
        {activeView === 'nfts' && <MyNFTs nfts={studentNFTs} />}
        {activeView === 'marketplace' && <Marketplace studentId={studentId} />}
        {activeView === 'my-tasks' && <MyTasks studentId={studentId} />}
        {activeView === 'profile-settings' && <StudentProfileSettings studentId={studentId} />}
      </div>
    </div>
  );
}
