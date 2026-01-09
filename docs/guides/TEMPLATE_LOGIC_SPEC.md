# Especificación de Lógica de Plantillas (Backend) - FIX VERIFICADO

> **Diagnóstico Verificado:**
> 1. He revisado `schedules.service.ts`: El método `findAll` solo devuelve clases con **`isVisible: true`**.
> 2. He revisado `schedule.entity.ts`: La columna `isVisible` existe.
> 3. **Error anterior:** Al quitar `isVisible` del payload, las clases se creaban pero no se veían.
> 4. **Solución:** Enviar explícitamente `isVisible: true`.

## 3. Apply Template (CÓDIGO CORRECTO Y FINAL)

**Archivo:** `templates.service.ts`
**Método:** `applyTemplate`

```typescript
async applyTemplate(templateId: string, dto: ApplyTemplateDto): Promise<void> {
    const { targetWeekStartDate } = dto;
    const mondayDate = this.validateMonday(targetWeekStartDate);

    const template = await this.findOne(templateId);
    if (!template || !template.items || template.items.length === 0) return;

    const schedulesToCreate = [];

    for (const item of template.items) {
        const itemDate = new Date(mondayDate);
        itemDate.setDate(mondayDate.getDate() + (item.dayOfWeek - 1));
        const dateStr = itemDate.toISOString().split('T')[0];

        const schedule = {
            boxId: template.boxId,
            disciplineId: item.disciplineId, // Correcto según Entity
            trainerId: item.trainerId, 
            date: dateStr,
            startTime: item.startTime,
            endTime: item.endTime,
            maxCapacity: item.maxCapacity, // Correcto según Entity
            
            // CAMPOS CRÍTICOS
            currentBookings: 0,
            isCancelled: false,
            isVisible: true, // <--- IMPRESCINDIBLE: true para que findAll las devuelva
            
            name: item.name,
            description: item.description
        };

        schedulesToCreate.push(schedule);
    }

    if (schedulesToCreate.length > 0) {
        await this.scheduleRepo
            .createQueryBuilder()
            .insert()
            .into(Schedule)
            .values(schedulesToCreate)
            .orIgnore() // Evita duplicados y errores de constraints únicos
            .execute();
    }
}
```
