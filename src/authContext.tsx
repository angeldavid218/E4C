import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, Student, Teacher, Admin, Validator } from './types';
import { supabase } from './lib/supabaseClient'; // Importar cliente de Supabase

// Tipos de simulación para Sesión y Usuario
interface User {
  id: string;
  app_metadata: {
    provider?: string;
  };
      user_metadata: {
          role?: UserRole;
          name?: string;
          email?: string;
          [key: string]: unknown;
      };
      aud: string;
      created_at: string;
      [key: string]: unknown;}

interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
  switchUserRole: (role: UserRole, id?: string) => Promise<void>; // Make it async here too
  allStudents: Student[];
  allTeachers: Teacher[];

  allValidators: Validator[];
  currentRole: UserRole;
  refreshUsers: () => Promise<{ currentStudents: Student[]; adminsData: Admin[]; teachersData: Teacher[]; validatorsData: Validator[]; }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  // const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
  const [allValidators, setAllValidators] = useState<Validator[]>([]);

  const [registeredEmails, setRegisteredEmails] = useState<Set<string>>(new Set(['test@example.com', 'admin@example.com']));

  const signIn = async (email: string, password: string) => {
    // Basic mock sign-in logic
    if (registeredEmails.has(email) && password === 'password') { // Asumiendo una contraseña por defecto para la simulación
      const mockUser: User = {
        id: 'mock-user-' + email,
        app_metadata: {},
        user_metadata: { email, name: email.split('@')[0], role: 'student' as UserRole }, // Default to student role for mock
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      const mockSession: Session = {
        access_token: 'mock-access-token-' + email,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };
      setUser(mockUser);
      setSession(mockSession);
      return Promise.resolve({ user: mockUser, session: mockSession });
    } else {
      throw new Error("Credenciales inválidas.");
    }
  };

  const signUp = async (email: string, password: string) => {
    // Simulate "email already exists"
    if (registeredEmails.has(email)) {
      throw new Error("El correo electrónico ya está registrado.");
    }
    
    // Basic mock sign-up logic
    const mockUser: User = {
      id: 'mock-user-' + email,
      app_metadata: {},
      user_metadata: { email, name: email.split('@')[0], role: 'student' as UserRole },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    const mockSession: Session = {
      access_token: 'mock-access-token-' + email,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    
    setRegisteredEmails(prev => new Set(prev).add(email)); // Add new email to mock registered
    setUser(mockUser);
    setSession(mockSession);
    return Promise.resolve({ user: mockUser, session: mockSession });
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    return Promise.resolve();
  };

  const refreshUsers = useCallback(async () => {
    // Eliminamos setLoading(true) para evitar que App.tsx desmonte el dashboard
    let currentStudents: Student[] = [];

    const { data: studentsData, error: studentsError } = await supabase.from('students').select('*');
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    } else {
      setAllStudents(studentsData as Student[]);
      currentStudents = studentsData as Student[];
    }

    const { data: teachersData, error: teachersError } = await supabase.from('teachers').select('*');
    if (teachersError) {
      console.error('Error fetching teachers:', teachersError);
    } else {
      setAllTeachers(teachersData as Teacher[]);
    }
    
    // const { data: adminsData, error: adminsError } = await supabase.from('admins').select('*');
    // if (adminsError) {
    //   console.error('Error fetching admins:', adminsError);
    // } else {
    //   setAllAdmins(adminsData as Admin[]);
    // }
    
    const { data: validatorsData, error: validatorsError } = await supabase.from('validators').select('*');
    if (validatorsError) {
      console.error('Error fetching validators:', validatorsError);
    } else {
      setAllValidators(validatorsData as Validator[]);
    }
    return { currentStudents, adminsData: [], teachersData: teachersData || [], validatorsData: validatorsData || [] };
  }, []);

  const switchUserRole = useCallback(async (role: UserRole, id?: string) => { // Make it async and useCallback
    setCurrentRole(role);
    let selectedUser: User | null = null;
    const userMetadata: { role: UserRole; [key: string]: unknown } = { role };

    if (role === 'student') {
      const studentIdToUse = id || (allStudents.length > 0 ? allStudents[0].id : undefined);
      if (studentIdToUse) {
        const student = allStudents.find(s => s.id === studentIdToUse);
        if (student) {
          selectedUser = {
            id: student.id,
            app_metadata: {},
            user_metadata: { ...userMetadata, name: student.name, email: student.email },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          };
        }
      }
    } else if (role === 'teacher') {
      const teacherIdToUse = id || (allTeachers.length > 0 ? allTeachers[0].id : undefined);
      if (teacherIdToUse) {
        const teacher = allTeachers.find(t => t.id === teacherIdToUse);
        if (teacher) {
          selectedUser = {
            id: teacher.id,
            app_metadata: {},
            user_metadata: { ...userMetadata, name: teacher.name, email: teacher.email },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          };
        }
      }

    } else if (role === 'validator') {
      const validatorIdToUse = id || (allValidators.length > 0 ? allValidators[0].id : undefined);
      if (validatorIdToUse) {
        const validator = allValidators.find(v => v.id === validatorIdToUse);
        if (validator) {
          selectedUser = {
            id: validator.id,
            app_metadata: {},
            user_metadata: { ...userMetadata, name: validator.name, email: validator.email },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          };
        }
      }
    } else {
      selectedUser = {
        id: `mock-${role}-id`,
        app_metadata: {},
        user_metadata: userMetadata,
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
    }
    setUser(selectedUser);
    // After setting selectedUser, also set a mock session
    let mockSession: Session | null = null;
    if (selectedUser) {
      mockSession = {
        access_token: `mock-access-token-${selectedUser.id}-${Date.now()}`, // Unique mock token
        refresh_token: 'mock-refresh-token',
        user: selectedUser,
        token_type: 'Bearer',
        expires_in: 3600, // 1 hour
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    setSession(mockSession); // Después de establecer el usuario seleccionado, también se establece una sesión de prueba.

  }, [allStudents, allTeachers, allValidators]); // Dependencies need to include relevant state if used inside.

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true); // Solo activamos el loading real aquí
      const { currentStudents } = await refreshUsers(); // Get currentStudents directly
      
      // Prioritize setting the first real student if available
      if (currentStudents.length > 0) {
        const firstStudent = currentStudents[0];
        const initialUser: User = {
          id: firstStudent.id,
          app_metadata: {},
          user_metadata: { role: 'student' as UserRole, name: firstStudent.name, email: firstStudent.email },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        };
        setUser(initialUser);
      } else if (!user) { // Only set a default if no user is already logged in and no real students
        const mockStudentUser = {
          id: `mock-student-id-${Date.now()}`,
          app_metadata: {},
          user_metadata: { role: 'student' as UserRole, name: "Student (Mock)", email: "mock@student.com" },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        };
        setUser(mockStudentUser);
      }
      setCurrentRole('student'); // Ensure the current role is student by default
      setLoading(false); // Terminamos el loading inicial
    };
    
    initialLoad();
  }, [refreshUsers]);

  return (
    <AuthContext.Provider value={{ session, user, currentRole, loading, signIn, signUp, signOut, switchUserRole, allStudents, allTeachers, allValidators, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
}; // Gancho personalizado para acceder al contexto de autenticación.
// Proporciona una forma limpia y segura de obtener los datos de sesión y usuario en cualquier componente.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
