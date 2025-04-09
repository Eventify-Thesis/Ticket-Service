export declare enum SeatStatus {
    AVAILABLE = "AVAILABLE",
    BOOKED = "BOOKED"
}
export declare class Seat {
    id: string;
    seatingPlanId: string;
    eventId: string;
    showId: string;
    zoneId: string;
    rowLabel: string;
    seatNumber: string;
    ticketTypeId: string;
    status: SeatStatus;
}
