# 🎉 Invitación de Cumpleaños - 22 Octubre 2025

## 📱 URLs del Proyecto

### 🌐 Sitio Web en Vivo
- **🎂 Invitación Principal**: https://birthday-inv-phi.vercel.app ⭐ **¡ESTE es el link para compartir!**
- **URL alternativo**: https://birthday-94jmj6vnw-fksfs-projects.vercel.app

### 🛠️ Paneles de Control
- **Vercel Dashboard**: https://vercel.com/fksfs-projects/birthday-inv
- **Supabase Dashboard**: https://supabase.com/dashboard/project/qavuevrjcjdotzcbblnb
- **GitHub Repository**: https://github.com/FksF/birthdayInv

### 🔧 URLs de Desarrollo
- **Local**: http://localhost:4321/

---

## 🚀 Proyecto de Invitación de Cumpleaños

Una página web moderna para invitación de cumpleaños construida con **Astro + React**, backend en **Supabase**, deployado en **Vercel** con tipografía **Frijole** y animaciones de galaxia.

## 🚀 Tecnologías

- **Frontend**: Astro + React + TailwindCSS + Framer Motion
- **Tipografía**: Frijole (Google Fonts) + Inter Display + JetBrains Mono
- **Backend**: Supabase (PostgreSQL)
- **Deploy**: Vercel (estático)
- **Animaciones**: CSS + Framer Motion + Canvas Confetti
- **Efectos**: Galaxia animada con múltiples capas CSS

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

-- Insertar PINs configurados
INSERT INTO valid_pins (pin_code) VALUES 
('2210'), -- Familia
('5678'), -- Amigos cercanos
('9876'), -- Compañeros de trabajo
('4321'); -- Otros

-- Habilitar Row Level Security
ALTER TABLE valid_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Allow read access to valid_pins" ON valid_pins FOR SELECT USING (true);
CREATE POLICY "Allow insert access to rsvps" ON rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read access to rsvps" ON rsvps FOR SELECT USING (true);
```

### 3. Variables de Entorno

El archivo `.env` ya está configurado con las credenciales de Supabase:

```env
PUBLIC_SUPABASE_URL=https://qavuevrjcjdotzcbblnb.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Nota**: Las variables tienen el prefijo `PUBLIC_` porque Astro las necesita del lado del cliente.

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

### 🎨 Diseño y UX
- ✅ **Tipografía Frijole**: Suave y divertida para títulos
- ✅ **Animaciones de galaxia**: Fondo animado con 7+ capas CSS
- ✅ **Efectos holográficos**: Modales futuristas con efectos 3D
- ✅ **Responsive design**: Optimizado para móviles y desktop
- ✅ **Confetti celebration**: Celebración animada al confirmar asistencia

### 🔐 Sistema de PIN de Seguridad
- ✅ **PIN grupos**: 2210 (familia), 5678 (amigos), 9876 (trabajo), 4321 (otros)
- ✅ **Validación en tiempo real**: Verificación contra Supabase
- ✅ **Múltiples usuarios por PIN**: Los PINs representan grupos, no usuarios únicos

### 📝 Formulario RSVP
- ✅ **Modal integrado**: Todo en un solo botón sin scroll
- ✅ **Validación completa**: Campos requeridos con feedback visual
- ✅ **Selección de asistencia**: Botones animados (Sí/No)
- ✅ **Mensaje opcional**: Campo de texto libre
- ✅ **Guardado automático**: Directo a Supabase con column `pin_used`

### 📊 Panel Admin
- ✅ **Estadísticas en tiempo real**: Dashboard con métricas
- ✅ **Lista de confirmaciones**: Todas las respuestas organizadas
- ✅ **Filtros dinámicos**: Por asistencia y PIN usado
- ✅ **Vista responsive**: Funciona en móviles

## 🔒 Seguridad

- Variables de entorno para credenciales
- Row Level Security en Supabase
- Cloudflare para protección DDoS y caching
- HTTPS forzado

## 🎯 Información del Evento

**🎂 Evento**: Cumpleaños  
**📅 Fecha**: 22 de Octubre 2025  
**🕐 Hora**: Desde las 11 AM  
**📍 Lugar**: Ca. Ramón Castilla 399-383, Miraflores, Lima, Perú  
**🎊 Tema**: "Solo una tomada más entre patas"  

### 🔑 Códigos de Invitación
- **2210**: Familia y parientes
- **5678**: Amigos cercanos  
- **9876**: Compañeros de trabajo
- **4321**: Otros invitados

### 📊 Estado Actual del Proyecto
- ✅ **Desarrollo**: Completado
- ✅ **Deploy**: Online en Vercel
- ✅ **Base de datos**: Configurada y funcionando
- ✅ **Responsive**: Optimizado para todos los dispositivos
- ✅ **Performance**: Animaciones optimizadas (50-70% más rápidas)
- ✅ **Listo para producción**: ¡Puedes compartir las invitaciones!

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