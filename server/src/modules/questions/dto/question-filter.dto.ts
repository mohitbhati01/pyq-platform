import { IsOptional, IsString, IsEnum, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionFilterDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() examName?: string;
  @IsOptional() @IsInt() @Type(() => Number) examYear?: number;
  @IsOptional() @IsEnum(['EASY', 'MEDIUM', 'HARD']) difficulty?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @Type(() => String) tags?: string[];
  @IsOptional() @IsEnum(['newest', 'votes', 'views', 'answered']) sort?: string;
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) page?: number;
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) limit?: number;
}
