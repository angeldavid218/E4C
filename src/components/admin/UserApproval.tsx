import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UserCheck, XCircle, Hourglass, CheckCircle, Wallet, GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';

interface Request {
  id: string;
  name: string;
  email: string;
  stellar_public_key: string;
  role: 'student' | 'teacher' | 'validator';
  details: string;
}

const UserApproval: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const allRequests: Request[] = [];

    // 1. Alumnos
    const { data: students } = await supabase.from('students').select('*').eq('status', 'pending');
    students?.forEach(s => allRequests.push({
      id: s.id, name: s.name, email: s.email, stellar_public_key: s.stellar_public_key,
      role: 'student', details: `${s.escuela} - ${s.curso}° "${s.division}"`
    }));

    // 2. Docentes
    const { data: teachers } = await supabase.from('teachers').select('*').eq('status', 'pending');
    teachers?.forEach(t => allRequests.push({
      id: t.id, name: t.name, email: t.email, stellar_public_key: t.stellar_public_key,
      role: 'teacher', details: `${t.escuela} | ${t.subjects?.join(', ')}`
    }));

    // 3. Validadores
    const { data: validators } = await supabase.from('validators').select('*').eq('status', 'pending');
    validators?.forEach(v => allRequests.push({
      id: v.id, name: v.name, email: v.email, stellar_public_key: v.stellar_public_key,
      role: 'validator', details: `Sedes: ${v.escuelas?.join(', ')}`
    }));

    setRequests(allRequests.sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (req: Request) => {
    setProcessingId(req.id);
    try {
      if (req.role === 'student') {
        // Ejecutar lógica de Stellar para alumnos
        const { error } = await supabase.functions.invoke('create-stellar-student-wallet', {
          body: { student_id: req.id },
        });
        if (error) throw error;
      } else {
        // Para docentes y validadores solo cambiamos el estado (ellos ya tienen su wallet conectada)
        const table = req.role === 'teacher' ? 'teachers' : 'validators';
        const { error } = await supabase.from(table).update({ status: 'approved' }).eq('id', req.id);
        if (error) throw error;
      }

      alert(`¡${req.name} aprobado exitosamente como ${req.role}!`);
      fetchRequests();
    } catch (err: any) {
      alert(`Error al aprobar: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: Request) => {
    if (!confirm(`¿Rechazar solicitud de ${req.name}?`)) return;
    setProcessingId(req.id);
    try {
      const table = req.role === 'student' ? 'students' : req.role === 'teacher' ? 'teachers' : 'validators';
      const { error } = await supabase.from(table).update({ status: 'rejected' }).eq('id', req.id);
      if (error) throw error;
      fetchRequests();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-12 text-center"><Hourglass className="animate-spin mx-auto text-indigo-600 mb-4" /> Cargando solicitudes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck className="text-indigo-600" /> Centro de Aprobación Web3
        </h2>
        <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase">{requests.length} Pendientes</span>
      </div>

      {requests.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-16 text-center">
          <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-bold">No hay solicitudes de registro pendientes.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => {
            const Icon = req.role === 'student' ? GraduationCap : req.role === 'teacher' ? BookOpen : ShieldCheck;
            const colorClass = req.role === 'student' ? 'text-indigo-600 bg-indigo-50' : req.role === 'teacher' ? 'text-purple-600 bg-purple-50' : 'text-emerald-600 bg-emerald-50';
            
            return (
              <div key={req.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-2xl ${colorClass} transition-colors`}>
                      <Icon size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-lg">{req.name}</h4>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${colorClass}`}>{req.role}</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{req.email}</p>
                      <p className="text-xs text-gray-400 mt-1 italic">{req.details}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 flex-1 lg:max-w-xs border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">Wallet vinculada</p>
                    <code className="text-[10px] font-mono text-gray-600 break-all block">{req.stellar_public_key}</code>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleReject(req)} disabled={processingId !== null} className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors disabled:opacity-50"><XCircle size={24} /></button>
                    <button onClick={() => handleApprove(req)} disabled={processingId !== null} className="flex-1 lg:flex-none px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                      {processingId === req.id ? <Hourglass className="animate-spin" size={20} /> : <UserCheck size={20} />}
                      {processingId === req.id ? 'Activando...' : 'Aprobar Acceso'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserApproval;
