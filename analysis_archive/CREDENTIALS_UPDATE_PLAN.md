# 🔑 ACTUALIZACIÓN DE CREDENCIALES SUPABASE

**Fecha:** 2026-02-09 22:13 UTC  
**Acción:** Rotación de API keys completada  
**Siguiente paso:** Actualizar archivos del proyecto

---

## 📋 CHECKLIST DE ACTUALIZACIÓN

### **ARCHIVOS PRINCIPALES A ACTUALIZAR:**

- [ ] `apps/mobile/.env.local` - **PRIORITARIO** (Mobile app)
- [ ] `apps/backend/.env` - Backend server
- [ ] `apps/dashboard/.env` - Dashboard principal
- [ ] `apps/dashboard/backend/.env` - Dashboard backend
- [ ] `apps/cli/.env` - CLI tool

### **ARCHIVOS SECUNDARIOS:**

- [ ] `.env.local` - Root (si existe)
- [ ] `apps/dashboard/.env.local` - Dashboard local

### **NO TOCAR (Backups):**

- ❌ `apps/backend/_SECRETS_BACKUP_20260208_132332/.env`
- ❌ `_archive/secrets-backup-20260208-140155/.env.local`

---

## 🔑 NUEVAS CREDENCIALES

**Proyecto:** `uoekolfgbbmvhzsfkjef.supabase.co`

### **Para copiar del usuario:**

```bash
# ANON KEY (pública - para frontend)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PEGAR_AQUÍ>

# SERVICE_ROLE KEY (secreta - para backend)
SUPABASE_SERVICE_ROLE_KEY=<PEGAR_AQUÍ>

# URL (no cambió)
NEXT_PUBLIC_SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
```

---

## 📝 TEMPLATE PARA CADA ARCHIVO

### **apps/mobile/.env.local** (PRIORITARIO)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NUEVA_ANON_KEY>

# Otras variables existentes...
```

### **apps/backend/.env**

```bash
# Supabase
SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<NUEVA_SERVICE_ROLE_KEY>

# Otras variables existentes...
```

### **apps/dashboard/.env**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NUEVA_ANON_KEY>

# Otras variables existentes...
```

### **apps/dashboard/backend/.env**

```bash
# Supabase
SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<NUEVA_SERVICE_ROLE_KEY>

# Otras variables existentes...
```

### **apps/cli/.env**

```bash
# Supabase
SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
SUPABASE_ANON_KEY=<NUEVA_ANON_KEY>

# Otras variables existentes...
```

---

## 🚀 DESPUÉS DE ACTUALIZAR

### **1. Mobile App:**

```bash
cd apps/mobile
npm run build
npx cap sync
# Rebuild APK y reinstalar
```

### **2. Backend:**

```bash
cd apps/backend
# Si usa Google Secret Manager:
node upload-secrets.js

# Deploy:
gcloud run deploy rentman-backend --source .
```

### **3. Dashboard:**

```bash
cd apps/dashboard
npm run build
# Deploy si es necesario
```

### **4. CLI:**

```bash
cd apps/cli
# Test:
node src/commands/init.js
```

---

## ✅ VERIFICACIÓN

Después de actualizar, verificar que funciona:

```bash
# Test mobile
cd apps/mobile
node check-db.mjs

# Test backend
cd apps/backend
node test-secrets.js

# Test CLI
cd apps/cli
node test-integration.js
```

---

## ⚠️ IMPORTANTE

1. **NO commitear** archivos .env a Git
2. **Verificar** que `.env.local` está en `.gitignore`
3. **Hacer backup** antes de modificar
4. **Actualizar** Google Secret Manager si se usa
5. **Redeploy** todos los servicios después

---

**Status:** ⏳ ESPERANDO NUEVAS KEYS DEL USUARIO
