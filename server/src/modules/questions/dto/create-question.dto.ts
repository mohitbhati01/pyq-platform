import { IsString, IsNotEmpty, IsArray, IsOptional, IsInt, Min, Max, IsEnum, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum Difficulty { EASY = 'EASY', MEDIUM = 'MEDIUM', HARD = 'HARD' }

export class CreateQuestionDto {
  @IsString() @IsNotEmpty() @MinLength(10) @MaxLength(300)
  title: string;

  @IsString() @IsNotEmpty() @MinLength(20)
  description: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsString() @IsNotEmpty() @MaxLength(100)
  examName: string;

  @IsInt() @Min(1990) @Max(new Date().getFullYear())
  @Type(() => Number)
  examYear: number;

  @IsOptional() @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional() @IsArray() @IsString({ each: true })
  imageUrls?: string[];
}
