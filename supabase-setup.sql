-- Script de configuración para Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- 1. Crear la tabla para los PINs válidos
CREATE TABLE IF NOT EXISTS valid_pins (
  id BIGSERIAL PRIMARY KEY,
  pin_code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insertar PINs válidos (puedes cambiar estos códigos)
INSERT INTO valid_pins (pin_code, description) VALUES 
('2210', 'PIN principal para invitados'),
('5678', 'PIN alternativo'),
('9876', 'PIN para familia'),
('4321', 'PIN para amigos cercanos')
ON CONFLICT (pin_code) DO NOTHING;

-- 3. Crear la tabla para las respuestas RSVP
CREATE TABLE IF NOT EXISTS rsvps (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) >= 2),
  attending BOOLEAN NOT NULL,
  message TEXT,
  pin_used TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE valid_pins ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de seguridad

-- Permitir INSERT a usuarios anónimos solo si el PIN es válido
CREATE POLICY "Allow public inserts with valid pin" ON rsvps
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM valid_pins 
      WHERE pin_code = pin_used AND is_active = true
    )
  );

-- Permitir SELECT a usuarios anónimos (para la página de admin)
CREATE POLICY "Allow public selects on rsvps" ON rsvps
  FOR SELECT TO anon
  USING (true);

-- Permitir SELECT de PINs válidos para validación
CREATE POLICY "Allow public pin validation" ON valid_pins
  FOR SELECT TO anon
  USING (is_active = true);

-- 6. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_rsvps_submitted_at ON rsvps(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvps_attending ON rsvps(attending);
CREATE INDEX IF NOT EXISTS idx_rsvps_pin_used ON rsvps(pin_used);
CREATE INDEX IF NOT EXISTS idx_valid_pins_code ON valid_pins(pin_code);

-- 5. Insertar datos de prueba (opcional - eliminar en producción)
-- INSERT INTO rsvps (name, attending, message) VALUES
-- ('Juan Pérez', true, '¡No me lo perdería por nada!'),
-- ('María García', false, 'Lo siento, tengo otro compromiso'),
-- ('Carlos López', true, 'Ahí estaremos para celebrar');

-- 6. Consultas útiles para verificar

-- Ver todas las respuestas
-- SELECT * FROM rsvps ORDER BY submitted_at DESC;

-- Ver estadísticas
-- SELECT 
--   COUNT(*) as total_respuestas,
--   COUNT(*) FILTER (WHERE attending = true) as confirmados,
--   COUNT(*) FILTER (WHERE attending = false) as no_asisten,
--   ROUND(COUNT(*) FILTER (WHERE attending = true) * 100.0 / COUNT(*), 2) as porcentaje_asistencia
-- FROM rsvps;