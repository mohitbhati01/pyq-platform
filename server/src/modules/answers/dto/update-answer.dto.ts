import { PartialType } from '@nestjs/swagger';
import { CreateAnswerDto } from './create-answer.dto';

// H-3 fix: Use PartialType so all fields become optional for updates
export class UpdateAnswerDto extends PartialType(CreateAnswerDto) {}
