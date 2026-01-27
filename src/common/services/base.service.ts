import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';
import { PaginationDto } from '../dtos/pagination.dto';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

export abstract class BaseService<T extends BaseEntity> {
    constructor(
        protected readonly repository: Repository<T>,
        protected readonly entityName: string
    ) { }

    async findAll(paginationDto: PaginationDto, where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<PaginatedResult<T>> {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const [items, totalItems] = await this.repository.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' } as any
        });

        const totalPages = Math.ceil(totalItems / limit);

        return {
            items,
            meta: {
                totalItems,
                itemCount: items.length,
                itemsPerPage: limit,
                totalPages,
                currentPage: page
            }
        };
    }

    async findOne(id: string): Promise<T> {
        const item = await this.repository.findOne({
            where: { id } as any
        });
        if (!item) throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
        return item;
    }

    async create(createDto: DeepPartial<T>): Promise<T> {
        const item = this.repository.create(createDto);
        return this.repository.save(item);
    }

    async update(id: string, updateDto: DeepPartial<T>): Promise<T> {
        await this.findOne(id);
        await this.repository.update(id, updateDto as any);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.repository.delete(id);
    }
}
