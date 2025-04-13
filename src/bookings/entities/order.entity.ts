import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ name: "event_id" })
  eventId: number;

  @Column({ name: "show_id" })
  showId: number;

  @Column({ name: "booking_code", type: "uuid" })
  bookingCode: string;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ name: "subtotal_amount", type: "decimal", precision: 10, scale: 2 })
  subtotalAmount: number;

  @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: "reserved_until" })
  reservedUntil: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "order_id" })
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items)
  order: Order;

  @Column({ name: "ticket_type_id" })
  ticketTypeId: number;

  @Column({ name: "seat_id", type: "uuid", nullable: true })
  seatId?: string;

  @Column({ name: "section_id", type: "uuid", nullable: true })
  sectionId?: string;

  @Column()
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
