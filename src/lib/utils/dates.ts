import { TIME } from "#lib/const/time.const.js";

const add_ms = (ms: number, dt = new Date()) => new Date(dt.getTime() + ms);
const add_days = (days: number, dt = new Date()) => add_ms(days * TIME.DAY, dt);

const to_start_of_day = (dt: Date, utc = false) => {
  const start = new Date(dt);
  if (utc) {
    start.setUTCHours(0, 0, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }
  return start;
};

const to_end_of_day = (dt: Date, utc = false) => {
  const end = new Date(dt);
  if (utc) {
    end.setUTCHours(23, 59, 59, 999);
  } else {
    end.setHours(23, 59, 59, 999);
  }
  return end;
};

/**
 * Check if two dates are on the same calendar day
 */
const is_same_day = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Get the start of the month for a given date
 */
const to_start_of_month = (date: Date): Date => {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
};

/**
 * Get the end of the month for a given date
 */
const to_end_of_month = (date: Date): Date => {
  const end = new Date(date);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Convert date to local time string (HH:MM format)
 */
const to_local_time = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const Dates = {
  add_ms,
  add_days,

  to_start_of_day,
  to_end_of_day,
  is_same_day,
  to_start_of_month,
  to_end_of_month,
  to_local_time,
};
