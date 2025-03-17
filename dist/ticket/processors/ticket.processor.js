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
var TicketProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const ticket_service_1 = require("../services/ticket.service");
let TicketProcessor = TicketProcessor_1 = class TicketProcessor {
    constructor(ticketService) {
        this.ticketService = ticketService;
        this.logger = new common_1.Logger(TicketProcessor_1.name);
    }
    async handleReservationCleanup(job) {
        this.logger.debug(`Processing reservation cleanup for ${job.data.reservationId}`);
        try {
            await this.ticketService.cleanupExpiredReservations();
        }
        catch (error) {
            this.logger.error(`Error cleaning up reservation ${job.data.reservationId}:`, error);
            throw error;
        }
    }
    async handleTicketCacheSync(job) {
        this.logger.debug(`Syncing ticket cache for ${job.data.ticketId}`);
        try {
            this.logger.debug(`Successfully synced ticket cache for ${job.data.ticketId}`);
        }
        catch (error) {
            this.logger.error(`Error syncing ticket cache ${job.data.ticketId}:`, error);
            throw error;
        }
    }
};
exports.TicketProcessor = TicketProcessor;
__decorate([
    (0, bull_1.Process)('cleanup-reservation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TicketProcessor.prototype, "handleReservationCleanup", null);
__decorate([
    (0, bull_1.Process)('sync-ticket-cache'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TicketProcessor.prototype, "handleTicketCacheSync", null);
exports.TicketProcessor = TicketProcessor = TicketProcessor_1 = __decorate([
    (0, bull_1.Processor)('ticket-operations'),
    __metadata("design:paramtypes", [ticket_service_1.TicketService])
], TicketProcessor);
//# sourceMappingURL=ticket.processor.js.map