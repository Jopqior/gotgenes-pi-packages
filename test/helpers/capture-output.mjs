import { vi } from "vitest";

/**
 * Capture the synchronous, no-callback string/Buffer writes made by a direct call.
 * Errors propagate unchanged; writers are restored before returning or throwing.
 * Not intended for asynchronous, nested or concurrent capture.
 * @template T
 * @param {() => T} callback
 * @returns {{ value: T, stdout: string, stderr: string }}
 */
export function captureOutput(callback) {
  const stdout = [];
  const stderr = [];
  const stdoutSpy = vi
    .spyOn(process.stdout, "write")
    .mockImplementation((chunk, encoding) => {
      stdout.push(
        Buffer.from(chunk, typeof encoding === "string" ? encoding : undefined),
      );
      return true;
    });
  const stderrSpy = vi
    .spyOn(process.stderr, "write")
    .mockImplementation((chunk, encoding) => {
      stderr.push(
        Buffer.from(chunk, typeof encoding === "string" ? encoding : undefined),
      );
      return true;
    });
  try {
    const value = callback();
    return {
      value,
      stdout: Buffer.concat(stdout).toString(),
      stderr: Buffer.concat(stderr).toString(),
    };
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }
}
