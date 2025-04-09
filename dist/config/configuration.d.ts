export declare const appConfig: (() => {
    port: number;
    environment: string;
    apiPrefix: string;
    fallbackLanguage: string;
    headerLanguage: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    port: number;
    environment: string;
    apiPrefix: string;
    fallbackLanguage: string;
    headerLanguage: string;
}>;
export declare const redisConfig: (() => {
    host: string;
    port: number;
    password: string;
    maxRetriesPerRequest: number;
    enableReadyCheck: boolean;
    maxReconnectAttempts: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string;
    maxRetriesPerRequest: number;
    enableReadyCheck: boolean;
    maxReconnectAttempts: number;
}>;
export declare const ticketConfig: (() => {
    reservationTimeoutSeconds: number;
    maxReservationsPerUser: number;
    maxTicketsPerReservation: number;
    retryAttempts: number;
    retryDelay: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    reservationTimeoutSeconds: number;
    maxReservationsPerUser: number;
    maxTicketsPerReservation: number;
    retryAttempts: number;
    retryDelay: number;
}>;
export declare const rateLimitConfig: (() => {
    ttl: number;
    limit: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    ttl: number;
    limit: number;
}>;
export declare const circuitBreakerConfig: (() => {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
}>;
declare const _default: (((() => {
    port: number;
    environment: string;
    apiPrefix: string;
    fallbackLanguage: string;
    headerLanguage: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    port: number;
    environment: string;
    apiPrefix: string;
    fallbackLanguage: string;
    headerLanguage: string;
}>) | ((() => {
    host: string;
    port: number;
    password: string;
    maxRetriesPerRequest: number;
    enableReadyCheck: boolean;
    maxReconnectAttempts: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string;
    maxRetriesPerRequest: number;
    enableReadyCheck: boolean;
    maxReconnectAttempts: number;
}>) | ((() => {
    reservationTimeoutSeconds: number;
    maxReservationsPerUser: number;
    maxTicketsPerReservation: number;
    retryAttempts: number;
    retryDelay: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    reservationTimeoutSeconds: number;
    maxReservationsPerUser: number;
    maxTicketsPerReservation: number;
    retryAttempts: number;
    retryDelay: number;
}>) | ((() => {
    ttl: number;
    limit: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    ttl: number;
    limit: number;
}>) | ((() => {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
}>))[];
export default _default;
