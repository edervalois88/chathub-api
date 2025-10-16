import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  displayName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  organizationName?: string;

  @IsOptional()
  @IsString()
  organizationSlug?: string;

  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @IsOptional()
  @IsIn(['owner', 'admin', 'agent'])
  role?: 'owner' | 'admin' | 'agent';
}
