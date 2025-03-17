import { Job } from 'bull';
import { TicketService } from '../services/ticket.service';
export declare class TicketProcessor {
    private readonly ticketService;
    private readonly logger;
    constructor(ticketService: TicketService);
    handleReservationCleanup(job: Job<{
        reservationId: string;
    }>): Promise<void>;
    handleTicketCacheSync(job: Job<{
        ticketId: string;
    }>): Promise<void>;
}
