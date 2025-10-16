import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtGuard } from './jwt/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('organizations')
  async listOrganizations() {
    return this.authService.listOrganizations();
  }

  @Get('organizations/:slug')
  async getOrganization(@Param('slug') slug: string) {
    return this.authService.findOrganizationBySlug(slug);
  }

  @Get('login')
  async getLogin() {
    return 'This is the login page. Please use POST to login.';
  }
}
