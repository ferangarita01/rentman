# 🧪 ESTRATEGIA DE TESTING COMPLETA - RENTMAN

## 📋 Resumen Ejecutivo

Este documento describe la estrategia completa de testing para validar el flujo end-to-end de Rentman.

---

## 🎯 Niveles de Testing

### 1. **Unit Tests** (Nivel Componente)
Pruebas aisladas de funciones críticas sin dependencias externas.

**Archivo:** `apps/backend/test-signature.js`

**Qué prueba:**
- Verificación criptográfica de firmas Ed25519
- Casos válidos e inválidos de firmas
- Detección de mensajes alterados

**Ejecutar:**
```bash
cd apps/backend
node test-signature.js
```

**Duración:** < 1 segundo  
**Dependencias:** Ninguna (solo TweetNaCl)

---

### 2. **Integration Tests** (Nivel Integración)
Pruebas de componentes conectados (CLI → Supabase).

**Archivo:** `apps/cli/test-integration.js`

**Qué prueba:**
- Registro de agentes en Supabase
- Creación de tareas firmadas
- Lectura/escritura en base de datos
- Integridad de datos después de roundtrip

**Ejecutar:**
```bash
cd apps/cli
node test-integration.js
```

**Duración:** 2-5 segundos  
**Dependencias:** Supabase (debe estar online)

---

### 3. **End-to-End Tests** (Nivel Sistema Completo)
Pruebas del flujo completo incluyendo webhooks, backend y AI.

**Archivo:** `test-flow.ps1` (PowerShell automatizado)

**Qué prueba:**
- Infraestructura (Supabase, Backend, CLI)
- Schema de base de datos
- Generación de identidades
- Firma y validación criptográfica
- Trigger de webhooks
- Procesamiento del backend
- Análisis de Vertex AI
- Visualización en Mobile/Dashboard

**Ejecutar:**
```bash
# Test completo
.\test-flow.ps1

# Test rápido (sin AI)
.\test-flow.ps1 -Quick

# Con logs detallados
.\test-flow.ps1 -Verbose

# Con limpieza automática
.\test-flow.ps1 -CleanDB
```

**Duración:** 30-60 segundos  
**Dependencias:** Todo el stack

---

### 4. **Manual Testing** (Nivel Usuario)
Guía paso a paso para testing manual exploratorio.

**Archivo:** `TESTING_GUIDE.md`

**Incluye:**
- Checklist de pre-requisitos
- Tests por fase (6 fases)
- Troubleshooting común
- Métricas de éxito
- Test de carga

---

## 🔄 Flujo de Testing Recomendado

### Para Desarrollo Diario:
```bash
# 1. Unit tests (rápido)
node apps/backend/test-signature.js

# 2. Integration test (medio)
node apps/cli/test-integration.js

# 3. Solo si cambios mayores: E2E
.\test-flow.ps1 -Quick
```

### Para Pre-Deploy:
```bash
# Test completo incluyendo AI
.\test-flow.ps1 -Verbose
```

### Para Debugging:
```bash
# Manual testing con guía
# Ver: TESTING_GUIDE.md
```

---

## 📊 Matriz de Cobertura

| Componente | Unit | Integration | E2E | Manual |
|------------|------|-------------|-----|--------|
| **Firma Criptográfica** | ✅ | ✅ | ✅ | ✅ |
| **Supabase DB** | ❌ | ✅ | ✅ | ✅ |
| **CLI Task Creation** | ❌ | ✅ | ✅ | ✅ |
| **Webhook Trigger** | ❌ | ❌ | ✅ | ✅ |
| **Backend Validation** | ✅ | ❌ | ✅ | ✅ |
| **Vertex AI Analysis** | ❌ | ❌ | ✅ | ✅ |
| **Mobile Read** | ❌ | ❌ | ✅ | ✅ |
| **Dashboard Viz** | ❌ | ❌ | ✅ | ✅ |

---

## 🚀 Quick Start

**Primera vez:**
```bash
# 1. Verificar dependencias
cd apps/cli && npm install
cd apps/backend && npm install

# 2. Configurar variables de entorno
# Ver TESTING_GUIDE.md sección "Pre-requisitos"

# 3. Ejecutar suite completa
.\test-flow.ps1 -Verbose
```

**Desarrollo iterativo:**
```bash
# Cada cambio → unit + integration
node apps/backend/test-signature.js && node apps/cli/test-integration.js

# Antes de commit → E2E rápido
.\test-flow.ps1 -Quick
```

---

## 🐛 Troubleshooting Tests

### Test falla: "Supabase not reachable"
**Fix:** Verificar internet, API key, URL

### Test falla: "Backend not running"
**Fix:** 
```bash
curl https://rentman-backend-*.run.app/
# Si no responde, redeploy backend
```

### Test falla: "Webhook did not process task"
**Fix:**
```sql
-- Verificar trigger en Supabase
SELECT * FROM pg_trigger WHERE tgname = 'on_task_created';

-- Verificar pg_net
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

### Test falla: "AI analysis not found"
**Fix:**
```bash
# Verificar acceso a Vertex AI
cd apps/backend
node check_models.js
```

---

## 📈 Métricas de Calidad

### Objetivos de Pass Rate:
- **Unit Tests:** 100% (crítico)
- **Integration Tests:** 100% (crítico)
- **E2E Tests:** ≥ 90% (aceptable)
- **Manual Tests:** ≥ 80% (exploración)

### Tiempos Objetivo:
| Test | Target | Max Acceptable |
|------|--------|----------------|
| Unit | < 1s | 2s |
| Integration | < 5s | 10s |
| E2E | < 60s | 120s |

---

## 🔐 Testing en CI/CD (Futuro)

```yaml
# .github/workflows/test.yml (ejemplo)
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Unit Tests
        run: node apps/backend/test-signature.js
      - name: Integration Tests
        run: node apps/cli/test-integration.js
        env:
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - name: E2E Tests (Quick)
        run: pwsh test-flow.ps1 -Quick
        env:
          WEBHOOK_SECRET: ${{ secrets.WEBHOOK_SECRET }}
```

---

## 📚 Archivos de Testing

```
Rentman/
├── test-flow.ps1              # E2E automatizado (PowerShell)
├── TESTING_GUIDE.md           # Guía manual paso a paso
├── apps/
│   ├── backend/
│   │   ├── test-signature.js  # Unit test (crypto)
│   │   ├── check_models.js    # AI connectivity test
│   │   └── test_curl.ps1      # Backend health check
│   ├── cli/
│   │   ├── test-integration.js   # CLI → Supabase test
│   │   ├── test_task.json        # Sample task payload
│   │   └── test_mission_v7.json  # Sample mission
│   └── mobile/
│       └── check-db.mjs       # DB inspection tool
```

---

## ✅ Checklist de Release

Antes de deploy a producción:

- [ ] ✅ Unit tests pasan al 100%
- [ ] ✅ Integration tests pasan
- [ ] ✅ E2E test completo (con AI) pasa
- [ ] ✅ Manual smoke test completado
- [ ] ✅ Backend logs revisados (sin errores)
- [ ] ✅ Métricas de performance aceptables
- [ ] ✅ Variables de entorno validadas
- [ ] ✅ Webhooks configurados correctamente
- [ ] ✅ Rollback plan documentado

---

## 🆘 Ayuda

**Documentación completa:**
- Unit Testing: Ver código en `apps/backend/test-signature.js`
- Integration: Ver código en `apps/cli/test-integration.js`
- E2E: Ver código en `test-flow.ps1`
- Manual: Ver `TESTING_GUIDE.md`

**Logs en tiempo real:**
```bash
# Backend
gcloud logging tail "resource.type=cloud_run_revision" --project=agent-gen-1

# Supabase
# Dashboard > Logs > Postgres Logs
```

**Reset completo (dev only):**
```sql
TRUNCATE TABLE tasks, agents CASCADE;
-- Solo en desarrollo!
```
