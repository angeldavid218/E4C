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
  switchUserRole: (role: UserRole, id?: string) => Promise<void>; // Hacerlo asíncrono aquí también
  allStudents: Student[];
  allTeachers: Teacher[];
  allAdmins: Admin[];

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
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]); // Descomentado e inicializado
  const [allValidators, setAllValidators] = useState<Validator[]>([]);

  const [registeredEmails, setRegisteredEmails] = useState<Set<string>>(new Set(['test@example.com', 'admin@example.com']));

  const signIn = async (email: string, password: string) => {
    // Lógica básica de simulación de inicio de sesión
    if (registeredEmails.has(email) && password === 'password') { // Asumiendo una contraseña por defecto para la simulación
      const mockUser: User = {
        id: 'mock-user-' + email,
        app_metadata: {},
        user_metadata: { email, name: email.split('@')[0], role: 'student' as UserRole }, // Por defecto, rol de estudiante para la simulación
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
    // Simular "el correo electrónico ya existe"
    if (registeredEmails.has(email)) {
      throw new Error("El correo electrónico ya está registrado.");
    }
    
    // Lógica básica de simulación de registro
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
    
    setRegisteredEmails(prev => new Set(prev).add(email)); // Añadir nuevo correo electrónico a los registrados de simulación
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
      setAllStudents((studentsData as Student[]).sort((a, b) => a.name.localeCompare(b.name)));
      currentStudents = studentsData as Student[];
    }

    const { data: teachersData, error: teachersError } = await supabase.from('teachers').select('*');
    if (teachersError) {
      console.error('Error fetching teachers:', teachersError.message || teachersError);
    } else {
      setAllTeachers((teachersData as Teacher[]).sort((a, b) => a.name.localeCompare(b.name)));
    }
    
    const { data: adminsData, error: adminsError } = await supabase.from('admins').select('*');
    if (adminsError) {
      console.error('Error fetching admins:', adminsError.message || adminsError);
    } else {
      setAllAdmins((adminsData as Admin[]).sort((a, b) => a.name.localeCompare(b.name)));
    }
    
    const { data: validatorsData, error: validatorsError } = await supabase.from('validators').select('*');
    if (validatorsError) {
      console.error('Error fetching validators:', validatorsError);
    } else {
      setAllValidators((validatorsData as Validator[]).sort((a, b) => a.name.localeCompare(b.name)));
    }
    return { currentStudents, adminsData: adminsData || [], teachersData: teachersData || [], validatorsData: validatorsData || [] };
  }, []);

  const switchUserRole = useCallback(async (role: UserRole, id?: string) => { // Hacerlo asíncrono y useCallback
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
    } else if (role === 'admin') { // Manejo de rol de administrador añadido
      const adminIdToUse = id || (allAdmins.length > 0 ? allAdmins[0].id : undefined);
      if (adminIdToUse) {
        const admin = allAdmins.find(a => a.id === adminIdToUse);
        if (admin) {
          selectedUser = {
            id: admin.id,
            app_metadata: {},
            user_metadata: { ...userMetadata, name: admin.name, email: admin.email },
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
    // Después de establecer el usuario seleccionado, también se establece una sesión de prueba
    let mockSession: Session | null = null;
    if (selectedUser) {
      mockSession = {
        access_token: `mock-access-token-${selectedUser.id}-${Date.now()}`, // Token de simulación único
        refresh_token: 'mock-refresh-token',
        user: selectedUser,
        token_type: 'Bearer',
        expires_in: 3600, // 1 hour
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    setSession(mockSession); // Después de establecer el usuario seleccionado, también se establece una sesión de prueba.

  }, [allStudents, allTeachers, allAdmins, allValidators, user]); // Se añadió el usuario a las dependencias.

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);

      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      const supabaseAuthUser = supabaseSession?.user || null;
      setSession(supabaseSession); // Actualizar el estado de la sesión

      const { currentStudents, adminsData, teachersData, validatorsData } = await refreshUsers();

      if (supabaseAuthUser) {
        // Si hay un usuario autenticado de Supabase, intentar identificar su rol
        const foundAdmin = adminsData.find(admin => admin.id === supabaseAuthUser.id);
        if (foundAdmin) {
          const authenticatedAdminUser: User = {
            id: foundAdmin.id,
            app_metadata: supabaseAuthUser.app_metadata,
            user_metadata: { role: 'admin' as UserRole, name: foundAdmin.name, email: foundAdmin.email },
            aud: supabaseAuthUser.aud,
            created_at: supabaseAuthUser.created_at,
          };
          setUser(authenticatedAdminUser);
          setCurrentRole('admin');
        } else {
            // Comprobar otros roles si no es administrador
            const foundTeacher = teachersData.find(teacher => teacher.id === supabaseAuthUser.id);
            if (foundTeacher) {
                const authenticatedTeacherUser: User = {
                    id: foundTeacher.id,
                    app_metadata: supabaseAuthUser.app_metadata,
                    user_metadata: { role: 'teacher' as UserRole, name: foundTeacher.name, email: foundTeacher.email },
                    aud: supabaseAuthUser.aud,
                    created_at: supabaseAuthUser.created_at,
                };
                setUser(authenticatedTeacherUser);
                setCurrentRole('teacher');
            } else {
                const foundValidator = validatorsData.find(validator => validator.id === supabaseAuthUser.id);
                if (foundValidator) {
                    const authenticatedValidatorUser: User = {
                        id: foundValidator.id,
                        app_metadata: supabaseAuthUser.app_metadata,
                        user_metadata: { role: 'validator' as UserRole, name: foundValidator.name, email: foundValidator.email },
                        aud: supabaseAuthUser.aud,
                        created_at: supabaseAuthUser.created_at,
                    };
                    setUser(authenticatedValidatorUser);
                    setCurrentRole('validator');
                } else {
                    const foundStudent = currentStudents.find(student => student.id === supabaseAuthUser.id);
                    if (foundStudent) {
                        const authenticatedStudentUser: User = {
                            id: foundStudent.id,
                            app_metadata: supabaseAuthUser.app_metadata,
                            user_metadata: { role: 'student' as UserRole, name: foundStudent.name, email: foundStudent.email },
                            aud: supabaseAuthUser.aud,
                            created_at: supabaseAuthUser.created_at,
                        };
                        setUser(authenticatedStudentUser);
                        setCurrentRole('student');
                    } else {
                        // Por defecto, rol de estudiante para usuarios autenticados sin rol coincidente en las tablas de la BD
                        const defaultAuthUser: User = {
                            id: supabaseAuthUser.id,
                            app_metadata: supabaseAuthUser.app_metadata,
                            user_metadata: { role: 'student' as UserRole, name: supabaseAuthUser.user_metadata.name || 'Authenticated User', email: supabaseAuthUser.email || 'no-email@example.com' },
                            aud: supabaseAuthUser.aud,
                            created_at: supabaseAuthUser.created_at,
                        };
                        setUser(defaultAuthUser);
                        setCurrentRole('student');
                    }
                }
            }
        }
      } else {
        // Si no hay un usuario autenticado de Supabase
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
          setCurrentRole('student');
        } else {
          // Si no hay estudiantes reales y ningún usuario autenticado, establecer un estudiante de simulación
          const mockStudentUser = {
            id: `mock-student-id-${Date.now()}`,
            app_metadata: {},
            user_metadata: { role: 'student' as UserRole, name: "Student (Mock)", email: "mock@student.com" },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          };
          setUser(mockStudentUser);
          setCurrentRole('student');
        }
      }

      setLoading(false);
    };
    
    initialLoad();
  }, [refreshUsers]);

  return (
    <AuthContext.Provider value={{ session, user, currentRole, loading, signIn, signUp, signOut, switchUserRole, allStudents, allTeachers, allAdmins, allValidators, refreshUsers }}>
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
