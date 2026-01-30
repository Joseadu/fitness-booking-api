# Especificación de Filtrado por Fechas (Schedules)

**Problema Detectado:**
El endpoint `GET /schedules` devuelve siempre las últimas clases registradas, ignorando el rango de fechas solicitado por el calendario. Esto hace que el calendario aparezca vacío en semanas futuras o pasadas.

**Solución Requerida:**
Implementar el filtrado por `fromDate` y `toDate` en el Controller y Service.

## 1. SchedulesController (`schedules.controller.ts`)

Añadir los Query Parameters opcionales.

```typescript
@Get()
findAll(
  @Query('boxId') boxId: string,
  @Query('fromDate') fromDate?: string, // <--- NUEVO
  @Query('toDate') toDate?: string      // <--- NUEVO
) {
  return this.schedulesService.findAll(boxId, fromDate, toDate);
}
```

## 2. SchedulesService (`schedules.service.ts`)

Usar `Between` (TypeORM) para filtrar por fecha si vienen los parámetros.

```typescript
// Importar Between de TypeORM
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

async findAll(boxId: string, fromDate?: string, toDate?: string) {
  const where: any = { 
    box: { id: boxId } 
  };

  // Lógica de filtrado dinámico
  if (fromDate && toDate) {
    // Rango exacto (lo que envía el calendario)
    where.date = Between(fromDate, toDate);
  } else if (fromDate) {
    // Desde tal fecha en adelante
    where.date = MoreThanOrEqual(fromDate);
  } else if (toDate) {
    // Hasta tal fecha
    where.date = LessThanOrEqual(toDate);
  }

  // Ejecutar consulta
  return this.scheduleRepo.find({
    where: where,
    relations: ['discipline', 'coach', 'bookings'], // Asegurar relaciones
    order: {
      date: 'ASC',
      start_time: 'ASC'
    }
    // IMPORTANTE: Quitar 'take: 50' o límites fijos si existen
  });
}
```

## Verificación
Una vez aplicado, la llamada:
`GET /schedules?boxId=...&fromDate=2026-01-12&toDate=2026-01-19`

Deberá devolver **SOLO** las clases de esa semana (las que acabamos de crear con la plantilla).
