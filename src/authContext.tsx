import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, Student, Teacher, Admin, Validator, Profile } from './types';
import { supabase } from './lib/supabaseClient'; 
import FreighterApi from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

// Extraer funciones con fallback para diferentes versiones
const { getPublicKey, isConnected, signTransaction } = (FreighterApi as any).default || FreighterApi;

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
    stellar_public_key?: string;
    [key: string]: unknown;
  };
  aud: string;
  created_at: string;
  [key: string]: unknown;
}

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
  signInWithFreighter: () => Promise<void>;
  signOut: () => Promise<void>;
  switchUserRole: (role: UserRole, id?: string) => Promise<void>;
  
  // Nuevo estado unificado
  allProfiles: Profile[];
  
  // Getters para compatibilidad (derivados de allProfiles)
  allStudents: Student[];
  allTeachers: Teacher[];
  allAdmins: Admin[];
  allValidators: Validator[];
  
  currentRole: UserRole;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('unauthenticated');
  const [loading, setLoading] = useState(true);
  
  // Estado unificado
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  // Derivados para compatibilidad
  const allStudents = allProfiles.filter(p => p.role === 'student') as Student[];
  const allTeachers = allProfiles.filter(p => p.role === 'teacher') as Teacher[];
  const allAdmins = allProfiles.filter(p => p.role === 'admin') as Admin[];
  const allValidators = allProfiles.filter(p => p.role === 'validator') as Validator[];

  const signIn = async (email: string, password: string) => {
    // Lógica para permitir el Bootstrap del Admin inicial
    if (email.includes('admin') && password === 'password') {
      const mockAdmin: User = {
        id: '00000000-0000-0000-0000-000000000000', // UUID válido para bootstrap
        app_metadata: {},
        user_metadata: { email, name: 'Administrador Maestro', role: 'admin' as UserRole },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      setUser(mockAdmin);
      setCurrentRole('admin');
      setSession({
        access_token: 'admin-token',
        refresh_token: 'admin-refresh',
        user: mockAdmin,
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });
      return Promise.resolve({ user: mockAdmin, session: null });
    } else {
      throw new Error("Credenciales de administrador inválidas.");
    }
  };

  const signInWithFreighter = async () => {
    try {
      // Re-verificar conexión con un pequeño delay por si la extensión tarda en cargar
      let connected = await isConnected();
      if (!connected) {
        // Un segundo intento tras 500ms
        await new Promise(r => setTimeout(r, 500));
        connected = await isConnected();
      }

      if (!connected) {
        throw new Error("Freighter no detectado. Asegúrate de que la extensión esté instalada, desbloqueada y configurada en Testnet.");
      }

      const publicKey = await getPublicKey();
      if (!publicKey) {
        throw new Error("No se pudo obtener la clave pública. Por favor, abre la extensión Freighter y permite el acceso.");
      }

      // Buscar usuario en la tabla unificada 'profiles'
      console.log("Iniciando sesión con PK:", publicKey);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('stellar_public_key', publicKey)
        .maybeSingle();

      if (error) {
        console.error("Error buscando perfil:", error);
        throw new Error("Error al consultar la base de datos.");
      }

      if (!profile) {
        throw new Error("No se encontró ningún usuario vinculado a esta wallet. Por favor regístrate primero o contacta al admin.");
      }

      const role: UserRole = profile.role as UserRole;

      // --- AUTOMATIZACIÓN TRUSTLINE (E4C) ---
      // Solo automatizar si el alumno ya está APROBADO (ahorramos XLM y fees del distribuidor)
      if (role === 'student' && profile.status === 'approved') {
        try {
          const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
          const account = await server.accounts().accountId(publicKey).call();
          
          const { data: issuerWallet } = await supabase.from('stellar_wallets').select('public_key').eq('role', 'issuer').maybeSingle();
          
          const hasTrustline = account.balances.some(b => 
            (b as any).asset_code === 'E4C' && (b as any).asset_issuer === issuerWallet?.public_key
          );

          if (!hasTrustline && issuerWallet) {
            console.log("Detectado Trustline faltante en alumno aprobado. Habilitando...");
            const E4C_ASSET = new StellarSdk.Asset('E4C', issuerWallet.public_key);
            
            const tx = new StellarSdk.TransactionBuilder(
              new StellarSdk.Account(publicKey, account.sequence),
              { fee: '1000', networkPassphrase: StellarSdk.Networks.TESTNET }
            )
              .addOperation(StellarSdk.Operation.changeTrust({ asset: E4C_ASSET }))
              .setTimeout(30)
              .build();

            const xdr = tx.toXDR();
            const signedXdr = await signTransaction(xdr, { network: "TESTNET" });
            await server.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET));
            console.log("Token E4C habilitado automáticamente.");
          }
        } catch (trustError) {
          console.warn("No se pudo automatizar el trustline:", trustError);
        }
      }

      const authenticatedUser: User = {
        id: profile.id,
        app_metadata: {},
        user_metadata: { 
          role, 
          name: profile.name, 
          email: profile.email,
          stellar_public_key: publicKey,
          status: profile.status
        },
        aud: 'authenticated',
        created_at: profile.created_at || new Date().toISOString(),
      };

      const mockSession: Session = {
        access_token: `freighter-session-${publicKey}`,
        refresh_token: 'mock-refresh-token',
        user: authenticatedUser,
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      setUser(authenticatedUser);
      setCurrentRole(role);
      setSession(mockSession);
    } catch (error: any) {
      console.error("Error signing in with Freighter:", error);
      throw error;
    }
  };

  const signUp = async (email: string) => {
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
    setUser(mockUser);
    setCurrentRole('student');
    setSession(mockSession);
    return Promise.resolve({ user: mockUser, session: mockSession });
  };

  const signOut = async () => {
    setUser(null);
    setCurrentRole('unauthenticated');
    setSession(null);
    return Promise.resolve();
  };

  const refreshUsers = useCallback(async () => {
    const { data: profilesData, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error("Error fetching profiles:", error);
    } else if (profilesData) {
      // Ordenar por nombre por defecto
      setAllProfiles(profilesData.sort((a, b) => a.name.localeCompare(b.name)) as Profile[]);
    }
  }, []);

  const switchUserRole = useCallback(async (role: UserRole, id?: string) => {
    setCurrentRole(role);
    let selectedUser: User | null = null;
    const userMetadata: { role: UserRole; [key: string]: unknown } = { role };

    const found = id ? allProfiles.find(u => u.id === id) : allProfiles.find(u => u.role === role);

    if (found) {
      selectedUser = {
        id: found.id,
        app_metadata: {},
        user_metadata: { 
          ...userMetadata, 
          name: found.name, 
          email: found.email, 
          stellar_public_key: found.stellar_public_key,
          status: found.status
        },
        aud: 'authenticated',
        created_at: found.created_at || new Date().toISOString(),
      };
    }
    setUser(selectedUser);
    if (selectedUser) {
      setSession({
        access_token: `mock-access-token-${selectedUser.id}`,
        refresh_token: 'mock-refresh-token',
        user: selectedUser,
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });
    }
  }, [allProfiles]);

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      setSession(supabaseSession as any);
      await refreshUsers();
      if (!supabaseSession) {
        setUser(null);
        setCurrentRole('unauthenticated');
      }
      setLoading(false);
    };
    initialLoad();
  }, [refreshUsers]);

  return (
    <AuthContext.Provider value={{ 
      session, user, currentRole, loading, 
      signIn, signUp, signInWithFreighter, signOut, switchUserRole, 
      allProfiles, allStudents, allTeachers, allAdmins, allValidators, 
      refreshUsers 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
