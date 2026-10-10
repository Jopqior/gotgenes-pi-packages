import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureOutput } from "./capture-output.mjs";

afterEach(() => vi.restoreAllMocks());

describe("captureOutput", () => {
  it("returns the original callback value with empty channels", () => {
    const value = { unchanged: true };
    const captured = captureOutput(() => value);
    expect(captured.value).toBe(value);
    expect(captured.stdout).toBe("");
    expect(captured.stderr).toBe("");
  });

  it("retains ordered string and Buffer writes on both channels", () => {
    const captured = captureOutput(() => {
      expect(process.stdout.write("start\n")).toBe(true);
      expect(process.stderr.write(Buffer.from("warning\n"))).toBe(true);
      process.stdout.write(Buffer.from("middle "));
      process.stdout.write("終わり\n");
      process.stderr.write("done\n");
    });
    expect(captured.stdout).toBe("start\nmiddle 終わり\n");
    expect(captured.stderr).toBe("warning\ndone\n");
  });

  it("decodes split UTF-8 bytes only after all writes", () => {
    const bytes = Buffer.from("界\n");
    const captured = captureOutput(() => {
      process.stdout.write(bytes.subarray(0, 1));
      process.stdout.write(bytes.subarray(1));
      process.stderr.write(bytes.subarray(0, 2));
      process.stderr.write(bytes.subarray(2));
    });
    expect(captured.stdout).toBe("界\n");
    expect(captured.stderr).toBe("界\n");
  });

  it("owns Buffer chunks rather than retaining mutable caller bytes", () => {
    const bytes = Buffer.from("original\n");
    const captured = captureOutput(() => {
      process.stdout.write(bytes);
      process.stderr.write(bytes);
      bytes.fill(0);
    });
    expect(captured.stdout).toBe("original\n");
    expect(captured.stderr).toBe("original\n");
  });

  it("restores both writers after success", () => {
    const stdout = process.stdout.write;
    const stderr = process.stderr.write;
    captureOutput(() => {
      process.stdout.write("captured\n");
      process.stderr.write("captured\n");
    });
    expect(process.stdout.write).toBe(stdout);
    expect(process.stderr.write).toBe(stderr);
  });

  it.each([new Error("original"), { sentinel: true }, "primitive", 7])(
    "preserves the original thrown value and restores writers: %s",
    (sentinel) => {
      const stdout = process.stdout.write;
      const stderr = process.stderr.write;
      let caught;
      try {
        captureOutput(() => {
          process.stdout.write("before failure\n");
          process.stderr.write("before failure\n");
          throw sentinel;
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBe(sentinel);
      expect(process.stdout.write).toBe(stdout);
      expect(process.stderr.write).toBe(stderr);
    },
  );

  it("captures native stderr while preserving successful child stdout", () => {
    const captured = captureOutput(() =>
      execFileSync(
        process.execPath,
        [
          "-e",
          'process.stdout.write("result\\n"); process.stderr.write("diagnostic\\n")',
        ],
        { encoding: "utf8" },
      ),
    );
    expect(captured.value).toBe("result\n");
    expect(captured.stdout).toBe("");
    expect(captured.stderr).toBe("diagnostic\n");
  });

  it("captures a native failure diagnostic without altering its error fields", () => {
    const captured = captureOutput(() => {
      try {
        execFileSync(
          process.execPath,
          [
            "-e",
            'process.stdout.write("partial\\n"); process.stderr.write("failed\\n"); process.exit(7)',
          ],
          { encoding: "utf8" },
        );
      } catch (error) {
        return error;
      }
      throw new Error("Expected a nonzero child");
    });
    expect(captured.value.status).toBe(7);
    expect(captured.value.stdout).toBe("partial\n");
    expect(captured.value.stderr).toBe("failed\n");
    expect(captured.stdout).toBe("");
    expect(captured.stderr).toBe("failed\n");
  });
});
