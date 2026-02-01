import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    getMyNotifications(@CurrentUser() user: any) {
        console.log('🔍 Current user:', user);
        console.log('🔍 User ID:', user?.userId);
        return this.notificationsService.getUnread(user.userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
        return this.notificationsService.markAsRead(id, user.userId);
    }
}
