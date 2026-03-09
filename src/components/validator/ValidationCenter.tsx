import { useState } from 'react';
import { ValidationInterface } from './ValidationInterface';
import { Clock, CheckCircle, XCircle, Filter, FileCheck } from 'lucide-react';
import type { NFTRequest } from '../../types';

interface ValidationCenterProps {
  requests: NFTRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason: string) => void;
}

export function ValidationCenter({ requests, onApprove, onReject }: ValidationCenterProps) {
  // --- Estados Locales del Componente ---
  // `selectedRequest`: Almacena la solicitud de NFT que el validador está revisando en el modal.
  const [selectedRequest, setSelectedRequest] = useState<NFTRequest | null>(null);
  // `filter`: Controla qué solicitudes se muestran en la lista (todas, pendientes, validadas, rechazadas).
  const [filter, setFilter] = useState<'all' | 'pending' | 'validated' | 'rejected'>('all');

  // --- Lógica de Filtrado de Solicitudes ---
  // Filtra la lista de solicitudes `requests` basándose en el valor del estado `filter`.
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return req.status !== 'pending-admin'; // Muestra todas excepto las que aún no llegan al validador
    if (filter === 'pending') return req.status === 'pending-validator';
    if (filter === 'validated') return req.status === 'approved';
    if (filter === 'rejected') return req.status === 'rejected';
    return true;
  }).sort((a, b) => {
    const studentNameA = a.studentName || '';
    const studentNameB = b.studentName || '';
    const achievementNameA = a.achievementName || '';
    const achievementNameB = b.achievementName || '';

    const studentNameCompare = studentNameA.localeCompare(studentNameB);
    if (studentNameCompare !== 0) {
      return studentNameCompare;
    }
    return achievementNameA.localeCompare(achievementNameB);
  });

  // --- Función Auxiliar para la Insignia de Estado ---
  // Devuelve un componente `<span>` con un icono y estilo específico según el estado de la solicitud.
  const getStatusBadge = (status: NFTRequest['status']) => {
    switch (status) {
      case 'pending-validator':
        return (
          <span className="px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-700 border border-orange-200">
            <Clock className="inline w-3 h-3 mr-1" />
            Pendiente Validación
          </span>
        );

      case 'approved':
        return (
          <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
            <CheckCircle className="inline w-3 h-3 mr-1" />
            Validado y Registrado
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700 border border-red-200">
            <XCircle className="inline w-3 h-3 mr-1" />
            Rechazado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-green-600" />
              <h3 className="text-green-900">Cola de Validación</h3>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'validated' | 'rejected')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="validated">Validadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {filter === 'pending' 
                  ? 'No hay solicitudes pendientes de validación'
                  : 'No hay solicitudes con este filtro'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* --- Renderizado Condicional de Solicitudes Individuales --- */}
              {/* Itera sobre las solicitudes filtradas, mostrando detalles y acciones. */}
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-gray-900">{request.achievementName}</h4>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-gray-700 mb-3">{request.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>Estudiante: <span className="text-gray-900">{request.studentName}</span></span>
                        <span>•</span>
                        <span>Docente: <span className="text-gray-900">{request.teacherName}</span></span>
                        <span>•</span>
                        <span>{new Date(request.requestDate).toLocaleDateString('es-ES')}</span>
                      </div>

                      {/* Firmas Previas Completadas (Docente y Admin) */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <p className="text-xs text-gray-600 mb-2">Firmas Completadas:</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">Docente: {request.teacherSignature?.name}</span>
                          </div>
                          {request.adminSignature && (
                            <>
                              <span className="text-gray-400">•</span>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-gray-700">Admin: {request.adminSignature.name}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>



                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs text-red-600 mb-1">Razón del rechazo:</p>
                          <p className="text-sm text-red-900">{request.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Botón 'Validar' que aparece solo si la solicitud está pendiente del validador. */}
                    {request.status === 'pending-validator' && (
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        Validar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Modal de Validación de Solicitud --- */}
      {/* Se renderiza condicionalmente cuando se ha seleccionado una solicitud para validar.
          Pasa funciones para aprobar, rechazar o cerrar el modal, las cuales actualizan el estado. */}
      {selectedRequest && (
        <ValidationInterface
          request={selectedRequest}
          onApprove={() => {
            onApprove(selectedRequest.id);
            setSelectedRequest(null);
          }}
          onReject={(reason) => {
            onReject(selectedRequest.id, reason);
            setSelectedRequest(null);
          }}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </>
  );
}