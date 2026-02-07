# 🎯 Rentman-Capacitor: Proyecto Clonado + IA

## ✅ COMPLETADO (10 minutos)

### 1. Estructura Base Copiada
```
rentman-capacitor/
├── src/
│   ├── app/            # Next.js pages
│   ├── components/     # UI components
│   ├── contexts/       # React contexts
│   │   ├── AuthContext.tsx
│   │   └── SarahContext.tsx    ← Sistema de IA
│   ├── hooks/
│   ├── lib/
│   └── plugins/
├── public/
├── certificates/
├── icons/
├── resources/
├── capacitor.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### 2. Sistema de IA Encontrado
**Archivo**: `src/contexts/SarahContext.tsx`

**Características**:
- ✅ WebSocket connection al backend
- ✅ Sistema de conversación bidireccional
- ✅ Audio input/output (opcional)
- ✅ Screen context awareness
- ✅ User action tracking
- ✅ Mode switching (normal, full-page)

**Backend**: Cloud Run (WebSocket server)
- URL: `process.env.NEXT_PUBLIC_BACKEND_URL`
- Provider actual: Gemini API
- Fácilmente adaptable a Vertex AI

---

## 📋 PRÓXIMOS PASOS

### PASO 1: Configuración Básica (15 min)

```bash
cd C:\Users\Natan\Documents\predict\Rentman\rentman-capacitor

# 1. Actualizar package.json
# - name: "rentman-app"
# - version: "1.0.0"

# 2. Actualizar capacitor.config.ts
# - appId: 'com.rentman.app'
# - appName: 'Rentman'

# 3. Crear .env.local
NEXT_PUBLIC_SUPABASE_URL=<tu-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-key>
NEXT_PUBLIC_BACKEND_URL=<backend-url-vertex>

# 4. Instalar dependencias
npm install
```

### PASO 2: Adaptar IA para Rentman (30 min)

#### Opción A: Mantener Backend Actual + Agregar Vertex
```typescript
// src/contexts/RentmanAssistantContext.tsx

// Cambiar:
const BACKEND_URL = process.env.NEXT_PUBLIC_VERTEX_BACKEND_URL;

// Prompts adaptados:
const SYSTEM_PROMPT = `
Eres el asistente de Rentman, una plataforma de alquiler...
Ayudas a los usuarios con:
- Buscar propiedades
- Gestionar reservas
- Responder preguntas sobre listings
- Etc.
`;
```

#### Opción B: API Directa Vertex AI (más simple)
```typescript
// src/lib/vertexAI.ts

import { VertexAI } from '@google-cloud/vertexai';

export async function chat(message: string) {
  const vertex = new VertexAI({
    project: 'tu-project',
    location: 'us-central1'
  });
  
  const model = vertex.getGenerativeModel({
    model: 'gemini-pro'
  });
  
  const response = await model.generateContent(message);
  return response.text();
}
```

### PASO 3: Limpiar UI de Sarah (20 min)

Archivos a renombrar/actualizar:
```bash
# Renombrar:
src/contexts/SarahContext.tsx → RentmanAssistantContext.tsx

# Actualizar referencias en:
src/app/layout.tsx
src/components/*.tsx (todos los que usen useSarah)

# Buscar y reemplazar globalmente:
"Sarah" → "Rentman Assistant"
"sarah" → "rentman"
"SarahContext" → "RentmanAssistantContext"
"useSarah" → "useRentmanAssistant"
```

### PASO 4: Copiar Código de Rentman-app (45 min)

```bash
# Copiar desde rentman-app a rentman-capacitor/src:

# 1. Types
cp rentman-app/types/* src/types/

# 2. Services (Supabase)
cp rentman-app/services/* src/lib/services/

# 3. Components (adaptar de React Native a Next.js)
# - Cambiar StyleSheet → Tailwind
# - Cambiar View/Text → div/span con className

# 4. Contexts
cp rentman-app/contexts/AuthContext.tsx src/contexts/
# (Adaptar para Next.js si es necesario)
```

### PASO 5: Build Local (5 min)

```bash
# 1. Build Next.js
npm run build

# 2. Sync Capacitor
npx cap sync

# 3. Build Android
cd android
./gradlew.bat assembleRelease

# APK en: android/app/build/outputs/apk/release/
```

---

## 🤖 ESTRATEGIA DE IA

### Configuración Recomendada:

**Backend Architecture**:
```
Frontend (rentman-capacitor)
    ↓
Backend API (Cloud Function/Cloud Run)
    ↓
Vertex AI (Gemini Pro)
    ↓
Supabase (contexto del usuario)
```

**Por qué NO integrar Vertex AI directamente:**
1. ❌ Requiere credenciales de servicio
2. ❌ No es seguro exponer en frontend
3. ❌ Billing directo al usuario

**Por qué SÍ usar Backend intermediario:**
1. ✅ Seguro (credenciales en server)
2. ✅ Rate limiting
3. ✅ Caching
4. ✅ Logging
5. ✅ Costos controlados

### Backend Simple para Vertex AI:

```javascript
// backend/vertex-proxy.js (Cloud Function)

const { VertexAI } = require('@google-cloud/vertexai');

exports.chat = async (req, res) => {
  const { message, userId } = req.body;
  
  // 1. Verificar usuario en Supabase
  const user = await verifyUser(userId);
  
  // 2. Obtener contexto
  const context = await getUserContext(userId);
  
  // 3. Llamar Vertex AI
  const vertex = new VertexAI({
    project: 'agent-gen-1',
    location: 'us-central1'
  });
  
  const model = vertex.getGenerativeModel({
    model: 'gemini-pro'
  });
  
  const prompt = `
Context: ${JSON.stringify(context)}
User: ${message}
  `;
  
  const response = await model.generateContent(prompt);
  
  res.json({ response: response.text() });
};
```

---

## ⏱️ TIMELINE TOTAL: ~2 HORAS

| Paso | Tarea | Tiempo |
|------|-------|--------|
| ✅ 1 | Copiar estructura | 10 min |
| ⏳ 2 | Configuración básica | 15 min |
| ⏳ 3 | Adaptar IA | 30 min |
| ⏳ 4 | Limpiar UI Sarah | 20 min |
| ⏳ 5 | Copiar código Rentman | 45 min |
| ⏳ 6 | Build local | 5 min |
| **TOTAL** | | **2 horas** |

---

## 🎯 DECISIÓN RÁPIDA SOBRE IA

### Opción 1: Mantener IA Completa (2 hrs)
- Backend WebSocket
- Audio input/output
- Screen context
- Conversación bidireccional

### Opción 2: IA Simple (1.5 hrs) ⭐ RECOMENDADO
- API simple texto → respuesta
- Sin audio (por ahora)
- Chat básico
- Agregar features después

---

## 📝 SIGUIENTE COMANDO

```bash
cd C:\Users\Natan\Documents\predict\Rentman\rentman-capacitor
code .
```

Luego ejecutar PASO 1 (Configuración Básica).

---

**Fecha**: 2026-02-06  
**Estado**: Base copiada, listo para configurar  
**Próximo**: Actualizar package.json y capacitor.config.ts
