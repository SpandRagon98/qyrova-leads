import { describe, expect, it } from "vitest";
import { findDuplicate, guessField, mapCsvRows } from "./csvImport";

describe("CSV import utilities", () => {
  it("guesses common column aliases", () => {
    expect(guessField("Company")).toBe("businessName");
    expect(guessField("LinkedIn Profile URL")).toBe("linkedinUrl");
  });

  it("maps records and detects normalized duplicates", () => {
    const [lead] = mapCsvRows(
      [{ Name: "Ava Stone", Website: "https://example.com/" }],
      { Name: "fullName", Website: "websiteUrl" },
    );

    expect(lead.firstName).toBe("Ava");
    expect(
      findDuplicate(
        [{ id: "existing", websiteUrl: "https://example.com" }],
        lead,
      )?.id,
    ).toBe("existing");
  });
});
