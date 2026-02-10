import { useState, useEffect } from 'react';
import { UserPlus, Search } from 'lucide-react';
import type { Teacher } from '../../types';
import { supabase, supabaseAnonKey } from '../../lib/supabaseClient';
import { createTeacher } from '../../lib/teacher'; // Import the new createTeacher function
import Select from 'react-select'; // Import react-select

const subjectOptions = [
  { value: "Lengua y Literatura", label: "Lengua y Literatura" },
  { value: "Matemática", label: "Matemática" },
  { value: "Lengua Adicional", label: "Lengua Adicional" },
  { value: "Educación Física", label: "Educación Física" },
  { value: "Biología", label: "Biología" },
  { value: "Física-Química", label: "Física-Química" },
  { value: "Historia", label: "Historia" },
  { value: "Geografía", label: "Geografía" },
  { value: "Formación Ética y Ciudadana", label: "Formación Ética y Ciudadana" },
  { value: "Educación Tecnológica", label: "Educación Tecnológica" },
  { value: "Artes", label: "Artes" },
  { value: "Tecnologías de la Información", label: "Tecnologías de la Información" },
  { value: "Tutoría", label: "Tutoría" },
];

export function TeacherManagement() { // Removed props
  const [teachers, setTeachers] = useState<Teacher[]>([]); // Internal state for teachers
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherSubjects, setNewTeacherSubjects] = useState<string[]>([]); // Changed to array
  const [newTeacherCurso, setNewTeacherCurso] = useState('');
  const [newTeacherDivision, setNewTeacherDivision] = useState('');
  const [newTeacherEscuela, setNewTeacherEscuela] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data, error } = await supabase.from('teachers').select('*'); // Assuming 'teachers' table
    if (error) {
      console.error('Error fetching teachers:', error);
    } else {
      setTeachers(data as Teacher[]);
    }
  };

  const filteredTeachers = (teachers || []).filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subjects.join(', ').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.curso && teacher.curso.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (teacher.division && teacher.division.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (teacher.escuela && teacher.escuela.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateTeacher = async () => {
    if (newTeacherName && newTeacherEmail && newTeacherSubjects.length > 0 && newTeacherCurso && newTeacherDivision && newTeacherEscuela) {
      try {
        const newTeacherData = {
          name: newTeacherName,
          email: newTeacherEmail,
          subjects: newTeacherSubjects, // Pass directly as it's already an array
          curso: newTeacherCurso,
          division: newTeacherDivision,
          escuela: newTeacherEscuela,
        };
        const createdTeacher = await createTeacher(newTeacherData);

        // 1. Obtener la sesión actual
        const { data: { session } } = await supabase.auth.getSession();

        // --- MVP Bypass: Authentication (REMOVE FOR PRODUCTION) ---
        // Since login is not implemented yet, we bypass session check and pass a dummy auth header.
        // This is INSECURE and must be replaced with proper authentication for production.
        console.warn('ADVERTENCIA: Bypass de autenticación activo para MVP. ESTO ES INSEGURO Y DEBE SER REEMPLAZADO PARA PRODUCCIÓN.');
        const dummyAuthHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.BgK64W-B_kQ2GkLg-47k-qQz-rG1-t-k-0-l-0-l-0'; // Dummy JWT
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
            body: JSON.stringify({ student_id: createdTeacher.id }), // Note: it's student_id in the body, which is used for generic wallet creation
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

        // Re-fetch the teacher from the database to ensure we have the most up-to-date data,
        // including the stellar_public_key updated by the Edge Function
        const { data: updatedTeacher, error: fetchError } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', createdTeacher.id)
          .single();

        if (fetchError || !updatedTeacher) {
          console.error('Error fetching updated teacher:', fetchError);
          alert('Profesor y billetera creados, pero falló la actualización de la lista.');
          return;
        }

        setTeachers(prev => [...prev, updatedTeacher as Teacher]);
        setNewTeacherName('');
        setNewTeacherEmail('');
        setNewTeacherSubjects([]); // Reset as array
        setNewTeacherCurso('');
        setNewTeacherDivision('');
        setNewTeacherEscuela('');
        alert('Profesor y billetera Stellar creados exitosamente.'); // Success feedback
      } catch (err: any) {
        console.error('Error creating teacher:', err);
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
          <UserPlus className="w-5 h-5 text-purple-600" />
          <h3 className="text-purple-900">Agregar Nuevo Docente</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del docente"
              value={newTeacherName}
              onChange={(e) => setNewTeacherName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="email"
              placeholder="Email del docente"
              value={newTeacherEmail}
              onChange={(e) => setNewTeacherEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              isMulti
              options={subjectOptions}
              value={newTeacherSubjects.map(subject => ({ value: subject, label: subject }))}
              onChange={(selectedOptions) => {
                const selectedSubjects = selectedOptions ? selectedOptions.map(option => option.value) : [];
                setNewTeacherSubjects(selectedSubjects);
              }}
              className="w-full" // Basic Tailwind for width
              classNamePrefix="react-select" // For custom styling if needed
              placeholder="Selecciona Materias"
            />
            <select
              value={newTeacherCurso}
              onChange={(e) => setNewTeacherCurso(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 self-start"
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
              value={newTeacherDivision}
              onChange={(e) => setNewTeacherDivision(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 self-start"
            />
            <select
              value={newTeacherEscuela}
              onChange={(e) => setNewTeacherEscuela(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 self-start"
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
              onClick={handleCreateTeacher}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Agregar Docente
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="text-gray-900">Lista de Docentes</h3>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar docente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-sm text-gray-500">{teacher.email}</p>
                  {(teacher.escuela || teacher.curso || teacher.division) && (
                    <p className="text-sm text-gray-500">
                      {teacher.escuela}{teacher.escuela && (teacher.curso || teacher.division) ? ' - ' : ''}
                      {teacher.curso}{teacher.curso && teacher.division ? '° "' : ''}
                      {teacher.division}{teacher.division ? '"' : ''}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{teacher.subjects.join(', ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}