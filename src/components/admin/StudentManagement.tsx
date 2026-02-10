import { useState, useEffect } from 'react';
import { UserPlus, Search } from 'lucide-react';
import type { Student } from '../../types';
import { supabase, supabaseAnonKey } from '../../lib/supabaseClient'; // Import supabaseAnonKey
import { createStudent } from '../../lib/student';

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCurso, setNewStudentCurso] = useState('');
  const [newStudentDivision, setNewStudentDivision] = useState('');
  const [newStudentEscuela, setNewStudentEscuela] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

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

  const handleCreateStudent = async () => {
    if (newStudentName && newStudentEmail && newStudentCurso && newStudentDivision && newStudentEscuela) {
      try {
        const newStudentData = {
          name: newStudentName,
          email: newStudentEmail,
          curso: newStudentCurso,
          division: newStudentDivision,
          escuela: newStudentEscuela
        };
        const createdStudent = await createStudent(newStudentData);

        // 1. Obtener la sesión actual
        const { data: { session } } = await supabase.auth.getSession();

        // --- MVP Bypass: Authentication (REMOVE FOR PRODUCTION) ---
        // Since login is not implemented yet, we bypass session check and pass a dummy auth header.
        // This is INSECURE and must be replaced with proper authentication for production.
        console.warn('ADVERTENCIA: Bypass de autenticación activo para MVP. ESTO ES INSEGURO Y DEBE SER REEMPLAZADO PARA PRODUCCIÓN.');
        // --- END MVP Bypass ---

        // Now, trigger wallet creation via the new Edge Function
        const createWalletResponse = await fetch(
          `${supabase.supabaseUrl}/functions/v1/trigger-wallet-creation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`, // ESTA LINEA ES CLAVE
              'apikey': supabaseAnonKey
            },
            body: JSON.stringify({ student_id: createdStudent.id }),
          }
        );

        const data = await createWalletResponse.json();

        if (!createWalletResponse.ok) {
          console.error('Error from trigger-wallet-creation:', data);
          throw new Error(data.error || 'Failed to trigger wallet creation.');
        }

        const { stellar_public_key, stellar_secret_key } = data;

        // Display critical alert for the user to save their secret key
        alert(`¡Billetera Stellar creada exitosamente!\n\nIMPORTANTE: Guarda esta clave privada en un lugar seguro. La necesitarás para acceder a tu billetera.\n\nCLAVE PRIVADA: ${stellar_secret_key}\n\nNO compartas esta clave con nadie.`);

        // Re-fetch the student from the database to ensure we have the most up-to-date data,
        // including the stellar_public_key updated by the Edge Function
        const { data: updatedStudent, error: fetchError } = await supabase
          .from('students')
          .select('*')
          .eq('id', createdStudent.id)
          .single();

        if (fetchError || !updatedStudent) {
          console.error('Error fetching updated student:', fetchError);
          alert('Estudiante y billetera creados, pero falló la actualización de la lista.');
          return;
        }

        setStudents(prev => [...prev, updatedStudent as Student]);
        setNewStudentName('');
        setNewStudentEmail('');
        setNewStudentCurso('');
        setNewStudentDivision('');
        setNewStudentEscuela('');
        alert('Estudiante y billetera Stellar creados exitosamente.'); // Success feedback
      } catch (err: any) {
        console.error('Error creating student:', err);
        alert(err.message); // Display user-friendly error
      }
    } else {
      alert('Por favor, completa todos los campos.'); // Provide feedback for incomplete form
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Esta es la parte que lista los alumnos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="text-gray-900">Lista de Estudiantes</h3>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredStudents.map(student => (
            <div key={student.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                  <p className="text-sm text-gray-500">{student.escuela} - {student.curso}° "{student.division}"</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{student.stellar_public_key}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}