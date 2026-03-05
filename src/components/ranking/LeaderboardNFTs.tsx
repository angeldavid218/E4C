import { Award, Trophy, Medal } from 'lucide-react';
import type { NFTRequest, Student } from '../../types';

interface LeaderboardNFTsProps {
  nftRequests: NFTRequest[];
  students?: Student[]; // New prop
}

interface StudentNFTCount {
  studentId: string;
  studentName: string;
  studentAlias: string; // New field to hold the alias
  nftCount: number;
  nfts: NFTRequest[];
}

export function LeaderboardNFTs({ nftRequests }: LeaderboardNFTsProps) {
  // --- Agregación y Cómputo del Ranking ---
  // 1. Se agrupan los NFTs aprobados por estudiante usando un Map para eficiencia.
  const studentNFTMap = new Map<string, StudentNFTCount>();

  nftRequests.filter(req => req.status === 'approved').forEach(nft => {
    const existing = studentNFTMap.get(nft.studentId);
    // const studentData = students.find(s => s.id === nft.studentId); // Find the corresponding student
    // const displayAlias = studentData?.alias || 'Estudiante E4C'; // Use alias if exists, else fall back to generic alias

    if (existing) {
      existing.nftCount++;
      existing.nfts.push(nft);
    } else {
      studentNFTMap.set(nft.studentId, {
        studentId: nft.studentId,
        studentName: nft.studentName, // Keep original name if needed elsewhere
        studentAlias: "Estudiante E4C", // Store the chosen display name
        nftCount: 1,
        nfts: [nft],
      });
    }
  });

  // 2. Se convierte el Map a un array y se ordena para crear el ranking.
  const sortedStudents = Array.from(studentNFTMap.values()).sort((a, b) => b.nftCount - a.nftCount);

  // --- Funciones Auxiliares de UI ---
  // Estas funciones ayudan a mantener el JSX limpio y legible.

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

  // Asigna un emoji a un NFT basado en palabras clave en su nombre.
  const getNFTEmoji = (name: string) => {
    if (name.includes('Excelencia')) return '🏆';
    if (name.includes('Proyecto') || name.includes('Innovador')) return '🚀';
    if (name.includes('Liderazgo')) return '⭐';
    if (name.includes('Participación')) return '💡';
    if (name.includes('Mejora')) return '📈';
    if (name.includes('Asistencia')) return '✅';
    return '🎖️';
  };

  if (sortedStudents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-gray-900 mb-2">No hay NFTs emitidos aún</h3>
        <p className="text-gray-600">
          Los estudiantes aparecerán aquí cuando obtengan sus primeros NFTs de mérito
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Renderizado del Podio para el Top 3 */}
      {/* Si hay al menos 3 estudiantes, se muestra una sección especial para ellos
          con un diseño de podio (2-1-3) y estilos destacados. */}
      {sortedStudents.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedStudents.slice(0, 3).map((student, index) => (
            <div
              key={student.studentId}
              className={`rounded-xl border-2 overflow-hidden ${getMedalBg(index)} ${index === 0 ? 'md:order-2 transform md:scale-105' : index === 1 ? 'md:order-1' : 'md:order-3'
                }`}
            >
              <div className={`p-6 text-center ${index === 0
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
                <p className="text-gray-900 mb-3">{student.studentAlias}</p>
                <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                  <p className="text-gray-600 text-sm">NFTs Obtenidos</p>
                  <p className="text-purple-600">{student.nftCount}</p>
                </div>
                <div className="flex gap-1 justify-center">
                  {student.nfts.slice(0, 3).map(nft => (
                    <div key={nft.id} className="text-2xl" title={nft.achievementName}>
                      {getNFTEmoji(nft.achievementName)}
                    </div>
                  ))}
                  {student.nftCount > 3 && (
                    <div className="text-sm text-gray-600 self-center ml-1">+{student.nftCount - 3}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Renderizado del resto del ranking (posiciones 4 en adelante) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-700" />
            <h3 className="text-purple-900">Ranking por Logros NFT</h3>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {sortedStudents.slice(3).map((student, index) => {
            const position = index + 3;
            return (
              <div key={student.studentId} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-700">{position + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">{student.studentAlias}</p>
                      <div className="flex gap-1">
                        {student.nfts.slice(0, 5).map(nft => (
                          <div key={nft.id} className="text-lg" title={nft.achievementName}>
                            {getNFTEmoji(nft.achievementName)}
                          </div>
                        ))}
                        {student.nftCount > 5 && (
                          <div className="text-xs text-gray-600 self-center ml-1">+{student.nftCount - 5}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-600">{student.nftCount}</p>
                    <p className="text-xs text-gray-500">NFTs</p>
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