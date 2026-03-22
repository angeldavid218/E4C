import { useState } from 'react';
import { Upload, Award, CheckCircle, FileText } from 'lucide-react';
import { type AchievementTemplate } from '../../types';
import { useAuth } from '../../authContext';

import type { NFTRequest } from '../../types';

interface NFTRequestFormProps {
  onSubmit: (request: Omit<NFTRequest, 'id' | 'requestDate' | 'status' | 'teacherSignature' | 'teacherId' | 'teacherName'>) => void;
  teacherId: string | undefined;
}

export function NFTRequestForm({ onSubmit }: NFTRequestFormProps) {
  const { allStudents } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [achievementName, setAchievementName] = useState('');
  const [customAchievement, setCustomAchievement] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const mockAchievementTemplates: AchievementTemplate[] = [
    { name: 'Excelencia Académica', emoji: '🏆', description: 'Reconocimiento por desempeño sobresaliente en estudios.' },
    { name: 'Líder Estudiantil', emoji: '🌟', description: 'Por liderazgo y contribución significativa a la comunidad.' },
    { name: 'Innovador Creativo', emoji: '💡', description: 'Premio a la originalidad y creatividad en proyectos.' },
  ];

  const currentStudents = allStudents;
  const currentAchievementTemplates = mockAchievementTemplates;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const student = currentStudents.find(s => s.id === selectedStudent);
    if (!student) return;

    const finalAchievementName = achievementName === 'custom' ? customAchievement : achievementName;

    onSubmit({
      studentId: selectedStudent,
      studentName: student.name,
      achievementName: finalAchievementName,
      description,
      evidence,
    });

    setSelectedStudent('');
    setAchievementName('');
    setCustomAchievement('');
    setDescription('');
    setEvidence('');
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const isFormValid = selectedStudent && 
    (achievementName && (achievementName !== 'custom' || customAchievement)) && 
    description && 
    evidence;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-purple-900 font-bold">Solicitud de NFT de Mérito</h3>
              <p className="text-sm text-purple-700 opacity-80 mt-1">
                Completa el formulario para iniciar el proceso de certificación
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selección de Estudiante */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Estudiante <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            >
              <option value="">-- Seleccionar Estudiante --</option>
              {currentStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} {student.alias ? `(${student.alias})` : ''} - {student.curso}° "{student.division}"
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Tipo de Logro <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentAchievementTemplates.map(template => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => {
                    setAchievementName(template.name);
                    setDescription(template.description);
                  }}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    achievementName === template.name
                      ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
                      : 'border-gray-100 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setAchievementName('custom');
                  setDescription('');
                }}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  achievementName === 'custom'
                    ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
                    : 'border-gray-100 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✏️</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">Logro Personalizado</p>
                    <p className="text-xs text-gray-500 mt-1">Define tu propio logro</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {achievementName === 'custom' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nombre del Logro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customAchievement}
                onChange={(e) => setCustomAchievement(e.target.value)}
                placeholder="Ej: Investigador Destacado"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Descripción del Logro <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe detalladamente el logro del estudiante..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Evidencia del Logro <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Ej: Reporte académico Q4 2024, Certificado de proyecto, etc."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-full text-xs font-bold">
                1/2
              </div>
              <div>
                <p className="text-indigo-900 font-bold text-sm mb-1">Firma del Docente (Automática)</p>
                <p className="text-xs text-indigo-700 opacity-80">
                  Al enviar esta solicitud, se registrará tu firma como docente certificador.
                  La solicitud quedará pendiente de aprobación por parte del Administrador.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              isFormValid
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>Enviar Solicitud de NFT</span>
          </button>
        </form>
      </div>

      {showSuccess && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top flex items-start gap-3 border border-white/20">
          <CheckCircle className="w-6 h-6 mt-1" />
          <div>
            <p className="font-bold">¡Solicitud Enviada!</p>
            <p className="text-sm opacity-90">Firma 1 de 2 completada</p>
            <p className="text-sm opacity-90 mt-1">
              Pendiente de aprobación por el Administrador
            </p>
          </div>
        </div>
      )}
    </div>
  );
}