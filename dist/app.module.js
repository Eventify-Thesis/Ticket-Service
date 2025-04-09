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
const bull_1 = require("@nestjs/bull");
const schedule_1 = require("@nestjs/schedule");
const nestjs_pino_1 = require("nestjs-pino");
const throttler_1 = require("@nestjs/throttler");
const health_module_1 = require("./health/health.module");
const redis_module_1 = require("./shared/redis/redis.module");
const terminus_1 = require("@nestjs/terminus");
const seat_module_1 = require("./seat/seat.module");
const typeorm_1 = require("@nestjs/typeorm");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
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
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: "postgres",
                    host: configService.get("DATABASE_HOST"),
                    port: configService.get("DATABASE_PORT"),
                    username: configService.get("DATABASE_USERNAME"),
                    password: configService.get("DATABASE_PASSWORD"),
                    database: configService.get("DATABASE_NAME"),
                    entities: [__dirname + "/**/*.entity{.ts,.js}"],
                    synchronize: configService.get("DATABASE_SYNCHRONIZE") === "true",
                }),
                inject: [config_1.ConfigService],
            }),
            redis_module_1.RedisModule,
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    redis: {
                        standalone: {
                            nodes: [
                                {
                                    host: config.get("REDIS_HOST", "localhost"),
                                    port: config.get("REDIS_PORT", 6379),
                                },
                            ],
                        },
                        maxRetriesPerRequest: config.get("REDIS_MAX_RETRIES_PER_REQUEST", 3),
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
            seat_module_1.SeatModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map