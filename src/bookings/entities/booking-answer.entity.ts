import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";


@Entity("booking_answers")
export class BookingAnswer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "event_id" })
    eventId: number;

    @Column({ name: "show_id" })
    showId: number;

    @Column({ name: "user_id" })
    userId: string;

    @Column({ name: "order_id" })
    orderId: number;

    @Column({ name: "question_id" })
    questionId: number;

    @Column({ name: "attendee_id" })
    attendeeId: number;

    @Column({ name: "ticket_type_id" })
    ticketTypeId: number;

    @Column()
    answer: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
