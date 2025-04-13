import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ItemInfo {
  @ApiProperty()
  quantity: number;

  @ApiProperty()
  id: number;

  @ApiProperty()
  @IsOptional()
  sectionId: string;

  @ApiProperty()
  seats: {
    id: string;
    quantity: number;
  }[];
}

export class SubmitTicketInfoDto {
  @ApiProperty()
  eventId: string;

  @ApiProperty()
  showId: string;

  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  items?: ItemInfo[];
}
