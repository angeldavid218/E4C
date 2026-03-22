
import { useState } from 'react';
import { UserPlus, Search } from 'lucide-react';
import type { Teacher } from '../../types';
import Select from 'react-select'; // Importar react-select

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

const sortedSchoolOptions = [
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
  { value: "Colegio N° 8 \"Julio Argentino Roca\"", label: "Colegio N° 8 \"Julio Argentino Roca\"" },
  { value: "Colegio N° 9 \"Justo José de Urquiza\"", label: "Colegio N° 9 \"Justo José de Urquiza\"" },
  { value: "Colegio N° 10 \"José de San Martín\"", label: "Colegio N° 10 \"José de San Martín\"" },
  { value: "Colegio N° 11 \"Hipólito Yrigoyen\"", label: "Colegio N° 11 \"Hipólito Yrigoyen\"" },
  { value: "Colegio N° 12 \"Reconquista\"", label: "Colegio N° 12 \"Reconquista\"" },
  { value: "Colegio N° 13 \"Tomás Espora\"", label: "Colegio N° 13 \"Tomás Espora\"" },
  { value: "Colegio N° 14 \"Juan José Paso\"", label: "Colegio N° 14 \"Juan José Paso\"" },
  { value: "Colegio N° 15 \"Revolución de Mayo\"", label: "Colegio N° 15 \"Revolución de Mayo\"" },
  { value: "Colegio N° 16 \"Guillermo Rawson\"", label: "Colegio N° 16 \"Guillermo Rawson\"" },
  { value: "Colegio N° 17 \"Primera Junta\"", label: "Colegio N° 17 \"Primera Junta\"" },
  { value: "Colegio N° 19 \"Luis Pasteur\"", label: "Colegio N° 19 \"Luis Pasteur\"" },
  { value: "EEM N° 1 \"Federico García Lorca\"", label: "EEM N° 1 \"Federico García Lorca\"" },
  { value: "EEM N° 1 \"Julio Cortázar\"", label: "EEM N° 1 \"Julio Cortázar\"" },
  { value: "EEM N° 1 \"Rodolfo Walsh\"", label: "EEM N° 1 \"Rodolfo Walsh\"" },
  { value: "EEM N° 2 \"Rumania\"", label: "EEM N° 2 \"Rumania\"" },
  { value: "EEM N° 2 \"Agustín Tosco\"", label: "EEM N° 2 \"Agustín Tosco\"" },
  { value: "EEM N° 3 \"Antonio Devoto\"", label: "EEM N° 3 \"Antonio Devoto\"" },
  { value: "EEM N° 3 \"Prof. Carlos Geniso\"", label: "EEM N° 3 \"Prof. Carlos Geniso\"" },
  { value: "EEM N° 5 \"Héroes de Malvinas\"", label: "EEM N° 5 \"Héroes de Malvinas\"" },
  { value: "EEM N° 5 \"Monseñor Enrique Angelelli\"", label: "EEM N° 5 \"Monseñor Enrique Angelelli\"" },
  { value: "EEM N° 6 \"Padre Carlos Mugica\"", label: "EEM N° 6 \"Padre Carlos Mugica\"" },
  { value: "EEM N° 7 \"Escuela de la Ribera\"", label: "EEM N° 7 \"Escuela de la Ribera\"" },
  { value: "ET N° 1 \"Ingeniero Otto Krause\"", label: "ET N° 1 \"Ingeniero Otto Krause\"" },
  { value: "ET N° 6 \"Fernando Fader\"", label: "ET N° 6 \"Fernando Fader\"" },
  { value: "ET N° 9 \"Ingeniero Luis A. Huergo\"", label: "ET N° 9 \"Ingeniero Luis A. Huergo\"" },
  { value: "ET N° 11 \"Manuel Belgrano\"", label: "ET N° 11 \"Manuel Belgrano\"" },
  { value: "ET N° 17 \"Brigadier Gral. Cornelio Saavedra\"", label: "ET N° 17 \"Brigadier Gral. Cornelio Saavedra\"" },
  { value: "ET N° 27 \"Hipólito Yrigoyen\"", label: "ET N° 27 \"Hipólito Yrigoyen\"" },
  { value: "ET N° 28 \"República Francesa\"", label: "ET N° 28 \"República Francesa\"" },
  { value: "ET N° 32 \"General José de San Martín\"", label: "ET N° 32 \"General José de San Martín\"" },
  { value: "ET N° 35 \"Ingeniero Eduardo Latzina\"", label: "ET N° 35 \"Ingeniero Eduardo Latzina\"" },
  { value: "Esc. de Comercio N° 1 \"Joaquín V. González\"", label: "Esc. de Comercio N° 1 \"Joaquín V. González\"" },
  { value: "Esc. de Comercio N° 4 \"Baldomero Fernández Moreno\"", label: "Esc. de Comercio N° 4 \"Baldomero Fernández Moreno\"" },
  { value: "Esc. de Comercio N° 5 \"José de San Martín\"", label: "Esc. de Comercio N° 5 \"José de San Martín\"" },
  { value: "Esc. de Comercio N° 7 \"Manuel Belgrano\"", label: "Esc. de Comercio N° 7 \"Manuel Belgrano\"" },
  { value: "Esc. de Comercio N° 11 \"Dr. José Peralta\"", label: "Esc. de Comercio N° 11 \"Dr. José Peralta\"" },
  { value: "Esc. de Comercio N° 18 \"Reino de Suecia\"", label: "Esc. de Comercio N° 18 \"Reino de Suecia\"" },
  { value: "Esc. de Comercio N° 30 \"Dr. Esteban Agustín Gascón\"", label: "Esc. de Comercio N° 30 \"Dr. Esteban Agustín Gascón\"" },
  { value: "ENS N° 1 \"Presidente Roque Sáenz Peña\"", label: "ENS N° 1 \"Presidente Roque Sáenz Peña\"" },
  { value: "ENS N° 2 \"Mariano Acosta\"", label: "ENS N° 2 \"Mariano Acosta\"" },
  { value: "ENS N° 3 \"Bernardino Rivadavia\"", label: "ENS N° 3 \"Bernardino Rivadavia\"" },
  { value: "ENS N° 4 \"Estanislao Severo Zeballos\"", label: "ENS N° 4 \"Estanislao Severo Zeballos\"" },
  { value: "ENS N° 6 \"Vicente López y Planes\"", label: "ENS N° 6 \"Vicente López y Planes\"" },
  { value: "ENS N° 10 \"Juan Bautista Alberdi\"", label: "ENS N° 10 \"Juan Bautista Alberdi\"" },
  { value: "ENS en Lenguas Vivas \"Sofía E. B. de Spangenberg\" (Lengüitas)", label: "ENS en Lenguas Vivas \"Sofía E. B. de Spangenberg\" (Lengüitas)" },
  { value: "IES en Lenguas Vivas \"Juan Ramón Fernández\"", label: "IES en Lenguas Vivas \"Juan Ramón Fernández\"" },
  { value: "Escuela de Bellas Artes \"Manuel Belgrano\"", label: "Escuela de Bellas Artes \"Manuel Belgrano\"" },
  { value: "Escuela de Bellas Artes \"Lola Mora\"", label: "Escuela de Bellas Artes \"Lola Mora\"" },
  { value: "Escuela de Bellas Artes \"Rogelio Yrurtia\"", label: "Escuela de Bellas Artes \"Rogelio Yrurtia\"" },
  { value: "Escuela de Música \"Juan Pedro Esnaola\"", label: "Escuela de Música \"Juan Pedro Esnaola\"" },
  { value: "Escuela de Danzas \"Aída Mastrazzi\"", label: "Escuela de Danzas \"Aída Mastrazzi\"" },
  { value: "Escuela de Cerámica N° 1", label: "Escuela de Cerámica N° 1" },
].sort((a, b) => a.label.localeCompare(b.label));

interface TeacherManagementProps {
  teachers: Teacher[];
  onCreateTeacher: (teacher: Omit<Teacher, 'id' | 'stellar_public_key'>) => Promise<void>;
}

export function TeacherManagement({ teachers, onCreateTeacher }: TeacherManagementProps) { // Propiedades eliminadas

  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherSubjects, setNewTeacherSubjects] = useState<string[]>([]); // Cambiado a array
  const [newTeacherCurso, setNewTeacherCurso] = useState('');
  const [newTeacherDivision, setNewTeacherDivision] = useState('');
  const [newTeacherEscuela, setNewTeacherEscuela] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null); // Nuevo estado para el profesor seleccionado



  const filteredTeachers = (teachers || [])
    .filter(teacher =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.subjects || []).join(', ').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.curso && teacher.curso.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (teacher.division && teacher.division.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (teacher.escuela && teacher.escuela.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleCreateTeacher = async () => {
    if (newTeacherName && newTeacherEmail && newTeacherSubjects.length > 0 && newTeacherCurso && newTeacherDivision && newTeacherEscuela) {
      try {
        const newTeacherData = {
          name: newTeacherName,
          email: newTeacherEmail,
          subjects: newTeacherSubjects, // Pasar directamente ya que ya es un array
          curso: newTeacherCurso,
          division: newTeacherDivision,
          escuela: newTeacherEscuela,
          // stellar_public_key es manejado por el onCreateTeacher del padre
        };
        const fullTeacherData: Omit<Teacher, 'id' | 'stellar_public_key'> = {
          ...newTeacherData,
          role: 'teacher',
          status: 'approved'
        };
        await onCreateTeacher(fullTeacherData);

        setNewTeacherName('');
        setNewTeacherEmail('');
        setNewTeacherSubjects([]); // Reset as array
        setNewTeacherCurso('');
        setNewTeacherDivision('');
        setNewTeacherEscuela('');
      } catch (err: any) {
        console.error('Fallo total:', err);
        alert(`Error al crear: ${err.message}`);
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
                className="w-full" // Tailwind básico para el ancho
                classNamePrefix="react-select" // Para estilos personalizados si es necesario
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
      </div>
      {selectedTeacher && (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-purple-900 text-lg font-semibold">Detalles del Docente</h3>
          <p><strong>ID:</strong> {selectedTeacher.id}</p>
          <p><strong>Nombre:</strong> {selectedTeacher.name}</p>
          <p><strong>Email:</strong> {selectedTeacher.email}</p>
          <p><strong>Materias:</strong> {selectedTeacher.subjects?.join(', ') || 'Ninguna'}</p>
          <p><strong>Curso:</strong> {selectedTeacher.curso}° "{selectedTeacher.division}"</p>
          <p><strong>Escuela:</strong> {selectedTeacher.escuela}</p>
          <p><strong>Public Key Stellar:</strong> {selectedTeacher.stellar_public_key}</p>
          {/* Agregar más detalles según sea necesario */}
          <button
            onClick={() => setSelectedTeacher(null)}
            className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Cerrar Detalles
          </button>
        </div>
      )}
    </div>
  );
}