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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "seating_plan_id" })
  seatingPlanId: number;

  @Column({ name: "event_id" })
  eventId: number;

  @Column({ name: "show_id" })
  showId: number;

  @Column()
  category: string;

  @Column({ name: "ticket_type_id" })
  ticketTypeId: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relationships

  @OneToOne(() => TicketType, (ticketType) => ticketType.seatCategoryMapping)
  @JoinColumn({ name: "ticket_type_id" })
  ticketType: TicketType;
}
