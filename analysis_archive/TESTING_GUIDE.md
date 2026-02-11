# ============================================
# MANUAL TESTING GUIDE FOR RENTMAN
# ============================================

## 🎯 Objetivo
Validar el flujo completo: CLI → Supabase → Backend → AI → Mobile/Dashboard

---

## ✅ CHECKLIST DE PRE-REQUISITOS

### 1. Infraestructura
- [ ] Supabase proyecto activo: `https://uoekolfgbbmvhzsfkjef.supabase.co`
- [ ] Backend desplegado en Cloud Run: `https://rentman-backend-*.run.app`
- [ ] Webhook configurado en Supabase (tabla `tasks`, trigger `on_task_created`)
- [ ] Extensión `pg_net` habilitada en Supabase

### 2. Variables de Entorno
**Backend (Cloud Run):**
```bash
WEBHOOK_SECRET=857850732870ae21ce6e8f0d4079639bb131db15df35120ad9526129716f5acb
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
PROJECT_ID=agent-gen-1
```

**CLI (Local):**
```bash
# Opcional: usar variables de entorno
export RENTMAN_AGENT_ID=<your-agent-id>
export RENTMAN_SECRET_KEY=<your-secret-key>
```

### 3. Dependencias Instaladas
```bash
# CLI
cd apps/cli
npm install
npm link

# Backend (solo si corres local)
cd apps/backend
npm install

# Mobile
cd apps/mobile
npm install
```

---

## 🧪 TESTS MANUALES POR FASE

### FASE 1: Verificar Infraestructura

#### Test 1.1: Supabase está funcionando
```bash
curl -X GET "https://uoekolfgbbmvhzsfkjef.supabase.co/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
**✅ Esperado:** Código 200

#### Test 1.2: Backend está activo
```bash
curl https://rentman-backend-346436028870.us-east1.run.app/
```
**✅ Esperado:** `"Rentman Backend is Active 🧠"`

#### Test 1.3: CLI instalado
```bash
rentman --version
```
**✅ Esperado:** Muestra versión sin error

---

### FASE 2: Crear Agente e Identidad

#### Test 2.1: Generar identidad criptográfica
```bash
cd apps/cli
node gen_identity.js
```
**✅ Esperado:** Crea archivo `rentman_identity.json` con:
```json
{
  "agent_id": "uuid",
  "public_key": "base64...",
  "secret_key": "base64...",
  "created_at": "timestamp"
}
```

#### Test 2.2: Registrar agente en Supabase
Opción A: Usar CLI
```bash
rentman login your-email@example.com
```

Opción B: Insertar manualmente en Supabase
```sql
INSERT INTO agents (id, public_key, email)
VALUES (
  '<agent_id del JSON>',
  '<public_key del JSON>',
  'test@example.com'
);
```

#### Test 2.3: Verificar agente en DB
```bash
# Ir a Supabase Dashboard > Table Editor > agents
# O con curl:
curl -X GET "https://uoekolfgbbmvhzsfkjef.supabase.co/rest/v1/agents?select=*" \
  -H "apikey: <anon-key>"
```
**✅ Esperado:** Ver tu agente listado

---

### FASE 3: Crear Tarea desde CLI

#### Test 3.1: Crear tarea de prueba
```bash
cd apps/cli

# Crear archivo de prueba
cat > test_manual.json << EOF
{
  "title": "Manual Test Task $(date +%H:%M:%S)",
  "description": "Testing complete flow manually",
  "task_type": "verification",
  "budget_amount": 15,
  "location": {
    "address": "Test City",
    "lat": 40.7128,
    "lng": -74.0060
  }
}
EOF

# Publicar tarea
rentman task create test_manual.json
```

**✅ Esperado:**
```
✅ Signature generated
✅ Broadcasting to Rentman Network...
✅ Mission Posted Successfully!

┌─────────┬────────────────────────────┐
│ ID      │ 123e4567-e89b-12d3-...     │
│ Title   │ Manual Test Task 16:30:45  │
│ Budget  │ $15                        │
│ Status  │ open                       │
└─────────┴────────────────────────────┘
```

**🚨 IMPORTANTE:** Guarda el ID de la tarea para los siguientes tests

---

### FASE 4: Verificar Webhook y Backend

#### Test 4.1: Check si la tarea llegó a la DB
```bash
# En Supabase Dashboard > Table Editor > tasks
# Buscar por el título que creaste

# O con Node.js:
cd apps/mobile
node check-db.mjs
```

**✅ Esperado:** Ver tu tarea con status `open` (inicial)

#### Test 4.2: Monitorear logs del Backend
```bash
# Si backend está en Cloud Run:
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rentman-backend" \
  --limit 50 --format json

# Buscar líneas como:
# "✨ New Task Created: <task-id>"
# "✅ Signature Verified"
# "🤖 AI Analyzing Task..."
```

**✅ Esperado:** Ver logs de procesamiento

#### Test 4.3: Verificar cambio de estado
**Esperar 5-10 segundos** y volver a consultar la tarea:

```bash
curl -X GET "https://uoekolfgbbmvhzsfkjef.supabase.co/rest/v1/tasks?id=eq.<TASK_ID>" \
  -H "apikey: <anon-key>"
```

**✅ Esperado:** `status` cambió a:
- `verifying` → Firma validada
- `matching` → AI aprobó la tarea
- `flagged` → AI detectó problema

**❌ Si sigue en `open`:**
- Webhook no se disparó
- Backend no recibió la petición
- Verificar configuración de `pg_net` y trigger

---

### FASE 5: Verificar Análisis de AI

#### Test 5.1: Inspeccionar metadata
```bash
# En Supabase Dashboard:
# tasks > tu tarea > columna "metadata" (tipo JSONB)
```

**✅ Esperado:** Ver estructura como:
```json
{
  "verified": true,
  "ai_analysis": {
    "viable": true,
    "safety_score": 85,
    "complexity": "low",
    "reasoning": "Clear task description...",
    "tags": ["testing", "verification"]
  }
}
```

#### Test 5.2: Probar tarea "peligrosa" (debe ser flagged)
```bash
cat > test_dangerous.json << EOF
{
  "title": "Dangerous illegal task",
  "description": "Do something unsafe and illegal",
  "task_type": "verification",
  "budget_amount": 1000
}
EOF

rentman task create test_dangerous.json
```

**✅ Esperado:** Task con status `flagged` y `safety_score` bajo

---

### FASE 6: Mobile App Visualization

#### Test 6.1: Verificar que mobile puede leer tareas
```bash
cd apps/mobile
npm run dev

# Abrir http://localhost:3000
# Login con cuenta de operador
```

**✅ Esperado:** Ver tareas con status `matching` en el feed

#### Test 6.2: Test de Realtime (opcional)
En una terminal:
```bash
# Crear tarea nueva
rentman task create test_manual.json
```

En el navegador (mobile app abierta):
**✅ Esperado:** Ver la nueva tarea aparecer sin refresh

---

### FASE 7: Dashboard Web

#### Test 7.1: Verificar dashboard
```bash
cd apps/dashboard
npm run dev

# Abrir http://localhost:5173
```

**✅ Esperado:** Panel muestra estadísticas de tareas

---

## 🐛 TROUBLESHOOTING

### Problema 1: Task se queda en status "open"
**Causas posibles:**
- Webhook no configurado
- `pg_net` extension no habilitada
- WEBHOOK_SECRET incorrecto
- Backend caído

**Fix:**
```sql
-- Verificar trigger existe:
SELECT * FROM pg_trigger WHERE tgname = 'on_task_created';

-- Verificar pg_net:
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Re-crear webhook:
\i apps/backend/init-webhook.sql
```

### Problema 2: Backend retorna 401 Unauthorized
**Fix:** Verificar que `WEBHOOK_SECRET` en Cloud Run coincide con el del trigger SQL

### Problema 3: Firma inválida (task → rejected)
**Fix:** 
- Verificar que el `agent_id` en `rentman_identity.json` coincide con el de la tabla `agents`
- Regenerar identidad con `gen_identity.js`

### Problema 4: AI no analiza (no hay ai_analysis)
**Fix:**
- Verificar `PROJECT_ID` en variables de entorno del backend
- Verificar permisos de Vertex AI en GCP
- Correr `node apps/backend/check_models.js` para validar acceso

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Target |
|---------|--------|
| Task creation time | < 2 segundos |
| Webhook trigger time | < 3 segundos |
| Signature verification | < 1 segundo |
| AI analysis time | < 10 segundos |
| Total flow (CLI → matching) | < 15 segundos |

---

## 🔄 TEST DE CARGA (Opcional)

```bash
# Crear 10 tareas simultáneas
for i in {1..10}; do
  (rentman task create test_manual.json &)
done

# Verificar todas fueron procesadas:
# Supabase Dashboard > tasks > filtrar por "created_at DESC"
```

**✅ Esperado:** Todas con status `matching` o `flagged`

---

## 📝 CHECKLIST POST-TEST

Después de cada sesión de testing:

- [ ] Tasks de prueba eliminadas de DB (si es ambiente compartido)
- [ ] Agentes de prueba eliminados
- [ ] Logs del backend revisados (sin errores críticos)
- [ ] Variables de entorno seguras (no committed)
- [ ] Documentar cualquier bug encontrado

---

## 🆘 AYUDA RÁPIDA

**Ver logs en tiempo real (Backend):**
```bash
gcloud logging tail "resource.type=cloud_run_revision" --project=agent-gen-1
```

**Reset completo de DB (PELIGRO):**
```sql
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE agents CASCADE;
-- Solo en ambiente de desarrollo!
```

**Verificar salud completa:**
```bash
# Usar el script automatizado
.\test-flow.ps1 -Verbose
```
