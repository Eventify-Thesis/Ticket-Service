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
import { MessagePattern, Payload } from "@nestjs/microservices";
import { SubmitTicketInfoDto } from "./dto/submit-ticket-info.dto";
import { QuestionAnswerDto } from "./dto/question-answer.dto";

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @MessagePattern("submitTicketInfo")
  async create(@Payload() submitTicketInfoDto: SubmitTicketInfoDto) {
    try {
      return await this.bookingsService.create(submitTicketInfoDto);
    } catch (error) {
      return {
        error: error.toString(),
      }
    }
  }

  @MessagePattern("getBookingStatus")
  async getBookingStatus(@Payload() booking: { showId: number, bookingCode: string }) {
    try {
      return await this.bookingsService.getBookingStatus(booking.showId, booking.bookingCode);
    } catch (error) {
      return {
        error: error.toString(),
      }
    }
  }

  @MessagePattern("cancelBooking")
  async cancelBooking(@Payload() booking: { showId: number, bookingCode: string }) {
    try {
      return await this.bookingsService.cancelBooking(booking.showId, booking.bookingCode);
    } catch (error) {
      return {
        error: error.toString(),
      }
    }
  }

  @MessagePattern("getFormAnswers")
  async getFormAnswers(@Payload() booking: { showId: number, bookingId: string }) {
    try {
      return await this.bookingsService.getFormAnswers(booking.showId, booking.bookingId);
    } catch (error) {
      return {
        error: error.toString(),
      }
    }
  }

  @MessagePattern("updateAnswers")
  async updateAnswers(@Payload() questionAnswers: QuestionAnswerDto) {
    try {
      console.log(questionAnswers);
      return await this.bookingsService.updateAnswers(questionAnswers);
    } catch (error) {
      return {
        error: error.toString(),
      }
    }
  }

  @MessagePattern('get_available_vouchers')
  async getAvailableVouchers({ eventId, showId }: { eventId: number, showId: number }) {
    return this.bookingsService.getAvailableVouchers(eventId, showId);
  }

  @MessagePattern('apply_voucher')
  async applyVoucher({ showId, bookingCode, voucherCode }: { showId: number, bookingCode: string; voucherCode: string }) {
    return this.bookingsService.applyVoucher(showId, bookingCode, voucherCode);
  }
}
