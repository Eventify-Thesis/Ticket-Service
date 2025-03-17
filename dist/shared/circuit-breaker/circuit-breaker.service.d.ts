import { ConfigService } from '@nestjs/config';
export declare class CircuitBreakerService {
    private readonly configService;
    private readonly logger;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private readonly failureThreshold;
    private readonly successThreshold;
    private readonly timeout;
    constructor(configService: ConfigService);
    execute<T>(operation: () => Promise<T>, fallback: () => Promise<T>, context: string): Promise<T>;
    private isOpen;
    private onSuccess;
    private onFailure;
    private reset;
    getState(): string;
}
