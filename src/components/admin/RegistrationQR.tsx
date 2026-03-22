import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Share2, Info, GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';
import logo from '../../assets/Logo E4C.png';

type InviteRole = 'student' | 'teacher' | 'validator';

export function RegistrationQR() {
  const [role, setRole] = useState<InviteRole>('student');

  // Generar la URL de registro dinámica con el parámetro de rol
  const registrationUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?role=${role}`;
  }, [role]);

  const downloadQR = () => {
    const svg = document.getElementById('registration-qr');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx?.drawImage(img, 0, 0, 1000, 1000);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `E4C-${role}-Registration-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const roleConfigs = {
    student: { label: 'Estudiante', color: 'indigo', icon: GraduationCap, bg: 'bg-indigo-50', text: 'text-indigo-600' },
    teacher: { label: 'Docente', color: 'purple', icon: BookOpen, bg: 'bg-purple-50', text: 'text-purple-600' },
    validator: { label: 'Validador', color: 'emerald', icon: ShieldCheck, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="text-indigo-600" /> Generador de Invitaciones Web3
          </h3>
          <p className="text-gray-500 mt-1">Selecciona el rol para generar el código de acceso correspondiente.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadQR}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download size={16} /> Descargar
          </button>
          <button 
            onClick={() => navigator.clipboard.writeText(registrationUrl)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium text-white hover:bg-indigo-700 transition-all shadow-md"
          >
            <Share2 size={16} /> Copiar Link
          </button>
        </div>
      </div>

      {/* Selector de Rol */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-md">
        {(Object.keys(roleConfigs) as InviteRole[]).map((r) => {
          const Config = roleConfigs[r];
          return (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                role === r 
                  ? `bg-white ${Config.text} shadow-sm ring-1 ring-black/5` 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Config.icon size={16} />
              {Config.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Visualización del QR */}
        <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] p-12 transition-colors duration-500 ${roleConfigs[role].bg} border-gray-200`}>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-white relative group">
            <QRCodeSVG
              id="registration-qr"
              value={registrationUrl}
              size={280}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: logo,
                x: undefined,
                y: undefined,
                height: 55,
                width: 55,
                excavate: true,
              }}
            />
          </div>
          <div className="mt-8 text-center space-y-2">
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${roleConfigs[role].text}`}>Link de Registro {roleConfigs[role].label}</p>
            <code className="text-[10px] bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full font-mono border border-white/50 block">
              {registrationUrl}
            </code>
          </div>
        </div>

        {/* Instrucciones Dinámicas */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4">
              <Info className="text-indigo-500" size={20} /> Proceso de Alta
            </h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${roleConfigs[role].bg} ${roleConfigs[role].text}`}>1</div>
                <div>
                  <p className="font-bold text-gray-800">Escaneo</p>
                  <p className="text-sm text-gray-500">El usuario escanea el QR y accede al portal de registro oficial.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${roleConfigs[role].bg} ${roleConfigs[role].text}`}>2</div>
                <div>
                  <p className="font-bold text-gray-800">Vinculación Web3</p>
                  <p className="text-sm text-gray-500">Se completa el perfil y se asocia la wallet de Stellar (sin claves privadas en el servidor).</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${roleConfigs[role].bg} ${roleConfigs[role].text}`}>3</div>
                <div>
                  <p className="font-bold text-gray-800">Validación</p>
                  <p className="text-sm text-gray-500">Deberás aprobar la solicitud en la pestaña <strong>"Aprobar"</strong> para activar los permisos.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-3xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="font-bold mb-2 flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-400" /> Seguridad de Grado Stellar</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Este método garantiza que cada {roleConfigs[role].label.toLowerCase()} sea el único dueño de sus credenciales. Edu-Chain nunca tendrá acceso a los fondos ni a las llaves de los usuarios.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <QrCode size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
