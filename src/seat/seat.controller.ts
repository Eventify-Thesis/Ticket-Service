import { Controller, Param } from "@nestjs/common";
import { SeatService } from "./seat.service";
import { MessagePattern } from "@nestjs/microservices";

@Controller("seat")
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @MessagePattern("getShowSeatAvailability")
  async getShowSeatAvailability(showId: string) {
    console.log(showId);
    return this.seatService.getShowSeatAvailability(showId);
  }
}
