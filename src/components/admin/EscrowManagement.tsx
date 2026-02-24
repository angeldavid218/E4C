// src/components/admin/EscrowManagement.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { CreditCard, Copy, Check, Eye, EyeOff, Hourglass, ShieldAlert } from 'lucide-react';

interface EscrowManagementProps {
  adminId: string;
}

export function EscrowManagement({ adminId }: EscrowManagementProps) {
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [escrowResult, setEscrowResult] = useState<{
    publicKey: string;
    secretKey: string;
    stellarNetwork: string;
    message: string;
  } | null>(null);
  const [escrowError, setEscrowError] = useState<string | null>(null);
  const [showEscrowSecret, setShowEscrowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Check if escrow account already exists on component mount
  useEffect(() => {
    const checkExistingEscrow = async () => {
      const { data: existingEscrow } = await supabase
        .from('stellar_wallets')
        .select('public_key, secret_key, role')
        .eq('role', 'escrow')
        .limit(1);

      if (existingEscrow && existingEscrow.length > 0) {
        setEscrowResult({
          publicKey: existingEscrow[0].public_key,
          secretKey: existingEscrow[0].secret_key,
          stellarNetwork: 'TESTNET', // Assuming TESTNET for now, can be fetched from env in future
          message: "La cuenta de bóveda (escrow) ya existe. Solo se puede crear una vez."
        });
      }
    };
    checkExistingEscrow();
  }, []);

  const handleCreateEscrowAccount = async () => {
    setIsCreatingEscrow(true);
    setEscrowError(null);
    setEscrowResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-escrow-account', {
        body: { adminId: adminId } // Pass adminId if needed for logging/permissions
      });

      if (error) {
        console.error('Error invoking create-escrow-account:', error);
        throw new Error(error.message || "Error desconocido al crear la cuenta de escrow.");
      }

      if (data && data.success) {
        setEscrowResult({
          publicKey: data.publicKey,
          secretKey: data.secretKey,
          stellarNetwork: data.stellarNetwork,
          message: data.message
        });
      } else if (data && !data.success) {
        // Case where it already exists and function returns existing details
        setEscrowResult({
          publicKey: data.publicKey,
          secretKey: data.secretKey,
          stellarNetwork: data.stellarNetwork,
          message: data.message
        });
      } else {
        throw new Error("Respuesta inesperada de la función Edge.");
      }
    } catch (err: any) {
      console.error("ERROR en handleCreateEscrowAccount:", err.message);
      setEscrowError(err.message);
    } finally {
      setIsCreatingEscrow(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <CreditCard className="text-teal-600" /> Gestión de Bóveda de Canje (Escrow)
      </h3>
      <p className="text-gray-600 text-sm">
        Crea o visualiza la cuenta Stellar que actúa como bóveda para los tokens canjeados. Esta cuenta es clave para el funcionamiento del Marketplace.
        Solo se puede crear una vez.
      </p>

      {escrowResult ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-6">
          <h4 className="font-bold text-blue-800">Cuenta de Bóveda (Escrow) Configurada</h4>
          <p className="text-blue-700 text-sm">{escrowResult.message}</p>
          
          <div className="space-y-2 text-gray-900">
            <p className="text-xs font-bold text-blue-700 uppercase">Clave Pública (Public Key)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white p-2 rounded border border-blue-100 text-xs font-mono break-all leading-relaxed">
                {escrowResult.publicKey}
              </code>
              <button onClick={() => handleCopy(escrowResult.publicKey)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                {copiedKey && !showEscrowSecret ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-gray-900">
            <p className="text-xs font-bold text-blue-700 uppercase">Clave Secreta (Secret Key)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white p-2 rounded border border-blue-100 text-xs font-mono break-all leading-relaxed">
                {showEscrowSecret ? escrowResult.secretKey : '*******************************************************'}
              </code>
              <button onClick={() => setShowEscrowSecret(!showEscrowSecret)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                {showEscrowSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button onClick={() => handleCopy(escrowResult.secretKey)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                {copiedKey && showEscrowSecret ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 items-start text-orange-900 shadow-sm">
            <ShieldAlert size={24} className="shrink-0 text-orange-600" />
            <p className="text-sm leading-relaxed font-medium">
              **Acción Requerida:** Copia la **Clave Pública** (`E4C_ESCROW_ACCOUNT_PUBLIC_KEY`) y la **Red Stellar** (`STELLAR_NETWORK`: {escrowResult.stellarNetwork})
              y configúralas como variables de entorno en tu dashboard de Supabase (Settings &gt; Edge Functions).
            </p>
          </div>
        </div>
      ) : (
        <button 
          onClick={handleCreateEscrowAccount} 
          disabled={isCreatingEscrow} 
          className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {isCreatingEscrow ? <><Hourglass className="animate-spin" /> Creando Bóveda de Canje...</> : <><CreditCard /> Crear Bóveda de Canje (Escrow)</>}
        </button>
      )}

      {escrowError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {escrowError}</span>
        </div>
      )}
    </div>
  );
}