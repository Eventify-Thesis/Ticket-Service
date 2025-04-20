import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsEmail, IsObject, ValidateNested, IsArray, IsOptional } from 'class-validator';

export class QuestionResponse {
  @ApiProperty({ description: 'Answer to the question', required: false })
  @IsString()
  @IsOptional()
  answer?: string;
}

export class Question {
  @ApiProperty({ description: 'ID of the question' })
  @IsNumber()
  question_id: number;

  @ApiProperty({ description: 'Response to the question' })
  @ValidateNested()
  @Type(() => QuestionResponse)
  response: QuestionResponse;
}

export class Attendee {
  @ApiProperty({ description: 'ID of the ticket type' })
  @IsNumber()
  ticket_type_id: number;

  @ApiProperty({ description: 'First name of the attendee' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Last name of the attendee' })
  @IsString()
  last_name: string;

  @ApiProperty({ description: 'Email of the attendee' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Questions answered by the attendee', type: [Question] })
  @ValidateNested({ each: true })
  @Type(() => Question)
  @IsArray()
  questions: Question[];
}

export class Order {
  @ApiProperty({ description: 'First name of the order' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Last name of the order' })
  @IsString()
  last_name: string;

  @ApiProperty({ description: 'Email of the order' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Questions answered for the order', type: [Question] })
  @ValidateNested({ each: true })
  @Type(() => Question)
  @IsArray()
  questions: Question[];
}

export class QuestionAnswerDto {
  @ApiProperty({ description: 'ID of the show' })
  @IsNumber()
  @IsOptional()
  showId?: number;

  @ApiProperty({ description: 'Booking code' })
  @IsString()
  @IsOptional()
  bookingCode?: string;

  @ApiProperty({ description: 'Order information' })
  @ValidateNested()
  @Type(() => Order)
  order: Order;

  @ApiProperty({ description: 'Attendees information', type: [Attendee] })
  @ValidateNested({ each: true })
  @Type(() => Attendee)
  @IsArray()
  attendees: Attendee[];
}