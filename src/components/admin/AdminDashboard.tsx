import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../authContext';
import type { Teacher } from '../../types';
import {
  Users, UserPlus, BookCopy, UserCheck, CreditCard,
  DollarSign, ShieldCheck, Eye, EyeOff, Copy, Check, Hourglass, X, Warehouse, QrCode, Wallet, AlertTriangle
} from 'lucide-react';import { StudentManagement } from './StudentManagement';
import { TeacherManagement } from './TeacherManagement';
import { ValidatorManagement } from './ValidatorManagement';
import UserApproval from './UserApproval';
import { EscrowManagement } from './EscrowManagement';
import { RegistrationQR } from './RegistrationQR';
import * as StellarSdk from '@stellar/stellar-sdk';
import FreighterApi from "@stellar/freighter-api";

// Extraer funciones con fallback para diferentes versiones
const _freighter = (FreighterApi as any).default || FreighterApi;
const { getPublicKey, isConnected } = _freighter;

export default function AdminDashboard() {
  const { user, allAdmins, allStudents, allTeachers, allValidators, refreshUsers, switchUserRole } = useAuth();
  
  const currentAdmin = useMemo(() => {
    if (!user?.id || !Array.isArray(allAdmins) || allAdmins.length === 0) return null;
    return allAdmins.find(admin => admin.id === user.id);
  }, [user?.id, allAdmins]);

  const [activeView, setActiveView] = useState<'students' | 'teachers' | 'validators' | 'approve' | 'stellar-setup' | 'escrow-setup' | 'qr-invite'>('stellar-setup');
  
  // Estados Stellar
  const [isCreatingStellarAccounts, setIsCreatingStellarAccounts] = useState(false);
  const [isMintingTokens, setIsMintingTokens] = useState(false);
  const [mintAmount, setMintAmount] = useState('1000');
  const [stellarAccountCreationError, setStellarAccountCreationError] = useState<string | null>(null);
  const [stellarAccountCreationResult, setStellarAccountCreationResult] = useState<any>(null);
  
  // Estados Visibilidad y Copiado
  const [showIssuerSecret, setShowIssuerSecret] = useState(false);
  const [showDistributorSecret, setShowDistributorSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'issuer' | 'distributor' | 'created' | null>(null);

  // Estados Modal Éxito y Carga
  const [isProcessing, setIsProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState<{show: boolean; name: string; role: string; secretKey: string; publicKey: string}>({
    show: false, name: '', role: '', secretKey: '', publicKey: ''
  });
  const [showCreatedSecret, setShowCreatedSecret] = useState(false);
  
  // Estados para creación de perfil de administrador inicial
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminWallet, setAdminWallet] = useState<string | null>(null);
  const [adminProfileLoading, setAdminProfileLoading] = useState(false);

  useEffect(() => {
    const fetchStellarWallets = async () => {
      if (!currentAdmin?.id) return;
      const { data: wallets } = await supabase.from('stellar_wallets').select('*').eq('admin_id', currentAdmin.id);
      if (wallets) {
        const issuer = wallets.find(w => w.role === 'issuer');
        const distributor = wallets.find(w => w.role === 'distributor');
        if (issuer && distributor) {
          setStellarAccountCreationResult({
            issuerPublicKey: issuer.public_key,
            issuerSecretKey: issuer.secret_key,
            distributorPublicKey: distributor.public_key,
            distributorSecretKey: distributor.secret_key,
          });
        }
      }
    };
    fetchStellarWallets();
  }, [currentAdmin?.id]);

  const handleCopy = (text: string, type: 'issuer' | 'distributor' | 'created') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConnectAdminWallet = async () => {
    try {
      if (!await isConnected()) throw new Error("Freighter no detectado.");
      const pk = await getPublicKey();
      setAdminWallet(pk);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateAdminProfile = async () => {
    if (!adminWallet) return alert("Debes vincular tu wallet para continuar.");
    setAdminProfileLoading(true);
    try {
      // Validar si user.id es un UUID, si no generar uno nuevo
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const adminId = (user?.id && uuidRegex.test(user.id)) ? user.id : crypto.randomUUID();
      
      const { error } = await supabase
        .from('profiles')
        .insert({ 
          id: adminId, 
          name: newAdminName || "Admin Maestro", 
          email: newAdminEmail,
          role: 'admin',
          status: 'approved',
          stellar_public_key: adminWallet 
        });

      if (error) throw error;
      alert('Perfil Web3 de Administrador creado con éxito. ¡Ahora puedes loguearte con tu wallet!');
      await refreshUsers();
      window.location.reload();
    } catch (error: any) {
      alert("Error al crear perfil: " + error.message);
    } finally {
      setAdminProfileLoading(false);
    }
  };

  const handleCreateStellarAccounts = async () => {
    if (!currentAdmin?.id) return;
    setIsCreatingStellarAccounts(true);
    setStellarAccountCreationError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-e4c-accounts-and-emit', { body: { adminId: currentAdmin.id } });
      if (error) throw error;
      
      if (data?.success) {
        setStellarAccountCreationResult({
          issuerPublicKey: data.issuerPublicKey,
          issuerSecretKey: data.issuerSecretKey,
          distributorPublicKey: data.distributorPublicKey,
          distributorSecretKey: data.distributorSecretKey,
        });
        alert("Cuentas Stellar creadas con éxito.");
      } else {
        throw new Error(data?.error || "Error desconocido al crear cuentas.");
      }
    } catch (err: any) {
      console.error("Error en handleCreateStellarAccounts:", err);
      setStellarAccountCreationError(err.message);
    } finally {
      setIsCreatingStellarAccounts(false);
    }
  };

  const handleMintTokens = async () => {
    if (!currentAdmin?.id || !mintAmount) return;
    setIsMintingTokens(true);
    try {
      const { error } = await supabase.functions.invoke('mint-e4c-tokens', { body: { adminId: currentAdmin.id, amount: mintAmount } });
      if (error) throw error;
      alert("Emisión exitosa");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsMintingTokens(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-lg text-gray-600">Por favor, inicia sesión</div>;

  if (!currentAdmin) {
    return (
      <div className="flex justify-center items-center min-h-[80vh] p-8">
        <div className="bg-white rounded-[3rem] border border-gray-200 p-12 space-y-8 text-center max-w-lg shadow-2xl">
          <div className="bg-indigo-600 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-2 shadow-xl shadow-indigo-200 rotate-3">
            <ShieldCheck className="text-white" size={48} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Bootstrap Admin</h3>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              Configura tu identidad Web3 para comenzar la gestión institucional.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-left space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Datos Maestros</label>
              <input
                type="text"
                placeholder="Tu Nombre Completo"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <input
                type="email"
                placeholder="Email de Respaldo"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all mt-2"
              />
            </div>

            <div className="pt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left ml-4">Seguridad Web3</p>
              {!adminWallet ? (
                <button
                  onClick={handleConnectAdminWallet}
                  className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                >
                  <Wallet size={20} /> Vincular Freighter Wallet
                </button>
              ) : (
                <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="text-green-600" size={20} />
                    <code className="text-xs font-mono text-green-700">{adminWallet.slice(0, 6)}...{adminWallet.slice(-6)}</code>
                  </div>
                  <button onClick={() => setAdminWallet(null)} className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase">Cambiar</button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleCreateAdminProfile}
            disabled={adminProfileLoading || !newAdminName || !adminWallet}
            className="w-full px-6 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95 disabled:opacity-50 mt-4"
          >
            {adminProfileLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Hourglass className="animate-spin" size={20} /> Inicializando...
              </span>
            ) : 'Activar Panel Maestro'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-3 rounded-full"><Users className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-bold text-white">Panel de Administrador {currentAdmin?.name && ` - ${currentAdmin.name}`}</h2>
            <p className="opacity-80">Gestión institucional y red Stellar E4C</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2 flex gap-2 overflow-x-auto shadow-sm">
        {[
          { id: 'students', label: 'Estudiantes', icon: UserPlus, color: 'indigo' },
          { id: 'teachers', label: 'Docentes', icon: BookCopy, color: 'purple' },
          { id: 'validators', label: 'Validadores', icon: ShieldCheck, color: 'green' },
          { id: 'qr-invite', label: 'Invitar QR', icon: QrCode, color: 'orange' },
          { id: 'approve', label: 'Aprobar', icon: UserCheck, color: 'blue' },
          { id: 'stellar-setup', label: 'Cuentas Stellar', icon: CreditCard, color: 'yellow' },
          { id: 'escrow-setup', label: 'Bóveda E4C', icon: Warehouse, color: 'teal' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all min-w-[140px] ${
              activeView === tab.id ? `bg-${tab.color}-100 text-${tab.color}-700 font-bold shadow-sm` : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[400px] shadow-sm text-gray-900">
        {activeView === 'students' && <StudentManagement />}
        {activeView === 'teachers' && <TeacherManagement teachers={allTeachers} onCreateTeacher={async () => {}} />}
        {activeView === 'validators' && <ValidatorManagement validators={allValidators} onCreateValidator={async () => {}} />}
        {activeView === 'qr-invite' && <RegistrationQR />}
        {activeView === 'approve' && <UserApproval />}
        
        {activeView === 'stellar-setup' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><CreditCard className="text-yellow-600" /> Configuración Stellar</h3>
            {!stellarAccountCreationResult ? (
              <div className="space-y-4">
                <button onClick={handleCreateStellarAccounts} disabled={isCreatingStellarAccounts} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
                  {isCreatingStellarAccounts ? <><Hourglass className="animate-spin" /> Creando...</> : <><CreditCard /> Configurar Emisor/Distribuidor</>}
                </button>
                {stellarAccountCreationError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Error al configurar cuentas Stellar</h4>
                      <p className="text-sm">{stellarAccountCreationError}</p>
                      {stellarAccountCreationError.includes('escrow') && (
                        <p className="text-sm mt-2 font-semibold">
                          👉 Ve a la pestaña "Bóveda E4C" y configura la cuenta Escrow primero.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-green-700 uppercase">Issuer</p>
                    <p className="text-[10px] font-mono break-all bg-white p-2 rounded border">{stellarAccountCreationResult.issuerPublicKey}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-2 rounded border text-xs font-mono">
                        {showIssuerSecret ? stellarAccountCreationResult.issuerSecretKey : '*******************************************************'}
                      </code>
                      <button onClick={() => setShowIssuerSecret(!showIssuerSecret)} className="p-2 hover:bg-white rounded-lg transition-colors">
                        {showIssuerSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button onClick={() => handleCopy(stellarAccountCreationResult.issuerSecretKey, 'issuer')} className="p-2 hover:bg-white rounded-lg transition-colors">
                        {copiedKey === 'issuer' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-green-700 uppercase">Distributor</p>
                    <p className="text-[10px] font-mono break-all bg-white p-2 rounded border">{stellarAccountCreationResult.distributorPublicKey}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-2 rounded border text-xs font-mono">
                        {showDistributorSecret ? stellarAccountCreationResult.distributorSecretKey : '*******************************************************'}
                      </code>
                      <button onClick={() => setShowDistributorSecret(!showDistributorSecret)} className="p-2 hover:bg-white rounded-lg transition-colors">
                        {showDistributorSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button onClick={() => handleCopy(stellarAccountCreationResult.distributorSecretKey, 'distributor')} className="p-2 hover:bg-white rounded-lg transition-colors">
                        {copiedKey === 'distributor' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-green-200 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Emitir más E4C</label>
                    <input type="number" value={mintAmount} onChange={e => setMintAmount(e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none" placeholder="Cantidad" />
                  </div>
                  <button onClick={handleMintTokens} disabled={isMintingTokens} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-all">
                    {isMintingTokens ? "Emitiendo..." : "Emitir Tokens"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {activeView === 'escrow-setup' && currentAdmin?.id && <EscrowManagement adminId={currentAdmin.id} />}
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[110]">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <Hourglass className="w-12 h-12 text-indigo-600 animate-spin" />
            <h3 className="font-bold text-gray-800">Cargando...</h3>
          </div>
        </div>
      )}
    </div>
  );
}
