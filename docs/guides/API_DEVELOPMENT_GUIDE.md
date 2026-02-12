# 📚 Guía de Desarrollo de APIs - Fitness Booking

> **Propósito**: Guía práctica para desarrollar APIs consistentes en backend (NestJS) y consumirlas en frontend (Angular).

---

## 📖 Índice

1. [Backend: Crear un nuevo recurso](#backend-crear-un-nuevo-recurso)
2. [Frontend: Crear un nuevo servicio](#frontend-crear-un-nuevo-servicio)
3. [Convenciones y Estándares](#convenciones-y-estándares)
4. [Ejemplos Completos](#ejemplos-completos)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Backend: Crear un nuevo recurso

### Paso 1: Generar módulo (NestJS CLI)

```bash
cd fitness-booking-api
nest g resource products
# Seleccionar: REST API
# Seleccionar: Yes (generate CRUD entry points)
```

### Paso 2: Crear entidad

```typescript
// src/products/entities/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column('uuid', { name: 'box_id' })
  boxId: string;

  @Column('text')
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('boolean', { default: true })
  isActive: boolean;
}
```

### Paso 3: Crear DTOs

```typescript
// src/products/dto/create-product.dto.ts
import { IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  boxId: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;
}

// src/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### Paso 4: Crear servicio (extender BaseService)

```typescript
// src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../common/services/base.service';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService extends BaseService<Product> {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>
  ) {
    super(productRepository, 'Product');
  }

  // Solo agregar métodos específicos de negocio aquí
  // Ejemplo:
  async findByCategory(category: string) {
    return this.productRepository.find({ where: { category } });
  }
}
```

### Paso 5: Crear controlador (extender BaseController)

```typescript
// src/products/products.controller.ts
import { Controller, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { BaseController } from '../common/controllers/base.controller';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/role.enum';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController extends BaseController<Product> {
  constructor(private readonly productsService: ProductsService) {
    super(productsService);
  }

  @Post()
  @Roles(UserRole.OWNER)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  // activate/deactivate heredados de BaseController
}
```

### ✅ Endpoints generados automáticamente

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/products?boxId=...&page=1&limit=10` | Listar productos (paginado) |
| GET | `/products/:id` | Obtener producto por ID |
| POST | `/products` | Crear producto |
| PATCH | `/products/:id` | Actualizar producto |
| DELETE | `/products/:id` | Eliminar producto |
| PATCH | `/products/:id/activate` | Activar producto |
| PATCH | `/products/:id/deactivate` | Desactivar producto |

---

## 🎨 Frontend: Crear un nuevo servicio

### Paso 1: Crear modelo

```typescript
// src/app/core/models/product.model.ts
export interface Product {
  id: string;
  box_id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductDto {
  box_id: string;
  name: string;
  price: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  is_active?: boolean;
}
```

### Paso 2: Exportar en index.ts

```typescript
// src/app/core/models/index.ts
export * from './product.model';
```

### Paso 3: Crear servicio (extender BaseCrudService)

```typescript
// src/app/core/services/products/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, CreateProductDto, UpdateProductDto } from '../../models';
import { BaseCrudService } from '../base/base-crud.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseCrudService<Product> {
  protected resourcePath = 'products';

  constructor(http: HttpClient) {
    super(http);
  }

  // Métodos heredados disponibles:
  // - getByBox(boxId, page, limit)
  // - getById(id)
  // - create(data)
  // - update(id, data)
  // - delete(id)
  // - activate(id)
  // - deactivate(id)

  // Solo agregar métodos específicos aquí
  // Ejemplo:
  getByCategory(boxId: string, category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}?boxId=${boxId}&category=${category}`);
  }
}
```

### Paso 4: Usar en componente

```typescript
// src/app/features/products/products.component.ts
import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../core/services/products/product.service';
import { Product } from '../../core/models';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    const boxId = 'your-box-id';
    this.productService.getByBox(boxId).subscribe(result => {
      this.products = result.items;
    });
  }

  createProduct(data: any) {
    this.productService.create(data).subscribe(product => {
      this.products.push(product);
    });
  }

  updateProduct(id: string, data: any) {
    this.productService.update(id, data).subscribe(updated => {
      const index = this.products.findIndex(p => p.id === id);
      if (index !== -1) this.products[index] = updated;
    });
  }

  deleteProduct(id: string) {
    this.productService.delete(id).subscribe(() => {
      this.products = this.products.filter(p => p.id !== id);
    });
  }
}
```

---

## 📋 Convenciones y Estándares

### Métodos HTTP

| Operación | Método | Cuándo usar |
|-----------|--------|-------------|
| Listar | `GET` | Obtener múltiples recursos |
| Obtener | `GET` | Obtener un recurso específico |
| Crear | `POST` | Crear nuevo recurso |
| Actualizar | `PATCH` | Actualización parcial (recomendado) |
| Reemplazar | `PUT` | Reemplazo completo (evitar) |
| Eliminar | `DELETE` | Eliminar recurso |

### Nomenclatura de Endpoints

```
✅ CORRECTO:
GET    /products              # Listar
GET    /products/:id          # Obtener
POST   /products              # Crear
PATCH  /products/:id          # Actualizar
DELETE /products/:id          # Eliminar
PATCH  /products/:id/activate # Acción específica

❌ INCORRECTO:
GET    /getProducts           # No usar verbos en URL
POST   /products/create       # Redundante
PUT    /products/:id          # Preferir PATCH
GET    /product/:id           # Usar plural
```

### Convención de Nombres (snake_case vs camelCase)

**Backend (Base de datos y DTOs)**:
- Base de datos: `snake_case` (PostgreSQL estándar)
- DTOs: `camelCase` (TypeScript/JavaScript estándar)

**Frontend**:
- Modelos: `snake_case` (coincide con DB)
- Código: `camelCase` (TypeScript estándar)

**Transformación automática**: Usar `TransformInterceptor` (opcional)

### Estructura de Respuestas

**Paginación** (usar `PaginatedResult`):
```typescript
{
  items: [...],
  meta: {
    totalItems: 100,
    itemCount: 10,
    itemsPerPage: 10,
    totalPages: 10,
    currentPage: 1
  }
}
```

**Respuesta simple** (recurso único):
```typescript
{
  id: "uuid",
  name: "Product",
  // ... campos
}
```

**Respuesta con mensaje** (usar `ApiResponse` para operaciones complejas):
```typescript
{
  success: true,
  data: { ... },
  message: "Operation completed"
}
```

---

## 📚 Ejemplos Completos

### Ejemplo 1: CRUD Simple (Disciplines)

**Backend**:
- ✅ Extiende `BaseController` y `BaseService`
- ✅ Solo define `create()` y `update()` con DTOs específicos
- ✅ Hereda: `findAll()`, `findOne()`, `remove()`, `activate()`, `deactivate()`

**Frontend**:
- ✅ Extiende `BaseCrudService`
- ✅ Solo agrega transformación de datos (`mapItem()`)
- ✅ Hereda todos los métodos CRUD

**Ver**: [`disciplines.controller.ts`](file:///c:/Users/Jose%20Diaz/Desktop/proyectos/fitness-booking-api/src/disciplines/disciplines.controller.ts)

---

### Ejemplo 2: CRUD + Lógica de Negocio (Schedules)

**Backend**:
- ✅ Extiende `BaseController` y `BaseService`
- ✅ Define CRUD básico
- ✅ Agrega endpoints de negocio: `cancel()`, `copyWeek()`, `publishWeek()`

**Frontend**:
- ✅ Extiende `BaseCrudService`
- ✅ Sobreescribe `getSchedules()` para filtros custom
- ✅ Agrega métodos de negocio: `cancelSchedules()`, `copyWeek()`, etc.

**Ver**: [`schedules.controller.ts`](file:///c:/Users/Jose%20Diaz/Desktop/proyectos/fitness-booking-api/src/schedules/schedules.controller.ts)

---

### Ejemplo 3: Endpoints Especializados (Invitations)

**Backend**:
- ⚠️ NO extiende `BaseController` (lógica muy específica)
- ✅ Define endpoints custom: `accept()`, `validateToken()`, `setupAccount()`
- ✅ Usa `@Public()` para endpoints sin autenticación

**Frontend**:
- ✅ Extiende `BaseCrudService`
- ✅ Agrega métodos específicos: `acceptInvitation()`, `validateToken()`, etc.

**Ver**: [`invitations.controller.ts`](file:///c:/Users/Jose%20Diaz/Desktop/proyectos/fitness-booking-api/src/invitations/invitations.controller.ts)

---

## 🔍 Troubleshooting

### Error: "Cannot find name 'Patch'"

**Solución**: Agregar `Patch` al import de `@nestjs/common`
```typescript
import { Controller, Get, Post, Patch, Delete } from '@nestjs/common';
```

### Error: "Type 'Observable<X>' is not assignable to type 'Observable<Y>'"

**Solución**: Verificar que los tipos coincidan o agregar mapper
```typescript
// Opción 1: Cambiar tipo de retorno
createProduct(data: any): Observable<ProductApiDto> { ... }

// Opción 2: Agregar mapper
return this.http.post(...).pipe(
  map(item => this.mapToFrontend(item))
);
```

### Error: Paginación no funciona

**Solución**: Verificar que el backend devuelva `PaginatedResult`
```typescript
// Backend debe devolver:
{
  items: [...],
  meta: { totalItems, itemCount, ... }
}
```

### ¿Cuándo NO usar BaseController/BaseCrudService?

**NO usar cuando**:
- Lógica de negocio muy específica (ej: Invitations)
- Endpoints completamente diferentes al patrón CRUD
- Necesitas control total sobre cada endpoint

**SÍ usar cuando**:
- CRUD estándar (80% de casos)
- Necesitas consistencia
- Quieres ahorrar código repetitivo

---

## 📝 Checklist para Nuevos Recursos

### Backend
- [ ] Generar módulo con NestJS CLI
- [ ] Crear entidad extendiendo `BaseEntity`
- [ ] Crear DTOs con validación (`class-validator`)
- [ ] Servicio extiende `BaseService<T>`
- [ ] Controlador extiende `BaseController<T>`
- [ ] Definir solo métodos específicos
- [ ] Usar `@Roles()` para autorización
- [ ] Usar `PATCH` para actualizaciones

### Frontend
- [ ] Crear interfaz del modelo
- [ ] Exportar en `models/index.ts`
- [ ] Servicio extiende `BaseCrudService<T>`
- [ ] Definir `resourcePath`
- [ ] Agregar solo métodos específicos
- [ ] Usar métodos heredados en componentes

---

## 🎯 Resumen

**Regla de oro**: 
> Usa `BaseController`/`BaseService` (backend) y `BaseCrudService` (frontend) para CRUD estándar. Solo sobreescribe o agrega métodos cuando tengas lógica de negocio específica.

**Beneficios**:
- ✅ Código consistente
- ✅ Menos bugs
- ✅ Fácil mantenimiento
- ✅ Onboarding rápido para nuevos desarrolladores

---

## 📚 Referencias

- [API Governance Guide (Técnico)](file:///c:/Users/Jose%20Diaz/Desktop/proyectos/fitness-booking-api/docs/guides/API_GOVERNANCE_GUIDE.md)
- [BaseController](file:///c:/Users/Jose%20Diaz/Desktop/proyectos/fitness-booking-api/src/common/controllers/base.controller.ts)
- [BaseService](file:///c:/Users/Jose%20Diaz/Desktop/proyectos/fitness-booking-api/src/common/services/base.service.ts)
- [BaseCrudService](file:///c:/Users/Jose%20Diaz/Desktop/proyectos/fitness-booking/src/app/core/services/base/base-crud.service.ts)
