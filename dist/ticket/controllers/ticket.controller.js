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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const ticket_service_1 = require("../services/ticket.service");
const cache_manager_1 = require("@nestjs/cache-manager");
const reservation_dto_1 = require("../dto/reservation.dto");
const ticket_query_dto_1 = require("../dto/ticket-query.dto");
const user_decorator_1 = require("../../shared/decorators/user.decorator");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
let TicketController = class TicketController {
    constructor(ticketService) {
        this.ticketService = ticketService;
    }
    async getAvailableTickets(eventId, query) {
        return this.ticketService.getAvailableTickets(eventId, query.showingId);
    }
    async reserveTickets(userId, reservationDto) {
        const reservationId = await this.ticketService.reserveTickets(reservationDto.ticketId, userId, reservationDto.quantity);
        return { reservationId };
    }
    async confirmReservation(userId, reservationId) {
        await this.ticketService.confirmReservation(reservationId, userId);
        return { message: "Reservation confirmed successfully" };
    }
    async cancelReservation(userId, reservationId) {
        await this.ticketService.cancelReservation(reservationId, userId);
        return { message: "Reservation cancelled successfully" };
    }
};
exports.TicketController = TicketController;
__decorate([
    (0, common_1.Get)("events/:eventId"),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(30),
    (0, swagger_1.ApiOperation)({ summary: "Get available tickets for an event" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of available tickets" }),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ticket_query_dto_1.TicketQueryDto]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "getAvailableTickets", null);
__decorate([
    (0, common_1.Post)("reserve"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: "Reserve tickets" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Tickets reserved successfully" }),
    (0, swagger_1.ApiResponse)({ status: 409, description: "Tickets not available" }),
    __param(0, (0, user_decorator_1.User)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reservation_dto_1.ReservationDto]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "reserveTickets", null);
__decorate([
    (0, common_1.Post)("reservations/:reservationId/confirm"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Confirm ticket reservation" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Reservation confirmed successfully",
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Reservation not found" }),
    __param(0, (0, user_decorator_1.User)("id")),
    __param(1, (0, common_1.Param)("reservationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "confirmReservation", null);
__decorate([
    (0, common_1.Delete)("reservations/:reservationId"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Cancel ticket reservation" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Reservation cancelled successfully",
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Reservation not found" }),
    __param(0, (0, user_decorator_1.User)("id")),
    __param(1, (0, common_1.Param)("reservationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "cancelReservation", null);
exports.TicketController = TicketController = __decorate([
    (0, swagger_1.ApiTags)("tickets"),
    (0, common_1.Controller)("api/v1/tickets"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [ticket_service_1.TicketService])
], TicketController);
//# sourceMappingURL=ticket.controller.js.map