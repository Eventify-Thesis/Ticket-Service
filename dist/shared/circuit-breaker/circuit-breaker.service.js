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
var CircuitBreakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
var CircuitState;
(function (CircuitState) {
    CircuitState[CircuitState["CLOSED"] = 0] = "CLOSED";
    CircuitState[CircuitState["OPEN"] = 1] = "OPEN";
    CircuitState[CircuitState["HALF_OPEN"] = 2] = "HALF_OPEN";
})(CircuitState || (CircuitState = {}));
let CircuitBreakerService = CircuitBreakerService_1 = class CircuitBreakerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CircuitBreakerService_1.name);
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.failureThreshold = this.configService.get('circuitBreaker.failureThreshold');
        this.successThreshold = this.configService.get('circuitBreaker.successThreshold');
        this.timeout = this.configService.get('circuitBreaker.timeout');
    }
    async execute(operation, fallback, context) {
        if (this.isOpen()) {
            this.logger.warn(`Circuit breaker is OPEN for ${context}`);
            return fallback();
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            this.logger.error(`Circuit breaker operation failed for ${context}:`, error);
            return fallback();
        }
    }
    isOpen() {
        if (this.state === CircuitState.OPEN) {
            const now = Date.now();
            if (this.lastFailureTime && now - this.lastFailureTime > this.timeout) {
                this.state = CircuitState.HALF_OPEN;
                this.logger.log('Circuit breaker state changed to HALF_OPEN');
                return false;
            }
            return true;
        }
        return false;
    }
    onSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this.reset();
                this.logger.log('Circuit breaker state changed to CLOSED');
            }
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.CLOSED &&
            this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.logger.warn('Circuit breaker state changed to OPEN');
        }
        else if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.logger.warn('Circuit breaker state changed back to OPEN');
        }
    }
    reset() {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
    }
    getState() {
        return CircuitState[this.state];
    }
};
exports.CircuitBreakerService = CircuitBreakerService;
exports.CircuitBreakerService = CircuitBreakerService = CircuitBreakerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CircuitBreakerService);
//# sourceMappingURL=circuit-breaker.service.js.map