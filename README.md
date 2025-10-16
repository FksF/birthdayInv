# Instrucciones de Setup - Invitación de Cumpleaños

## 🎉 Proyecto de Invitación de Cumpleaños

Una página web moderna para invitación de cumpleaños construida con **Astro + React**, backend en **Supabase**, deployado en **Vercel** y protegido con **Cloudflare**.

## 🚀 Tecnologías

- **Frontend**: Astro + React + TailwindCSS
- **Backend**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **CDN/Seguridad**: Cloudflare (capa gratuita)

## 📋 Configuración Paso a Paso

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings > API y copia:
   - Project URL
   - Anon public key

4. **Crear la tabla de RSVPs** en SQL Editor:

```sql
-- Crear tabla de PINs válidos
CREATE TABLE valid_pins (
  id SERIAL PRIMARY KEY,
  pin_code VARCHAR(4) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crear tabla de RSVPs
CREATE TABLE rsvps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  attending BOOLEAN NOT NULL,
  message TEXT,
  pin_used VARCHAR(4) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insertar PINs de ejemplo
INSERT INTO valid_pins (pin_code) VALUES 
('2210'),
('5678'),
('9876'),
('4321');

-- Habilitar Row Level Security
ALTER TABLE valid_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Allow read access to valid_pins" ON valid_pins FOR SELECT USING (true);
CREATE POLICY "Allow insert access to rsvps" ON rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read access to rsvps" ON rsvps FOR SELECT USING (true);
```

### 3. Variables de Entorno

Renombra `.env` y completa con tus datos de Supabase:

```env
SUPABASE_URL=tu_project_url_aqui
SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 4. Deploy en Vercel

1. Conecta tu repositorio GitHub con Vercel
2. Configura las variables de entorno en Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Deploy automático ✨

### 5. Configurar Cloudflare (Opcional)

1. Crea una cuenta en Cloudflare
2. Agrega tu dominio (o usa el subdominio de Vercel)
3. Configura las siguientes opciones en el dashboard:
   - **SSL**: Full (strict)
   - **Security Level**: Medium
   - **Browser Integrity Check**: On
   - **Challenge Passage**: 30 minutos
   - **DDoS Protection**: Automático (incluido en plan gratuito)

## 🏃‍♂️ Comandos de Desarrollo

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## 📱 Páginas Principales

- `/` - Invitación principal con formulario RSVP
- `/admin` - Panel para ver las respuestas (requiere URL directa)

## 🎨 Personalización

### Cambiar los Datos del Evento

Edita `src/pages/index.astro`:
- Fecha: línea 23 (`22 DE OCTUBRE`)
- Hora: línea 39 (`Desde las 11 AM`)
- Lugar: línea 44-45
- Mensaje: línea 30 (`Solo una tomada más entre patas`)

### Colores y Estilos

Los colores principales están en `tailwind.config.mjs`:
- Primary: Púrpura
- Secondary: Naranja
- Degradados personalizados

## 📊 Funcionalidades

### Formulario RSVP
- ✅ Validación de campos requeridos
- ✅ Selección de asistencia (Sí/No)
- ✅ Mensaje opcional
- ✅ Guardado en Supabase
- ✅ Feedback visual

### Panel Admin
- ✅ Estadísticas de confirmaciones
- ✅ Lista completa de respuestas
- ✅ Filtros por asistencia
- ✅ Exportación de datos

## 🔒 Seguridad

- Variables de entorno para credenciales
- Row Level Security en Supabase
- Cloudflare para protección DDoS y caching
- HTTPS forzado

## 🎯 Contenido Actual

**Evento**: Cumpleaños  
**Fecha**: 22 de Octubre 2025  
**Hora**: Desde las 11 AM  
**Lugar**: Ca. Ramón Castilla 399-383, Miraflores  
**Mensaje**: Solo una tomada más entre patas 🎉

## 🐛 Solución de Problemas

### Error de conexión con Supabase
- Verifica que las variables de entorno estén correctas
- Asegúrate de haber creado la tabla `rsvps`
- Revisa las políticas RLS

### Problemas de deploy en Vercel
- Verifica que las variables de entorno estén configuradas
- Revisa los logs de build en Vercel dashboard

### Formulario no funciona
- Abre Developer Tools y revisa la consola
- Verifica que Supabase esté respondiendo en la pestaña Network

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica los logs de Vercel
3. Confirma la configuración de Supabase

¡Que disfrutes tu cumpleaños! 🎂🎉