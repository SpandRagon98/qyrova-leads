import { describe, expect, it } from "vitest";
import { calculateLeadScore, getLeadTemperature } from "./leadScoring";

describe("lead scoring", () => {
  it("rewards strong Qyrova buying signals", () => {
    const score = calculateLeadScore(
      {
        email: "owner@example.com",
        linkedinUrl: "https://linkedin.com/in/owner",
        websiteUrl: "https://example.com",
        role: "Founder and Consultant",
        industry: "Marketing",
        businessType: "Consultant",
        country: "India",
        painPoint: "Manual quotation and invoice workflow",
      },
      ["India"],
    );

    expect(score).toBe(100);
    expect(getLeadTemperature(score)).toBe("Hot");
  });

  it("penalizes leads without contact information", () => {
    expect(calculateLeadScore({ role: "Assistant" })).toBe(0);
    expect(getLeadTemperature(0)).toBe("Cold");
  });
});
