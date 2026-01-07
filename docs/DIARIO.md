# Diario de Desarrollo

## 01 - Configuración Inicial (Dia 1)
**Estado**: Completado

Se ha establecido la base del proyecto Backend con NestJS.

### Cambios Realizados
1. **GitHub**: Repositorio inicializado y conectado.
2. **Entorno**: Validación estricta de variables de entorno (`DATABASE_URL`, `SUPABASE_JWT_SECRET`).
3. **Database**: Conexión a Supabase configurada usando TypeORM con soporte SSL.
4. **Auth**: Estrategia de Passport implementada para validar JWTs nativos de Supabase.
5. **Health**: Endpoint `/health` creado para monitoreo.

### Próximos Pasos
- Definir modelos de datos principales (Usuarios, Clases, Reservas).
- Crear endpoints de API para dichas entidades.

### Notas de Resolución de Problemas
- **Conexión Supabase**: Se resolvió problema de autenticación (`password authentication failed` y `Circuit breaker open`).
    - Solución: Reset de contraseña a una alfanumérica simple y uso de conexión **Transaction Pooler** (puerto 6543).
    - Importante: Las variables en `.env` deben ir entre comillas dobles.
