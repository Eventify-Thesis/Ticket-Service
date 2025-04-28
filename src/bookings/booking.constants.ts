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

  VOUCHER_CANNOT_BE_APPLIED: {
    error: "VOUCHER_CANNOT_BE_APPLIED",
    message: "Voucher cannot be applied",
    code: HttpStatus.BAD_REQUEST,
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  VOUCHER_NOT_FOUND: {
    error: "VOUCHER_NOT_FOUND",
    message: "Voucher not found",
    code: HttpStatus.NOT_FOUND,
    httpStatus: HttpStatus.NOT_FOUND,
  },

  VOUCHER_EXPIRED: {
    error: "VOUCHER_EXPIRED",
    message: "Voucher is not valid at this time",
    code: HttpStatus.BAD_REQUEST,
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  VOUCHER_OUT_OF_STOCK: {
    error: "VOUCHER_OUT_OF_STOCK",
    message: "Voucher is out of stock",
    code: HttpStatus.BAD_REQUEST,
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  VOUCHER_INVALID_SHOWING: {
    error: "VOUCHER_INVALID_SHOWING",
    message: "Voucher is not valid for this showing",
    code: HttpStatus.BAD_REQUEST,
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  VOUCHER_INVALID_TICKET_TYPES: {
    error: "VOUCHER_INVALID_TICKET_TYPES",
    message: "Voucher is not valid for selected ticket types",
    code: HttpStatus.BAD_REQUEST,
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  VOUCHER_MIN_QUANTITY: {
    error: "VOUCHER_MIN_QUANTITY",
    message: "Minimum quantity required for this voucher",
    code: HttpStatus.BAD_REQUEST,
    httpStatus: HttpStatus.BAD_REQUEST,
  },

  VOUCHER_MAX_QUANTITY: {
    error: "VOUCHER_MAX_QUANTITY",
    message: "Maximum quantity exceeded for this voucher",
    code: HttpStatus.BAD_REQUEST,
    httpStatus: HttpStatus.BAD_REQUEST,
  },
};
