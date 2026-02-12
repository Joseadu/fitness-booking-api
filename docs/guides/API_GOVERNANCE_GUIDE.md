# Guía de Uso: Mejoras de Gobierno de APIs

## 1. ApiResponse Wrapper

### Backend - Uso del Wrapper

```typescript
import { successResponse, errorResponse, ApiResponse } from '../common/interfaces/api-response.interface';

// En tus servicios o controladores:

// Respuesta exitosa con datos
return successResponse(discipline, 'Discipline created successfully');

// Respuesta exitosa sin mensaje
return successResponse(disciplines);

// Respuesta de error
return errorResponse('VALIDATION_ERROR', 'Invalid input data');
```

### Cuándo usar el wrapper

✅ **Usar para**:
- Endpoints que requieren mensajes de éxito/error explícitos
- Operaciones complejas (invitaciones, autenticación, etc.)
- Respuestas que necesitan metadatos adicionales

❌ **No usar para**:
- Endpoints CRUD simples que solo devuelven datos
- Endpoints que ya tienen formato consistente
- Paginación (usa `PaginatedResult<T>`)

## 2. Transform Interceptor

### Activación Global (Opcional)

Para activar la transformación automática camelCase → snake_case en TODAS las respuestas:

```typescript
// src/main.ts
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Activar transformación global
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // ... resto de configuración
}
```

### Activación por Controlador

Si prefieres activarlo solo en controladores específicos:

```typescript
import { UseInterceptors } from '@nestjs/common';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';

@Controller('disciplines')
@UseInterceptors(TransformInterceptor)
export class DisciplinesController {
  // ...
}
```

### ⚠️ Importante

**NO actives el interceptor global si**:
- Ya tienes transformación manual en servicios frontend (como `DisciplineService.mapToFrontend()`)
- Prefieres control granular sobre qué endpoints transforman

**Activa el interceptor global si**:
- Quieres eliminar toda la transformación manual
- Prefieres consistencia automática en toda la API

## 3. Métodos HTTP Estandarizados

### Convención Adoptada

| Operación | Método | Endpoint | Uso |
|-----------|--------|----------|-----|
| Listar | `GET` | `/resource` | Obtener lista paginada |
| Obtener | `GET` | `/resource/:id` | Obtener un recurso |
| Crear | `POST` | `/resource` | Crear nuevo recurso |
| Actualizar | `PATCH` | `/resource/:id` | Actualización parcial |
| Eliminar | `DELETE` | `/resource/:id` | Eliminar recurso |
| Activar | `PATCH` | `/resource/:id/activate` | Cambiar estado |
| Desactivar | `PATCH` | `/resource/:id/deactivate` | Cambiar estado |

### Cambios Realizados

✅ **Backend**:
- `DisciplinesController`: `PUT` → `PATCH`
- `TemplatesController`: `PUT` → `PATCH`
- `TemplateItemsController`: `PUT` → `PATCH`

✅ **Frontend**:
- `DisciplineService.updateDiscipline()`: `http.put` → `http.patch`

### Migración de Código Existente

Si tienes otros controladores usando `PUT`, cámbialos a `PATCH`:

```typescript
// ❌ Antes
@Put(':id')
update(@Param('id') id: string, @Body() dto: UpdateDto) {
  return this.service.update(id, dto);
}

// ✅ Después
@Patch(':id')
update(@Param('id') id: string, @Body() dto: UpdateDto) {
  return this.service.update(id, dto);
}
```

## 4. BaseController Mejorado

El `BaseController` ya proporciona:
- ✅ `GET /resource` → findAll (paginado)
- ✅ `GET /resource/:id` → findOne
- ✅ `DELETE /resource/:id` → remove

Para usar en nuevos controladores:

```typescript
import { Controller, Post, Body, Patch, Param } from '@nestjs/common';
import { BaseController } from '../common/controllers/base.controller';
import { MyEntity } from './entities/my-entity.entity';
import { MyService } from './my.service';

@Controller('my-resource')
export class MyController extends BaseController<MyEntity> {
  constructor(private readonly myService: MyService) {
    super(myService); // Hereda findAll, findOne, remove
  }

  // Solo necesitas definir create y update
  @Post()
  create(@Body() dto: CreateDto) {
    return this.myService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDto) {
    return this.myService.update(id, dto);
  }
}
```

## 5. Próximos Pasos

### Fase 2: Automatización (Opcional)
- [ ] Implementar Swagger/OpenAPI para documentación automática
- [ ] Crear DTOs de respuesta tipados

### Fase 3: Mejoras Avanzadas (Opcional)
- [ ] Versionado `/v1/` en rutas
- [ ] Rate limiting global

## 6. Checklist de Migración

Para cada nuevo recurso:
- [ ] Extender de `BaseController<T>` y `BaseService<T>`
- [ ] Usar `PATCH` para actualizaciones
- [ ] Usar `PaginationDto` para listados
- [ ] Definir DTOs con `class-validator`
- [ ] Considerar usar `ApiResponse<T>` para operaciones complejas

## 7. Ejemplos Completos

Ver implementaciones de referencia en:
- ✅ `DisciplinesController` - Ejemplo completo de CRUD
- ✅ `TemplatesController` - Ejemplo con endpoints adicionales
- ✅ `BaseCrudService` (frontend) - Servicio base para frontend
