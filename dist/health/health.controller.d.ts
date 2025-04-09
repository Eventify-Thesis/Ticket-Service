import { HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from "@nestjs/terminus";
export declare class HealthController {
    private health;
    private memory;
    private disk;
    constructor(health: HealthCheckService, memory: MemoryHealthIndicator, disk: DiskHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
