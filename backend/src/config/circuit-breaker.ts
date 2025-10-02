import { logger } from './logger';

/**
 * Circuit Breaker Pattern Implementation
 * Protects against cascading failures when external services (like Supabase) are down
 */

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Successful calls in HALF_OPEN before closing
  timeout: number; // Time in ms before moving from OPEN to HALF_OPEN
  mode: 'fail-open' | 'fail-closed'; // Behavior when circuit is OPEN
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private nextAttemptTime: number | null = null;

  constructor(private options: CircuitBreakerOptions) {
    logger.info(
      {
        name: options.name || 'unnamed',
        threshold: options.failureThreshold,
        timeout: options.timeout,
        mode: options.mode,
      },
      'Circuit breaker initialized'
    );
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed
      if (this.nextAttemptTime && Date.now() >= this.nextAttemptTime) {
        logger.info(
          { name: this.options.name },
          'Circuit breaker: OPEN → HALF_OPEN'
        );
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        // Circuit still open
        const error = new Error(
          `Circuit breaker is OPEN for ${this.options.name || 'service'}`
        );
        (error as any).circuitOpen = true;

        logger.warn(
          {
            name: this.options.name,
            state: this.state,
            mode: this.options.mode,
          },
          'Circuit breaker rejecting request'
        );

        // Fail-open: allow request through despite circuit being open
        if (this.options.mode === 'fail-open') {
          logger.warn(
            { name: this.options.name },
            'Circuit breaker: fail-open mode, allowing request'
          );
          return await this.tryExecute(fn);
        }

        throw error;
      }
    }

    // Execute the function
    return await this.tryExecute(fn);
  }

  /**
   * Try to execute the function and handle success/failure
   */
  private async tryExecute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      logger.debug(
        {
          name: this.options.name,
          successCount: this.successCount,
          threshold: this.options.successThreshold,
        },
        'Circuit breaker: success in HALF_OPEN'
      );

      // Close circuit if enough successful calls
      if (this.successCount >= this.options.successThreshold) {
        logger.info(
          { name: this.options.name },
          'Circuit breaker: HALF_OPEN → CLOSED'
        );
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.warn(
      {
        name: this.options.name,
        failureCount: this.failureCount,
        threshold: this.options.failureThreshold,
        error: error.message,
      },
      'Circuit breaker: failure recorded'
    );

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately open on failure in HALF_OPEN
      logger.warn(
        { name: this.options.name },
        'Circuit breaker: HALF_OPEN → OPEN (failure during test)'
      );
      this.openCircuit();
    } else if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.options.failureThreshold
    ) {
      // Open circuit after threshold failures
      logger.error(
        { name: this.options.name, failureCount: this.failureCount },
        'Circuit breaker: CLOSED → OPEN (threshold reached)'
      );
      this.openCircuit();
    }
  }

  /**
   * Open the circuit
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.options.timeout;
    this.successCount = 0;

    logger.error(
      {
        name: this.options.name,
        timeout: this.options.timeout,
        nextAttempt: new Date(this.nextAttemptTime).toISOString(),
      },
      'Circuit breaker opened'
    );
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null,
      nextAttemptTime: this.nextAttemptTime
        ? new Date(this.nextAttemptTime).toISOString()
        : null,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    logger.info({ name: this.options.name }, 'Circuit breaker manually reset');
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }
}

/**
 * Create a circuit breaker from environment variables
 */
export function createCircuitBreaker(name: string): CircuitBreaker {
  const threshold = parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '3', 10);
  const timeout = parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '30000', 10);
  const mode = (process.env.CIRCUIT_BREAKER_MODE || 'fail-closed') as
    | 'fail-open'
    | 'fail-closed';

  return new CircuitBreaker({
    name,
    failureThreshold: threshold,
    successThreshold: 2, // 2 successful calls to close
    timeout,
    mode,
  });
}
