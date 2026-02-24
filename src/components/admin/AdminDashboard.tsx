import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../authContext';
import type { Teacher } from '../../types';
import { 
  Users, UserPlus, BookCopy, UserCheck, CreditCard, 
  DollarSign, ShieldCheck, Eye, EyeOff, Copy, Check, Hourglass, X, Warehouse 
} from 'lucide-react';
import { StudentManagement } from './StudentManagement';
import { TeacherManagement } from './TeacherManagement';
import { ValidatorManagement } from './ValidatorManagement';
import UserApproval from './UserApproval';
import { EscrowManagement } from './EscrowManagement'; // Import the new component
import * as StellarSdk from '@stellar/stellar-sdk';

export default function AdminDashboard() {
  const { user, allAdmins, allStudents, allTeachers, allValidators, refreshUsers, switchUserRole } = useAuth();
  
  const currentAdmin = useMemo(() => {
    if (!user?.id || !allAdmins.length) return null;
    return allAdmins.find(admin => admin.id === user.id);
  }, [user?.id, allAdmins]);

  const [activeView, setActiveView] = useState<'students' | 'teachers' | 'validators' | 'approve' | 'stellar-setup' | 'escrow-setup'>('stellar-setup'); // Add 'escrow-setup'
  
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

  const handleCreateTeacherInSupabase = async (teacherData: any) => {
    setIsProcessing(true);
    try {
      const pair = StellarSdk.Keypair.random();
      const { data: created, error: tErr } = await supabase.from('teachers').insert([{ ...teacherData, stellar_public_key: pair.publicKey() }]).select().single();
      if (tErr) throw tErr;

      const { error: wErr } = await supabase.from('stellar_wallets').insert([{
        teacher_id: created.id, public_key: pair.publicKey(), secret_key: pair.secret(), role: 'teacher'
      }]);
      if (wErr) {
        await supabase.from('teachers').delete().eq('id', created.id);
        throw wErr;
      }

      setSuccessModal({ show: true, name: created.name, role: 'Docente', secretKey: pair.secret(), publicKey: pair.publicKey() });
      setShowCreatedSecret(false);
      await refreshUsers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateValidatorInSupabase = async (valData: any) => {
    setIsProcessing(true);
    try {
      const pair = StellarSdk.Keypair.random();
      const { data: created, error: vErr } = await supabase.from('validators').insert([{ ...valData, stellar_public_key: pair.publicKey() }]).select().single();
      if (vErr) throw vErr;

      const { error: wErr } = await supabase.from('stellar_wallets').insert([{
        validator_id: created.id, public_key: pair.publicKey(), secret_key: pair.secret(), role: 'validator'
      }]);
      if (wErr) {
        await supabase.from('validators').delete().eq('id', created.id);
        throw wErr;
      }

      setSuccessModal({ show: true, name: created.name, role: 'Validador', secretKey: pair.secret(), publicKey: pair.publicKey() });
      setShowCreatedSecret(false);
      await refreshUsers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateStellarAccounts = async () => {
    if (!currentAdmin?.id) return;
    setIsCreatingStellarAccounts(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-e4c-accounts-and-emit', { body: { adminId: currentAdmin.id } });
      if (error) throw error;
      window.location.reload(); // Recargar para ver los cambios
    } catch (err: any) {
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

  const handleCreateAdminProfile = async () => {
    setAdminProfileLoading(true);
    try {
      const newAdminId = crypto.randomUUID();
      const adminName = newAdminName || "Admin User";
      const adminEmail = newAdminEmail || "admin@example.com";

      const { error } = await supabase
        .from('admins')
        .insert({ id: newAdminId, name: adminName, email: adminEmail });

      if (error) throw error;
      
      alert('Perfil de administrador creado con éxito');
      await refreshUsers();
      await switchUserRole('admin', newAdminId);
    } catch (error: any) {
      alert("Error al crear perfil: " + error.message);
    } finally {
      setAdminProfileLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-lg text-gray-600">Por favor, inicia sesión</div>;

  // Lógica para mostrar el formulario de creación de perfil si no existe en la DB
  if (user.user_metadata?.role === 'admin' && !currentAdmin) {
    return (
      <div className="flex justify-center items-center min-h-[80vh] p-8">
        <div className="bg-white rounded-3xl border border-gray-200 p-10 space-y-6 text-center max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="text-indigo-600" size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Crear Perfil Admin</h3>
            <p className="text-gray-500 text-sm mt-2">
              No hemos encontrado un perfil para tu cuenta. Por favor, regístrate para gestionar la red E4C.
            </p>
          </div>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nombre Completo"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <input
              type="email"
              placeholder="Email Institucional"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleCreateAdminProfile}
            disabled={adminProfileLoading || !newAdminName || !newAdminEmail}
            className="w-full px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {adminProfileLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Hourglass className="animate-spin" size={20} /> Creando...
              </span>
            ) : 'Comenzar Gestión'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-3 rounded-full"><Users className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-bold text-white">Panel de Administrador {currentAdmin?.name && ` - ${currentAdmin.name}`}</h2>
            <p className="opacity-80">Gestión institucional y red Stellar E4C</p>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 flex gap-2 overflow-x-auto shadow-sm">
        {[
          { id: 'students', label: 'Estudiantes', icon: UserPlus, color: 'indigo' },
          { id: 'teachers', label: 'Docentes', icon: BookCopy, color: 'purple' },
          { id: 'validators', label: 'Validadores', icon: ShieldCheck, color: 'green' },
          { id: 'approve', label: 'Aprobar', icon: UserCheck, color: 'blue' },
          { id: 'stellar-setup', label: 'Cuentas Stellar', icon: CreditCard, color: 'yellow' },
          { id: 'escrow-setup', label: 'Bóveda E4C', icon: Warehouse, color: 'teal' }, // New tab
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

      {/* Contenido */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[400px] shadow-sm text-gray-900">
        {activeView === 'students' && <StudentManagement />}
        {activeView === 'teachers' && <TeacherManagement teachers={allTeachers} onCreateTeacher={handleCreateTeacherInSupabase} />}
        {activeView === 'validators' && <ValidatorManagement validators={allValidators} onCreateValidator={handleCreateValidatorInSupabase} />}
        {activeView === 'approve' && <UserApproval />}
        
        {activeView === 'stellar-setup' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><CreditCard className="text-yellow-600" /> Configuración de Cuentas Stellar (Emisor/Distribuidor)</h3>
            
            {!stellarAccountCreationResult ? (
              <button onClick={handleCreateStellarAccounts} disabled={isCreatingStellarAccounts} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                {isCreatingStellarAccounts ? <><Hourglass className="animate-spin" /> Creando cuentas...</> : <><CreditCard /> Configurar Emisor y Distribuidor</>}
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Issuer */}
                  <div className="space-y-2 text-gray-900">
                    <p className="text-xs font-bold text-green-700 uppercase">Cuenta Emisora (Issuer)</p>
                    <p className="text-[10px] font-mono break-all bg-white p-2 rounded border border-green-100">{stellarAccountCreationResult.issuerPublicKey}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-2 rounded border border-green-100 text-xs font-mono">
                        {showIssuerSecret ? stellarAccountCreationResult.issuerSecretKey : '*******************************************************'}
                      </code>
                      <button onClick={() => setShowIssuerSecret(!showIssuerSecret)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                        {showIssuerSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button onClick={() => handleCopy(stellarAccountCreationResult.issuerSecretKey, 'issuer')} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                        {copiedKey === 'issuer' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  {/* Distributor */}
                  <div className="space-y-2 text-gray-900">
                    <p className="text-xs font-bold text-green-700 uppercase">Cuenta Distribuidora (Distributor)</p>
                    <p className="text-[10px] font-mono break-all bg-white p-2 rounded border border-green-100">{stellarAccountCreationResult.distributorPublicKey}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-2 rounded border border-green-100 text-xs font-mono">
                        {showDistributorSecret ? stellarAccountCreationResult.distributorSecretKey : '*******************************************************'}
                      </code>
                      <button onClick={() => setShowDistributorSecret(!showDistributorSecret)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                        {showDistributorSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button onClick={() => handleCopy(stellarAccountCreationResult.distributorSecretKey, 'distributor')} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                        {copiedKey === 'distributor' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Gestión Tokens */}
                <div className="pt-6 border-t border-green-200 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Emitir más E4C</label>
                    <input type="number" value={mintAmount} onChange={e => setMintAmount(e.target.value)} className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="Cantidad" />
                  </div>
                  <button onClick={handleMintTokens} disabled={isMintingTokens} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-md transition-all">
                    {isMintingTokens ? "Emitiendo..." : "Emitir Tokens"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeView === 'escrow-setup' && currentAdmin?.id && <EscrowManagement adminId={currentAdmin.id} />} {/* Render the new component */}
      </div>

      {/* OVERLAYS */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[110]">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <Hourglass className="w-12 h-12 text-indigo-600 animate-spin" />
            <h3 className="font-bold text-gray-800">Creación en proceso...</h3>
          </div>
        </div>
      )}

      {successModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white text-center relative">
              <button onClick={() => setSuccessModal({...successModal, show: false})} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30 shadow-inner">
                <Check size={40} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">¡{successModal.role} Creado!</h3>
              <p className="font-medium opacity-90">{successModal.name}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clave Pública (Public Key)</p>
                <code className="block bg-white p-2 rounded-xl border border-gray-200 text-xs font-mono break-all leading-relaxed text-gray-800 shadow-sm">
                  {successModal.publicKey}
                </code>
              </div>
              <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clave Secreta (Secret Key)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white p-2 rounded-xl border border-gray-200 text-xs font-mono break-all leading-relaxed text-gray-800 shadow-sm">
                    {showCreatedSecret ? successModal.secretKey : '•••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setShowCreatedSecret(!showCreatedSecret)} className="p-2.5 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 shadow-sm transition-all">
                      {showCreatedSecret ? <EyeOff size={18} className="text-gray-600"/> : <Eye size={18} className="text-gray-600"/>}
                    </button>
                    <button onClick={() => handleCopy(successModal.secretKey, 'created')} className="p-2.5 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 shadow-sm transition-all text-indigo-600">
                      {copiedKey === 'created' ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start text-amber-900 shadow-sm">
                <ShieldCheck size={24} className="shrink-0 text-amber-600" />
                <p className="text-[11px] leading-relaxed font-medium">
                  Guarda esta clave ahora. Por tu seguridad, no se guardará en nuestros servidores y no podrá ser recuperada.
                </p>
              </div>
              <button onClick={() => setSuccessModal({...successModal, show: false})} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                He guardado mi clave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
