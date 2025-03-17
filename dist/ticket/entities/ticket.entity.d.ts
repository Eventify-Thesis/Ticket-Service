import { Document, Schema as MongooseSchema } from "mongoose";
export declare enum TicketStatus {
    AVAILABLE = "available",
    RESERVED = "reserved",
    SOLD = "sold",
    CANCELLED = "cancelled"
}
export declare enum TicketType {
    STANDARD = "standard",
    VIP = "vip",
    EARLY_BIRD = "early_bird"
}
export declare class Ticket {
    eventId: string;
    showingId: string;
    status: TicketStatus;
    price: number;
    quantity: number;
    remainingQuantity: number;
    type: TicketType;
    version: number;
    metadata: Record<string, any>;
    isActive: boolean;
}
export type TicketDocument = Ticket & Document;
export declare const TicketSchema: MongooseSchema<Ticket, import("mongoose").Model<Ticket, any, any, any, Document<unknown, any, Ticket> & Ticket & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Ticket, Document<unknown, {}, import("mongoose").FlatRecord<Ticket>> & import("mongoose").FlatRecord<Ticket> & {
    _id: import("mongoose").Types.ObjectId;
}>;
