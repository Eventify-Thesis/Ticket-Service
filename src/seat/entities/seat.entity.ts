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

  @Column({ name: "seating_plan_id" })
  seatingPlanId: number;

  @Column({ name: "event_id" })
  eventId: number;

  @Column({ name: "show_id" })
  showId: number;

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
