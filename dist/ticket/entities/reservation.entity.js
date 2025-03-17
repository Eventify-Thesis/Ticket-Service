"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationSchema = exports.Reservation = exports.ReservationStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const swagger_1 = require("@nestjs/swagger");
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "pending";
    ReservationStatus["CONFIRMED"] = "confirmed";
    ReservationStatus["EXPIRED"] = "expired";
    ReservationStatus["CANCELLED"] = "cancelled";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
let Reservation = class Reservation {
};
exports.Reservation = Reservation;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ticket ID this reservation belongs to' }),
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        index: true
    }),
    __metadata("design:type", String)
], Reservation.prototype, "ticketId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID who made the reservation' }),
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        index: true
    }),
    __metadata("design:type", String)
], Reservation.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantity of tickets reserved' }),
    (0, mongoose_1.Prop)({
        type: Number,
        required: true,
        min: 1,
    }),
    __metadata("design:type", Number)
], Reservation.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ReservationStatus, description: 'Current status of the reservation' }),
    (0, mongoose_1.Prop)({
        type: String,
        enum: ReservationStatus,
        default: ReservationStatus.PENDING,
        index: true,
    }),
    __metadata("design:type", String)
], Reservation.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Expiration time of the reservation' }),
    (0, mongoose_1.Prop)({
        type: Date,
        required: true,
        index: true,
    }),
    __metadata("design:type", Date)
], Reservation.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lock version for optimistic locking' }),
    (0, mongoose_1.Prop)({
        type: Number,
        default: 0,
    }),
    __metadata("design:type", Number)
], Reservation.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional reservation metadata' }),
    (0, mongoose_1.Prop)({
        type: Object,
        default: {},
    }),
    __metadata("design:type", Object)
], Reservation.prototype, "metadata", void 0);
exports.Reservation = Reservation = __decorate([
    (0, mongoose_1.Schema)({
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
], Reservation);
exports.ReservationSchema = mongoose_1.SchemaFactory.createForClass(Reservation);
exports.ReservationSchema.index({ ticketId: 1, status: 1 });
exports.ReservationSchema.index({ userId: 1, status: 1 });
exports.ReservationSchema.index({ status: 1, expiresAt: 1 });
exports.ReservationSchema.pre('save', function (next) {
    this.version = (this.version || 0) + 1;
    next();
});
//# sourceMappingURL=reservation.entity.js.map