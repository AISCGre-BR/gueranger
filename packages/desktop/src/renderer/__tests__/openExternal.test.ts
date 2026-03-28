import { describe, it, expect } from "vitest";
import { isAllowedUrl } from "../lib/validate-url";

describe("isAllowedUrl (UX-02 protocol validation)", () => {
  it("allows https URLs", () => {
    expect(isAllowedUrl("https://cantusindex.org/id/001234")).toBe(true);
  });
  it("allows http URLs", () => {
    expect(isAllowedUrl("http://example.com/manuscript")).toBe(true);
  });
  it("rejects file:// URLs", () => {
    expect(isAllowedUrl("file:///etc/passwd")).toBe(false);
  });
  it("rejects javascript: URLs", () => {
    expect(isAllowedUrl("javascript:alert(1)")).toBe(false);
  });
  it("rejects data: URLs", () => {
    expect(isAllowedUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });
  it("rejects ftp: URLs", () => {
    expect(isAllowedUrl("ftp://example.com/file")).toBe(false);
  });
  it("rejects malformed URLs", () => {
    expect(isAllowedUrl("not-a-url")).toBe(false);
  });
  it("rejects empty string", () => {
    expect(isAllowedUrl("")).toBe(false);
  });
});
