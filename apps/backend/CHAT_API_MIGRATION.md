# Chat API Migration - FASE 1 COMPLETA ✅

**Fecha:** 2026-02-08 23:07  
**Status:** Backend preparado - Sin romper nada existente

---

## ✅ Cambios Implementados

### 1. Nuevos Endpoints en Backend
**Archivo:** `apps/backend/server.js`

#### POST /api/chat
- Endpoint principal para chat con Rentman OS
- Usa Vertex AI Gemini 1.5 Flash 002
- Soporta contexto y historial de conversación
- System prompt operacional en español

#### POST /api/suggestions
- Genera sugerencias contextuales
- Máximo 3 sugerencias por request
- Basadas en contexto del usuario

### 2. Funciones Agregadas
```javascript
generateSystemPrompt(context)    // Genera prompt con contexto
chatModel                         // gemini-1.5-flash-002 para chat
suggestionsModel                  // gemini-1.5-flash-002 para suggestions
```

### 3. Configuración
- ✅ Usa credenciales existentes del backend
- ✅ Mismo proyecto: `agent-gen-1`
- ✅ Ubicación: `us-central1`
- ✅ No requiere secrets nuevos

---

## 🧪 Testing

### Local Testing (Opcional)
```bash
cd apps/backend

# Terminal 1: Start server
npm start

# Terminal 2: Run tests
node test-chat-api.js
```

**Resultado esperado:**
```
✅ Chat API working
✅ Suggestions API working
```

### Production Testing (Después de deploy)
```bash
$env:BACKEND_URL="https://rentman-api-mqadwgncoa-uc.a.run.app"
node test-chat-api.js
```

---

## 📦 Deploy Backend

### Opción A: Deploy Automático
```bash
cd apps/backend
.\deploy.ps1
```

### Opción B: Manual
```bash
gcloud run deploy rentman-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --project agent-gen-1
```

---

## 🔍 Verificación Post-Deploy

### 1. Health Check
```bash
curl https://rentman-api-mqadwgncoa-uc.a.run.app/
# Respuesta esperada: "Rentman Backend is Active 🧠"
```

### 2. Test Chat
```bash
curl -X POST https://rentman-api-mqadwgncoa-uc.a.run.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola",
    "context": {},
    "history": []
  }'
```

**Respuesta esperada:**
```json
{
  "response": "¡Saludos, operador!...",
  "timestamp": "2026-02-08T23:07:00.000Z"
}
```

### 3. Test Suggestions
```bash
curl -X POST https://rentman-api-mqadwgncoa-uc.a.run.app/api/suggestions \
  -H "Content-Type: application/json" \
  -d '{"context": {}}'
```

**Respuesta esperada:**
```json
{
  "suggestions": ["...", "...", "..."]
}
```

---

## 🚀 FASE 2: Actualizar Mobile

**DESPUÉS de verificar que backend funciona:**

### 1. Mobile ya está configurado ✅
- `api-client.ts` ya apunta al backend en modo nativo
- No requiere cambios de código

### 2. Rebuild APK
```bash
cd apps/mobile
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 3. Test en dispositivo
- Abrir Rentman OS chat
- Enviar mensaje
- Verificar respuesta

---

## 📊 Monitoreo

### Logs en Cloud Run
```bash
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=rentman-api" \
  --project agent-gen-1
```

### Buscar errores de chat
```bash
gcloud logging read "resource.type=cloud_run_revision AND jsonPayload.message=~'chat'" \
  --limit 50 \
  --project agent-gen-1
```

---

## 🔄 Rollback (Si algo falla)

### Backend
```bash
# Ver revisiones
gcloud run revisions list --service rentman-api

# Rollback a revisión anterior
gcloud run services update-traffic rentman-api \
  --to-revisions PREVIOUS-REVISION=100
```

### Mobile
```bash
# Reinstalar APK anterior (guardado en _releases/)
adb install -r apps/mobile/_releases/app-debug-FECHA.apk
```

---

## ✅ Checklist

- [x] Código agregado a `server.js`
- [x] Sintaxis validada
- [x] Test script creado
- [ ] Backend deploado
- [ ] Endpoints verificados en producción
- [ ] Mobile APK rebuilt
- [ ] Chat funcionando en dispositivo

---

## 📝 Notas Importantes

### ⚠️ Mobile Web (Browser)
- En modo web, Next.js API routes siguen funcionando
- No se rompe el web testing
- Mobile nativo usa backend directamente

### ✅ Sin Cambios Destructivos
- Next.js API routes NO eliminadas
- Backend agrega capacidades, no reemplaza aún
- Migración es reversible

### 🎯 Próximo Paso
**Deploy backend y verificar en producción antes de actualizar mobile**

---

**Status Final: BACKEND LISTO PARA DEPLOY** 🚀
