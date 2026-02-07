# Rentman Project (Monorepo)

Welcome to the Rentman project. This repository is organized as a monorepo containing the following applications:

## 📂 Project Structure

### `apps/` (Active Projects)

- **[mobile](apps/mobile)**: The Android functionality (Capacitor + Next.js).
  - *Command*: `cd apps/mobile && npm run android:run`
  
- **[dashboard](apps/dashboard)**: The Web Dashboard (Vite + React).
  - *Command*: `cd apps/dashboard && npm run dev`
  - *Deploy*: Vercel (Root Directory: `apps/dashboard`)

- **[cli](apps/cli)**: Backend CLI tool for M2M tasks.
  - *Command*: `cd apps/cli && npm link`

- **[backend](apps/backend)**: Internal API for Vertex AI and validation.
  - *Deploy*: Cloud Run

### `_archive/` (Legacy Code)

- **legacy_mobile_expo**: Old Expo-based mobile app (`rentman-app`).
- **legacy_mobile_v2**: Old React Native test app (`rentman-v2`).

## 🚀 Getting Started

To work on a specific app, navigate to its directory:

```bash
cd apps/mobile
npm install
npm run dev
```

## 🔄 Communication Architecture

All apps communicate through **Supabase** as the central hub:

```
CLI (Agents) → Supabase ← Mobile/Dashboard (Operators)
                 ↓
              Webhook
                 ↓
         Backend (Cloud Run) → Vertex AI
                 ↓
              Supabase (update)
```

**Flow:**
1. CLI creates signed task → Supabase
2. Database trigger → Webhook → Backend
3. Backend validates signature + AI analysis
4. Updates task status in Supabase
5. Mobile/Dashboard read in real-time

See full architecture details in project documentation.

## 🧪 Testing

### Quick Test (recommended for dev):
```bash
# Unit tests (< 1s)
node apps/backend/test-signature.js

# Integration tests (< 5s)
node apps/cli/test-integration.js
```

### Full E2E Test:
```bash
# Complete flow test (30-60s)
.\test-flow.ps1

# Quick mode (skip AI)
.\test-flow.ps1 -Quick

# With cleanup
.\test-flow.ps1 -CleanDB
```

### Manual Testing:
See comprehensive guide: **[TESTING_GUIDE.md](TESTING_GUIDE.md)**

### Testing Documentation:
- **[TESTING_STRATEGY.md](TESTING_STRATEGY.md)** - Complete testing strategy
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Manual testing guide
- `test-flow.ps1` - Automated E2E tests

## 📚 Additional Documentation

- [Testing Strategy](TESTING_STRATEGY.md)
- [Testing Guide](TESTING_GUIDE.md)
- App-specific READMEs in each `apps/` directory
Análisis del Estado de las Apps en Rentman

   🏗️ Arquitectura Genera

   Monorepo organizado con 4 aplicaciones activas en /apps:

   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

   1️⃣ Backend (apps/backend

   Tipo: API Express.js
   Estado: ✅ Funcional
   Propósito: Servidor webhook + Integración Vertex AI

   Stack:

     - Express.js (v5.2.1)
     - Supabase Client
     - Google Cloud Vertex AI
     - TweetNaCl (criptografía)

   Funcionalidad:

     - Endpoint de webhooks para nuevas tareas (/webhooks/tasks)
     - Validación de firmas criptográficas con claves públicas
     - Procesamiento automático de tareas nuevas desde Supabase
     - Health check endpoint (/)

   Deploy: Cloud Run (puerto 8080)

   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

   2️⃣ CLI (apps/cli

   Tipo: Herramienta de línea de comandos
   Estado: ✅ Funcional
   Propósito: Interfaz para agentes AI para crear tareas y contratar humanos

   Stack:

     - Commander.js (CLI framework)
     - Supabase Client
     - Inquirer (prompts interactivos)
     - Chalk, Ora, CLI-table3 (UI)

   Comandos principales:

     - rentman login - Autenticación
     - rentman task create - Crear tareas desde JSON
     - rentman task map - Ver tareas activas

   Features:

     - Sistema de autenticación con API keys
     - Validación de schemas (AJV)
     - Configuración persistente (~/.rentman/config.json)
     - Generación de identidades criptográficas

   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  

   3️⃣ Dashboard (apps/dashboard

   Tipo: Aplicación web (Vite + React)
   Estado: ✅ Funcional
   Propósito: Panel web para operadores

   Stack:

     - React 19.2.4
     - Vite 6.2.0
     - TailwindCSS 3.4.19
     - Supabase Client
     - React Router DOM

   Features:

     - Autenticación con Google OAuth
     - Expo Fonts (Inter, JetBrains Mono)
     - Generación de imágenes (html-to-image)
     - NativeWind para estilos

   Deploy: Vercel (configurado en vercel.json)

   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  

   4️⃣ Mobile (apps/mobile

   Tipo: App Android (Next.js + Capacitor)
   Estado: 🚧 En desarrollo activo
   Propósito: Aplicación móvil nativa para operadores

   Stack:

     - Next.js 16.1.1
     - React 19.2.3
     - Capacitor 8.0.0
     - TailwindCSS 4
     - TypeScript 5

   Features implementadas:

     - Sistema de navegación con páginas de perfil, inbox, chat
     - Notificaciones locales
     - Integración con Supabase
     - Animaciones (Framer Motion)
     - Sistema de gamificación con confetti
     - Componentes de UI (Heroicons, Lucide React)
     - Toasts (react-hot-toast)

   Scripts disponibles:

     - android:build - Compilar APK debug
     - android:release - Compilar APK release
     - android:run - Instalar y ejecutar
     - cap:sync - Sincronizar cambios

   Documentación extensa:

     - Múltiples guías MD para deployment Android
     - Sistema de colores dopaminérgicos
     - Propuesta de gamificación
     - Auditorías de funcionalidad y UX

   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  

   🎯 Estado del Repositorio

     - Branch: master (1 commit adelante de origin)
     - Último commit: Implementación inicial de páginas mobile
     - Working tree: Limpio, sin cambios pendientes

   📈 Conclusión

   Proyecto bien estructurado con todas las piezas del ecosistema Rentman funcionando: backend para webhooks/AI, CLI para agentes, dashboard web para operadores, y mobile app en desarrollo activo con documentación
   exhaustiva.

   Comunicación entre las Aplicaciones Rentman

   Arquitectura de Comunicación

   Todas las apps se comunican a través de Supabase como capa central:

     ┌─────────────┐
     │   CLI       │──┐
     │  (Agentes)  │  │
     └─────────────┘  │
                      │
     ┌─────────────┐  │    ┌──────────────────┐    ┌─────────────┐
     │  Dashboard  │──┼───►│    SUPABASE      │◄───│   Backend   │
     │   (Web)     │  │    │  (PostgreSQL +   │    │ (Cloud Run) │
     └─────────────┘  │    │   Realtime)      │    └─────────────┘
                      │    └──────────────────┘           ▲
     ┌─────────────┐  │            │                      │
     │   Mobile    │──┘            │                      │
     │  (Android)  │               └──────────────────────┘
     └─────────────┘                   Webhook Trigger

   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

   🔐 Flujo Completo de una Tarea

   Fase 1: Creación (CLI → Supabase)

     - CLI genera una tarea con firma criptográfica:
       - Carga identidad del agente (secret_key)
       - Crea mensaje: "title:agent_id:timestamp:nonce"
       - Firma con TweetNaCl (Ed25519)
       - Envía INSERT directo a tabla tasks en Supabase

     // CLI: Firma y envía
     const signature = nacl.sign.detached(message, secretKey);
     await supabase.from('tasks').insert({
       title, description, agent_id,
       signature: signatureBase64,
       metadata: payload
     });

   Fase 2: Webhook Trigger (Supabase → Backend)

     - Trigger PostgreSQL (on_task_created) detecta el INSERT:
       - Usa extensión pg_net para hacer HTTP POST
       - Envía payload completo al Backend en Cloud Run
       - URL: https://rentman-backend-*.run.app/webhooks/tasks?secret=...

     -- Trigger automático en Supabase
     SELECT net.http_post(
       url := 'BACKEND_URL/webhooks/tasks?secret=SECRET',
       body := jsonb_build_object('type', 'INSERT', 'record', NEW)
     );

   Fase 3: Validación (Backend)

     - Backend recibe webhook y valida:
       - Verifica WEBHOOK_SECRET (seguridad)
       - Busca public_key del agente en Supabase
       - Verifica firma criptográfica con TweetNaCl
       - Si válida → actualiza status a verifying

     // Backend: Verifica firma
     const verified = nacl.sign.detached.verify(
       messageBytes, signatureBytes, publicKeyBytes
     );
     if (verified) {
       await updateTaskStatus(id, 'verifying');
     }

   Fase 4: Análisis AI (Backend → Vertex AI)

     - Backend llama a Vertex AI (Gemini 2.5 Flash):
     
       - Analiza viabilidad, seguridad, complejidad
       - Recibe análisis en JSON
       - Actualiza status: matching (aprobado) o flagged (revisión)

     // Backend: Análisis AI
     const result = await vertex_ai.generateContent(prompt);
     if (aiAnalysis.viable && safety_score > 70) {
       await updateTaskStatus(id, 'matching');
     }

   Fase 5: Visualización (Supabase → Mobile/Dashboard)

     - Mobile/Dashboard leen en tiempo real:
       - Conectados vía Supabase Client
       - Usan Realtime subscriptions para cambios
       - Filtran por RLS policies (Row Level Security)

     // Mobile: Lee tareas
     const { data } = await supabase
       .from('tasks')
       .select('*')
       .eq('status', 'matching');

     // Suscripción en tiempo real
     supabase.channel('tasks')
       .on('INSERT', payload => console.log('Nueva tarea!'))
       .subscribe();

   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  

   🔑 Componentes de Seguridad

   ┌─────────────────────────────┬────────────────────────────────────────────┐
   │ Capa                        │ Mecanismo                                  │
   ├─────────────────────────────┼────────────────────────────────────────────┤
   │ CLI → Supabase              │ Firma Ed25519 con clave privada del agente │
   ├─────────────────────────────┼────────────────────────────────────────────┤
   │ Supabase → Backend          │ Webhook secret en URL params               │
   ├─────────────────────────────┼────────────────────────────────────────────┤
   │ Backend → Supabase          │ Service Role Key (admin)                   │
   ├─────────────────────────────┼────────────────────────────────────────────┤
   │ Mobile/Dashboard → Supabase │ Anon Key + RLS Policies                    │
   └─────────────────────────────┴────────────────────────────────────────────┘

   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  

   📡 URL Común (Supabase)

   Todas las apps usan la misma instancia:

     https://uoekolfgbbmvhzsfkjef.supabase.co

   Keys diferentes:

     - CLI/Mobile/Dashboard: SUPABASE_ANON_KEY (público, limitado por RLS)
     - Backend: SUPABASE_SERVICE_ROLE_KEY (admin, bypasses RLS)

   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  

   Resumen de Responsabilidades

   ┌───────────┬───────────────────────────┬─────────────────────────────────────┐
   │ App       │ Rol                       │ Comunicación                        │
   ├───────────┼───────────────────────────┼─────────────────────────────────────┤
   │ CLI       │ Crear tareas firmadas     │ Write directo a Supabase            │
   ├───────────┼───────────────────────────┼─────────────────────────────────────┤
   │ Backend   │ Validar + AI              │ Recibe webhooks, escribe resultados │
   ├───────────┼───────────────────────────┼─────────────────────────────────────┤
   │ Mobile    │ Operadores aceptan tareas │ Read/Write Supabase (RLS protegido) │
   ├───────────┼───────────────────────────┼─────────────────────────────────────┤
   │ Dashboard │ Visualización web         │ Read Supabase (RLS protegido)       │
   └───────────┴───────────────────────────┴─────────────────────────────────────┘

   No hay comunicación directa entre apps, todo pasa por Supabase como single source of truth.
