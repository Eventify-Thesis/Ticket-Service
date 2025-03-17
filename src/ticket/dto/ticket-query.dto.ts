import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketType } from '../entities/ticket.entity';

export class TicketQueryDto {
  @ApiProperty({
    description: 'ID of the showing/session',
    required: true,
  })
  @IsString()
  showingId: string;

  @ApiProperty({
    description: 'Type of ticket',
    enum: TicketType,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;
}
