import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || "development",
  apiPrefix: "api/v1",
  fallbackLanguage: "en",
  headerLanguage: "x-custom-lang",
}));

// export const redisConfig = registerAs("redis", () => ({
//   host: process.env.REDIS_HOST || "localhost",
//   port: parseInt(process.env.REDIS_PORT, 10) || 6379,
//   password: process.env.REDIS_PASSWORD,
//   maxRetriesPerRequest: 3,
//   enableReadyCheck: true,
//   maxReconnectAttempts: 10,
// }));

export const ticketConfig = registerAs("ticket", () => ({
  reservationTimeoutSeconds:
    parseInt(process.env.RESERVATION_TIMEOUT_SECONDS, 10) || 900,
  maxReservationsPerUser:
    parseInt(process.env.MAX_RESERVATIONS_PER_USER, 10) || 5,
  maxTicketsPerReservation:
    parseInt(process.env.MAX_TICKETS_PER_RESERVATION, 10) || 10,
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
}));

export const rateLimitConfig = registerAs("rateLimit", () => ({
  ttl: 60, // 1 minute
  limit: parseInt(process.env.RATE_LIMIT, 10) || 100,
}));

export const circuitBreakerConfig = registerAs("circuitBreaker", () => ({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000, // 10 seconds
}));

export default [
  appConfig,
  // redisConfig,
  ticketConfig,
  rateLimitConfig,
  circuitBreakerConfig,
];
