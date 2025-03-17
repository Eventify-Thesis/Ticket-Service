import { Document } from 'mongoose';
export declare enum ReservationStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare class Reservation {
    ticketId: string;
    userId: string;
    quantity: number;
    status: ReservationStatus;
    expiresAt: Date;
    version: number;
    metadata: Record<string, any>;
}
export type ReservationDocument = Reservation & Document;
export declare const ReservationSchema: import("mongoose").Schema<Reservation, import("mongoose").Model<Reservation, any, any, any, Document<unknown, any, Reservation> & Reservation & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Reservation, Document<unknown, {}, import("mongoose").FlatRecord<Reservation>> & import("mongoose").FlatRecord<Reservation> & {
    _id: import("mongoose").Types.ObjectId;
}>;
