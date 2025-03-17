import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { ApiProperty } from "@nestjs/swagger";

export enum TicketStatus {
  AVAILABLE = "available",
  RESERVED = "reserved",
  SOLD = "sold",
  CANCELLED = "cancelled",
}

export enum TicketType {
  STANDARD = "standard",
  VIP = "vip",
  EARLY_BIRD = "early_bird",
}

@Schema({
  timestamps: true,
  collection: "tickets",
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Ticket {
  @ApiProperty({ description: "Event ID this ticket belongs to" })
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  eventId: string;

  @ApiProperty({ description: "Showing/Session ID this ticket belongs to" })
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  showingId: string;

  @ApiProperty({
    enum: TicketStatus,
    description: "Current status of the ticket",
  })
  @Prop({
    type: String,
    enum: TicketStatus,
    default: TicketStatus.AVAILABLE,
    index: true,
  })
  status: TicketStatus;

  @ApiProperty({ description: "Ticket price" })
  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  price: number;

  @ApiProperty({ description: "Total quantity of tickets" })
  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  quantity: number;

  @ApiProperty({ description: "Remaining quantity of tickets" })
  @Prop({
    type: Number,
    required: true,
    min: 0,
    index: true,
  })
  remainingQuantity: number;

  @ApiProperty({ enum: TicketType, description: "Type of ticket" })
  @Prop({
    type: String,
    enum: TicketType,
    required: true,
    index: true,
  })
  type: TicketType;

  @ApiProperty({ description: "Version number for optimistic locking" })
  @Prop({
    type: Number,
    default: 0,
  })
  version: number;

  @ApiProperty({ description: "Additional ticket metadata" })
  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata: Record<string, any>;

  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isActive: boolean;
}

export type TicketDocument = Ticket & Document;
export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Compound indexes for performance
TicketSchema.index({ eventId: 1, showingId: 1, status: 1 });
TicketSchema.index({ eventId: 1, type: 1, status: 1 });

// Optimistic locking middleware
TicketSchema.pre("save", function (next) {
  this.version = (this.version || 0) + 1;
  next();
});
