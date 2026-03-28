import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WarningBanner } from "../components/WarningBanner";

describe("WarningBanner (UX-01)", () => {
  it("renders nothing when sourcesFailed is empty", () => {
    const { container } = render(
      <WarningBanner sourcesFailed={[]} warnings={[]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders unavailable count when sources failed", () => {
    render(
      <WarningBanner sourcesFailed={["DIAMM", "MMMO"]} warnings={[]} />,
    );
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/2 sources unavailable/)).toBeDefined();
  });

  it("renders warning messages as list items", () => {
    render(
      <WarningBanner
        sourcesFailed={["DIAMM"]}
        warnings={["DIAMM: credentials not configured"]}
      />,
    );
    expect(
      screen.getByText("DIAMM: credentials not configured"),
    ).toBeDefined();
  });
});
