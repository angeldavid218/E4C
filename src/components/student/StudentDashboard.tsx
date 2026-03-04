import { useState, useEffect } from 'react';
import { Coins, Award, ShoppingBag, Trophy, ClipboardList, Users, AlertCircle, Hourglass, User } from 'lucide-react';
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

export function StudentDashboard({ studentId, nftRequests: propNftRequests }: StudentDashboardProps) {
  const { user, allStudents, switchUserRole } = useAuth(); // Obtener de AuthContext
  const [activeView, setActiveView] = useState<StudentView>('my-tasks');
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [nftRequests, setNftRequests] = useState<NFTRequest[]>(propNftRequests || []);
  const [e4cBalance, setE4cBalance] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setStudentData(null);
        setE4cBalance(null);
        return;
      }

      setLoading(true);
      let student: Student | null = null;

      if (studentId.startsWith('mock-')) {
        // If it's a mock student, use the mock user data from auth context
        if (user && user.user_metadata.role === 'student' && user.id === studentId) {
          student = {
            id: user.id,
            name: user.user_metadata.name || 'Mock Student',
            email: user.user_metadata.email || 'mock@student.com',
            enrollmentDate: new Date().toISOString(), // Mock date
            tokens: 0, // Mock tokens
            tasksCompleted: 0, // Mock tasks
            nfts: [], // Mock NFTs
            grade: '', // Mock grade
            curso: 'Mock', // Mock curso
            division: 'A', // Mock division
            escuela: 'Mock School', // Mock escuela
            stellar_public_key: undefined, // Mock public key
            alias: 'mockstudent'
          };
        }
      } else {
        // Otherwise, fetch from Supabase
        const { data: fetchedStudent } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
        student = fetchedStudent as Student;
      }

      if (student) {
        setStudentData(student);
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
            
            if (e4c) {
              setE4cBalance(e4c.balance);
              setIsLinked(true);
            } else {
              setE4cBalance('0');
              setIsLinked(false); // No tiene el trustline
            }
          } catch (e) {
            setE4cBalance('0');
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [studentId]);

  const tabs = [
    { id: 'my-tasks' as StudentView, label: 'Mis Tareas', icon: ClipboardList, color: 'emerald' },
    { id: 'tokens' as StudentView, label: 'Mis Tokens', icon: Coins, color: 'indigo' },
    { id: 'nfts' as StudentView, label: 'Mis Logros NFT', icon: Trophy, color: 'purple' },
    { id: 'marketplace' as StudentView, label: 'Marketplace', icon: ShoppingBag, color: 'pink' },
    { id: 'profile-settings' as StudentView, label: 'Configuración de Perfil', icon: User, color: 'gray' }, // New tab
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

  if (loading || !studentData) return <div className="text-center p-12">Cargando datos del estudiante...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold">¡Hola, {studentData.name}! 👋</h2>
        <p className="mt-2 opacity-90 text-indigo-100">
          ID: {studentId} | {studentData.curso}° "{studentData.division}" - {studentData.escuela}
        </p>
      </div>

      {/* Alerta de Vinculación de Token */}
      {!isLinked && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">Vinculación de Token Pendiente</h4>
              <p className="text-sm text-amber-700">Tu billetera no está lista para recibir E4C. Haz clic en el botón para activarla.</p>
            </div>
          </div>
          <button 
            onClick={handleLinkToken}
            disabled={isLinking}
            className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all flex items-center gap-2 shadow-md"
          >
            {isLinking ? <><Hourglass className="animate-spin" size={18}/> Vinculando...</> : "Vincular Token E4C"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium mb-1">Tokens E4C</p>
          <p className="text-3xl font-bold text-indigo-600">
            {e4cBalance ? parseFloat(e4cBalance).toLocaleString('es-ES', { maximumFractionDigits: 2 }) : '0'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium mb-1">Logros Obtenidos</p>
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium mb-1">Ranking</p>
          <p className="text-3xl font-bold text-green-600">#3</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2 flex gap-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all whitespace-nowrap ${
              activeView === tab.id ? `bg-${tab.color}-100 text-${tab.color}-700 font-bold` : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[400px]">
        {activeView === 'tokens' && <MyTokens studentId={studentId} />}
        {activeView === 'nfts' && <MyNFTs nfts={[]} />}
        {activeView === 'marketplace' && <Marketplace studentId={studentId} />}
        {activeView === 'my-tasks' && <MyTasks studentId={studentId} />}
        {activeView === 'profile-settings' && <StudentProfileSettings studentId={studentId} />} {/* New render */}
      </div>
    </div>
  );
}
