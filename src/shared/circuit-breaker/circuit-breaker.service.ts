import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    this.failureThreshold = this.configService.get('circuitBreaker.failureThreshold');
    this.successThreshold = this.configService.get('circuitBreaker.successThreshold');
    this.timeout = this.configService.get('circuitBreaker.timeout');
  }

  async execute<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    context: string,
  ): Promise<T> {
    if (this.isOpen()) {
      this.logger.warn(`Circuit breaker is OPEN for ${context}`);
      return fallback();
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      this.logger.error(
        `Circuit breaker operation failed for ${context}:`,
        error,
      );
      return fallback();
    }
  }

  private isOpen(): boolean {
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

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.reset();
        this.logger.log('Circuit breaker state changed to CLOSED');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.failureThreshold
    ) {
      this.state = CircuitState.OPEN;
      this.logger.warn('Circuit breaker state changed to OPEN');
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.logger.warn('Circuit breaker state changed back to OPEN');
    }
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  getState(): string {
    return CircuitState[this.state];
  }
}
