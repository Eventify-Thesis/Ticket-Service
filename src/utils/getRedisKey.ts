export function getSeatLockKey(seatId: string): string {
    return `seat:lock:${seatId}`;
}

export function getTicketTypeLockKey(ticketTypeId: number): string {
    return `ticket-type:lock:${ticketTypeId}`;
}

export function getTicketTypeInfoKey(ticketTypeId: number): string {
    return `ticket-type:info:${ticketTypeId}`;
}

export function getSectionLockKey(sectionId: string): string {
    return `section:lock:${sectionId}`;
}

export function getBookingKey(showId: number, bookingCode: string): string {
    return `booking:${showId}:${bookingCode}`;
}

export function getBookingCleanupKey(showId: number, bookingCode: string): string {
    return `booking:cleanup:${showId}:${bookingCode}`;
}

export function getBookingAnswerKey(showId: number, bookingCode: string): string {
    return `booking:answer:${showId}:${bookingCode}`;
}

export function getSeatInfoKey(seatId: string): string {
    return `seat:info:${seatId}`;
}