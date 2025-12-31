/**
 * Circuit Breaker implementation for resilient external service calls
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit tripped, requests fail fast with fallback
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time in ms before attempting recovery (default: 30000) */
  resetTimeout?: number;
  /** Number of successful calls in half-open state to close circuit (default: 2) */
  successThreshold?: number;
  /** Optional callback when circuit state changes */
  onStateChange?: (from: CircuitState, to: CircuitState, serviceName: string) => void;
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

const DEFAULT_OPTIONS: Required<Omit<CircuitBreakerOptions, 'onStateChange'>> = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
};

// Global circuit breaker registry
const circuits = new Map<string, CircuitBreakerState>();

/**
 * Get or create a circuit breaker state for a service
 */
function getCircuit(name: string): CircuitBreakerState {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
    });
  }
  return circuits.get(name)!;
}

/**
 * Create a circuit breaker wrapper for an async function
 *
 * @example
 * const safeFetch = withCircuitBreaker(
 *   'sanity-api',
 *   () => client.fetch(query),
 *   () => fallbackData,
 *   { failureThreshold: 3 }
 * );
 * const result = await safeFetch();
 */
export function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  fallback: () => T | Promise<T>,
  options: CircuitBreakerOptions = {}
): () => Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async (): Promise<T> => {
    const circuit = getCircuit(serviceName);
    const now = Date.now();

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (circuit.state === 'OPEN' && circuit.nextAttemptTime && now >= circuit.nextAttemptTime) {
      transitionState(circuit, serviceName, 'HALF_OPEN', opts.onStateChange);
      circuit.successes = 0; // Reset for recovery test
    }

    // If circuit is OPEN, fail fast with fallback
    if (circuit.state === 'OPEN') {
      console.warn(`[CircuitBreaker] ${serviceName}: Circuit OPEN, returning fallback`);
      return fallback();
    }

    try {
      const result = await fn();

      // Success handling
      if (circuit.state === 'HALF_OPEN') {
        circuit.successes++;
        if (circuit.successes >= opts.successThreshold) {
          // Enough successes in half-open state, close the circuit
          transitionState(circuit, serviceName, 'CLOSED', opts.onStateChange);
          circuit.failures = 0;
          circuit.successes = 0;
        }
      } else if (circuit.state === 'CLOSED') {
        // Reset failure count on success in closed state
        circuit.failures = 0;
      }

      return result;
    } catch (error) {
      // Failure handling
      circuit.failures++;
      circuit.lastFailureTime = now;

      if (circuit.state === 'HALF_OPEN') {
        // Any failure in half-open state reopens the circuit
        transitionState(circuit, serviceName, 'OPEN', opts.onStateChange);
        circuit.nextAttemptTime = now + opts.resetTimeout;
        circuit.successes = 0;
      } else if (circuit.failures >= opts.failureThreshold) {
        // Threshold exceeded, open the circuit
        transitionState(circuit, serviceName, 'OPEN', opts.onStateChange);
        circuit.nextAttemptTime = now + opts.resetTimeout;
      }

      console.error(`[CircuitBreaker] ${serviceName}: Request failed (failures: ${circuit.failures})`, error);

      // Return fallback for this failed request
      return fallback();
    }
  };
}

function transitionState(
  circuit: CircuitBreakerState,
  serviceName: string,
  newState: CircuitState,
  onStateChange?: (from: CircuitState, to: CircuitState, serviceName: string) => void
): void {
  const oldState = circuit.state;
  if (oldState !== newState) {
    circuit.state = newState;
    console.log(`[CircuitBreaker] ${serviceName}: State transition ${oldState} -> ${newState}`);
    onStateChange?.(oldState, newState, serviceName);
  }
}

/**
 * Get current state of a circuit breaker
 */
export function getCircuitState(serviceName: string): CircuitState {
  return getCircuit(serviceName).state;
}

/**
 * Get detailed stats for a circuit breaker
 */
export function getCircuitStats(serviceName: string): {
  state: CircuitState;
  failures: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
} {
  const circuit = getCircuit(serviceName);
  return {
    state: circuit.state,
    failures: circuit.failures,
    lastFailureTime: circuit.lastFailureTime,
    nextAttemptTime: circuit.nextAttemptTime,
  };
}

/**
 * Reset a circuit breaker to closed state (useful for testing)
 */
export function resetCircuit(serviceName: string): void {
  circuits.set(serviceName, {
    state: 'CLOSED',
    failures: 0,
    successes: 0,
    lastFailureTime: null,
    nextAttemptTime: null,
  });
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuits(): void {
  circuits.clear();
}
