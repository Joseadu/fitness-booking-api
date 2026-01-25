import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { Discipline } from './entities/discipline.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class DisciplinesService {
    constructor(
        @InjectRepository(Discipline)
        private disciplineRepository: Repository<Discipline>,
    ) { }

    async create(createDisciplineDto: CreateDisciplineDto): Promise<Discipline> {
        const discipline = this.disciplineRepository.create(createDisciplineDto);
        return this.disciplineRepository.save(discipline);
    }

    async findAll(boxId: string, paginationDto: PaginationDto): Promise<PaginatedResult<Discipline>> {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const [items, totalItems] = await this.disciplineRepository.findAndCount({
            where: { boxId },
            skip,
            take: limit,
            order: { name: 'ASC' }
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

    async findOne(id: string): Promise<Discipline> {
        const discipline = await this.disciplineRepository.findOne({ where: { id } });
        if (!discipline) {
            throw new NotFoundException(`Discipline with ID "${id}" not found`);
        }
        return discipline;
    }

    async update(id: string, updateDisciplineDto: UpdateDisciplineDto): Promise<Discipline> {
        const discipline = await this.findOne(id); // Ensure exists
        Object.assign(discipline, updateDisciplineDto); // Merge updates
        return this.disciplineRepository.save(discipline);
    }

    async remove(id: string): Promise<void> {
        const result = await this.disciplineRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Discipline with ID "${id}" not found`);
        }
    }
}
