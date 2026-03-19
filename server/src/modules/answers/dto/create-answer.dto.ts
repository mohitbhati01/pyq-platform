import { IsString, IsNotEmpty, MinLength } from 'class-validator';
export class CreateAnswerDto {
  @IsString() @IsNotEmpty() @MinLength(10)
  body: string;
}
