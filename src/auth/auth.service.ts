import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    private readonly jwtService: JwtService,
  ) {}

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private generateAvatarColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = (hash & 0x00ffffff).toString(16).toUpperCase();
    return `#${'000000'.substring(0, 6 - color.length)}${color}`;
  }

  private sanitizeUser(user: UserDocument | (User & Record<string, any>)) {
    const plain =
      typeof (user as any).toObject === 'function'
        ? (user as any).toObject()
        : user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = plain;
    if (rest._id) {
      rest._id = rest._id.toString();
    }
    if (rest.organization?._id) {
      rest.organization._id = rest.organization._id.toString();
    }
    return rest;
  }

  async create(createUserDto: CreateUserDto) {
    const {
      username,
      displayName,
      email,
      password,
      organizationId,
      organizationName,
      organizationSlug,
      role,
    } = createUserDto;

    let organization: OrganizationDocument | null = null;

    if (organizationId) {
      organization = await this.organizationModel.findById(organizationId);
      if (!organization) {
        throw new NotFoundException('Organización no encontrada');
      }
    } else if (organizationName) {
      const slugCandidate =
        organizationSlug && organizationSlug.trim().length > 0
          ? this.slugify(organizationSlug)
          : this.slugify(organizationName);

      const existingOrg = await this.organizationModel
        .findOne({ slug: slugCandidate })
        .lean();

      if (existingOrg) {
        throw new ConflictException(
          'El slug de la organización ya está en uso, intenta con otro nombre',
        );
      }

      organization = new this.organizationModel({
        name: organizationName,
        slug: slugCandidate,
        primaryColor: '#255FED',
        secondaryColor: '#E91E63',
      });
      await organization.save();
    } else {
      throw new BadRequestException(
        'Indica organizationId para unirte o organizationName para crear una nueva organización',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const createdUser = new this.userModel({
        username,
        displayName,
        email,
        password: hashedPassword,
        organization: organization._id,
        role: organizationId ? role ?? 'agent' : 'owner',
        avatarColor: this.generateAvatarColor(displayName),
      });
      const savedUser = await createdUser.save();
      await savedUser.populate('organization');
      return this.sanitizeUser(savedUser);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Username o email ya existen');
      }
      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;
    const user = await this.userModel
      .findOne({ username })
      .select('+password')
      .populate('organization');

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.sanitizeUser(user),
    };
  }

  async getUserFromAuthenticationToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userModel
        .findById(payload.sub)
        .select('-password')
        .populate('organization');
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      throw new UnauthorizedException('Token invalido o expirado');
    }
  }

  async listOrganizations() {
    return this.organizationModel
      .find({}, { name: 1, slug: 1, primaryColor: 1, secondaryColor: 1 })
      .sort({ name: 1 })
      .lean();
  }

  async findOrganizationBySlug(slug: string) {
    const organization = await this.organizationModel
      .findOne({ slug })
      .select('name slug primaryColor secondaryColor')
      .lean();

    if (!organization) {
      throw new NotFoundException('Organizacion no encontrada');
    }

    return organization;
  }
}
