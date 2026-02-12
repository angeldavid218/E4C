import { useState, useEffect } from 'react';
import { Coins, Award, ShoppingBag, Trophy, ClipboardList } from 'lucide-react'; // Import ClipboardList
import { MyTokens } from './MyTokens';
import { MyNFTs } from './MyNFTs';
import { Marketplace } from './Marketplace';
import { MyTasks } from './MyTasks';
import { supabase } from '../../lib/supabaseClient';
import type { Student, NFTRequest } from '../../types';
import * as StellarSdk from '@stellar/stellar-sdk'; // Import Stellar SDK as a namespace

interface StudentDashboardProps {
  studentId?: string; // Make studentId optional
  nftRequests?: NFTRequest[];
}

type StudentView = 'tokens' | 'nfts' | 'marketplace' | 'my-tasks'; // Add 'my-tasks'

export function StudentDashboard({ studentId, nftRequests: propNftRequests }: StudentDashboardProps) {
  const [activeView, setActiveView] = useState<StudentView>('tokens');
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [nftRequests, setNftRequests] = useState<NFTRequest[]>(propNftRequests || []);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentAndNFTRequests = async () => {
      if (!studentId) { // Handle case where studentId is not provided
        setStudentData(null);
        setXlmBalance(null);
        setNftRequests([]);
        return;
      }

      // Fetch student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('Error fetching student:', studentError);
        setStudentData(null);
        setXlmBalance(null);
      } else {
        setStudentData(student as Student);

        // Fetch Stellar balance if public key exists
        if (student && student.stellar_public_key) {
          try {
            const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org'); // Use StellarSdk.Horizon.Server
            const account = await server.accounts().accountId(student.stellar_public_key).call();
            const nativeBalance = account.balances.find(b => b.asset_type === 'native');
            setXlmBalance(nativeBalance ? nativeBalance.balance : '0');
          } catch (stellarErr) {
            console.error('Error fetching Stellar balance:', stellarErr);
            setXlmBalance('Error');
          }
        } else {
          setXlmBalance(null);
        }
      }

      // Fetch NFT requests if not provided as prop
      if (!propNftRequests) {
        const { data: requests, error: requestsError } = await supabase
          .from('nft_requests')
          .select('*')
          .eq('studentId', studentId);

        if (requestsError) {
          console.error('Error fetching NFT requests:', requestsError);
          setNftRequests([]);
        } else {
          setNftRequests(requests as NFTRequest[]);
        }
      }
    };

    fetchStudentAndNFTRequests();
  }, [studentId, propNftRequests]);

  const myNFTs = nftRequests.filter(
    req => studentId && req.studentId === studentId && req.status === 'approved'
  );

  if (!studentData) {
    return (
      <div className="flex justify-center items-center h-full text-lg">
        {!studentId ? 'Selecciona un estudiante para ver su dashboard.' : 'Cargando datos del estudiante...'}
      </div>
    );
  }

  const student = studentData; // Use fetched data

  const tabs = [
    { id: 'my-tasks' as StudentView, label: 'Mis Tareas', icon: ClipboardList, color: 'emerald' }, // New tab, now first
    { id: 'tokens' as StudentView, label: 'Mis Tokens', icon: Coins, color: 'indigo' },
    { id: 'nfts' as StudentView, label: 'Mis Logros NFT', icon: Trophy, color: 'purple' },
    { id: 'marketplace' as StudentView, label: 'Marketplace', icon: ShoppingBag, color: 'pink' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h2>¡Hola, {student?.name || 'Estudiante'}! 👋</h2>
        <p className="mt-2 opacity-90">
          Bienvenido a tu panel estudiantil
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Tokens XLM</p>
              <p className="text-indigo-600">{xlmBalance !== null ? `${xlmBalance} XLM` : 'Cargando...'}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Coins className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">NFTs Obtenidos</p>
              <p className="text-purple-600">{myNFTs.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Ranking</p>
              <p className="text-green-600">#3 en mi grado</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación del Dashboard */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 flex gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all ${
                isActive
                  ? `bg-${tab.color}-100 text-${tab.color}-700`
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- Contenido Dinámico del Dashboard --- */}
      {/* Muestra el componente correspondiente (Mis Tokens, Mis NFTs, Marketplace o Mis Tareas)
          basado en la pestaña 'activeView' seleccionada. */}
      <div>
        {activeView === 'tokens' && <MyTokens studentId={studentId} />}
        {activeView === 'nfts' && <MyNFTs nfts={myNFTs} />}
        {activeView === 'marketplace' && <Marketplace studentId={studentId} />}
        {activeView === 'my-tasks' && studentId && <MyTasks studentId={studentId} />}
      </div>
    </div>
  );
}