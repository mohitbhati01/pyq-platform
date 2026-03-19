import { IsString, IsOptional, MaxLength, IsArray, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(60) name?: string;
  @IsOptional() @IsString() @MaxLength(30) @Matches(/^[a-zA-Z0-9_]+$/) username?: string;
  @IsOptional() @IsString() @MaxLength(300) bio?: string;
  @IsOptional() @IsString() @MaxLength(200) education?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsArray() skills?: string[];
  @IsOptional() @IsArray() subjects?: string[];
}
