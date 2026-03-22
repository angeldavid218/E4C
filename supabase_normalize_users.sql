-- ========================================================
-- SCRIPT DEFINITIVO DE NORMALIZACIÓN: PROYECTO E4C
-- ========================================================
-- Este script consolida todos los usuarios en la tabla 'profiles'
-- y actualiza las tablas dependientes (tasks, rewards, etc.)

-- 1. LIMPIEZA TOTAL (Cuidado: Borra datos de prueba previos)
DROP TABLE IF EXISTS public.redeems CASCADE;
DROP TABLE IF EXISTS public.student_tasks CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.stellar_wallets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABLA ÚNICA DE PERFILES (profiles)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'validator')),
    stellar_public_key TEXT UNIQUE,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')), -- Por defecto approved para el hackaton
    
    -- Datos compartidos (escuelas/institución)
    escuela TEXT,
    curso TEXT,
    division TEXT,
    
    -- Datos de Estudiante
    tokens INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    nfts TEXT[] DEFAULT '{}',
    grade TEXT,
    alias TEXT,
    enrollment_date TIMESTAMPTZ DEFAULT now(),

    -- Datos de Docente
    subjects TEXT[], 

    -- Datos de Validador
    escuelas TEXT[], -- Lista de escuelas que supervisa

    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BILLETERAS STELLAR INSTITUCIONALES
CREATE TABLE public.stellar_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    role TEXT NOT NULL, -- issuer, distributor, escrow
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TAREAS (vinculadas a un Docente en profiles)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    points INTEGER NOT NULL DEFAULT 10,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ENTREGAS DE ESTUDIANTES (vinculadas a profiles y tasks)
CREATE TABLE public.student_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'teacher_approved', 'rejected_by_teacher', 'validator_approved', 'rejected_by_validator')),
    assigned_date TIMESTAMPTZ DEFAULT now(),
    completed_date TIMESTAMPTZ,
    evidence_url TEXT,
    grade INTEGER,
    feedback TEXT
);

-- 6. PARTNERS Y RECOMPENSAS (Marketplace)
CREATE TABLE public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cost_e4c INTEGER NOT NULL CHECK (cost_e4c > 0),
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMPTZ,
    stock INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CANJES (vinculados a Estudiante y Recompensa)
CREATE TABLE public.redeems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'completed',
    redeemed_at TIMESTAMPTZ DEFAULT now(),
    blockchain_hash TEXT -- Para el registro de la transacción en Stellar
);

-- 8. SOLICITUDES DE NFT (Logros)
CREATE TABLE public.nft_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    evidence TEXT,
    request_date TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    teacher_name TEXT,
    status TEXT DEFAULT 'pending-admin' CHECK (status IN ('pending-admin', 'pending-validator', 'approved', 'rejected', 'blockchain-pending', 'blockchain-confirmed')),
    teacher_signature JSONB, -- {name, timestamp}
    admin_signature JSONB,
    validator_signature JSONB,
    rejection_reason TEXT,
    blockchain_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. SEGURIDAD (RLS) - Acceso libre para facilitar el desarrollo (MVP)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.stellar_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Wallets" ON public.stellar_wallets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Student Tasks" ON public.student_tasks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Partners" ON public.partners FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Rewards" ON public.rewards FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.redeems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Redeems" ON public.redeems FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.nft_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All NFT Requests" ON public.nft_requests FOR ALL USING (true) WITH CHECK (true);
