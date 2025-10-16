import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
}
