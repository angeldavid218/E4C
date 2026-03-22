import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import * as FreighterApi from "@stellar/freighter-api";

const { getPublicKey, isConnected } = (FreighterApi as any).default || FreighterApi;
import { Wallet, CheckCircle, Hourglass, UserCircle, School, GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';
import logo from '../../assets/Logo E4C.png';

export function PublicRegistration() {
  const [role, setRole] = useState<'student' | 'teacher' | 'validator'>('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    escuela: '', // Para alumnos y docentes
    curso: '',
    division: '',
    subjects: '', // Solo para docentes (se convertirá en array)
  });
  
  const [walletConnected, setWalletConnected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detectar rol de la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'teacher' || roleParam === 'validator' || roleParam === 'student') {
      setRole(roleParam as any);
    }
  }, []);

  const handleConnectWallet = async () => {
    setError(null);
    try {
      if (!await isConnected()) throw new Error("Freighter no detectado.");
      const publicKey = await getPublicKey();
      if (!publicKey) throw new Error("No se pudo obtener la clave pública.");
      setWalletConnected(publicKey);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      setError("Conecta tu wallet antes de continuar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Verificar duplicados en la tabla unificada 'profiles'
      const { data: existing } = await supabase.from('profiles').select('id').eq('stellar_public_key', walletConnected).maybeSingle();
      if (existing) throw new Error("Esta wallet ya está registrada en el sistema.");

      // 2. Preparar datos para la tabla 'profiles'
      const insertData: any = {
        name: formData.name,
        email: formData.email,
        stellar_public_key: walletConnected,
        role: role,
        status: 'pending',
      };

      if (role === 'student') {
        insertData.escuela = formData.escuela;
        insertData.curso = formData.curso;
        insertData.division = formData.division;
        insertData.tokens = 0;
        insertData.tasks_completed = 0;
      } else if (role === 'teacher') {
        insertData.escuela = formData.escuela;
        insertData.subjects = formData.subjects.split(',').map(s => s.trim());
      } else {
        insertData.escuela = formData.escuela; // Guardar escuela en campo único
      }

      const { error: insertError } = await supabase.from('profiles').insert([insertData]);
      if (insertError) throw insertError;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-green-100">
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Tus datos de <strong>{role === 'student' ? 'Estudiante' : role === 'teacher' ? 'Docente' : 'Validador'}</strong> han sido registrados. Espera la aprobación del administrador para comenzar.
          </p>
          <button onClick={() => window.location.href = '/'} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all">Volver al Inicio</button>
        </div>
      </div>
    );
  }

  const roleLabels = { student: 'Estudiante', teacher: 'Docente', validator: 'Validador' };
  const RoleIcon = role === 'student' ? GraduationCap : role === 'teacher' ? BookOpen : ShieldCheck;

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <img src={logo} alt="E4C Logo" className="mx-auto h-32 mb-6" />
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Registro de {roleLabels[role]}</h1>
          <p className="text-gray-500 mt-2">Completa tu perfil Web3 para unirte a Edu-Chain</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 bg-gray-900 text-white flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Wallet className="text-indigo-400" size={24} /> Vincula tu Wallet
              </h2>
              <p className="text-gray-400 text-xs mt-1">Stellar Testnet compatible</p>
            </div>
            {walletConnected && <CheckCircle className="text-green-400" size={24} />}
          </div>

          <div className="p-10 space-y-8">
            {!walletConnected ? (
              <button
                onClick={handleConnectWallet}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-4 active:scale-95"
              >
                <Wallet size={24} /> Conectar Freighter
              </button>
            ) : (
              <div className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-6 relative">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Dirección Vinculada</p>
                <code className="text-xs font-mono text-indigo-700 break-all block pr-12">{walletConnected}</code>
                <button onClick={() => setWalletConnected(null)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                  <UserCircle size={20} />
                </button>
              </div>
            )}

            {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold rounded-r-xl">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Juan Pérez" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="juan@edu.ar" />
                </div>

                {role !== 'validator' && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Institución / Escuela</label>
                    <input required type="text" value={formData.escuela} onChange={e => setFormData({ ...formData, escuela: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Nombre de la escuela" />
                  </div>
                )}

                {role === 'student' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Curso</label>
                      <input required type="text" value={formData.curso} onChange={e => setFormData({ ...formData, curso: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="4to" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">División</label>
                      <input required type="text" value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="A" />
                    </div>
                  </div>
                )}

                {role === 'teacher' && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Materias (Separadas por coma)</label>
                    <input required type="text" value={formData.subjects} onChange={e => setFormData({ ...formData, subjects: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Matemática, Física" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 ${
                  role === 'student' ? 'bg-indigo-600 hover:bg-indigo-700' : role === 'teacher' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'
                } text-white`}
              >
                {loading ? <Hourglass className="animate-spin" /> : <RoleIcon size={20} />}
                {loading ? 'Procesando...' : `Registrar ${roleLabels[role]}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
