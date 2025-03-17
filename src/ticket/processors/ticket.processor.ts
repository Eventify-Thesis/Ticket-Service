import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TicketService } from '../services/ticket.service';

@Processor('ticket-operations')
export class TicketProcessor {
  private readonly logger = new Logger(TicketProcessor.name);

  constructor(private readonly ticketService: TicketService) {}

  @Process('cleanup-reservation')
  async handleReservationCleanup(job: Job<{ reservationId: string }>) {
    this.logger.debug(`Processing reservation cleanup for ${job.data.reservationId}`);
    try {
      await this.ticketService.cleanupExpiredReservations();
    } catch (error) {
      this.logger.error(`Error cleaning up reservation ${job.data.reservationId}:`, error);
      throw error;
    }
  }

  @Process('sync-ticket-cache')
  async handleTicketCacheSync(job: Job<{ ticketId: string }>) {
    this.logger.debug(`Syncing ticket cache for ${job.data.ticketId}`);
    try {
      // Implement cache sync logic here
      this.logger.debug(`Successfully synced ticket cache for ${job.data.ticketId}`);
    } catch (error) {
      this.logger.error(`Error syncing ticket cache ${job.data.ticketId}:`, error);
      throw error;
    }
  }
}
