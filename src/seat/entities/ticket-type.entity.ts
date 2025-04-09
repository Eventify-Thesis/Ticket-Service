import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { SeatCategoryMapping } from "./seat-category-mapping.entity";

@Entity("ticket_types")
export class TicketType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "show_id" })
  showId: string;

  @Column({ name: "event_id" })
  eventId: string;

  @Column()
  name: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column({ default: false, name: "is_free" })
  isFree: boolean;

  @Column()
  quantity: number;

  @Column({ name: "min_ticket_purchase" })
  minTicketPurchase: number;

  @Column({ name: "max_ticket_purchase" })
  maxTicketPurchase: number;

  @Column({ type: "timestamp", name: "start_time" })
  startTime: Date;

  @Column({ type: "timestamp", name: "end_time" })
  endTime: Date;

  @Column("text")
  description: string;

  @Column({ name: "image_url" })
  imageUrl: string;

  @Column({ default: false, name: "is_hidden" })
  isHidden: boolean;

  @Column({ default: 0, name: "sold_quantity" })
  soldQuantity: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToOne(() => SeatCategoryMapping, (scm) => scm.ticketType, {
    cascade: true,
  })
  seatCategoryMapping: SeatCategoryMapping;
}
