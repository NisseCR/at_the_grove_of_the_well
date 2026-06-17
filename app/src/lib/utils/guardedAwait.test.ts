import { describe, it, expect, vi } from "vitest";
import { guardedAwait } from "./guardedAwait";

describe("guardedAwait", () => {
  it("resolves the promise value when the token is not aborted", async () => {
    const controller = new AbortController();
    const result = await guardedAwait(Promise.resolve(42), controller);
    expect(result).toBe(42);
  });

  it("throws an AbortError when the token is aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(guardedAwait(Promise.resolve(42), controller)).rejects.toThrow(
      expect.objectContaining({ name: "AbortError" }),
    );
  });

  it("calls onAbort before throwing when the token is aborted", async () => {
    const controller = new AbortController();
    const onAbort = vi.fn();
    controller.abort();
    await expect(
      guardedAwait(Promise.resolve(42), controller, onAbort),
    ).rejects.toThrow();
    expect(onAbort).toHaveBeenCalledOnce();
  });

  it("does not call onAbort when the token is not aborted", async () => {
    const controller = new AbortController();
    const onAbort = vi.fn();
    await guardedAwait(Promise.resolve(42), controller, onAbort);
    expect(onAbort).not.toHaveBeenCalled();
  });
});
