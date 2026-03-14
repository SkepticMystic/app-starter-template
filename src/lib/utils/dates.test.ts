import { describe, it, expect } from "vitest";
import { Dates } from "./dates";

describe("Dates", () => {
  describe("is_same_day", () => {
    it("should return true for same day", () => {
      const date1 = new Date("2024-03-15T10:00:00");
      const date2 = new Date("2024-03-15T18:00:00");
      expect(Dates.is_same_day(date1, date2)).toBe(true);
    });

    it("should return false for different days", () => {
      const date1 = new Date("2024-03-15T10:00:00");
      const date2 = new Date("2024-03-16T10:00:00");
      expect(Dates.is_same_day(date1, date2)).toBe(false);
    });
  });

  describe("to_start_of_month", () => {
    it("should return start of month", () => {
      const date = new Date("2024-03-15T10:00:00");
      const start = Dates.to_start_of_month(date);
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    });
  });

  describe("to_end_of_month", () => {
    it("should return end of month", () => {
      const date = new Date("2024-03-15T10:00:00");
      const end = Dates.to_end_of_month(date);
      expect(end.getDate()).toBe(31);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });
  });

  describe("to_datetime_local_string", () => {
    it("should format date for datetime-local input", () => {
      const date = new Date("2024-03-15T14:30:00");
      const formatted = Dates.to_datetime_local_string(date);
      expect(formatted).toBe("2024-03-15T14:30");
    });

    it("should pad single digits", () => {
      const date = new Date("2024-01-05T09:05:00");
      const formatted = Dates.to_datetime_local_string(date);
      expect(formatted).toBe("2024-01-05T09:05");
    });
  });
});
