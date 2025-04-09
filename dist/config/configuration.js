"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreakerConfig = exports.rateLimitConfig = exports.ticketConfig = exports.redisConfig = exports.appConfig = void 0;
const config_1 = require("@nestjs/config");
exports.appConfig = (0, config_1.registerAs)("app", () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    environment: process.env.NODE_ENV || "development",
    apiPrefix: "api/v1",
    fallbackLanguage: "en",
    headerLanguage: "x-custom-lang",
}));
exports.redisConfig = (0, config_1.registerAs)("redis", () => ({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    maxReconnectAttempts: 10,
}));
exports.ticketConfig = (0, config_1.registerAs)("ticket", () => ({
    reservationTimeoutSeconds: parseInt(process.env.RESERVATION_TIMEOUT_SECONDS, 10) || 900,
    maxReservationsPerUser: parseInt(process.env.MAX_RESERVATIONS_PER_USER, 10) || 5,
    maxTicketsPerReservation: parseInt(process.env.MAX_TICKETS_PER_RESERVATION, 10) || 10,
    retryAttempts: 3,
    retryDelay: 1000,
}));
exports.rateLimitConfig = (0, config_1.registerAs)("rateLimit", () => ({
    ttl: 60,
    limit: parseInt(process.env.RATE_LIMIT, 10) || 100,
}));
exports.circuitBreakerConfig = (0, config_1.registerAs)("circuitBreaker", () => ({
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 10000,
}));
exports.default = [
    exports.appConfig,
    exports.redisConfig,
    exports.ticketConfig,
    exports.rateLimitConfig,
    exports.circuitBreakerConfig,
];
//# sourceMappingURL=configuration.js.map