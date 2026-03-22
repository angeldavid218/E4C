import React, { useState } from 'react';
import { useAuth } from '../../authContext';
import logo from '../../assets/Logo E4C.png';
import { Wallet, ShieldCheck, ArrowLeft } from 'lucide-react';

export function LoginSignupForm() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signInWithFreighter } = useAuth();

  const handleFreighterLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithFreighter();
    } catch (err: any) {
      setError(err.message || "Error al conectar con Freighter.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError("Credenciales de administrador inválidas.");
    } finally {
      setLoading(false);
    }
  };

  if (showAdminLogin) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 px-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
          <button 
            onClick={() => setShowAdminLogin(false)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-8 transition-colors"
          >
            <ArrowLeft size={18} /> Volver al portal Web3
          </button>
          
          <div className="text-center mb-8">
            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="text-indigo-600" size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase">Acceso E4C Admin</h2>
            <p className="text-sm text-gray-500 mt-1">Solo personal administrativo autorizado.</p>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Email Institucional</label>
              <input 
                required 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                placeholder="admin@e4c.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Contraseña</label>
              <input 
                required 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button
              disabled={loading}
              className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Entrar al Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl w-full max-w-md border border-gray-200 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />
        
        <div className="text-center mb-10 relative z-10">
          <img src={logo} alt="E4C Logo" className="mx-auto h-40 object-contain drop-shadow-sm mb-4" />
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Bienvenido a E4C
          </h2>
          <p className="text-gray-500 text-sm mt-2 font-medium italic">Education for Culture</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl animate-shake">
            <p className="text-red-700 text-xs font-bold">{error}</p>
          </div>
        )}
        
        <div className="space-y-4 relative z-10">
          <button
            type="button"
            onClick={handleFreighterLogin}
            disabled={loading}
            className="w-full flex justify-center items-center py-5 px-6 border border-transparent rounded-[1.5rem] shadow-2xl text-lg font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Wallet className="mr-3 h-6 w-6" />
                Conectar Wallet
              </>
            )}
          </button>
          
          <div className="text-center pt-6">
            <p className="text-[10px] text-gray-400 mb-4 px-8 leading-relaxed">
              El acceso a esta plataforma es por invitación institucional. Asegúrate de haber escaneado tu código QR oficial.
            </p>
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
            >
              Acceso Administrador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
