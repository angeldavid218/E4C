-- Función para decrementar tokens de forma atómica
CREATE OR REPLACE FUNCTION decrement_student_tokens(row_id UUID, amount_to_subtract INT)
RETURNS void AS $$
BEGIN
  UPDATE students
  SET tokens = GREATEST(0, COALESCE(tokens, 0) - amount_to_subtract)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- Asegurarse de que el tipo UUID esté disponible si no lo está
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creación de la tabla 'redeems' si no existe
-- Esta tabla registrará cada canje de recompensa por parte de un estudiante
CREATE TABLE IF NOT EXISTS public.redeems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id),
    reward_id TEXT NOT NULL, -- ID de la recompensa canjeada
    amount INTEGER NOT NULL, -- Cantidad de tokens E4C canjeados
    stellar_tx_hash TEXT NOT NULL UNIQUE, -- Hash de la transacción Stellar para validación
    voucher_uuid TEXT NOT NULL UNIQUE, -- UUID usado como memo en la transacción Stellar
    status TEXT NOT NULL DEFAULT 'pending_validation', -- Ej: 'pending_validation', 'validated', 'rejected'
    redeem_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar políticas RLS para 'redeems' (ejemplo, ajustar según necesidades de seguridad)
ALTER TABLE public.redeems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own redeems." ON public.redeems
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all redeems." ON public.redeems
  FOR SELECT TO authenticated USING (auth.jwt() ->> 'user_role' = 'admin');

-- Función para actualizar el estado del canje por el validador del comercio
-- Esto sería invocado por una Edge Function del validador o directamente por la app del comercio
CREATE OR REPLACE FUNCTION update_redeem_status(voucher TEXT, new_status TEXT)
RETURNS void AS $$
BEGIN
  UPDATE redeems
  SET status = new_status
  WHERE voucher_uuid = voucher;
END;
$$ LANGUAGE plpgsql;
