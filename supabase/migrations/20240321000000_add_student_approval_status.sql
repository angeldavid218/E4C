-- Migración: Soporte para aprobación de alumnos vía QR
-- 1. Limpiar alumnos existentes
DELETE FROM students;

-- 2. Añadir columna de estado si no existe
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 3. Asegurar que la clave pública sea requerida para el nuevo flujo Web3
ALTER TABLE students 
ALTER COLUMN stellar_public_key SET NOT NULL;
