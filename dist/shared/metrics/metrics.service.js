"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    constructor() {
        this.registry = new prom_client_1.Registry();
        this.counters = new Map();
        this.histograms = new Map();
        this.initializeMetrics();
    }
    initializeMetrics() {
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
    createCounter(options) {
        const counter = new prom_client_1.Counter({
            name: options.name,
            help: options.help,
            labelNames: options.labelNames || [],
        });
        this.registry.registerMetric(counter);
        this.counters.set(options.name, counter);
        return counter;
    }
    createHistogram(options) {
        const histogram = new prom_client_1.Histogram({
            name: options.name,
            help: options.help,
            labelNames: options.labelNames || [],
            buckets: options.buckets || prom_client_1.Histogram.defaultBuckets,
        });
        this.registry.registerMetric(histogram);
        this.histograms.set(options.name, histogram);
        return histogram;
    }
    getCounter(name) {
        const counter = this.counters.get(name);
        if (!counter) {
            throw new Error(`Counter ${name} not found`);
        }
        return counter;
    }
    getHistogram(name) {
        const histogram = this.histograms.get(name);
        if (!histogram) {
            throw new Error(`Histogram ${name} not found`);
        }
        return histogram;
    }
    incrementCounter(name, labels) {
        const counter = this.getCounter(name);
        if (labels) {
            counter.inc(labels);
        }
        else {
            counter.inc();
        }
    }
    observeHistogram(name, value, labels) {
        const histogram = this.getHistogram(name);
        if (labels) {
            histogram.observe(labels, value);
        }
        else {
            histogram.observe(value);
        }
    }
    startTimer(name, labels) {
        const histogram = this.getHistogram(name);
        return histogram.startTimer(labels);
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    clearRegistry() {
        this.registry.clear();
    }
    startReservationTimer() {
        return this.startTimer("ticket_reservation_duration_seconds", { status: "success" });
    }
    incrementReservation(status) {
        this.incrementCounter("ticket_reservations_total", { status });
    }
    incrementConfirmation(status) {
        this.incrementCounter("ticket_confirmations_total", { status });
    }
    incrementCancellation(status) {
        this.incrementCounter("ticket_cancellations_total", { status });
    }
    recordCacheHit(operation) {
        this.incrementCounter("cache_hits_total", { operation });
    }
    recordCacheMiss(operation) {
        this.incrementCounter("cache_misses_total", { operation });
    }
    recordCircuitBreakerStateChange(fromState, toState) {
        this.incrementCounter("circuit_breaker_state_changes_total", {
            from_state: fromState,
            to_state: toState,
        });
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map