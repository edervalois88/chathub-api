import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { username, displayName, email, password } = createUserDto;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const createdUser = new this.userModel({
        username,
        displayName,
        email,
        password: hashedPassword,
      });
      const savedUser = await createdUser.save();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = savedUser.toObject();
      return result;

    } catch (error) {
      if (error.code === 11000) { // Duplicate key error code from MongoDB
        throw new ConflictException('Username or email already exists');
      }
      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    const { username, password } = loginUserDto;
    const user = await this.userModel.findOne({ username }).select('+password');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getUserFromAuthenticationToken(token: string): Promise<UserDocument> {
    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      return this.userModel.findById(userId);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
