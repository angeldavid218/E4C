import { useState, useEffect, useCallback } from 'react';
import { Coins, ShoppingBag, CheckCircle, Ticket, QrCode, Hourglass } from 'lucide-react';
import { type Reward } from '../../types';
import { supabase } from '../../lib/supabaseClient'; // Necesario para obtener el balance del estudiante
import * as StellarSdk from '@stellar/stellar-sdk'; // Necesario para Stellar



interface MarketplaceProps {
  studentId: string | undefined;
}

export function Marketplace({ studentId }: MarketplaceProps) {
  const [e4cBalance, setE4cBalance] = useState<string>('0');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>(''); // Para almacenar el UUID/hash del voucher
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const initialRewards: Reward[] = [
    { id: 'reward-1', name: 'Entrada 2D - Cine', description: 'Válido para cualquier función de lunes a jueves en salas seleccionadas.', cost: 100, category: 'Cine', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80', available: 10 },
    { id: 'reward-2', name: 'Obra: "El Método"', description: 'Pase para 1 persona en el Teatro San Martín. Funciones de fin de semana.', cost: 250, category: 'Teatro', image: 'https://images.unsplash.com/photo-1503095396549-80705bc06179?auto=format&fit=crop&w=800&q=80', available: 5 },
    { id: 'reward-3', name: 'Membresía MALBA', description: 'Acceso ilimitado por 1 mes y catálogo digital de exposiciones.', cost: 400, category: 'Museos', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80', available: 3 },
  ];

  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [filterCategory, setFilterCategory] = useState<string>('Todos');

  const categories = [
    'Todos',
    ...Array.from(new Set(initialRewards.map(r => r.category)))
  ];

  const fetchStellarBalance = useCallback(async () => {
    if (!studentId) {
      setE4cBalance('0');
      return;
    }

    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('stellar_public_key')
        .eq('id', studentId)
        .single();

      if (studentError || !student?.stellar_public_key) {
        throw new Error("No se encontró la clave pública Stellar del estudiante.");
      }

      const publicKey = student.stellar_public_key;
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      const account = await server.accounts().accountId(publicKey).call();
      
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
    } catch (err: any) {
      console.error("Error fetching Stellar balance:", err.message);
      setE4cBalance('0');
    }
  }, [studentId]);

  useEffect(() => {
    fetchStellarBalance();
  }, [studentId, fetchStellarBalance]);

  const filteredRewards =
    filterCategory === 'Todos'
      ? rewards
      : rewards.filter((r) => r.category === filterCategory);

  const openModal = (reward: Reward) => {
    setSelectedReward(reward);
    setShowConfirmation(true);
    setShowQR(false);
    setTransactionSuccess(false);
    setTransactionError(null);
  };

  const closeModal = () => {
    setSelectedReward(null);
    setShowConfirmation(false);
    setShowQR(false);
    setProcessingTransaction(false);
    setTransactionSuccess(false);
    setTransactionError(null);
    fetchStellarBalance(); // Refrescar balance al cerrar el modal
  };

  const confirmTransaction = async () => {
    if (!selectedReward || !studentId) return;

    setProcessingTransaction(true);
    setTransactionError(null);

    try {
      // Invocar la Edge Function para realizar la transacción Stellar
      const { data, error } = await supabase.functions.invoke('redeem-e4c-tokens', {
        body: { 
          studentId: studentId,
          amount: selectedReward.cost,
          rewardId: selectedReward.id
        },
      });

      if (error) {
        console.error('Error invoking redeem-e4c-tokens:', error);
        throw new Error(error.message || "Error desconocido al canjear tokens.");
      }

      if (data && data.success) {
        setQrCodeData(data.voucher_uuid); // Usar el UUID generado por la Edge Function
        setTransactionSuccess(true);
        setShowConfirmation(false);
        setShowQR(true);
      } else {
        throw new Error(data?.message || "Fallo en la transacción Stellar.");
      }

    } catch (err: any) {
      console.error("Error en la confirmación de la transacción:", err.message);
      setTransactionError(err.message);
    } finally {
      setProcessingTransaction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Marketplace Cultural</h2>
          <p className="text-slate-500 italic">Canjea tus logros académicos por cultura.</p>
        </div>
        <div className="text-right">
          <span className="block text-sm text-slate-400">Tu Saldo</span>
          <span className="text-2xl font-bold text-indigo-600">
            {parseFloat(e4cBalance).toLocaleString('es-ES', { maximumFractionDigits: 2 })} $E4C
          </span>
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {categories.map(category => (
          <button 
            key={category}
            onClick={() => setFilterCategory(category)}
            className={`px-6 py-2 rounded-full font-medium transition ${
              filterCategory === category ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map(reward => {
          const canAfford = parseFloat(e4cBalance) >= reward.cost;
          return (
            <div 
              key={reward.id} 
              className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition ${!canAfford && 'opacity-60 grayscale'}`}
            >
              <div className="h-48 bg-slate-200 relative">
                <img src={reward.image} alt={reward.name} className="w-full h-full object-cover" />
                <span className={`absolute top-4 left-4 ${
                  reward.category === 'Cine' ? 'bg-indigo-600' : 
                  reward.category === 'Teatro' ? 'bg-purple-600' : 
                  'bg-amber-500'
                } text-white px-3 py-1 rounded-full text-xs font-bold uppercase`}>{reward.category}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{reward.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{reward.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-indigo-600">{reward.cost} $E4C</span>
                  <button 
                    onClick={() => openModal(reward)} 
                    disabled={!canAfford || processingTransaction}
                    className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Canjear
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmación / QR */}
      {(showConfirmation || showQR) && (
        <div id="modal" className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center">
            {/* Paso 1: Confirmación de Canje */}
            {showConfirmation && !transactionSuccess && (
              <div id="modal-step-1">
                <h2 className="text-2xl font-bold mb-2">¿Confirmar canje?</h2>
                <p className="text-slate-500 mb-6" id="modal-desc">
                  Se debitarán {selectedReward?.cost} $E4C de tu billetera por: {selectedReward?.name}.
                </p>
                {transactionError && (
                  <p className="text-red-500 text-sm mb-4">{transactionError}</p>
                )}
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmTransaction} 
                    id="btn-confirm" 
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200"
                    disabled={processingTransaction}
                  >
                    {processingTransaction ? <><Hourglass className="inline-block animate-spin mr-2" size={18} /> Procesando en Red Stellar...</> : 'Confirmar en Red Stellar'}
                  </button>
                  <button onClick={closeModal} className="w-full py-4 text-slate-400 font-medium">Cancelar</button>
                </div>
              </div>
            )}

            {/* Paso 2: Voucher QR */}
            {showQR && transactionSuccess && (
              <div id="modal-step-2">
                <div className="mb-6 flex justify-center">
                  <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center border-4 border-indigo-600 p-2">
                      {qrCodeData ? (
                          <div className="flex items-center justify-center w-full h-full text-center text-sm font-mono break-all p-2 text-gray-800">
                            {qrCodeData}
                          </div>
                      ) : (
                          <Ticket className="w-full h-full text-indigo-600 opacity-70" />
                      )}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">¡Canje Exitoso!</h2>
                <p className="text-slate-500 mb-6 text-sm">Presenta este código en la boletería. El comercio validará la transacción con el ID: <br/><span className="font-mono text-indigo-600 font-bold break-all">{qrCodeData || 'STLR-XXXX...'}</span></p>
                <button onClick={closeModal} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">Volver al inicio</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}