import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWithRetry, createRateLimiter } from "./http-client.js";

describe("createRateLimiter", () => {
  it("returns a Bottleneck instance with configured maxConcurrent and minTime", () => {
    const limiter = createRateLimiter({ maxConcurrent: 2, minTime: 500 });
    expect(limiter).toBeDefined();
    // Bottleneck instances have a schedule method
    expect(typeof limiter.schedule).toBe("function");
  });
});

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on 200", async () => {
    const mockData = { chants: [{ id: 1 }] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockData)),
      }),
    );

    const result = await fetchWithRetry("https://example.com/api");
    expect(result).toEqual(mockData);
  });

  it("strips BOM from JSON responses", async () => {
    const mockData = { name: "test" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve("\uFEFF" + JSON.stringify(mockData)),
      }),
    );

    const result = await fetchWithRetry("https://example.com/api");
    expect(result).toEqual(mockData);
  });

  it("retries on 500 status", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server Error"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"ok": true}'),
      });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchWithRetry("https://example.com/api", {
      retries: 3,
    });
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 404", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not Found"),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      fetchWithRetry("https://example.com/api", { retries: 3 }),
    ).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
