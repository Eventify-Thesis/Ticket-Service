import { HttpStatus } from "@nestjs/common";

export const MESSAGE = {
  TICKET_TYPE_QUANTITY_NOT_ENOUGH: {
    error: "TICKET_TYPE_QUANTITY_NOT_ENOUGH",
    message: "Ticket type quantity not enough",
    code: HttpStatus.EXPECTATION_FAILED,
    httpStatus: HttpStatus.EXPECTATION_FAILED,
  },
  SECTION_ALREADY_FULL: {
    error: "SECTION_ALREADY_FULL",
    message: "Section already full",
    code: HttpStatus.CONFLICT,
    httpStatus: HttpStatus.CONFLICT,
  },
  SEAT_ALREADY_BOOKED: {
    error: "SEAT_ALREADY_BOOKED",
    message: "Seat already booked",
    code: HttpStatus.CONFLICT,
    httpStatus: HttpStatus.CONFLICT,
  },
  BOOKING_NOT_FOUND: {
    error: "BOOKING_NOT_FOUND",
    message: "Booking not found",
    code: HttpStatus.NOT_FOUND,
    httpStatus: HttpStatus.NOT_FOUND,
  },

  BOOKING_ANSWERS_NOT_FOUND: {
    error: "BOOKING_ANSWERS_NOT_FOUND",
    message: "Booking answers not found",
    code: HttpStatus.NOT_FOUND,
    httpStatus: HttpStatus.NOT_FOUND,
  },
};
