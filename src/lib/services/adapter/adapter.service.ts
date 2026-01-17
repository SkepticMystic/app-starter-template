import { getRequestEvent } from "$app/server";

const get_ip = () => {
  const event = getRequestEvent();

  return (
    event.getClientAddress() ||
    event.request.headers.get("cf-connecting-ip") ||
    event.request.headers.get("x-forwarded-for")?.split(",")[0] ||
    event.request.headers.get("x-real-ip") ||
    null
  );
};

const get_user_agent = () => {
  const event = getRequestEvent();

  return event.request.headers.get("user-agent") || null;
};

export const AdapterService = {
  get_ip,
  get_user_agent,
};
