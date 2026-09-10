import { describe, expect, it } from "vitest";
import {
  SelectionQueue,
  SelectionQueueCancelledError,
  SelectionQueueClosedError,
} from "#src/selection-queue";

/** A signal that is never aborted. */
function liveSignal(): AbortSignal {
  return new AbortController().signal;
}

describe("SelectionQueue", () => {
  describe("FIFO admission", () => {
    it("does not start job B until job A settles", async () => {
      const queue = new SelectionQueue();
      const log: string[] = [];
      const aGate = Promise.withResolvers<true>();
      const aStarted = Promise.withResolvers<true>();
      const bStarted = Promise.withResolvers<true>();

      const a = queue.enqueue(async () => {
        aStarted.resolve(true);
        log.push("a-start");
        await aGate.promise;
        log.push("a-end");
        return "a";
      }, liveSignal());

      const b = queue.enqueue(async () => {
        bStarted.resolve(true);
        log.push("b-start");
        return "b";
      }, liveSignal());

      await aStarted.promise;
      expect(log).toEqual(["a-start"]);

      let bStartedAlready = false;
      void bStarted.promise.then(() => {
        bStartedAlready = true;
      });
      await Promise.resolve();
      expect(bStartedAlready).toBe(false);

      aGate.resolve(true);
      await expect(a).resolves.toBe("a");
      await expect(b).resolves.toBe("b");
      expect(log).toEqual(["a-start", "a-end", "b-start"]);
    });
  });

  describe("cancellation", () => {
    it("never runs a waiting job whose signal aborts before it starts", async () => {
      const queue = new SelectionQueue();
      const aGate = Promise.withResolvers<true>();
      const aStarted = Promise.withResolvers<true>();
      let bRan = false;

      const a = queue.enqueue(async () => {
        aStarted.resolve(true);
        await aGate.promise;
        return "a";
      }, liveSignal());

      const bController = new AbortController();
      const b = queue.enqueue(async () => {
        bRan = true;
        return "b";
      }, bController.signal);

      await aStarted.promise;
      bController.abort();
      await expect(b).rejects.toBeInstanceOf(SelectionQueueCancelledError);

      aGate.resolve(true);
      await expect(a).resolves.toBe("a");
      expect(bRan).toBe(false);
    });

    it("aborts the active job's dialog signal when its request is cancelled", async () => {
      const queue = new SelectionQueue();
      const aController = new AbortController();
      const dialogSeen = Promise.withResolvers<AbortSignal>();

      const a = queue.enqueue(async (dialogSignal) => {
        dialogSeen.resolve(dialogSignal);
        await new Promise<void>((resolve) => {
          dialogSignal.addEventListener("abort", () => resolve(), {
            once: true,
          });
        });
        return "unused";
      }, aController.signal);

      const dialogSignal = await dialogSeen.promise;
      expect(dialogSignal.aborted).toBe(false);

      aController.abort();
      expect(dialogSignal.aborted).toBe(true);
      await expect(a).rejects.toBeInstanceOf(SelectionQueueCancelledError);
    });

    it("starts the next job after the active request is cancelled", async () => {
      const queue = new SelectionQueue();
      const aController = new AbortController();
      const aStarted = Promise.withResolvers<AbortSignal>();

      const a = queue.enqueue(async (dialogSignal) => {
        aStarted.resolve(dialogSignal);
        await new Promise<void>((resolve) => {
          dialogSignal.addEventListener("abort", () => resolve(), {
            once: true,
          });
        });
        return "unused";
      }, aController.signal);

      const b = queue.enqueue(async () => "b", liveSignal());

      await aStarted.promise;
      aController.abort();
      await expect(a).rejects.toBeInstanceOf(SelectionQueueCancelledError);
      await expect(b).resolves.toBe("b");
    });
  });

  describe("close", () => {
    it("aborts the active dialog and refuses waiting jobs without running them", async () => {
      const queue = new SelectionQueue();
      const dialogSeen = Promise.withResolvers<AbortSignal>();
      let bRan = false;

      const a = queue.enqueue(async (dialogSignal) => {
        dialogSeen.resolve(dialogSignal);
        await new Promise<void>((resolve) => {
          dialogSignal.addEventListener("abort", () => resolve(), {
            once: true,
          });
        });
        return "unused";
      }, liveSignal());

      const b = queue.enqueue(async () => {
        bRan = true;
        return "b";
      }, liveSignal());

      const dialogSignal = await dialogSeen.promise;
      queue.close();

      expect(dialogSignal.aborted).toBe(true);
      await expect(a).rejects.toBeInstanceOf(SelectionQueueClosedError);
      await expect(b).rejects.toBeInstanceOf(SelectionQueueClosedError);
      expect(bRan).toBe(false);
    });

    it("rejects a later enqueue without running the job", async () => {
      const queue = new SelectionQueue();
      queue.close();

      let ran = false;
      const result = queue.enqueue(async () => {
        ran = true;
        return "x";
      }, liveSignal());

      await expect(result).rejects.toBeInstanceOf(SelectionQueueClosedError);
      expect(ran).toBe(false);
    });

    it("is idempotent", () => {
      const queue = new SelectionQueue();
      queue.close();
      expect(queue.closed).toBe(true);
      queue.close();
      expect(queue.closed).toBe(true);
    });
  });
});
