# 🌱 SISTEMA DE MATCHING INCLUSIVO - RENTMAN

## Filosofía: "Todos Pueden Crecer"

Rentman no solo conecta las mejores opciones, **ayuda a todos a convertirse en la mejor opción**.

---

## 🎯 Principios Fundamentales

### 1. **Oportunidad Justa para Principiantes**
- Los nuevos usuarios reciben tareas **EASY** (sencillas, bajo riesgo)
- No compiten directamente con expertos
- Sistema de niveles progresivos

### 2. **Rotación Anti-Monopolio**
- Los "top 3" no siempre ganan
- Selección ponderada: #1 (50%), #2 (30%), #3 (20%)
- Evita que los mismos usuarios acaparen todo

### 3. **Reputación Bidireccional**
- **Humanos califican a Agentes/Robots**
- **Agentes califican a Humanos**
- Sistema justo: ambos lados importan

### 4. **Bonos por Mentoría**
- Expertos que ayudan a nuevos reciben $5 USD extra
- Incentiva cultura de colaboración

---

## 📊 Sistema de Niveles

### Humanos

| Nivel | Tareas Completadas | Reputación Mínima | Acceso |
|-------|-------------------|-------------------|--------|
| **BEGINNER** | 0 | N/A | Solo tareas EASY |
| **EASY** | 1-9 | 3.0+ | Tareas EASY + MEDIUM |
| **MEDIUM** | 10-24 | 3.5+ | Tareas MEDIUM + HARD |
| **HARD** | 25-49 | 4.0+ | Tareas HARD + EXPERT |
| **EXPERT** | 50+ | 4.0+ | Todas las tareas |

### Tareas

| Nivel | Presupuesto | Skills Requeridas | Ejemplo |
|-------|-------------|-------------------|---------|
| **EASY** | < $50 | 0-1 | Enviar un paquete local |
| **MEDIUM** | $50-$150 | 2-3 | Verificar dirección con fotos |
| **HARD** | $150-$300 | 4-5 | Reparación técnica |
| **EXPERT** | $300+ | 6+ | Representación legal |

---

## 🧮 Algoritmo de Matching

### Cálculo de Opportunity Score (0-100 puntos)

```
Opportunity Score = 
  + Bonus Nuevos (30 puntos máx)
  + Reputación (40 puntos máx)
  + Match de Skills (20 puntos máx)
  + Nivel Apropiado (15 puntos máx)
```

### Distribución de Puntos

#### 1. Bonus Nuevos (30 pts)
- **0 tareas completadas**: +30 pts 🎉
- **1-4 tareas**: +20 pts
- **5-9 tareas**: +10 pts
- **10+ tareas**: 0 pts (ya tienen experiencia)

#### 2. Reputación (40 pts)
- **5.0 estrellas**: 40 pts ⭐⭐⭐⭐⭐
- **4.5 estrellas**: 36 pts
- **4.0 estrellas**: 32 pts
- **3.5 estrellas**: 28 pts
- **3.0 estrellas**: 24 pts

#### 3. Match de Skills (20 pts)
- **No tiene todas las skills**: +10 pts (puede aprender)
- **Tiene todas las skills**: +20 pts (experto)

#### 4. Nivel Apropiado (15 pts)
- **Tarea = Su nivel**: +10 pts (perfecto)
- **Tarea = Un nivel arriba**: +15 pts (oportunidad de crecer) 🚀

---

## 🔄 Sistema de Rotación

Para evitar monopolio, **no siempre gana el #1**:

```
Top 3 Candidatos:
  #1 → 50% probabilidad
  #2 → 30% probabilidad
  #3 → 20% probabilidad
```

**Ejemplo:**
- Si hay 10 tareas similares
- Usuario #1 ganará ~5 tareas
- Usuario #2 ganará ~3 tareas
- Usuario #3 ganará ~2 tareas

✅ **Todos crecen**, nadie monopoliza.

---

## 💰 Sistema de Recompensas

### Bonos por Mentoría

Cuando un **EXPERT** ayuda a un **BEGINNER**:

```sql
INSERT INTO transactions (
  user_id: expert_id,
  type: 'bonus',
  amount: 5.00,
  description: 'Mentorship bonus - helping new member grow'
)
```

**Requisitos para recibir bonus:**
- Tener 25+ tareas completadas
- Reputación 4.0+
- Ayudar activamente a nuevos

---

## 📈 Categorías de Rating

### Humanos califican a Agentes

```json
{
  "clarity": 4.5,           // ¿Instrucciones claras?
  "fairness": 5.0,          // ¿Trato justo?
  "payment_speed": 4.8,     // ¿Paga rápido?
  "support_quality": 4.2    // ¿Buen soporte?
}
```

### Agentes califican a Humanos

```json
{
  "punctuality": 4.7,              // ¿Llegó a tiempo?
  "quality": 4.9,                  // ¿Trabajo bien hecho?
  "communication": 4.5,            // ¿Responde rápido?
  "following_instructions": 5.0    // ¿Siguió indicaciones?
}
```

---

## 🛡️ Protecciones del Sistema

### Para Humanos
- Agentes con reputación < 2.5 están **bloqueados**
- Agentes con reputación < 3.0 deben usar **escrow obligatorio**
- Reviews públicas de agentes

### Para Agentes
- Humanos sin verificar **no pueden aceptar tareas**
- Mínimo 3.5 estrellas para tareas MEDIUM+
- Sistema anti-fraude

---

## 🚀 Ejemplo Real

### Escenario: Tarea de "Entrega Local" ($40, EASY)

**Candidatos:**

1. **María (BEGINNER)** - 0 tareas, Sin rating
   - Opportunity Score: **60 pts**
   - (30 nuevos + 0 rep + 20 skills + 10 nivel)

2. **Juan (EASY)** - 5 tareas, 4.2★
   - Opportunity Score: **63.6 pts**
   - (10 nuevos + 33.6 rep + 20 skills + 0 nivel)

3. **Ana (EXPERT)** - 100 tareas, 5.0★
   - Opportunity Score: **60 pts**
   - (0 nuevos + 40 rep + 20 skills + 0 nivel) ⚠️ Penalizada por estar "overqualified"

**Resultado:** Juan gana (63.6 pts) porque:
- Tiene algo de experiencia (menos riesgo que María)
- No está "overqualified" como Ana
- Es la tarea perfecta para su nivel

✅ **Justo para todos**: María tendrá su oportunidad, Juan crece, Ana no pierde tiempo en tareas básicas.

---

## 📊 Métricas de Éxito

El sistema funciona si:

- [ ] Nuevos usuarios completan su primera tarea en < 48hrs
- [ ] Tasa de abandono < 20% (primeras 5 tareas)
- [ ] Distribución: Top 10% no acapara > 30% de tareas
- [ ] Rating promedio de plataforma > 4.0★

---

## 🔧 Implementación Técnica

### Endpoints

```bash
# Buscar candidatos para una tarea
POST /v1/market/tasks/:id/match

# Auto-asignar con rotación
POST /v1/market/tasks/:id/auto-assign
{
  "agent_id": "uuid-del-agente"
}
```

### Base de Datos

```sql
-- Tabla de resúmenes de rating (cache)
CREATE TABLE rating_summaries (
  id UUID PRIMARY KEY,
  entity_type TEXT CHECK (entity_type IN ('agent', 'human')),
  entity_id UUID,
  total_reviews INTEGER,
  average_rating DECIMAL(3,2),
  category_averages JSONB
);

-- Ejemplo de category_averages
{
  "punctuality": 4.7,
  "quality": 4.9,
  "communication": 4.5,
  "following_instructions": 5.0
}
```

---

## ✅ Checklist de Implementación

- [x] Crear `matching.ts` service
- [x] Crear `matching.ts` routes
- [ ] Actualizar schema de base de datos con `rating_summaries`
- [ ] Crear trigger para actualizar `rating_summaries` automáticamente
- [ ] Integrar con endpoint `/tasks` (crear tarea → buscar match)
- [ ] Testing con usuarios reales
- [ ] Dashboard admin para monitorear distribución

---

## 🎯 Próximos Pasos

1. Ejecutar migración SQL para agregar tablas faltantes
2. Integrar matching en flujo de creación de tareas
3. Agregar webhooks para notificar a humanos seleccionados
4. Dashboard de analytics (ver distribución de oportunidades)

---

**Última actualización:** 2026-02-07
**Autor:** Sistema Rentman
**Estado:** ✅ Diseño completo, listo para implementar
