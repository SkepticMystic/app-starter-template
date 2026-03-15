import { getRequestEvent } from "$app/server";
import { geolocation } from "@vercel/functions";

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

const get_geo = () => {
  const event = getRequestEvent();

  const geo = geolocation(event.request);

  return geo;
};

const get_user_agent = () => {
  const event = getRequestEvent();

  return event.request.headers.get("user-agent") || null;
};

export const AdapterService = {
  get_ip,
  get_geo,
  get_user_agent,
};
