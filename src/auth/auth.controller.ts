import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  async login(@Body() loginUserDto: any) {
    // Por ahora, solo devolvemos un texto. La lógica real vendrá después.
    return 'login';
  }

  @Get('login')
  async getLogin() {
    return 'This is the login page. Please use POST to login.';
  }
}
