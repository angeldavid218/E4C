-- SQL para crear las tablas de usuarios faltantes en Supabase (admins, teachers, validators, students)
-- Ejecuta esto en el SQL Editor de tu Dashboard de Supabase.

-- 1. Tabla de Administradores
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    stellar_public_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de Docentes
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    escuela TEXT,
    subjects TEXT[], -- Array de materias
    stellar_public_key TEXT UNIQUE,
    status TEXT DEFAULT 'pending', -- approved, pending, rejected
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de Validadores
CREATE TABLE IF NOT EXISTS public.validators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    escuelas TEXT[], -- Lista de escuelas asignadas
    stellar_public_key TEXT UNIQUE,
    status TEXT DEFAULT 'pending', -- approved, pending, rejected
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de Estudiantes
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    enrollment_date TIMESTAMPTZ DEFAULT now(),
    tokens INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    nfts TEXT[] DEFAULT '{}',
    grade TEXT,
    curso TEXT,
    division TEXT,
    escuela TEXT,
    alias TEXT,
    stellar_public_key TEXT UNIQUE,
    status TEXT DEFAULT 'pending', -- approved, pending, rejected
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla de Wallets Stellar (Auxiliar para las Edge Functions)
CREATE TABLE IF NOT EXISTS public.stellar_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admins(id),
    public_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    role TEXT NOT NULL, -- issuer, distributor, escrow
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Opcional por ahora para el MVP, pero recomendado)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stellar_wallets ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples (Permitir lectura y escritura para pruebas en el MVP)
-- NOTA: En producción estas políticas deben ser mucho más restrictivas.
CREATE POLICY "Public Read Access" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.admins FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Access" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.teachers FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Access" ON public.validators FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.validators FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Access" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.students FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Access" ON public.stellar_wallets FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.stellar_wallets FOR INSERT WITH CHECK (true);
