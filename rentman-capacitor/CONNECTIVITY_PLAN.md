# RENTMAN - REPORTE DE FUNCIONALIDADES CONECTABLES
Fecha: 2026-02-07 00:20

## 📊 DATOS DISPONIBLES EN SUPABASE:

### ✅ Tabla 'tasks' (2 registros)
1. Test iOS login flow
   - ID: 3f8d9506-5090-43d1-b89c-2aca5297fa41
   - Type: verification
   - Budget: $15 USD
   - Location: New York, NY
   - Status: open

2. Test Delivery Mission
   - ID: 0adb6439-5eca-4748-bfbc-91fb5c292b2f
   - Type: delivery
   - Budget: $25 USD
   - Location: 123 Main Street, Downtown
   - Status: open

### ✅ Tabla 'profiles' (1 registro)
- Email: ferangarita01@gmail.com
- Credits: 0
- Is Agent: false

## 🔌 FUNCIONALIDADES QUE PODEMOS CONECTAR AHORA:

### 1. HOME PAGE (/) - ALTA PRIORIDAD
✅ **Cambiar mock data por datos reales de Supabase**
   - Conectar a tabla 'tasks'
   - Mostrar las 2 tareas reales
   - Implementar filtros: TASKS, NEARBY, ACTIVE
   
✅ **Bottom Navigation**
   - Tasks → Ya funciona ✅
   - Explore → Conectar con mapa/búsqueda
   - Create + → Abrir modal para crear nueva tarea
   - Wallet → Ir a /profile (wallet section)
   - Profile → Ya funciona ✅

### 2. CONTRACT DETAILS (/contract/[id]) - ALTA PRIORIDAD
✅ **Cargar datos reales desde Supabase**
   - Usar task ID desde URL params
   - Mostrar datos reales del task
   
✅ **Botón ACCEPT CONTRACT**
   - Crear tabla 'task_assignments' en Supabase
   - Asignar task al usuario actual
   - Cambiar status de 'open' → 'assigned'
   - Navegar a página de "Active Tasks"

### 3. PROFILE PAGE (/profile) - MEDIA PRIORIDAD
✅ **Cargar datos reales del usuario**
   - Conectar a tabla 'profiles'
   - Mostrar credits reales
   - Calcular earnings desde tasks completados
   
✅ **Withdraw button**
   - Crear tabla 'withdrawals' en Supabase
   - Implementar lógica de retiro
   
✅ **Transaction History**
   - Crear tabla 'transactions' en Supabase
   - Mostrar historial real

### 4. NUEVAS TABLAS NECESARIAS EN SUPABASE:

`sql
-- Asignaciones de tareas
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'assigned', -- assigned, in_progress, completed, cancelled
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rating INTEGER,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transacciones/Earnings
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id),
  type TEXT, -- earning, withdrawal, bonus, penalty
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retiros
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  method TEXT, -- bank, paypal, crypto
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
`

## 🎯 PLAN DE ACCIÓN RECOMENDADO:

### FASE 1: Conexión Básica (1-2 horas)
1. ✅ Conectar Home con tasks reales de Supabase
2. ✅ Conectar Contract Details con task data real
3. ✅ Implementar botón "Accept Contract"
4. ✅ Conectar Profile con user data real

### FASE 2: Funcionalidades Core (2-3 horas)
1. ⚠️ Crear tablas necesarias en Supabase
2. ⚠️ Implementar sistema de asignación de tareas
3. ⚠️ Implementar tracking de earnings
4. ⚠️ Implementar withdraw functionality

### FASE 3: Features Avanzadas (3-4 horas)
1. ⚠️ Crear nueva tarea (Create + button)
2. ⚠️ Sistema de calificaciones
3. ⚠️ Notificaciones
4. ⚠️ Mapa de tareas nearby

## 📝 CÓDIGO NECESARIO:

### Servicio de Tasks (src/services/tasks.ts)
`	ypescript
import { supabase } from '@/lib/supabase';

export async function getTasks(status = 'open') {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getTaskById(id: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data, error };
}

export async function acceptTask(taskId: string, userId: string) {
  const { data, error } = await supabase
    .from('task_assignments')
    .insert({ task_id: taskId, user_id: userId })
    .select()
    .single();
  
  if (!error) {
    await supabase
      .from('tasks')
      .update({ status: 'assigned' })
      .eq('id', taskId);
  }
  
  return { data, error };
}
`

¿Empezamos con FASE 1?
