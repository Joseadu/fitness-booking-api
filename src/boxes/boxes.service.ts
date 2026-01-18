import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Box } from './entities/box.entity';
import { CreateBoxDto } from './dto/create-box.dto';
import { UpdateBoxDto } from './dto/update-box.dto';
import { MembershipsService } from '../memberships/memberships.service';

@Injectable()
export class BoxesService {
    constructor(
        @InjectRepository(Box)
        private boxesRepository: Repository<Box>,
        private membershipsService: MembershipsService,
    ) { }

    async create(createBoxDto: CreateBoxDto, ownerId: string): Promise<Box> {
        const { contact_email, contact_phone, ...rest } = createBoxDto;
        const box = this.boxesRepository.create({
            ...rest,
            email: contact_email,
            phone: contact_phone,
            owner_id: ownerId, // Asignamos el creador como dueño
        });
        const savedBox = await this.boxesRepository.save(box);

        // AUTO-MEMBERSHIP: Link owner to their new box immediately
        await this.membershipsService.create(ownerId, {
            boxId: savedBox.id,
            role: 'business_owner',
            membershipType: 'staff'
        });

        return savedBox;
    }

    async findAll(): Promise<Box[]> {
        return this.boxesRepository.find({
            where: { is_active: true },
        });
    }

    async findOne(id: string): Promise<Box> {
        const box = await this.boxesRepository.findOne({ where: { id } });
        if (!box) {
            throw new NotFoundException(`Box with ID ${id} not found`);
        }
        return box;
    }

    async update(id: string, updateBoxDto: UpdateBoxDto, user: any): Promise<Box> {
        // Verify ownership first
        this.verifyOwnership(id, user);

        const box = await this.findOne(id);
        const { contact_email, contact_phone, ...rest } = updateBoxDto;

        // Map DTO aliases to Entity columns
        if (contact_email !== undefined) box.email = contact_email;
        if (contact_phone !== undefined) box.phone = contact_phone;

        Object.assign(box, rest);
        return this.boxesRepository.save(box);
    }

    async remove(id: string, user: any): Promise<void> {
        this.verifyOwnership(id, user);

        const box = await this.findOne(id);
        // Soft delete or hard delete? Usually soft delete via isActive or TypeORM softDelete
        // Given we have isActive, let's use that mostly, but remove() deletes from DB.
        // Let's do a real delete for now as requested by typical CRUD, or logic.
        // But wait, the Entity has `isActive`. Maybe user prefers soft delete?
        // Let's implement standard delete for the DELETE method for now.
        await this.boxesRepository.remove(box);
    }

    private verifyOwnership(boxId: string, user: any) {
        if (!user || !user.memberships) {
            throw new ForbiddenException('No membership context found');
        }

        const hasPermission = user.roles.includes('admin') || user.memberships.some((m: any) =>
            m.boxId === boxId && ['business_owner'].includes(m.role)
        );

        if (!hasPermission) {
            throw new ForbiddenException(`You do not have permission to manage Box ${boxId}`);
        }
    }
}
