import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Order } from "src/bookings/entities/order.entity";
// import { BookingAnswer } from "../../order/entities/booking-answer.entity";

@Entity("attendees")
export class Attendee {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: "email" })
  email: string;

  @Column({ name: "event_id" })
  eventId: number;

  @Column({ name: "show_id" })
  showId: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: "public_id" })
  publicId: string;

  @Column({ name: "short_id" })
  shortId: string;

  @Column({ name: 'seat_id' })
  seatId: string;

  // @ManyToOne(() => TicketType)
  // @JoinColumn({ name: 'ticket_type_id' })
  // ticketType: TicketType;

  @Column({ name: 'ticket_type_id' })
  ticketTypeId: number;

  @Column({ name: 'row_label' })
  rowLabel: string;

  @Column({ name: 'seat_number' })
  seatNumber: number;

  @Column({ name: 'qr_code' })
  qrCode: string;

  @Column({ name: 'status' })
  status: string;

  @Column({ name: 'checked_in_by' })
  checkedInBy: string;

  @Column({ name: 'checked_in_at' })
  checkedInAt: Date;

  @Column({ name: 'checked_out_by' })
  checkedOutBy: string;

  @Column({ name: 'checked_out_at' })
  checkedOutAt: Date;

  // @OneToOne(() => BookingAnswer, (bookingAnswer) => bookingAnswer.attendee)
  // bookingAnswer: BookingAnswer;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}