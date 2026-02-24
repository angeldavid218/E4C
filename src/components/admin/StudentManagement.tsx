import * as StellarSdk from '@stellar/stellar-sdk'; // Importar SDK de Stellar
import { useState, useEffect } from 'react';
import { UserPlus, Search, CheckCircle, Eye, EyeOff, ShieldCheck, Copy, Check, Hourglass } from 'lucide-react';
import type { Student } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { createStudent } from '../../lib/student';

import { useAuth } from '../../authContext';

export function StudentManagement({ onSelectStudent, students: propsStudents }: { onSelectStudent?: (studentId: string) => void, students?: Student[] }) {
  const { allStudents: authStudents } = useAuth();
  const [students, setStudents] = useState<Student[]>(propsStudents || authStudents || []);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCurso, setNewStudentCurso] = useState('');
  const [newStudentDivision, setNewStudentDivision] = useState('');
  const [newStudentEscuela, setNewStudentEscuela] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null); // Nuevo estado para el estudiante seleccionado

  // Estados para el Modal de Éxito
  const [successModal, setSuccessModal] = useState<{ show: boolean; name: string; secretKey: string; publicKey: string }>({
    show: false,
    name: '',
    secretKey: '',
    publicKey: ''
  });
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (propsStudents) {
      setStudents(propsStudents);
    } else if (authStudents && authStudents.length > 0) {
      setStudents(authStudents);
    } else {
      fetchStudents();
    }
  }, [propsStudents, authStudents]);

  const fetchStudents = async () => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data as Student[]);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.curso && student.curso.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (student.division && student.division.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (student.escuela && student.escuela.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // **Operación Stellar: Creación y Fondeo de Wallet de Estudiante**
  // Esta función maneja la creación de una nueva cuenta Stellar para un estudiante,
  // la fondea usando Friendbot (solo para Testnet) y guarda la clave pública
  // en la base de datos de Supabase.
  const handleCreateStudent = async () => {
    if (newStudentName && newStudentEmail && newStudentCurso && newStudentDivision && newStudentEscuela) {
      setIsCreating(true);
      try {
        // 1. Generar un par de claves Stellar para el nuevo estudiante (wallet)
        // StellarSdk.Keypair.random() crea un nuevo par de claves criptográficas.
        const pair = StellarSdk.Keypair.random();
        const publicKey = pair.publicKey();
        const secretKey = pair.secret(); // IMPORTANTE: La clave secreta debe ser manejada con seguridad.

        // 2. Fondeo de la cuenta (usando Friendbot para Testnet)
        // Friendbot es un servicio de Stellar Testnet que distribuye XLM a cuentas nuevas.
        // Esto es necesario para que la cuenta sea activa y pueda realizar transacciones.
        // En una red Stellar real (Mainnet), el fondeo inicial requeriría XLM de una cuenta existente.
        const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
        if (!response.ok) throw new Error('Error en Friendbot: No se pudo fondear la cuenta Stellar del estudiante.');

        // 3. Crear el registro del estudiante en la base de datos de Supabase
        // Se almacena la clave pública Stellar del estudiante junto con sus otros datos,
        // vinculando así el perfil del estudiante a su wallet Stellar.
        const newStudentData = {
          name: newStudentName,
          email: newStudentEmail,
          curso: newStudentCurso,
          division: newStudentDivision,
          escuela: newStudentEscuela,
          stellar_public_key: publicKey // Asegúrate que este nombre coincida con tu tabla en Supabase
        };

        const createdStudent = await createStudent(newStudentData);

        // 3.5 Guardar en stellar_wallets
        const { error: walletError } = await supabase
          .from('stellar_wallets')
          .insert([{
            student_id: (createdStudent as Student).id,
            public_key: publicKey,
            secret_key: secretKey,
            role: 'student',
            admin_id: null // Enviamos null explícito
          }]);

        if (walletError) {
          console.error("Error guardando wallet de alumno:", walletError);
          // No bloqueamos el proceso pero avisamos
          alert(`Estudiante creado pero error al guardar llaves en DB: ${walletError.message}`);
        }

        // 4. Mostrar Modal de Éxito
        setSuccessModal({
          show: true,
          name: createdStudent.name,
          secretKey: secretKey,
          publicKey: publicKey
        });
        setShowSecret(false);
        
        setStudents(prev => [...prev, createdStudent as Student]);
        setNewStudentName('');
        setNewStudentEmail('');
        setNewStudentCurso('');
        setNewStudentDivision('');
        setNewStudentEscuela('');
        // Limpiar campos...
      } catch (err: unknown) {
        console.error("Fallo total al crear estudiante y wallet Stellar:", err);
        alert(`Error al crear estudiante: ${err.message}`);
      } finally {
        setIsCreating(false);
      }
    } else {
      alert('Por favor, completa todos los campos.'); // Proporcionar retroalimentación para el formulario incompleto
    }
  };

  return (
    <div className="flex space-x-6">
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="text-indigo-900">Agregar Nuevo Estudiante</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre del estudiante"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email del estudiante"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={newStudentCurso}
                onChange={(e) => setNewStudentCurso(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecciona Curso</option>
                <option value="primero">Primero</option>
                <option value="segundo">Segundo</option>
                <option value="tercero">Tercero</option>
                <option value="cuarto">Cuarto</option>
                <option value="quinto">Quinto</option>
                <option value="sexto">Sexto</option>
              </select>
              <input
                type="text"
                placeholder="División"
                value={newStudentDivision}
                onChange={(e) => setNewStudentDivision(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newStudentEscuela}
                onChange={(e) => setNewStudentEscuela(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecciona Escuela</option>
                <option value="Colegio Nacional de Buenos Aires (UBA)">Colegio Nacional de Buenos Aires (UBA)</option>
                <option value="Escuela Superior de Comercio Carlos Pellegrini (UBA)">Escuela Superior de Comercio Carlos Pellegrini (UBA)</option>
                <option value="Instituto Libre de Segunda Enseñanza (ILSE)">Instituto Libre de Segunda Enseñanza (ILSE)</option>
                <option value="Colegio N° 1 &quot;Bernardino Rivadavia&quot;">Colegio N° 1 "Bernardino Rivadavia"</option>
                <option value="Colegio N° 2 &quot;Domingo Faustino Sarmiento&quot;">Colegio N° 2 "Domingo Faustino Sarmiento"</option>
                <option value="Colegio N° 3 &quot;Mariano Moreno&quot;">Colegio N° 3 "Mariano Moreno"</option>
                <option value="Colegio N° 4 &quot;Nicolás Avellaneda&quot;">Colegio N° 4 "Nicolás Avellaneda"</option>
                <option value="Colegio N° 5 &quot;Bartolomé Mitre&quot;">Colegio N° 5 "Bartolomé Mitre"</option>
                <option value="Colegio N° 6 &quot;Manuel Belgrano&quot;">Colegio N° 6 "Manuel Belgrano"</option>
                <option value="Colegio N° 7 &quot;Juan Martín de Pueyrredón&quot;">Colegio N° 7 "Juan Martín de Pueyrredón"</option>
                <option value="Colegio N° 8 &quot;Julio Argentino Roca&quot;">Colegio N° 8 "Julio Argentino Roca"</option>
                <option value="Colegio N° 9 &quot;Justo José de Urquiza&quot;">Colegio N° 9 "Justo José de Urquiza"</option>
                <option value="Colegio N° 10 &quot;José de San Martín&quot;">Colegio N° 10 "José de San Martín"</option>
                <option value="Colegio N° 11 &quot;Hipólito Yrigoyen&quot;">Colegio N° 11 "Hipólito Yrigoyen"</option>
                <option value="Colegio N° 12 &quot;Reconquista&quot;">Colegio N° 12 "Reconquista"</option>
                <option value="Colegio N° 13 &quot;Tomás Espora&quot;">Colegio N° 13 "Tomás Espora"</option>
                <option value="Colegio N° 14 &quot;Juan José Paso&quot;">Colegio N° 14 "Juan José Paso"</option>
                <option value="Colegio N° 15 &quot;Revolución de Mayo&quot;">Colegio N° 15 "Revolución de Mayo"</option>
                <option value="Colegio N° 16 &quot;Guillermo Rawson&quot;">Colegio N° 16 "Guillermo Rawson"</option>
                <option value="Colegio N° 17 &quot;Primera Junta&quot;">Colegio N° 17 "Primera Junta"</option>
                <option value="Colegio N° 19 &quot;Luis Pasteur&quot;">Colegio N° 19 "Luis Pasteur"</option>
                <option value="EEM N° 1 &quot;Federico García Lorca&quot;">EEM N° 1 "Federico García Lorca"</option>
                <option value="EEM N° 1 &quot;Julio Cortázar&quot;">EEM N° 1 "Julio Cortázar"</option>
                <option value="EEM N° 1 &quot;Rodolfo Walsh&quot;">EEM N° 1 "Rodolfo Walsh"</option>
                <option value="EEM N° 2 &quot;Rumania&quot;">EEM N° 2 "Rumania"</option>
                <option value="EEM N° 2 &quot;Agustín Tosco&quot;">EEM N° 2 "Agustín Tosco"</option>
                <option value="EEM N° 3 &quot;Antonio Devoto&quot;">EEM N° 3 "Antonio Devoto"</option>
                <option value="EEM N° 3 &quot;Prof. Carlos Geniso&quot;">EEM N° 3 "Prof. Carlos Geniso"</option>
                <option value="EEM N° 5 &quot;Héroes de Malvinas&quot;">EEM N° 5 "Héroes de Malvinas"</option>
                <option value="EEM N° 5 &quot;Monseñor Enrique Angelelli&quot;">EEM N° 5 "Monseñor Enrique Angelelli"</option>
                <option value="EEM N° 6 &quot;Padre Carlos Mugica&quot;">EEM N° 6 "Padre Carlos Mugica"</option>
                <option value="EEM N° 7 &quot;Escuela de la Ribera&quot;">EEM N° 7 "Escuela de la Ribera"</option>
                <option value="ET N° 1 &quot;Ingeniero Otto Krause&quot;">ET N° 1 "Ingeniero Otto Krause"</option>
                <option value="ET N° 6 &quot;Fernando Fader&quot;">ET N° 6 "Fernando Fader"</option>
                <option value="ET N° 9 &quot;Ingeniero Luis A. Huergo&quot;">ET N° 9 "Ingeniero Luis A. Huergo"</option>
                <option value="ET N° 11 &quot;Manuel Belgrano&quot;">ET N° 11 "Manuel Belgrano"</option>
                <option value="ET N° 17 &quot;Brigadier Gral. Cornelio Saavedra&quot;">ET N° 17 "Brigadier Gral. Cornelio Saavedra"</option>
                <option value="ET N° 27 &quot;Hipólito Yrigoyen&quot;">ET N° 27 "Hipólito Yrigoyen"</option>
                <option value="ET N° 28 &quot;República Francesa&quot;">ET N° 28 "República Francesa"</option>
                <option value="ET N° 32 &quot;General José de San Martín&quot;">ET N° 32 "General José de San Martín"</option>
                <option value="ET N° 35 &quot;Ingeniero Eduardo Latzina&quot;">ET N° 35 "Ingeniero Eduardo Latzina"</option>
                <option value="Esc. de Comercio N° 1 &quot;Joaquín V. González&quot;">Esc. de Comercio N° 1 "Joaquín V. González"</option>
                <option value="Esc. de Comercio N° 4 &quot;Baldomero Fernández Moreno&quot;">Esc. de Comercio N° 4 "Baldomero Fernández Moreno"</option>
                <option value="Esc. de Comercio N° 5 &quot;José de San Martín&quot;">Esc. de Comercio N° 5 "José de San Martín"</option>
                <option value="Esc. de Comercio N° 7 &quot;Manuel Belgrano&quot;">Esc. de Comercio N° 7 "Manuel Belgrano"</option>
                <option value="Esc. de Comercio N° 11 &quot;Dr. José Peralta&quot;">Esc. de Comercio N° 11 "Dr. José Peralta"</option>
                <option value="Esc. de Comercio N° 18 &quot;Reino de Suecia&quot;">Esc. de Comercio N° 18 "Reino de Suecia"</option>
                <option value="Esc. de Comercio N° 30 &quot;Dr. Esteban Agustín Gascón&quot;">Esc. de Comercio N° 30 "Dr. Esteban Agustín Gascón"</option>
                <option value="ENS N° 1 &quot;Presidente Roque Sáenz Peña&quot;">ENS N° 1 "Presidente Roque Sáenz Peña"</option>
                <option value="ENS N° 2 &quot;Mariano Acosta&quot;">ENS N° 2 "Mariano Acosta"</option>
                <option value="ENS N° 3 &quot;Bernardino Rivadavia&quot;">ENS N° 3 "Bernardino Rivadavia"</option>
                <option value="ENS N° 4 &quot;Estanislao Severo Zeballos&quot;">ENS N° 4 "Estanislao Severo Zeballos"</option>
                <option value="ENS N° 6 &quot;Vicente López y Planes&quot;">ENS N° 6 "Vicente López y Planes"</option>
                <option value="ENS N° 10 &quot;Juan Bautista Alberdi&quot;">ENS N° 10 "Juan Bautista Alberdi"</option>
                <option value="ENS en Lenguas Vivas &quot;Sofía E. B. de Spangenberg&quot; (Lengüitas)">ENS en Lenguas Vivas "Sofía E. B. de Spangenberg" (Lengüitas)</option>
                <option value="IES en Lenguas Vivas &quot;Juan Ramón Fernández&quot;">IES en Lenguas Vivas "Juan Ramón Fernández"</option>
                <option value="Escuela de Bellas Artes &quot;Manuel Belgrano&quot;">Escuela de Bellas Artes "Manuel Belgrano"</option>
                <option value="Escuela de Bellas Artes &quot;Lola Mora&quot;">Escuela de Bellas Artes "Lola Mora"</option>
                <option value="Escuela de Bellas Artes &quot;Rogelio Yrurtia&quot;">Escuela de Bellas Artes "Rogelio Yrurtia"</option>
                <option value="Escuela de Música &quot;Juan Pedro Esnaola&quot;">Escuela de Música "Juan Pedro Esnaola"</option>
                <option value="Escuela de Danzas &quot;Aída Mastrazzi&quot;">Escuela de Danzas "Aída Mastrazzi"</option>
                <option value="Escuela de Cerámica N° 1">Escuela de Cerámica N° 1</option>
              </select>
              <button
                onClick={handleCreateStudent}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Agregar Estudiante
              </button>
            </div>
          </div>
        </div>
      </div>

            {selectedStudent && (
              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 className="text-indigo-900 text-lg font-semibold">Detalles del Estudiante</h3>
                <p><strong>ID:</strong> {selectedStudent.id}</p>
                <p><strong>Nombre:</strong> {selectedStudent.name}</p>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                <p><strong>Curso:</strong> {selectedStudent.curso}° "{selectedStudent.division}"</p>
                <p><strong>Escuela:</strong> {selectedStudent.escuela}</p>
                <p><strong>Tokens:</strong> {selectedStudent.tokens}</p>
                <p><strong>Tareas Completadas:</strong> {selectedStudent.tasksCompleted}</p>
                <p><strong>Public Key Stellar:</strong> {selectedStudent.stellar_public_key}</p>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cerrar Detalles
                </button>
              </div>
            )}
      
            {/* Modal de Éxito de Creación de Alumno */}
            {successModal.show && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold">¡Estudiante Creado!</h3>
                    <p className="opacity-90">{successModal.name}</p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                      Se ha generado la billetera Stellar. Guarda las claves en un lugar seguro ahora mismo.
                    </p>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Clave Pública (Public Key)</p>
                      <code className="block bg-white px-2 py-1.5 rounded border border-gray-200 text-xs break-all font-mono">
                        {successModal.publicKey}
                      </code>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Clave Secreta (Secret Key)</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white px-2 py-1.5 rounded border border-gray-200 text-xs break-all font-mono">
                          {showSecret ? successModal.secretKey : '*******************************************************'}
                        </code>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                            title="Mostrar/Ocultar"
                          >
                            {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          <button
                            onClick={() => handleCopy(successModal.secretKey)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                            title="Copiar"
                          >
                            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
      
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start text-amber-800">
                      <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                      <p className="text-xs">
                        Si pierdes esta clave, el alumno no podrá acceder a sus tokens o logros. No se puede recuperar.
                      </p>
                    </div>
      
                    <button
                      onClick={() => setSuccessModal({ ...successModal, show: false })}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                      He guardado la clave
                    </button>
                  </div>
                </div>
              </div>
            )}
                {/* Modal de Carga */}
                {isCreating && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[110]">
                    <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                      <Hourglass className="w-12 h-12 text-indigo-600 animate-spin" />
                      <div className="text-center">
                        <h3 className="font-bold text-gray-800">Creación en proceso</h3>
                        <p className="text-sm text-gray-500">Configurando perfil y billetera Stellar...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          