import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry } from 'prom-client';
import { MetricOptions } from './interfaces/metric-options.interface';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly counters: Map<string, Counter>;
  private readonly histograms: Map<string, Histogram>;

  constructor() {
    this.registry = new Registry();
    this.counters = new Map();
    this.histograms = new Map();
    this.initializeMetrics();
  }

  private initializeMetrics() {
    this.ticketReservationDuration = this.createHistogram({
      name: "ticket_reservation_duration_seconds",
      help: "Duration of ticket reservation operations",
      labelNames: ["status"],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.ticketReservationTotal = this.createCounter({
      name: "ticket_reservations_total",
      help: "Total number of ticket reservations",
      labelNames: ["status"],
    });

    this.ticketConfirmationTotal = this.createCounter({
      name: "ticket_confirmations_total",
      help: "Total number of ticket confirmations",
      labelNames: ["status"],
    });

    this.ticketCancellationTotal = this.createCounter({
      name: "ticket_cancellations_total",
      help: "Total number of ticket cancellations",
      labelNames: ["status"],
    });

    this.cacheHitTotal = this.createCounter({
      name: "cache_hits_total",
      help: "Total number of cache hits",
      labelNames: ["operation"],
    });

    this.cacheMissTotal = this.createCounter({
      name: "cache_misses_total",
      help: "Total number of cache misses",
      labelNames: ["operation"],
    });

    this.circuitBreakerStateChanges = this.createCounter({
      name: "circuit_breaker_state_changes_total",
      help: "Total number of circuit breaker state changes",
      labelNames: ["from_state", "to_state"],
    });
  }

  createCounter(options: MetricOptions): Counter<string> {
    const counter = new Counter({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || [],
    });
    this.registry.registerMetric(counter);
    this.counters.set(options.name, counter);
    return counter;
  }

  createHistogram(options: MetricOptions): Histogram<string> {
    const histogram = new Histogram({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || [],
      buckets: options.buckets || Histogram.defaultBuckets,
    });
    this.registry.registerMetric(histogram);
    this.histograms.set(options.name, histogram);
    return histogram;
  }

  getCounter(name: string): Counter<string> {
    const counter = this.counters.get(name);
    if (!counter) {
      throw new Error(`Counter ${name} not found`);
    }
    return counter;
  }

  getHistogram(name: string): Histogram<string> {
    const histogram = this.histograms.get(name);
    if (!histogram) {
      throw new Error(`Histogram ${name} not found`);
    }
    return histogram;
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    const counter = this.getCounter(name);
    if (labels) {
      counter.inc(labels);
    } else {
      counter.inc();
    }
  }

  observeHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    const histogram = this.getHistogram(name);
    if (labels) {
      histogram.observe(labels, value);
    } else {
      histogram.observe(value);
    }
  }

  startTimer(name: string, labels?: Record<string, string>) {
    const histogram = this.getHistogram(name);
    return histogram.startTimer(labels);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  clearRegistry(): void {
    this.registry.clear();
  }

  // Reservation metrics
  startReservationTimer(): Histogram.StartTimer {
    return this.startTimer("ticket_reservation_duration_seconds", { status: "success" });
  }

  incrementReservation(status: "success" | "failure") {
    this.incrementCounter("ticket_reservations_total", { status });
  }

  // Confirmation metrics
  incrementConfirmation(status: "success" | "failure") {
    this.incrementCounter("ticket_confirmations_total", { status });
  }

  // Cancellation metrics
  incrementCancellation(status: "success" | "failure") {
    this.incrementCounter("ticket_cancellations_total", { status });
  }

  // Cache metrics
  recordCacheHit(operation: string) {
    this.incrementCounter("cache_hits_total", { operation });
  }

  recordCacheMiss(operation: string) {
    this.incrementCounter("cache_misses_total", { operation });
  }

  // Circuit breaker metrics
  recordCircuitBreakerStateChange(fromState: string, toState: string) {
    this.incrementCounter("circuit_breaker_state_changes_total", {
      from_state: fromState,
      to_state: toState,
    });
  }
}
