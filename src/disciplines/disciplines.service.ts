import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../common/services/base.service';
import { Discipline } from './entities/discipline.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class DisciplinesService extends BaseService<Discipline> {
    constructor(
        @InjectRepository(Discipline)
        private disciplineRepository: Repository<Discipline>,
    ) {
        super(disciplineRepository, 'Discipline');
    }

    // findAll inherited from BaseService


    // create, update, remove, findOne are inherited from BaseService
}
