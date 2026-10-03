import { getRequestEvent } from "$app/server";
import { describe, expect, it, vi } from "vite-plus/test";
import { AdapterService } from "./adapter.service";

// Not `requestEventMocker`, which builds no `getClientAddress`.
const mock_event = (input: {
  client_address?: string;
  headers?: Record<string, string>;
}) => {
  vi.mocked(getRequestEvent).mockReturnValue({
    getClientAddress: () => input.client_address ?? "",
    request: { headers: new Headers(input.headers ?? {}) },
  } as unknown as ReturnType<typeof getRequestEvent>);
};

describe("AdapterService.get_ip", () => {
  it("prefers the adapter's own answer", () => {
    mock_event({
      client_address: "203.0.113.7",
      headers: { "x-forwarded-for": "198.51.100.1" },
    });

    expect(AdapterService.get_ip()).toBe("203.0.113.7");
  });

  it("falls back to forwarding headers when the adapter has no answer", () => {
    mock_event({ headers: { "cf-connecting-ip": "203.0.113.9" } });
    expect(AdapterService.get_ip()).toBe("203.0.113.9");

    mock_event({ headers: { "x-forwarded-for": "203.0.113.10, 70.41.3.18" } });
    expect(AdapterService.get_ip()).toBe("203.0.113.10");

    mock_event({ headers: { "x-real-ip": "203.0.113.11" } });
    expect(AdapterService.get_ip()).toBe("203.0.113.11");
  });

  it("is null when nothing identifies the caller", () => {
    mock_event({});

    expect(AdapterService.get_ip()).toBeNull();
  });
});

describe("AdapterService.pin_client_ip", () => {
  const header = AdapterService.CLIENT_IP_HEADER;

  const event = (client_address: () => string, sent?: string) => ({
    getClientAddress: client_address,
    request: new Request("http://localhost/", {
      headers: sent ? { [header]: sent } : {},
    }),
  });

  it("stamps the address SvelteKit resolved", () => {
    const e = event(() => "203.0.113.7");
    AdapterService.pin_client_ip(e);

    expect(e.request.headers.get(header)).toBe("203.0.113.7");
  });

  it("overwrites whatever the client sent", () => {
    const e = event(() => "203.0.113.7", "198.51.100.1");
    AdapterService.pin_client_ip(e);

    expect(e.request.headers.get(header)).toBe("203.0.113.7");
  });

  it("drops a client-sent value even when no address resolves", () => {
    const e = event(() => {
      throw new Error("no client during prerender");
    }, "198.51.100.1");
    AdapterService.pin_client_ip(e);

    expect(e.request.headers.has(header)).toBe(false);
  });
});
