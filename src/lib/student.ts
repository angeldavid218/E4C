import { supabase } from './supabaseClient';
import { Student } from '../types'; // Importar tipo Student

export const createStudent = async (studentData: {
  name: string;
  email: string;
  curso?: string;
  division?: string;
  escuela?: string;
  stellar_public_key?: string;
  passkey_credential_id?: string; // Nuevo: Soporte para Account Abstraction
}): Promise<Student> => {
  // 1. Verificar si el estudiante ya existe antes de intentar insertar
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('email', studentData.email)
    .maybeSingle();

  if (existingStudent) {
    throw new Error('Este correo electrónico ya está registrado con otro alumno.');
  }

  // 2. Si no existe, procedemos con la inserción
  const { data, error } = await supabase
    .from('students')
    .insert([studentData])
    .select()
    .single();

  if (error) {
    console.error("Error original de Supabase:", error);
    throw new Error('No se pudo crear el estudiante. Por favor, intenta de nuevo.');
  }

  return data;
};