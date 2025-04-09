import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

export enum SeatStatus {
  AVAILABLE = "AVAILABLE",
  BOOKED = "BOOKED",
}

@Entity("seats")
export class Seat {
  @PrimaryColumn({ type: "uuid" })
  id: string;

  @ApiProperty()
  @Column({ name: "seating_plan_id", type: "uuid" })
  seatingPlanId: string;

  @ApiProperty()
  @Column({ name: "event_id", type: "uuid" })
  eventId: string;

  @ApiProperty()
  @Column({ name: "show_id", type: "uuid" })
  showId: string;

  @ApiProperty()
  @Column({ name: "zone_id", nullable: true })
  zoneId: string;

  @ApiProperty()
  @Column({ name: "row_label", nullable: true })
  rowLabel: string;

  @ApiProperty()
  @Column({ name: "seat_number", nullable: true })
  seatNumber: string;

  @ApiProperty()
  @Column({ name: "ticket_type_id", type: "uuid" })
  ticketTypeId: string;

  @ApiProperty({ enum: SeatStatus })
  @Column({
    type: "enum",
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;
}
