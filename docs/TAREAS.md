# Fitness Booking API - Seguimiento de Tareas

Este archivo se actualizará automáticamente con el progreso del desarrollo.

- [x] **Configuración del Proyecto y GitHub**
    - [x] Inicializar repositorio Git
    - [x] Añadir remoto `origin`
    - [x] Subir código inicial a main/master
- [x] **Configuración y Entorno**
    - [x] Instalar `@nestjs/config` y `joi`
    - [x] Configurar `ConfigModule` con validación Joi
    - [x] Crear archivo `.env` (Usuario debe rellenar credenciales)
- [x] **Conexión a Base de Datos (TypeORM)**
    - [x] Instalar `typeorm`, `pg`, `@nestjs/typeorm`
    - [x] Configurar `TypeOrmModule` (Supabase SSL)
    - [x] Crear entidad `HealthCheck`
- [x] **Autenticación (Supabase JWT)**
    - [x] Instalar `passport`, `passport-jwt`
    - [x] Crear `JwtStrategy`
    - [x] Implementar `JwtAuthGuard` global
- [x] **Health Check Endpoint**
    - [x] Crear `HealthController` (`GET /health`)
- [x] **Documentación**
    - [x] Crear guía de credenciales
    - [x] Mantener `docs/` actualizado
- [x] **Verificación Final**
    - [x] Conexión DB verificada (Transaction Pooler)
    - [x] Endpoint `/health` respondiendo OK

## Fase 2: Migración Backend (En Progreso)
- [x] **Fase 1: Data Model (Entidades)**
    - [x] Crear Entidad `Box`
    - [x] Crear Entidad `Profile` (Athlete)
    - [x] Crear Entidad `Discipline`
    - [x] Crear Entidad `Schedule`
    - [x] Crear Entidad `Booking`
    - [x] Crear Entidad `BoxMembership`
    - [x] Crear Entidad `WeekTemplate` & `WeekTemplateItem`
    - [x] Registrar Módulos en `AppModule` (TemplatesModule incluido)
- [ ] **Fase 2: Módulos CRUD**
    - [x] Disciplines Module (CRUD Completo)
    - [x] Athlete Module (Profile + Memberships Read)
