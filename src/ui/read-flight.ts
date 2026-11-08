/** Share pending checks only. A write starts a new freshness boundary. */
export function createReadFlight<T>(load: (signal: AbortSignal) => Promise<T>) {
  let current: { promise: Promise<T>; controller: AbortController; consumers: number } | undefined;
  return {
    read(signal: AbortSignal): Promise<T> {
      signal.throwIfAborted();
      if (!current) {
        const controller = new AbortController();
        const flight = { controller, consumers: 0, promise: undefined as unknown as Promise<T> };
        flight.promise = load(controller.signal).finally(() => {
          queueMicrotask(() => { if (current === flight) current = undefined; });
        });
        current = flight;
      }
      const flight = current;
      flight.consumers++;
      return new Promise<T>((resolve, reject) => {
        let done = false;
        const finish = (action: () => void) => {
          if (done) return;
          done = true;
          signal.removeEventListener('abort', abort);
          flight.consumers--;
          action();
        };
        const abort = () => finish(() => {
          reject(signal.reason);
          if (!flight.consumers) {
            if (current === flight) current = undefined;
            flight.controller.abort();
          }
        });
        signal.addEventListener('abort', abort, { once: true });
        flight.promise.then(value => finish(() => resolve(value)), error => finish(() => reject(error)));
      });
    },
    invalidate() { current = undefined; },
  };
}
