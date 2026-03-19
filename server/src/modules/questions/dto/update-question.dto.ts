import { IsString, IsOptional, IsArray, IsInt, IsEnum, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty } from './create-question.dto';

export class UpdateQuestionDto {
  @IsOptional() @IsString() @MinLength(10) @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MinLength(20) description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(100) examName?: string;
  @IsOptional() @IsInt() @Min(1990) @Max(new Date().getFullYear()) @Type(() => Number) examYear?: number;
  @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty;
}
