import { useState } from 'react';
import { Award, Calendar, X } from 'lucide-react';
import type { NFTRequest } from '../../types';

interface MyNFTsProps {
  nfts: NFTRequest[];
}

export function MyNFTs({ nfts }: MyNFTsProps) {
  // Estado para controlar qué NFT se muestra en el modal de detalles.
  const [selectedNFT, setSelectedNFT] = useState<NFTRequest | null>(null);

  // Función auxiliar que devuelve un emoji basado en el nombre del logro del NFT.
  const getNFTEmoji = (name: string) => {
    if (name.includes('Excelencia')) return '🏆';
    if (name.includes('Proyecto') || name.includes('Innovador')) return '🚀';
    if (name.includes('Liderazgo')) return '⭐';
    if (name.includes('Participación')) return '💡';
    if (name.includes('Mejora')) return '📈';
    if (name.includes('Asistencia')) return '✅';
    return '🎖️';
  };

  return (
    <>
      <div className="space-y-6">
        {/* --- Renderizado Condicional: Estado Vacío o Lista de NFTs --- */}
        {/* Si el estudiante no tiene NFTs, se muestra un mensaje; de lo contrario, se renderiza la lista. */}
        {nfts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">Aún no tienes NFTs</h3>
            <p className="text-gray-600">
              Sigue trabajando duro y pronto obtendrás tus primeros logros certificados
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gray-900">Mis NFTs de Mérito</h3>
                  <p className="text-sm text-gray-600 mt-1">

                  </p>
                </div>
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full">
                  {nfts.length} Logro{nfts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* --- Listado de NFTs del Estudiante --- */}
            {/* Mapea sobre el array de NFTs para mostrar cada uno como una tarjeta clickable.
                Al hacer clic, se selecciona el NFT para mostrar sus detalles en un modal. */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...nfts].sort((a, b) => a.achievementName.localeCompare(b.achievementName)).map(nft => (
                <button
                  key={nft.id}
                  onClick={() => setSelectedNFT(nft)}
                  className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-purple-400 hover:shadow-xl transition-all text-left"
                >
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 flex items-center justify-center border-b border-gray-200">
                    <div className="text-7xl">{getNFTEmoji(nft.achievementName)}</div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-gray-900 mb-2">{nft.achievementName}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {nft.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(nft.requestDate).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* --- Modal de Detalles del NFT --- */}
      {/* Se renderiza condicionalmente cuando un NFT es seleccionado, mostrando información detallada
          y las firmas de certificación. */}
      {selectedNFT && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 text-white relative">
              <button
                onClick={() => setSelectedNFT(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-8xl mb-4 text-center">{getNFTEmoji(selectedNFT.achievementName)}</div>
              <h2 className="text-center">{selectedNFT.achievementName}</h2>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <h4 className="text-gray-900 mb-2">Descripción</h4>
                <p className="text-gray-700">{selectedNFT.description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-gray-900 mb-2">Evidencia</h4>
                <p className="text-gray-700 text-sm">{selectedNFT.evidence}</p>
              </div>

              <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-indigo-600" />
                  <h4 className="text-indigo-900">Certificación Multi-Firma</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">Docente Certificador</p>
                      <p className="text-sm text-gray-600">{selectedNFT.teacherSignature?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">Administrador</p>
                      <p className="text-sm text-gray-600">{selectedNFT.adminSignature?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">Validador Técnico</p>
                      <p className="text-sm text-gray-600">{selectedNFT.validatorSignature?.name}</p>
                    </div>
                  </div>
                </div>
              </div>



            </div>
          </div>
        </div>
      )}
    </>
  );
}