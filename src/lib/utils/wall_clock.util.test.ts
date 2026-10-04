import { describe, expect, it } from "vite-plus/test";
import { TaskSchema } from "#lib/server/db/models/task.model.js";
import { WallClock } from "./wall_clock.util.js";

/**
 * `Africa/Johannesburg` is UTC+2 with no DST. Expectations are literals rather than derived from
 * `TIME.ZONE`, so they cannot agree with a bug in the derivation.
 */
describe("WallClock.to_absolute_string", () => {
  it("reads a zoneless wall clock as SAST, not as the server's zone", () => {
    expect(WallClock.to_absolute_string("2026-09-01T16:00")).toBe(
      "2026-09-01T14:00:00.000Z",
    );
  });

  it("takes seconds when the input carries them", () => {
    expect(WallClock.to_absolute_string("2026-09-01T16:00:30")).toBe(
      "2026-09-01T14:00:30.000Z",
    );
  });

  it("trims, because a form field can post whitespace", () => {
    expect(WallClock.to_absolute_string("  2026-09-01T16:00  ")).toBe(
      "2026-09-01T14:00:00.000Z",
    );
  });

  it("leaves a value that already names an instant alone", () => {
    for (const already of [
      "2026-09-01T14:00:00.000Z",
      "2026-09-01T16:00:00+02:00",
      "2026-09-01T16:00Z",
    ]) {
      expect(WallClock.to_absolute_string(already)).toBe(already);
    }
  });

  it("hands anything it does not recognise straight back", () => {
    for (const junk of ["", "next tuesday", "2026-09-01", "16:00"]) {
      expect(WallClock.to_absolute_string(junk)).toBe(junk);
    }
  });

  it("hands back a date that is shaped right and does not exist", () => {
    expect(WallClock.to_absolute_string("2026-02-30T10:00")).toBe(
      "2026-02-30T10:00",
    );
  });
});

describe("WallClock.to_input_value", () => {
  it("renders an instant as the SAST wall clock that means it", () => {
    expect(WallClock.to_input_value(new Date("2026-09-01T14:00:00.000Z"))).toBe(
      "2026-09-01T16:00",
    );
  });

  it("round-trips with to_absolute_string", () => {
    const at = new Date("2026-09-01T14:00:00.000Z");

    expect(WallClock.to_absolute_string(WallClock.to_input_value(at))).toBe(
      at.toISOString(),
    );
  });

  it("keeps the SAST date when UTC has not got there yet", () => {
    expect(WallClock.to_input_value(new Date("2026-09-01T23:30:00.000Z"))).toBe(
      "2026-09-02T01:30",
    );
  });
});

const parse = (due_date: string) =>
  TaskSchema.insert.parse({ title: "Call back", status: "pending", due_date });

/** On the schema too: `z.coerce.date` alone reads a zoneless string in the server's zone. */
describe("TaskSchema.insert.due_date", () => {
  it("parses the form's datetime-local value in SAST", () => {
    expect(parse("2026-09-01T16:00").due_date?.toISOString()).toBe(
      "2026-09-01T14:00:00.000Z",
    );
  });

  it("still accepts an instant that carries its own offset", () => {
    expect(parse("2026-09-01T14:00:00.000Z").due_date?.toISOString()).toBe(
      "2026-09-01T14:00:00.000Z",
    );
  });

  it("reads an empty field as no time at all", () => {
    expect(parse("").due_date).toBeUndefined();
  });

  it("refuses junk with the field's own message", () => {
    expect(() => parse("next tuesday")).toThrow(/invalid date/i);
  });
});
