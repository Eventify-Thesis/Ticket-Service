import { Counter, Histogram } from 'prom-client';
import { MetricOptions } from './interfaces/metric-options.interface';
export declare class MetricsService {
    private readonly registry;
    private readonly counters;
    private readonly histograms;
    constructor();
    private initializeMetrics;
    createCounter(options: MetricOptions): Counter<string>;
    createHistogram(options: MetricOptions): Histogram<string>;
    getCounter(name: string): Counter<string>;
    getHistogram(name: string): Histogram<string>;
    incrementCounter(name: string, labels?: Record<string, string>): void;
    observeHistogram(name: string, value: number, labels?: Record<string, string>): void;
    startTimer(name: string, labels?: Record<string, string>): (labels?: Partial<Record<string, string | number>>) => number;
    getMetrics(): Promise<string>;
    clearRegistry(): void;
    startReservationTimer(): Histogram.StartTimer;
    incrementReservation(status: "success" | "failure"): void;
    incrementConfirmation(status: "success" | "failure"): void;
    incrementCancellation(status: "success" | "failure"): void;
    recordCacheHit(operation: string): void;
    recordCacheMiss(operation: string): void;
    recordCircuitBreakerStateChange(fromState: string, toState: string): void;
}
