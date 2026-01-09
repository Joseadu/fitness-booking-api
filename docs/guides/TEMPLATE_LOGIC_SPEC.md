# Especificación de Lógica de Plantillas (Backend)

## 1. Validaciones Previas (Común)
Para evitar desajustes en el calendario, todas las operaciones de plantillas (`import`, `apply`, `check`) deben validar que la fecha proporcionada sea el inicio de la semana (Lunes).

```typescript
private validateMonday(date: string | Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    // 0 = Domingo, 1 = Lunes. En JS, getDay() devuelve 0-6.
    // Asumimos que la semana empieza el Lunes (1).
    if (day !== 1) {
        throw new BadRequestException('La fecha proporcionada debe ser un Lunes.');
    }
    return d;
}
```

## 2. Nuevo Endpoint: Chequeo de Conflictos
Antes de aplicar, el frontend llamará a este endpoint para advertir al usuario.

**Ruta:** `POST /week-templates/:id/check-conflicts`
**Body:** `{ targetWeekStartDate: "YYYY-MM-DD" }`

**Lógica de Servicio:**
```typescript
async checkConflicts(templateId: string, dto: ApplyTemplateDto): Promise<{ conflicts: number, totalToCreate: number }> {
    const { targetWeekStartDate } = dto;
    this.validateMonday(targetWeekStartDate); // Validación

    const template = await this.findOne(templateId);
    if (!template.items.length) return { conflicts: 0, totalToCreate: 0 };

    const mondayDate = new Date(targetWeekStartDate);
    let conflicts = 0;

    // Pre-calcular los slots que intentaremos llenar
    for (const item of template.items) {
        // Calcular fecha real del item (Lunes + offset)
        const itemDate = new Date(mondayDate);
        itemDate.setDate(mondayDate.getDate() + (item.dayOfWeek - 1));
        const dateStr = itemDate.toISOString().split('T')[0];

        // Buscar si YA existe una clase igual
        const exists = await this.scheduleRepo.findOne({
            where: {
                boxId: template.boxId,
                disciplineId: item.disciplineId, // Asumiendo conflicto por disciplina
                date: dateStr,
                startTime: item.startTime
                // NOTA: Si queremos permitir varios profes, añadir trainerId aquí
            }
        });

        if (exists) {
            conflicts++;
        }
    }

    return { 
        conflicts, 
        totalToCreate: template.items.length 
    };
}
```

## 3. Mejora Crítica: Aplicar Plantilla (Safe Merge)
Usamos `orIgnore` para evitar errores 500.

**Ruta:** `POST /week-templates/:id/apply`

**Lógica de Servicio:**
```typescript
async applyTemplate(templateId: string, dto: ApplyTemplateDto): Promise<void> {
    const { targetWeekStartDate } = dto;
    this.validateMonday(targetWeekStartDate); // Validación

    const template = await this.findOne(templateId);
    
    // ... Generar array de objetos 'schedulesToCreate' (igual que antes) ...

    // SOLUCIÓN "OR IGNORE"
    await this.scheduleRepo
        .createQueryBuilder()
        .insert()
        .into(Schedule)
        .values(schedulesToCreate)
        .orIgnore() // <--- CRÍTICO: Ignora duplicados, inserta solo los huecos libres
        .execute();
}
```
