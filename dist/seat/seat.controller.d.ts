import { SeatService } from "./seat.service";
export declare class SeatController {
    private readonly seatService;
    constructor(seatService: SeatService);
    getShowSeatAvailability(showId: string): Promise<any>;
}
