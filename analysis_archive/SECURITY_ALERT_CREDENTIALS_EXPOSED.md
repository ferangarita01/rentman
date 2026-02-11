# 🚨 ALERTA DE SEGURIDAD CRÍTICA - CREDENCIALES EXPUESTAS

**Fecha:** 2026-02-09 22:08 UTC  
**Severidad:** 🔴 CRÍTICA  
**Status:** ⚠️ ACCIÓN INMEDIATA REQUERIDA

---

## ⚠️ CREDENCIALES COMPROMETIDAS

Las siguientes credenciales de Supabase fueron **expuestas públicamente**:

```
✅ ANON Key (pública - OK para compartir):
[REDACTED]

❌ SERVICE_ROLE Key (SECRETA - COMPROMETIDA):
[REDACTED]

❌ Publishable key:
[REDACTED]

❌ Secret keys:
[REDACTED]
```

**Proyecto Supabase:** `uoekolfgbbmvhzsfkjef.supabase.co`

---

## 🚨 NIVEL DE RIESGO

### **SERVICE_ROLE Key Expuesta** 🔴

Esta key tiene **ACCESO TOTAL** sin restricciones:

- ❌ Bypasea **todas** las Row Level Security (RLS) policies
- ❌ Puede leer **todos** los datos (users, tasks, messages, escrow, etc.)
- ❌ Puede modificar **todos** los datos
- ❌ Puede eliminar **todos** los datos
- ❌ Puede crear/modificar usuarios
- ❌ Puede acceder a información sensible (pagos, Stripe IDs, etc.)

**IMPACTO:** Cualquier persona con esta key puede comprometer completamente tu aplicación.

---

## ✅ ACCIONES INMEDIATAS REQUERIDAS

### **1. ROTAR LAS API KEYS AHORA** (URGENTE)

1. **Ir a Supabase Dashboard:**
   - https://app.supabase.com/project/uoekolfgbbmvhzsfkjef/settings/api

2. **Generar nuevas keys:**
   - Click "Reset API keys"
   - Confirmar la rotación
   - **IMPORTANTE:** Esto invalidará las keys actuales

3. **Copiar las nuevas keys:**
   - Nueva ANON key
   - Nueva SERVICE_ROLE key

---

### **2. ACTUALIZAR VARIABLES DE ENTORNO**

**Archivo:** `apps/mobile/.env.local`

```bash
# Actualizar con las NUEVAS keys
NEXT_PUBLIC_SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NUEVA_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<NUEVA_SERVICE_ROLE_KEY>
```

**Archivo:** `apps/backend/.env` (si existe)

```bash
SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<NUEVA_SERVICE_ROLE_KEY>
```

---

### **3. REBUILD Y REDEPLOY**

Después de actualizar las keys:

```bash
# Mobile app
cd apps/mobile
npm run build
npx cap sync
# Rebuild APK y reinstalar

# Backend (si usa las keys)
cd apps/backend
gcloud run deploy
```

---

### **4. REVISAR LOGS DE ACCESO**

En Supabase Dashboard:
1. Ir a "Logs" > "API"
2. Filtrar por las últimas 24 horas
3. Buscar actividad sospechosa:
   - Requests desde IPs desconocidas
   - Queries masivas de datos
   - Intentos de modificación no autorizados

---

### **5. VERIFICAR INTEGRIDAD DE DATOS**

```sql
-- Verificar usuarios creados recientemente
SELECT id, email, created_at 
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Verificar tareas modificadas
SELECT id, title, updated_at 
FROM tasks 
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;

-- Verificar transacciones de escrow
SELECT id, status, created_at 
FROM escrow_transactions 
WHERE held_at > NOW() - INTERVAL '24 hours'
ORDER BY held_at DESC;
```

---

## 🛡️ MEJORES PRÁCTICAS DE SEGURIDAD

### **Para el futuro:**

1. **NUNCA compartir:**
   - ❌ SERVICE_ROLE key
   - ❌ Secret keys
   - ❌ Database passwords
   - ❌ API tokens privados

2. **OK para compartir en público:**
   - ✅ ANON key (protegida por RLS)
   - ✅ Publishable keys de Stripe
   - ✅ URLs públicas

3. **Usar variables de entorno:**
   - Mantener keys en `.env.local`
   - Agregar `.env.local` a `.gitignore`
   - NO commitear keys en Git

4. **Limitar acceso:**
   - Usar ANON key en frontend
   - SERVICE_ROLE key SOLO en backend
   - Implementar RLS policies correctamente

5. **Monitorear:**
   - Revisar logs regularmente
   - Configurar alertas de actividad sospechosa
   - Rotar keys periódicamente

---

## 📋 CHECKLIST DE SEGURIDAD

- [ ] Rotar API keys en Supabase Dashboard
- [ ] Actualizar `.env.local` con nuevas keys
- [ ] Actualizar backend (si aplica)
- [ ] Rebuild mobile app
- [ ] Reinstalar APK en dispositivos
- [ ] Revisar logs de acceso
- [ ] Verificar integridad de datos
- [ ] Configurar alertas de seguridad
- [ ] Documentar el incidente
- [ ] Implementar mejores prácticas

---

## ⚠️ ADVERTENCIA FINAL

**Estas credenciales están ahora en:**
- Historial de chat
- Logs del sistema
- Posiblemente cache del navegador

**Por seguridad:**
1. Rotar keys INMEDIATAMENTE
2. Monitorear actividad por las próximas 48 horas
3. Considerar auditoría de seguridad completa

---

## 📞 RECURSOS

- [Supabase Security Docs](https://supabase.com/docs/guides/platform/security)
- [API Keys Best Practices](https://supabase.com/docs/guides/api#api-keys)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Generado:** 2026-02-09 22:08 UTC  
**Por:** GitHub Copilot CLI - Security Alert System  
**Status:** 🚨 CRITICAL - ACTION REQUIRED
