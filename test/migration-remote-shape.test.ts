// D1's remote executor splits a migration into statements and ends a trigger
// at the first line ending in END and a semicolon. A CASE expression closed
// that way inside a trigger body is cut there, and the whole migration fails
// with "incomplete input" — on deploy only, since the local test pool applies
// migrations by another route. 0.32.0 shipped 0024 that way (session 37).
import { describe, expect, it } from "vitest";

const migrations = import.meta.glob("../migrations/*.sql", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

describe("migrations survive D1's remote statement splitter", () => {
  it("found the migrations", () => {
    expect(Object.keys(migrations).length).toBeGreaterThan(20);
  });

  for (const [path, sql] of Object.entries(migrations)) {
    it(`${path.split("/").pop()}: a trigger body ends at its own END only`, () => {
      const lines = sql.split("\n");
      let inTrigger = false;
      const early: string[] = [];
      for (const line of lines) {
        if (/^\s*CREATE\s+TRIGGER\b/i.test(line)) inTrigger = true;
        if (!inTrigger) continue;
        if (/^\s*END\s*;\s*$/i.test(line)) inTrigger = false;
        else if (/\bEND\s*;/i.test(line)) early.push(line.trim());
      }
      expect(early).toEqual([]);
    });
  }
});
