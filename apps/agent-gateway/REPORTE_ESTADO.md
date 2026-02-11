# 🤖 Análisis de Estado Real: Agent Gateway

Tras una investigación profunda del código (confirmando que el README está desactualizado), este es el estado real del servicio:

## 🏗️ Realidad vs. Documentación
> [!WARNING]
> El `README.md` actual es **aspiracional**. Varias características mencionadas como funcionales están en fase de "TODO" o son carpetas vacías en la rama actual.

- **MCP (Protocolo de Contexto de Modelo):** ❌ **No implementado**. Existe la estructura de carpetas `src/mcp/tools` pero está vacía. El código registra el plugin de WebSockets pero no hay lógica de MCP para Cursor o Cline todavía.
- **Escrow (Garantía):** ⚠️ **Parcial**. Se crean los `PaymentIntents` en Stripe con captura manual, pero la transferencia real a las cuentas de los humanos (via Stripe Connect) tiene un `TODO` pendiente.
- **KYA (Registro de Agentes):** ✅ **Funcional**. El proceso de registro genera llaves y guarda la configuración correctamente.

## 🔐 Hallazgos de Seguridad (Código Fuente)
1.  **Hashing de API Keys:** Se utiliza `SHA-256`. **No hay salt**, lo cual es un riesgo de seguridad moderado-alto para la base de datos de llaves.
2.  **Firmas NACL:** Implementadas y robustas. Es el método recomendado para agentes autónomos.
3.  **Audit Logs:** ✅ Muy bien implementados. Sanitizan datos sensibles y registran actividad en Supabase sin bloquear las respuestas del API.

## 🛒 Endpoints Verificados (Listos para usar)
- `POST /v1/market/tasks`: Crear tareas con presupuesto y geo-posición.
- `GET /v1/market/tasks`: Buscar tareas con filtros.
- `POST /v1/market/hire`: Formalizar contratación.
- `GET /v1/market/humans`: Buscar operadores humanos calificados.

## 📈 Conclusión
La base es profesional y escalable (Fastify + Redis). Sin embargo, si planeas usarlo hoy mismo con **MCP**, esa capa aún debe ser desarrollada siguiendo los tipos ya definidos en `src/types/index.ts`.

**Siguiente paso recomendado:** Implementar el salting de llaves y la capa de herramientas MCP.
