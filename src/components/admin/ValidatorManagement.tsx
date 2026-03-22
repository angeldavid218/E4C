import React, { useState, useMemo } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import type { Validator } from '../../types';
import Select from 'react-select';

// Reutilizamos la lógica de escuelas (en un futuro esto debería venir de una tabla 'schools')
const schoolOptions = [
  { value: "Colegio Nacional de Buenos Aires (UBA)", label: "Colegio Nacional de Buenos Aires (UBA)" },
  { value: "Escuela Superior de Comercio Carlos Pellegrini (UBA)", label: "Escuela Superior de Comercio Carlos Pellegrini (UBA)" },
  { value: "Instituto Libre de Segunda Enseñanza (ILSE)", label: "Instituto Libre de Segunda Enseñanza (ILSE)" },
  { value: "Colegio N° 1 \"Bernardino Rivadavia\"", label: "Colegio N° 1 \"Bernardino Rivadavia\"" },
  { value: "Colegio N° 2 \"Domingo Faustino Sarmiento\"", label: "Colegio N° 2 \"Domingo Faustino Sarmiento\"" },
  { value: "Colegio N° 3 \"Mariano Moreno\"", label: "Colegio N° 3 \"Mariano Moreno\"" },
  { value: "Colegio N° 4 \"Nicolás Avellaneda\"", label: "Colegio N° 4 \"Nicolás Avellaneda\"" },
  { value: "Colegio N° 5 \"Bartolomé Mitre\"", label: "Colegio N° 5 \"Bartolomé Mitre\"" },
  { value: "Colegio N° 6 \"Manuel Belgrano\"", label: "Colegio N° 6 \"Manuel Belgrano\"" },
  { value: "Colegio N° 7 \"Juan Martín de Pueyrredón\"", label: "Colegio N° 7 \"Juan Martín de Pueyrredón\"" },
].sort((a, b) => a.label.localeCompare(b.label));

interface ValidatorManagementProps {
  validators: Validator[];
  onCreateValidator: (validator: { name: string; email: string; escuelas: string[] }) => Promise<void>;
}

export function ValidatorManagement({ validators, onCreateValidator }: ValidatorManagementProps) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [selectedSchools, setSelectedSchools] = useState<any[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);

  const sortedValidators = useMemo(() => {
    return [...validators].sort((a, b) => a.name.localeCompare(b.name));
  }, [validators]);

  const handleCreate = async () => {
    if (newName && newEmail && selectedSchools.length > 0) {
      try {
        await onCreateValidator({ 
          name: newName, 
          email: newEmail, 
          escuelas: selectedSchools.map(s => s.value) 
        });
        setNewName('');
        setNewEmail('');
        setSelectedSchools([]);
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    } else {
      alert('Completa todos los campos, incluyendo al menos una escuela');
    }
  };

  return (
    <div className="flex space-x-6">
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <h3 className="text-green-900 font-bold">Alta de Validador por Institución</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre del validador"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
              <input
                type="email"
                placeholder="Email del validador"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Select
                  isMulti
                  options={schoolOptions}
                  value={selectedSchools}
                  onChange={(val: any) => setSelectedSchools(val)}
                  placeholder="Asignar Escuelas..."
                  className="text-sm"
                />
              </div>
              <button
                onClick={handleCreate}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold"
              >
                Dar de Alta
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedValidator && (
        <div className="w-80 bg-white rounded-xl border border-gray-200 p-6 h-fit sticky top-6">
          <h3 className="text-green-900 font-bold mb-4 flex items-center gap-2">
            <ShieldCheck size={18}/> Perfil Validador
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500 font-bold uppercase text-[10px]">Nombre</p>
              <p className="text-gray-900 font-medium">{selectedValidator.name}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase text-[10px]">Escuelas a Cargo</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedValidator.escuelas?.map((esc, i) => (
                  <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] border border-green-100">
                    {esc}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase text-[10px]">Stellar Public Key</p>
              <p className="font-mono text-[10px] break-all bg-gray-50 p-2 rounded">{selectedValidator.stellar_public_key}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedValidator(null)}
            className="w-full mt-6 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-xs font-bold"
          >
            Cerrar Detalles
          </button>
        </div>
      )}
    </div>
  );
}
