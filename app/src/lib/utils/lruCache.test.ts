import { describe, it, expect } from "vitest";
import { LruCache } from "./lruCache";

describe("get", () => {
  it("returns undefined for a missing key", () => {
    const cache = new LruCache<string, number>(3);
    expect(cache.get("x")).toBeUndefined();
  });

  it("returns the stored value", () => {
    const cache = new LruCache<string, number>(3);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("promotes the key so it is not the next eviction candidate", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // a moves to most recent — b becomes LRU
    cache.set("c", 3);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
  });
});

describe("set", () => {
  it("stores a new entry", () => {
    const cache = new LruCache<string, number>(3);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("overwrites an existing key", () => {
    const cache = new LruCache<string, number>(3);
    cache.set("a", 1);
    cache.set("a", 2);
    expect(cache.get("a")).toBe(2);
  });

  it("evicts the least recently used key when at capacity", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3); // a is LRU
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
    expect(cache.has("c")).toBe(true);
  });

  it("updating an existing key does not evict any entry", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("b", 99);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(true);
  });

  it("updating an existing key promotes it to most recent", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 99); // a was LRU, updating it should promote it
    cache.set("c", 3); // b should be evicted, not a
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
  });
});

describe("has", () => {
  it("returns false for a missing key", () => {
    const cache = new LruCache<string, number>(3);
    expect(cache.has("x")).toBe(false);
  });

  it("returns true for a stored key", () => {
    const cache = new LruCache<string, number>(3);
    cache.set("a", 1);
    expect(cache.has("a")).toBe(true);
  });
});

describe("delete", () => {
  it("removes a stored key", () => {
    const cache = new LruCache<string, number>(3);
    cache.set("a", 1);
    cache.delete("a");
    expect(cache.has("a")).toBe(false);
  });

  it("is a no-op for a missing key", () => {
    const cache = new LruCache<string, number>(3);
    expect(() => cache.delete("x")).not.toThrow();
  });
});

describe("clear", () => {
  it("removes all stored entries", () => {
    const cache = new LruCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(false);
  });
});
