import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { MessagePattern } from "@nestjs/microservices";
import { SubmitTicketInfoDto } from "./dto/submit-ticket-info.dto";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @MessagePattern("booking.created")
  @Post()
  create(@Body() submitTicketInfoDto: SubmitTicketInfoDto) {
    return this.bookingsService.create(submitTicketInfoDto);
  }

  @Post(":bookingCode/confirm")
  confirmPayment(@Param("bookingCode") bookingCode: string) {
    return this.bookingsService.confirmPayment(bookingCode);
  }

  @Post(":bookingCode/expire")
  expireBooking(@Param("bookingCode") bookingCode: string) {
    return this.bookingsService.expireBooking(bookingCode);
  }
}
