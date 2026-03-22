import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { type Student } from '../../types';

interface LeaderboardTokensProps {
  students: Student[];
}

export function LeaderboardTokens({ students }: LeaderboardTokensProps) {
  if (!students || students.length === 0) {
    return <div className="text-center py-8">No hay estudiantes para mostrar.</div>;
  }

  // Ordena a los estudiantes en orden descendente según su cantidad de tokens.
  const sortedStudents = [...students].sort((a, b) => {
    if (a.tokens === b.tokens) {
      // Secondary sort by alias if token counts are equal
      return (a.alias || '').localeCompare(b.alias || '');
    }
    return (b.tokens || 0) - (a.tokens || 0);
  });

  // --- Funciones Auxiliares de UI ---
  // Devuelve un icono de medalla o número según la posición en el ranking.
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-600">{position + 1}</div>;
    }
  };

  // Devuelve clases de CSS para el fondo de la tarjeta según la posición.
  const getMedalBg = (position: number) => {
    switch (position) {
      case 0:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300';
      case 1:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300';
      case 2:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Renderizado del Podio para el Top 3 */}
      {/* Muestra a los 3 mejores estudiantes con un diseño especial de podio (2-1-3)
          y estilos visuales que resaltan su posición. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedStudents.slice(0, 3).map((student, index) => (
          <div
            key={student.id}
            className={`rounded-xl border-2 overflow-hidden ${getMedalBg(index)} ${
              index === 0 ? 'md:order-2 transform md:scale-105' : index === 1 ? 'md:order-1' : 'md:order-3'
            }`}
          >
            <div className={`p-6 text-center ${
              index === 0 
                ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
                : index === 1
                ? 'bg-gradient-to-br from-gray-300 to-slate-400'
                : 'bg-gradient-to-br from-amber-600 to-orange-700'
            }`}>
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-white rounded-full">
                {getMedalIcon(index)}
              </div>
              <p className="text-white">#{index + 1}</p>
            </div>
            <div className="p-6">
              <p className="text-gray-900 mb-1">{student.alias || 'Estudiante E4C'}</p>
              <p className="text-gray-600 text-sm mb-3">{student.grade}</p>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-gray-600 text-sm">Tokens</p>
                <p className="text-indigo-600">{student.tokens}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Renderizado del resto de la clasificación */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-700" />
            <h3 className="text-yellow-900">Clasificación Completa</h3>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {sortedStudents.slice(3).map((student, index) => {
            const position = index + 3;
            return (
              <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-700">{position + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{student.alias || 'Estudiante E4C'}</p>
                      <p className="text-sm text-gray-600">{student.grade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-600">{student.tokens}</p>
                    <p className="text-xs text-gray-500">tokens</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}