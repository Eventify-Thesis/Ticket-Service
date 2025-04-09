import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { TicketType } from "./ticket-type.entity";

@Entity({ name: "seat_category_mappings" })
export class SeatCategoryMapping {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "seating_plan_id", type: "uuid" })
  seatingPlanId: string;

  @Column({ name: "event_id", type: "uuid" })
  eventId: string;

  @Column({ name: "show_id", type: "uuid" })
  showId: string;

  @Column()
  category: string;

  @Column({ name: "ticket_type_id", type: "uuid" })
  ticketTypeId: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relationships

  @OneToOne(() => TicketType, (ticketType) => ticketType.seatCategoryMapping)
  @JoinColumn({ name: "ticket_type_id" })
  ticketType: TicketType;
}
