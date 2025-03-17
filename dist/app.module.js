"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const bull_1 = require("@nestjs/bull");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const nestjs_pino_1 = require("nestjs-pino");
const terminus_1 = require("@nestjs/terminus");
const redis_module_1 = require("./shared/redis/redis.module");
const health_module_1 = require("./health/health.module");
const ticket_module_1 = require("./ticket/ticket.module");
const configuration_1 = require("./config/configuration");
const circuit_breaker_module_1 = require("./shared/circuit-breaker/circuit-breaker.module");
const metrics_module_1 = require("./shared/metrics/metrics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: configuration_1.default,
            }),
            nestjs_pino_1.LoggerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    pinoHttp: {
                        level: config.get("app.environment") === "development" ? "debug" : "info",
                        transport: config.get("app.environment") === "development"
                            ? { target: "pino-pretty" }
                            : undefined,
                    },
                }),
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    uri: config.get("database.uri"),
                    ...config.get("database.options"),
                }),
            }),
            redis_module_1.RedisModule,
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    redis: {
                        host: config.get("redis.host"),
                        port: config.get("redis.port"),
                        password: config.get("redis.password"),
                        maxRetriesPerRequest: config.get("redis.maxRetriesPerRequest"),
                    },
                }),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    ttl: config.get("rateLimit.ttl"),
                    limit: config.get("rateLimit.limit"),
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            terminus_1.TerminusModule,
            health_module_1.HealthModule,
            circuit_breaker_module_1.CircuitBreakerModule,
            metrics_module_1.MetricsModule,
            ticket_module_1.TicketModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map