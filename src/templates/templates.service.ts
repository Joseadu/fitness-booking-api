import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { WeekTemplate } from './entities/week-template.entity';
import { WeekTemplateItem } from './entities/week-template-item.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/create-template.dto';
import { AddTemplateItemDto } from './dto/add-template-item.dto';
import { ImportTemplateDto, ApplyTemplateDto } from './dto/template-actions.dto';

@Injectable()
export class TemplatesService {
    constructor(
        @InjectRepository(WeekTemplate)
        private readonly templateRepo: Repository<WeekTemplate>,
        @InjectRepository(WeekTemplateItem)
        private readonly itemRepo: Repository<WeekTemplateItem>,
        @InjectRepository(Schedule)
        private readonly scheduleRepo: Repository<Schedule>,
        private readonly dataSource: DataSource,
    ) { }

    // --- CRUD Template ---

    async findAll(boxId: string): Promise<WeekTemplate[]> {
        return this.templateRepo.find({
            where: { boxId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<WeekTemplate> {
        const template = await this.templateRepo.findOne({
            where: { id },
            relations: ['items', 'items.discipline'],
            order: {
                items: {
                    dayOfWeek: 'ASC',
                    startTime: 'ASC',
                },
            },
        });
        if (!template) throw new NotFoundException('Template not found');
        return template;
    }

    async create(dto: CreateTemplateDto): Promise<WeekTemplate> {
        const tpl = this.templateRepo.create(dto);
        return this.templateRepo.save(tpl);
    }

    async update(id: string, dto: UpdateTemplateDto): Promise<WeekTemplate> {
        const tpl = await this.findOne(id);
        Object.assign(tpl, dto);
        return this.templateRepo.save(tpl);
    }

    async remove(id: string): Promise<void> {
        // Cascade delete should handle items if configured in DB, 
        // but explicit removal is safer if FK cascade is missing.
        await this.templateRepo.delete(id);
    }

    // --- CRUD Items ---

    async addItem(templateId: string, dto: AddTemplateItemDto): Promise<WeekTemplateItem> {
        // Verificar existencia template
        await this.findOne(templateId);
        const item = this.itemRepo.create({ ...dto, templateId });
        return this.itemRepo.save(item);
    }

    async updateItem(itemId: string, dto: Partial<AddTemplateItemDto>): Promise<WeekTemplateItem> {
        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Item not found');
        Object.assign(item, dto);
        return this.itemRepo.save(item);
    }

    async removeItem(itemId: string): Promise<void> {
        await this.itemRepo.delete(itemId);
    }

    // --- BUSINESS LOGIC: IMPORT ---

    async importFromWeek(dto: ImportTemplateDto): Promise<WeekTemplate> {
        const { boxId, weekStartDate, name } = dto;

        // Calcular rango de fechas (Lunes a Domingo)
        const start = new Date(weekStartDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        // Ajuste zona horaria simple para búsqueda string YYYY-MM-DD
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // 1. Buscar clases activas
        const schedules = await this.scheduleRepo.find({
            where: {
                boxId,
                date: Between(startStr, endStr),
                isCancelled: false,
            }
        });

        if (schedules.length === 0) {
            throw new BadRequestException('No schedules found in that week to import');
        }

        // 2. Transaction para crear Template + Items
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Crear Template
            const newTemplate = queryRunner.manager.create(WeekTemplate, {
                boxId,
                name,
                description: `Imported from week ${startStr}`,
            });
            const savedTemplate = await queryRunner.manager.save(newTemplate);

            // Crear Items
            const itemsToCreate = schedules.map(schedule => {
                const dateObj = new Date(schedule.date); // "2024-01-01"
                // getDay(): 0=Domingo, 1=Lunes.
                // Nuestra DB usa 1=Lunes, 7=Domingo.
                let dayOfWeek = dateObj.getDay();
                if (dayOfWeek === 0) dayOfWeek = 7;

                return queryRunner.manager.create(WeekTemplateItem, {
                    templateId: savedTemplate.id,
                    disciplineId: schedule.disciplineId, // Asume que schedule tiene disciplineId cargado? No, es raw ID.
                    trainerId: schedule.trainerId,
                    dayOfWeek,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    maxCapacity: schedule.maxCapacity,
                    name: schedule.name,
                    description: schedule.description,
                });
            });

            await queryRunner.manager.save(WeekTemplateItem, itemsToCreate);

            await queryRunner.commitTransaction();
            return savedTemplate;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    // --- BUSINESS LOGIC: APPLY ---

    async applyTemplate(templateId: string, dto: ApplyTemplateDto): Promise<Schedule[]> {
        const { targetWeekStartDate } = dto;
        const template = await this.findOne(templateId); // Trae items

        if (!template.items || template.items.length === 0) {
            throw new BadRequestException('Template has no items');
        }

        // Validar que sea lunes? (Opcional, pero recomendable)
        const mondayDate = new Date(targetWeekStartDate);
        // if (mondayDate.getDay() !== 1) ... throw error "Must start on Monday"

        const schedulesToCreate: Schedule[] = [];

        for (const item of template.items) {
            // Calcular fecha para este item
            // item.dayOfWeek: 1=Lunes ... 7=Domingo
            // target=Lunes. Offset = dayOfWeek - 1.
            const itemDate = new Date(mondayDate);
            itemDate.setDate(mondayDate.getDate() + (item.dayOfWeek - 1));
            const dateStr = itemDate.toISOString().split('T')[0];

            const schedule = this.scheduleRepo.create({
                boxId: template.boxId,
                date: dateStr,
                startTime: item.startTime,
                endTime: item.endTime,
                disciplineId: item.disciplineId,
                trainerId: item.trainerId,
                maxCapacity: item.maxCapacity,
                name: item.name,
                description: item.description,
                isVisible: false, // BOTE EL BORRADOR
                isCancelled: false,
            });
            schedulesToCreate.push(schedule);
        }

        // Guardar todo
        // Podríamos usar transaction también, pero save([]) es atómico a nivel de typeorm batch insert
        return this.scheduleRepo.save(schedulesToCreate);
    }
}
