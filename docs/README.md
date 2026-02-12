# 📚 Documentación - Fitness Booking

Bienvenido a la documentación del proyecto Fitness Booking.

---

## � Inicio Rápido

### Para Desarrolladores

**¿Vas a crear o modificar APIs?**  
👉 Lee la [**Guía de Desarrollo de APIs**](./guides/API_DEVELOPMENT_GUIDE.md)

**¿Necesitas entender las herramientas y convenciones?**  
👉 Consulta la [**Guía de Gobierno de APIs**](./guides/API_GOVERNANCE_GUIDE.md)

---

## 📖 Guías Disponibles

### 1. [API Development Guide](./guides/API_DEVELOPMENT_GUIDE.md) ⭐ **EMPEZAR AQUÍ**
**Propósito**: Guía práctica paso a paso para desarrollo de APIs

**Contenido**:
- ✅ Cómo crear un nuevo recurso (backend)
- ✅ Cómo crear un nuevo servicio (frontend)
- ✅ Ejemplos completos con código
- ✅ Convenciones y estándares
- ✅ Troubleshooting de errores comunes
- ✅ Checklist de desarrollo

**Cuándo usar**: Cuando vayas a crear o modificar APIs

---

### 2. [API Governance Guide](./guides/API_GOVERNANCE_GUIDE.md)
**Propósito**: Guía técnica de herramientas y convenciones

**Contenido**:
- ✅ Uso de `ApiResponse<T>` wrapper
- ✅ Configuración de `TransformInterceptor`
- ✅ Estándares de métodos HTTP
- ✅ Mejores prácticas de gobierno de APIs

**Cuándo usar**: Cuando necesites entender una herramienta específica

---

### 3. [Schedule Filter Spec](./guides/SCHEDULE_FILTER_SPEC.md)
**Propósito**: Especificación de filtros de clases

**Contenido**:
- Lógica de filtrado de schedules
- Parámetros de consulta
- Casos de uso

---

### 4. [Template Logic Spec](./guides/TEMPLATE_LOGIC_SPEC.md)
**Propósito**: Especificación de lógica de plantillas

**Contenido**:
- Cómo funcionan las plantillas semanales
- Aplicación de plantillas
- Creación desde semana existente

---

### 5. [Obtener Credenciales](./guides/OBTENER_CREDENCIALES.md)
**Propósito**: Guía para configurar credenciales de Supabase

**Contenido**:
- Cómo obtener credenciales de Supabase
- Configuración de variables de entorno
- Troubleshooting de conexión

---

## 📂 Estructura de Documentación

```
docs/
├── README.md                              # Este archivo (índice)
└── guides/
    ├── API_DEVELOPMENT_GUIDE.md           # ⭐ Guía principal de desarrollo
    ├── API_GOVERNANCE_GUIDE.md            # Gobierno de APIs (técnico)
    ├── SCHEDULE_FILTER_SPEC.md            # Especificación de filtros
    ├── TEMPLATE_LOGIC_SPEC.md             # Especificación de plantillas
    └── OBTENER_CREDENCIALES.md            # Configuración de Supabase
```

---

## 🎯 Flujo de Trabajo Recomendado

### Crear un nuevo recurso
1. Lee [API Development Guide](./guides/API_DEVELOPMENT_GUIDE.md)
2. Sigue la sección "Backend: Crear un nuevo recurso"
3. Sigue la sección "Frontend: Crear un nuevo servicio"
4. Consulta ejemplos si tienes dudas

### Resolver un error
1. Ve a [Troubleshooting](./guides/API_DEVELOPMENT_GUIDE.md#troubleshooting)
2. Busca tu error específico
3. Si no está documentado, consulta las guías técnicas

### Entender una herramienta
1. Lee [API Governance Guide](./guides/API_GOVERNANCE_GUIDE.md)
2. Busca la herramienta específica
3. Ve ejemplos de uso en [API Development Guide](./guides/API_DEVELOPMENT_GUIDE.md)

---

## 📋 Convenciones Rápidas

| Aspecto | Convención |
|---------|------------|
| **Métodos HTTP** | Usar `PATCH` para actualizaciones |
| **Nomenclatura** | Endpoints en plural (`/products`) |
| **Backend** | Extender `BaseController` + `BaseService` |
| **Frontend** | Extender `BaseCrudService` |
| **DTOs** | Validación con `class-validator` |

---

## 🆘 ¿Necesitas Ayuda?

1. **Primero**: Consulta [API Development Guide](./guides/API_DEVELOPMENT_GUIDE.md)
2. **Si no resuelve**: Revisa [Troubleshooting](./guides/API_DEVELOPMENT_GUIDE.md#troubleshooting)
3. **Para detalles técnicos**: Lee [API Governance Guide](./guides/API_GOVERNANCE_GUIDE.md)

---

## 📝 Contribuir a la Documentación

Si encuentras algo que falta o puede mejorarse:
1. Actualiza el documento correspondiente en `docs/guides/`
2. Mantén el formato consistente (usa markdown)
3. Agrega ejemplos cuando sea posible
4. Actualiza este README si agregas nuevas guías
