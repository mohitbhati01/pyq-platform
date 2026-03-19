import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// M-3 fix: DTO for editing existing comments
export class UpdateCommentDto {
  @ApiProperty({ description: 'Updated comment body' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
