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
exports.ConfirmReservationDto = exports.ReservationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ReservationDto {
}
exports.ReservationDto = ReservationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "ID of the ticket to reserve",
        example: "507f1f77bcf86cd799439011",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReservationDto.prototype, "ticketId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Number of tickets to reserve",
        example: 2,
        minimum: 1,
        maximum: 10,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], ReservationDto.prototype, "quantity", void 0);
class ConfirmReservationDto {
}
exports.ConfirmReservationDto = ConfirmReservationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Payment transaction ID",
        example: "txn_123456789",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmReservationDto.prototype, "transactionId", void 0);
//# sourceMappingURL=reservation.dto.js.map