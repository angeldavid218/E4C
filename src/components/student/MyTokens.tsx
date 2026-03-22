import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, RefreshCcw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import * as StellarSdk from '@stellar/stellar-sdk';

interface MyTokensProps {
  studentId: string | undefined;
}

interface StellarTransaction {
  id: string;
  amount: string;
  type: 'earn' | 'spend';
  description: string;
  date: string;
  from?: string;
}

export function MyTokens({ studentId }: MyTokensProps) {
  const [balance, setBalance] = useState<string>('0');
  const [transactions, setTransactions] = useState<StellarTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStellarData = async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener la clave pública del estudiante
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

      // 2. Obtener el emisor para identificar el token E4C
      const { data: issuerWallet } = await supabase
        .from('stellar_wallets')
        .select('public_key')
        .eq('role', 'issuer')
        .limit(1)
        .single();

      // 3. Obtener balances
      const account = await server.accounts().accountId(publicKey).call();
      const e4cBalance = account.balances.find(
        (b: any) => b.asset_code === 'E4C' && b.asset_issuer === issuerWallet?.public_key
      );
      setBalance(e4cBalance ? e4cBalance.balance : '0');

      // 4. Obtener transacciones (pagos)
      const payments = await server.payments().forAccount(publicKey).limit(10).order('desc').call();
      
      const formattedTrans: StellarTransaction[] = payments.records
        .filter((p: any) => p.type === 'payment' && p.asset_code === 'E4C')
        .map((p: any) => ({
          id: p.id,
          amount: p.amount,
          type: (p.to === publicKey ? 'earn' : 'spend') as 'earn' | 'spend',
          description: p.to === publicKey ? 'Tokens recibidos' : 'Tokens enviados/canjeados',
          date: p.created_at,
          from: p.from
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(formattedTrans);

    } catch (err: any) {
      console.error("Error fetching Stellar data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStellarData();
  }, [studentId]);

  const totalEarned = transactions
    .filter((t) => t.type === 'earn')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const totalSpent = transactions
    .filter((t) => t.type === 'spend')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  if (loading) return <div className="text-center py-10">Cargando tus tokens...</div>;

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="opacity-90 mb-2 font-medium">Balance E4C</p>
            <p className="text-5xl font-bold mb-6">
              {parseFloat(balance).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <button 
            onClick={fetchStellarData}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Actualizar balance"
          >
            <RefreshCcw className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total Ganados</p>
            <p className="text-xl font-semibold">+{totalEarned.toFixed(2)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total Canjeados</p>
            <p className="text-xl font-semibold">-{totalSpent.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Historial de Transacciones */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Historial de Transacciones</h3>
            <p className="text-sm text-gray-600 mt-1">
              Actividad reciente en la red Stellar
            </p>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-gray-500 italic">No hay transacciones registradas aún.</div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-full ${
                        transaction.type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {transaction.type === 'earn' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-semibold mb-1">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(transaction.date).toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                        ID: {transaction.id}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-right font-bold ${
                      transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <p className="text-lg">
                      {transaction.type === 'earn' ? '+' : '-'}
                      {parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs uppercase tracking-wider opacity-70">E4C</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
