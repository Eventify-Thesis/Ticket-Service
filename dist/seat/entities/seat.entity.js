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
exports.Seat = exports.SeatStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
var SeatStatus;
(function (SeatStatus) {
    SeatStatus["AVAILABLE"] = "AVAILABLE";
    SeatStatus["BOOKED"] = "BOOKED";
})(SeatStatus || (exports.SeatStatus = SeatStatus = {}));
let Seat = class Seat {
};
exports.Seat = Seat;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "uuid" }),
    __metadata("design:type", String)
], Seat.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ name: "seating_plan_id", type: "uuid" }),
    __metadata("design:type", String)
], Seat.prototype, "seatingPlanId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ name: "event_id", type: "uuid" }),
    __metadata("design:type", String)
], Seat.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ name: "show_id", type: "uuid" }),
    __metadata("design:type", String)
], Seat.prototype, "showId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ name: "zone_id", nullable: true }),
    __metadata("design:type", String)
], Seat.prototype, "zoneId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ name: "row_label", nullable: true }),
    __metadata("design:type", String)
], Seat.prototype, "rowLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ name: "seat_number", nullable: true }),
    __metadata("design:type", String)
], Seat.prototype, "seatNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.Column)({ name: "ticket_type_id", type: "uuid" }),
    __metadata("design:type", String)
], Seat.prototype, "ticketTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SeatStatus }),
    (0, typeorm_1.Column)({
        type: "enum",
        enum: SeatStatus,
        default: SeatStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], Seat.prototype, "status", void 0);
exports.Seat = Seat = __decorate([
    (0, typeorm_1.Entity)("seats")
], Seat);
//# sourceMappingURL=seat.entity.js.map