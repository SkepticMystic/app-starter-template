import { TIME } from "$lib/const/time.const";

const add_ms = (ms: number, dt = new Date()) => new Date(dt.getTime() + ms);
const add_days = (days: number, dt = new Date()) => add_ms(days * TIME.DAY, dt);

const to_start_of_day = (dt: Date) => {
  const start = new Date(dt);
  start.setHours(0, 0, 0, 0);
  return start;
};
const to_end_of_day = (dt: Date) => {
  const end = new Date(dt);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const Dates = {
  add_ms,
  add_days,

  to_start_of_day,
  to_end_of_day,
};
