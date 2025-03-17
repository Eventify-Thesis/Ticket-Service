import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import { TicketService } from "../services/ticket.service";
import { CacheInterceptor, CacheTTL } from "@nestjs/cache-manager";
import { ReservationDto } from "../dto/reservation.dto";
import { TicketQueryDto } from "../dto/ticket-query.dto";
import { User } from "../../shared/decorators/user.decorator";
import { JwtAuthGuard } from "../../shared/guards/jwt-auth.guard";

@ApiTags("tickets")
@Controller("api/v1/tickets")
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@ApiBearerAuth()
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get("events/:eventId")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) // Cache for 30 seconds
  @ApiOperation({ summary: "Get available tickets for an event" })
  @ApiResponse({ status: 200, description: "List of available tickets" })
  async getAvailableTickets(
    @Param("eventId") eventId: string,
    @Query() query: TicketQueryDto
  ) {
    return this.ticketService.getAvailableTickets(eventId, query.showingId);
  }

  @Post("reserve")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Reserve tickets" })
  @ApiResponse({ status: 201, description: "Tickets reserved successfully" })
  @ApiResponse({ status: 409, description: "Tickets not available" })
  async reserveTickets(
    @User("id") userId: string,
    @Body() reservationDto: ReservationDto
  ) {
    const reservationId = await this.ticketService.reserveTickets(
      reservationDto.ticketId,
      userId,
      reservationDto.quantity
    );
    return { reservationId };
  }

  @Post("reservations/:reservationId/confirm")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm ticket reservation" })
  @ApiResponse({
    status: 200,
    description: "Reservation confirmed successfully",
  })
  @ApiResponse({ status: 404, description: "Reservation not found" })
  async confirmReservation(
    @User("id") userId: string,
    @Param("reservationId") reservationId: string
  ) {
    await this.ticketService.confirmReservation(reservationId, userId);
    return { message: "Reservation confirmed successfully" };
  }

  @Delete("reservations/:reservationId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel ticket reservation" })
  @ApiResponse({
    status: 200,
    description: "Reservation cancelled successfully",
  })
  @ApiResponse({ status: 404, description: "Reservation not found" })
  async cancelReservation(
    @User("id") userId: string,
    @Param("reservationId") reservationId: string
  ) {
    await this.ticketService.cancelReservation(reservationId, userId);
    return { message: "Reservation cancelled successfully" };
  }
}
