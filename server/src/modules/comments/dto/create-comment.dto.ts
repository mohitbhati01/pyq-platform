import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(1000)
  body: string;

  @IsString() @IsNotEmpty()
  targetId: string;

  @IsEnum(['question', 'answer'])
  targetType: 'question' | 'answer';

  @IsOptional() @IsString()
  parentId?: string;
}
