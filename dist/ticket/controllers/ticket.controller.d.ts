import { TicketService } from "../services/ticket.service";
import { ReservationDto } from "../dto/reservation.dto";
import { TicketQueryDto } from "../dto/ticket-query.dto";
export declare class TicketController {
    private readonly ticketService;
    constructor(ticketService: TicketService);
    getAvailableTickets(eventId: string, query: TicketQueryDto): Promise<import("../entities/ticket.entity").Ticket[]>;
    reserveTickets(userId: string, reservationDto: ReservationDto): Promise<{
        reservationId: string;
    }>;
    confirmReservation(userId: string, reservationId: string): Promise<{
        message: string;
    }>;
    cancelReservation(userId: string, reservationId: string): Promise<{
        message: string;
    }>;
}
