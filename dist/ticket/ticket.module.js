"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bull_1 = require("@nestjs/bull");
const throttler_1 = require("@nestjs/throttler");
const config_1 = require("@nestjs/config");
const ticket_controller_1 = require("./controllers/ticket.controller");
const ticket_service_1 = require("./services/ticket.service");
const ticket_processor_1 = require("./processors/ticket.processor");
const ticket_entity_1 = require("./entities/ticket.entity");
const reservation_entity_1 = require("./entities/reservation.entity");
const redis_module_1 = require("../shared/redis/redis.module");
const circuit_breaker_module_1 = require("../shared/circuit-breaker/circuit-breaker.module");
let TicketModule = class TicketModule {
};
exports.TicketModule = TicketModule;
exports.TicketModule = TicketModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: ticket_entity_1.Ticket.name, schema: ticket_entity_1.TicketSchema },
                { name: reservation_entity_1.Reservation.name, schema: reservation_entity_1.ReservationSchema },
            ]),
            bull_1.BullModule.registerQueue({
                name: "ticket-operations",
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: "exponential",
                        delay: 1000,
                    },
                    removeOnComplete: true,
                },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    ttl: config.get("rateLimit.ttl"),
                    limit: config.get("rateLimit.limit"),
                }),
            }),
            redis_module_1.RedisModule,
            circuit_breaker_module_1.CircuitBreakerModule,
        ],
        controllers: [ticket_controller_1.TicketController],
        providers: [ticket_service_1.TicketService, ticket_processor_1.TicketProcessor],
        exports: [ticket_service_1.TicketService],
    })
], TicketModule);
//# sourceMappingURL=ticket.module.js.map