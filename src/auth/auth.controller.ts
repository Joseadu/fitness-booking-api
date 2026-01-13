import { Body, Controller, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    async register(@Body() signUpDto: SignUpDto) {
        return this.authService.register(signUpDto);
    }

    @Post('change-initial-password')
    async changeInitialPassword(@Body() body: any, @Request() req) {
        // NOTE: Request must be authenticated (no @Public decorator)
        // userId comes from JWT strategy
        return this.authService.changeInitialPassword(req.user.userId, body.password);
    }
}
