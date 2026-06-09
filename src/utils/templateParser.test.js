import { describe, expect, it } from "vitest";
import { parseTemplate } from "./templateParser";

describe("template parser", () => {
  it("personalizes known variables and supplies safe fallbacks", () => {
    const result = parseTemplate(
      "Hi {{firstName}} from {{businessName}}. Meet {{myProductName}}.",
      { fullName: "Ava Stone" },
      { productName: "Qyrova" },
    );

    expect(result).toBe("Hi Ava from your business. Meet Qyrova.");
  });
});
