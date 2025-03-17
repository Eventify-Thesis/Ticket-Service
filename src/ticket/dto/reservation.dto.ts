import { IsString, IsInt, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ReservationDto {
  @ApiProperty({
    description: "ID of the ticket to reserve",
    example: "507f1f77bcf86cd799439011",
  })
  @IsString()
  ticketId: string;

  @ApiProperty({
    description: "Number of tickets to reserve",
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;
}

export class ConfirmReservationDto {
  @ApiProperty({
    description: "Payment transaction ID",
    example: "txn_123456789",
  })
  @IsString()
  transactionId: string;
}
