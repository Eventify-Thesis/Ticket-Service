import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PAYMENT_FAILED = "PAYMENT_FAILED",
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

  @Column({ name: "platform_discount_amount", type: "decimal", precision: 10, scale: 2, nullable: true })
  platformDiscountAmount: number;

  @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: "reserved_until" })
  reservedUntil: Date;

  @Column({ name: "stripe_payment_intent_id", type: "varchar", length: 255, nullable: true })
  stripePaymentIntentId: string;

  @Column({ name: "stripe_payment_status" })
  stripePaymentStatus: string;

  @Column({ name: "stripe_payment_error_message" })
  stripePaymentErrorMessage: string;

  @Column({ name: "stripe_customer_id" })
  stripeCustomerId: string;

  @Column({ name: "paid_at", type: "timestamp", nullable: true })
  paidAt: Date;

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
  order_id: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: "order_id" })
  order: Order;

  @Column({ name: "ticket_type_id" })
  ticketTypeId: number;

  @Column({
    name: 'name'
  })
  name: string;

  @Column({ name: "seat_id", type: "uuid", nullable: true })
  seatId?: string;

  @Column({ name: "section_id", type: "uuid", nullable: true })
  sectionId?: string;

  @Column()
  quantity: number;

  @Column({ name: 'row_label' })
  rowLabel: string;

  @Column({ name: 'seat_number' })
  seatNumber: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
