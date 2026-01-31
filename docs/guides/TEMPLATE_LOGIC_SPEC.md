# Especificación de Lógica de Plantillas (Backend) - FIX VERIFICADO

> **Diagnóstico Verificado:**
> 1. He revisado `schedules.service.ts`: El método `findAll` solo devuelve clases con **`is_visible: true`**.
> 2. He revisado `schedule.entity.ts`: La columna `is_visible` existe.
> 3. **Error anterior:** Al quitar `is_visible` del payload, las clases se creaban pero no se veían.
> 4. **Solución:** Enviar explícitamente `is_visible: true`.

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
            discipline_id: item.discipline_id, // Correcto según Entity
            trainer_id: item.trainer_id, 
            date: dateStr,
            start_time: item.start_time,
            end_time: item.end_time,
            maxCapacity: item.maxCapacity, // Correcto según Entity
            
            // CAMPOS CRÍTICOS
            currentBookings: 0,
            isCancelled: false,
            is_visible: true, // <--- IMPRESCINDIBLE: true para que findAll las devuelva
            
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
