import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, IsArray, ValidateNested, IsOptional, IsDateString, IsEmail } from 'class-validator';

export class SeatInfo {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class ItemInfo {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({ required: false, type: [SeatInfo] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatInfo)
  seats?: SeatInfo[];
}

export class SubmitTicketInfoDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  eventId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  showId: number;

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  timestamp: number;

  @ApiProperty()
  @IsString()
  platform: string;

  @ApiProperty({ type: [ItemInfo] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemInfo)
  items: ItemInfo[];
}
