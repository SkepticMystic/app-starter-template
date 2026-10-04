import { getRequestEvent } from "$app/server";
import { describe, expect, it, vi } from "vite-plus/test";
import { AdapterService } from "./adapter.service.js";

// Not `with_request`, which builds no `getClientAddress`.
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

  it("stands aside rather than throw when the runtime's headers are immutable", () => {
    // `Response.redirect` hands back headers with the fetch spec's `immutable`
    // guard, as a runtime that passes its own `Request` through may.
    const headers = Response.redirect("http://localhost/").headers;
    expect(() => headers.delete(header)).toThrow(TypeError);

    const e = {
      getClientAddress: () => "203.0.113.7",
      request: { headers } as Request,
    };

    expect(() => AdapterService.pin_client_ip(e)).not.toThrow();
    expect(headers.has(header)).toBe(false);
  });
});

describe("AdapterService.get_geo", () => {
  it("reads Vercel's headers, decoding the city", () => {
    mock_event({
      headers: {
        "x-vercel-ip-country": "ZA",
        "x-vercel-ip-country-region": "WC",
        "x-vercel-ip-city": "Cape%20Town",
      },
    });

    expect(AdapterService.get_geo()).toEqual({
      country: "ZA",
      region: "WC",
      city: "Cape Town",
    });
  });

  it("falls back to Cloudflare's country", () => {
    mock_event({ headers: { "cf-ipcountry": "ZA" } });

    expect(AdapterService.get_geo().country).toBe("ZA");
  });

  it("treats the unknown-country sentinels as absent", () => {
    mock_event({ headers: { "cf-ipcountry": "XX" } });
    expect(AdapterService.get_geo().country).toBeUndefined();

    mock_event({ headers: { "cf-ipcountry": "T1" } });
    expect(AdapterService.get_geo().country).toBeUndefined();
  });

  // Off Vercel and Cloudflare; a throw would fail sign-in over a label.
  it("is empty when no edge placed the request", () => {
    mock_event({});

    expect(AdapterService.get_geo()).toEqual({
      country: undefined,
      region: undefined,
      city: undefined,
    });
  });
});
