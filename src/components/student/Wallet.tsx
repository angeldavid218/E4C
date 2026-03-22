import { useState, useEffect, useCallback } from 'react';
import { Coins, Award, ArrowRight, Hourglass } from 'lucide-react';
import { type Student, type NFT } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import * as StellarSdk from '@stellar/stellar-sdk';

interface WalletProps {
  studentId: string;
  onViewNFT: (nftId: string) => void;
  onNavigateToMarketplace: () => void;
}

export function Wallet({ studentId, onViewNFT, onNavigateToMarketplace }: WalletProps) {
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [e4cBalance, setE4cBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<NFT[]>([]);

  const fetchWalletData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      // 1. Obtener datos del perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (profileError) throw profileError;
      setStudentData(profile as Student);

      // 2. Obtener balance de Stellar si tiene llave pública
      if (profile.stellar_public_key) {
        const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
        const account = await server.accounts().accountId(profile.stellar_public_key).call();
        
        const { data: issuerWallet } = await supabase.from('stellar_wallets').select('public_key').eq('role', 'issuer').maybeSingle();

        const e4c = account.balances.find(
          (b: any) => b.asset_code === 'E4C' && b.asset_issuer === issuerWallet?.public_key
        );
        setE4cBalance(e4c ? parseFloat(e4c.balance).toFixed(0) : '0');
      }

      // 3. NFTs (Por ahora simulamos que vienen de un array vacío hasta implementar la tabla de NFTs)
      setNfts([]);

    } catch (err) {
      console.error("Error cargando billetera:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Hourglass className="animate-spin text-indigo-600 mr-2" />
      <span>Cargando tu billetera...</span>
    </div>
  );

  if (!studentData) return <div className="text-center py-8 text-red-600">No se pudo cargar la información del alumno.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Mi Billetera Digital</h2>
      </div>

      {/* Balance de Tokens */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Coins className="w-6 h-6" />
          </div>
          <span className="opacity-90 font-medium">Balance de Tokens</span>
        </div>

        <p className="text-5xl font-black mb-6">{e4cBalance} <span className="text-xl font-normal opacity-80 text-white/80">E4C</span></p>
        
        <button
          onClick={onNavigateToMarketplace}
          className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg"
        >
          <span>Canjear Tokens</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* NFTs de Mérito */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="text-purple-900 font-bold">Mis NFTs de Mérito</h3>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
              {nfts.length} Logros
            </span>
          </div>
        </div>
        <div className="p-6">
          {nfts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 grayscale opacity-50">🏆</div>
              <p className="text-gray-600 font-medium">
                Aún no tienes logros. ¡Completa tareas para ganar NFTs!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nfts.map(nft => (
                <button
                  key={nft.id}
                  onClick={() => onViewNFT(nft.id)}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all text-center bg-gradient-to-b from-white to-gray-50"
                >
                  <div className="text-6xl mb-4">{nft.image}</div>
                  <h4 className="text-gray-900 font-bold mb-2">{nft.name}</h4>
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs mb-3 font-bold ${
                    nft.category === 'excellence' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {nft.category === 'excellence' ? 'Excelencia' : 'Logro'}
                  </div>
                  <p className="text-gray-600 text-sm">{nft.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}