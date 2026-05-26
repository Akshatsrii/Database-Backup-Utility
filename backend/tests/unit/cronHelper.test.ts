import {
  frequencyToCron,
  getNextRunTime,
  cronToLabel,
} from "../../src/utils/cronHelper";

describe("cronHelper", () => {
  describe("frequencyToCron", () => {
    it("hourly  → 0 * * * *",  () => expect(frequencyToCron("hourly")).toBe("0 * * * *"));
    it("daily   → 0 0 * * *",  () => expect(frequencyToCron("daily")).toBe("0 0 * * *"));
    it("weekly  → 0 0 * * 0",  () => expect(frequencyToCron("weekly")).toBe("0 0 * * 0"));
    it("monthly → 0 0 1 * *",  () => expect(frequencyToCron("monthly")).toBe("0 0 1 * *"));
  });

  describe("getNextRunTime", () => {
    it("should return a future Date", () => {
      const next = getNextRunTime("0 0 * * *");
      expect(next.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("cronToLabel", () => {
    it("should return readable label", () => {
      expect(cronToLabel("0 0 * * *")).toBe("Daily at midnight");
      expect(cronToLabel("0 * * * *")).toBe("Every hour");
    });
  });
});