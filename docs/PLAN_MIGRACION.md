# Plan Maestro de Migración - Fitness Booking API Backend 🚀

Este documento define la arquitectura, estándares de código y fases de implementación para migrar el backend de Supabase a NestJS.

## 1. Arquitectura del Sistema

Seguiremos una **Arquitectura por Capas** (Layered Architecture) estricta para asegurar mantenibilidad y escalabilidad.

### Diagrama de Flujo de Datos
`Request` ➡️ **Controller** ➡️ **Service** ➡️ **Repository (TypeORM)** ➡️ `Database`

### Capas y Responsabilidades

1.  **Transport Layer (Controllers + DTOs)**
    - **Responsabilidad**: Manejar peticiones HTTP, validación de entrada y serialización de respuesta.
    - **Reglas**:
        - NUNCA contener lógica de negocio.
        - Usar siempre **DTOs** (Data Transfer Objects) para recibir datos.
        - Validar datos usando `class-validator` y `class-transformer`.
        - Retornar códigos HTTP adecuados (200, 201, 400, 404).

2.  **Domain/Business Layer (Services)**
    - **Responsabilidad**: Lógica de negocio pura.
    - **Reglas**:
        - Validaciones de reglas de negocio (ej: "¿hay cupo en la clase?").
        - Transformación de datos.
        - Orquestar llamadas a repositorios.

3.  **Data Access Layer (Entities + Repositories)**
    - **Responsabilidad**: Interacción directa con la base de datos.
    - **Reglas**:
        - Usar **Entidades TypeORM** que reflejen fielmente las tablas de Supabase.
        - Usar `Repository<Entity>` inyectado.

---

## 2. Estándares de Código

### Estructura de Módulos
Cada dominio funcional tendrá su propio módulo.
```
src/
├── athletes/           # Módulo de Atletas
├── disciplines/        # Módulo de Disciplinas
├── schedules/          # Módulo de Clases/Horarios (CORE)
├── bookings/           # Módulo de Reservas (CORE)
└── stats/              # (Futuro) Estadísticas de propietarios
```

### Naming Conventions
- Archivos: `kebab-case` (ej: `create-booking.dto.ts`)
- Clases: `PascalCase` (ej: `CreateBookingDto`)
- Métodos/Variables: `camelCase` (ej: `findActiveBookings`)
- Interfaces: `I` prefix opcional, prefiero sin prefijo si es DTO/Entity.

### Entidades (Reverse Engineering)
Las entidades deben coincidir con las tablas de PostgreSQL existentes para no romper Supabase.
- Usar nombres de tabla explícitos: `@Entity('bookings')`.
- Usar nombres de columna explícitos: `@Column({ name: 'is_active' })`.

---

## 3. Plan de Acción Detallado

### Fase 1: Cimientos ("Foundation")
- [ ] **Configuración DB**: (Completado) Configuración TypeORM y SSL.
- [ ] **Auth**: (Completado) JWT Strategy.
- [ ] **Data Model (Entidades)**: Crear las clases TypeScript para:
    - `Box` (boxes)
    - `Profile` (profiles -> users table extension)
    - `Discipline` (disciplines)
    - `Schedule` (schedules)
    - `Booking` (bookings)

### Fase 2: CRUDs Básicos ("Dumb Resources")
Objetivo: Reemplazar lecturas directas del frontend.
- [ ] **Disciplines Module**: GET, POST, PUT, DELETE.
- [ ] **Athletes Module**: GET (perfil + membresía).

### Fase 3: Core (Lógica de Negocio)
Aquí está el 80% de la complejidad.
- [ ] **Schedules Module**:
    - `GET` con filtros complejos (fecha, box).
    - Lógica de `spots_available`.
    - Acciones: Cancelar clase, Publicar semana.
- [ ] **Bookings Module**:
    - `POST /bookings`: **Validación Crítica de Cupo** (Transacción o Lock).
    - `GET /my-bookings`: Join con Schedules y Disciplines.

### Fase 4: Lógica Avanzada
- [ ] **Template Module**: Lógica para aplicar patrones de semana (`week_templates`).
- [ ] **Migración de Scripts**: Reemplazar funciones SQL (RPCs) por código Node.js si es necesario para mayor control.

---

## 4. Próximos Pasos (Inmediato)
1.  Generar las Entidades TypeORM base (`src/**/*.entity.ts`).
2.  Crear el módulo `disciplines` como primera prueba de concepto "end-to-end" (Controller -> Service -> DB).
