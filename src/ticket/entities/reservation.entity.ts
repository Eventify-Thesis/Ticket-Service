import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
  collection: 'reservations',
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
export class Reservation {
  @ApiProperty({ description: 'Ticket ID this reservation belongs to' })
  @Prop({ 
    type: String, 
    required: true,
    index: true 
  })
  ticketId: string;

  @ApiProperty({ description: 'User ID who made the reservation' })
  @Prop({ 
    type: String, 
    required: true,
    index: true 
  })
  userId: string;

  @ApiProperty({ description: 'Quantity of tickets reserved' })
  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;

  @ApiProperty({ enum: ReservationStatus, description: 'Current status of the reservation' })
  @Prop({
    type: String,
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
    index: true,
  })
  status: ReservationStatus;

  @ApiProperty({ description: 'Expiration time of the reservation' })
  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  expiresAt: Date;

  @ApiProperty({ description: 'Lock version for optimistic locking' })
  @Prop({
    type: Number,
    default: 0,
  })
  version: number;

  @ApiProperty({ description: 'Additional reservation metadata' })
  @Prop({
    type: Object,
    default: {},
  })
  metadata: Record<string, any>;
}

export type ReservationDocument = Reservation & Document;
export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// Compound indexes for efficient queries
ReservationSchema.index({ ticketId: 1, status: 1 });
ReservationSchema.index({ userId: 1, status: 1 });
ReservationSchema.index({ status: 1, expiresAt: 1 });

// Optimistic locking middleware
ReservationSchema.pre('save', function(next) {
  this.version = (this.version || 0) + 1;
  next();
});
