/**
 * selection-queue.ts — FIFO ownership for one root chooser's dialogs.
 *
 * Independent of Pi: jobs are thunks that receive a dialog AbortSignal.
 * Cancelling a waiting request removes it without running it; cancelling the
 * active request aborts its dialog signal. close() invalidates the active job
 * and drains waiters without confirmation.
 */

export class SelectionQueueCancelledError extends Error {
  constructor(message = "The selection request was cancelled.") {
    super(message);
    this.name = "SelectionQueueCancelledError";
  }
}

export class SelectionQueueClosedError extends Error {
  constructor(message = "The selection queue is closed.") {
    super(message);
    this.name = "SelectionQueueClosedError";
  }
}

type Job<T> = (dialogSignal: AbortSignal) => Promise<T>;

interface Waiter {
  readonly dialog: AbortController;
  readonly reject: (reason: unknown) => void;
}

export class SelectionQueue {
  #closed = false;
  #tail: Promise<void> = Promise.resolve();
  readonly #waiters = new Set<Waiter>();

  get closed(): boolean {
    return this.#closed;
  }

  enqueue<T>(job: Job<T>, signal: AbortSignal): Promise<T> {
    if (this.#closed) {
      return Promise.reject(new SelectionQueueClosedError());
    }
    if (signal.aborted) {
      return Promise.reject(new SelectionQueueCancelledError());
    }

    const { promise, resolve, reject } = Promise.withResolvers<T>();
    const dialog = new AbortController();
    const waiter: Waiter = { dialog, reject };
    this.#waiters.add(waiter);

    const onAbort = (): void => {
      this.#failWaiter(waiter, new SelectionQueueCancelledError());
    };
    signal.addEventListener("abort", onAbort, { once: true });

    const run = this.#tail.then(async () => {
      if (!this.#waiters.has(waiter)) {
        return;
      }
      if (this.#closed) {
        this.#failWaiter(waiter, new SelectionQueueClosedError());
        return;
      }
      if (signal.aborted) {
        this.#failWaiter(waiter, new SelectionQueueCancelledError());
        return;
      }
      try {
        resolve(await job(dialog.signal));
      } catch (err) {
        reject(err);
      } finally {
        this.#waiters.delete(waiter);
      }
    });

    this.#tail = run.then(
      () => undefined,
      () => undefined,
    );

    const detachAbort = (): void => {
      signal.removeEventListener("abort", onAbort);
    };
    void promise.then(detachAbort, detachAbort);

    return promise;
  }

  close(): void {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    for (const waiter of [...this.#waiters]) {
      this.#failWaiter(waiter, new SelectionQueueClosedError());
    }
  }

  #failWaiter(waiter: Waiter, err: Error): void {
    if (!this.#waiters.has(waiter)) {
      return;
    }
    this.#waiters.delete(waiter);
    waiter.dialog.abort();
    waiter.reject(err);
  }
}
