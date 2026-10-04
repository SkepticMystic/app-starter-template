import { describe, expect, it } from "vite-plus/test";
import {
  check_url,
  check_url_shape,
  is_blocked_address,
  is_blocked_hostname,
  type Lookup,
} from "./url.util.js";

const lookup_to =
  (...addresses: string[]): Lookup =>
  async () =>
    addresses.map((address) => ({
      address,
      family: address.includes(":") ? 6 : 4,
    }));

const PUBLIC = lookup_to("93.184.216.34");

describe("is_blocked_address", () => {
  describe("IPv4", () => {
    it.each([
      ["loopback", "127.0.0.1"],
      ["loopback, other host", "127.1.2.3"],
      ["this network", "0.0.0.0"],
      ["private 10/8", "10.0.0.1"],
      ["private 172.16/12 low", "172.16.0.1"],
      ["private 172.16/12 high", "172.31.255.254"],
      ["private 192.168/16", "192.168.1.1"],
      ["link-local", "169.254.1.1"],
      ["instance metadata", "169.254.169.254"],
      ["carrier-grade NAT", "100.64.0.1"],
      ["IETF protocol assignments", "192.0.0.1"],
      ["benchmarking", "198.19.0.1"],
      ["multicast", "224.0.0.1"],
      ["broadcast", "255.255.255.255"],
      ["TEST-NET-1", "192.0.2.1"],
      ["TEST-NET-2", "198.51.100.1"],
      ["TEST-NET-3", "203.0.113.1"],
      ["6to4 relay anycast", "192.88.99.1"],
    ])("blocks %s", (_label, address) => {
      expect(is_blocked_address(address)).toBe(true);
    });

    it.each([
      ["a public address", "93.184.216.34"],
      // Neighbours of the private ranges, which a string-prefix check gets wrong.
      ["172.15.x, just below the private range", "172.15.255.255"],
      ["172.32.x, just above it", "172.32.0.1"],
      ["11.x, just above 10/8", "11.0.0.1"],
      ["100.63.x, just below CGNAT", "100.63.255.255"],
      ["100.128.x, just above CGNAT", "100.128.0.1"],
      ["169.253.x, just below link-local", "169.253.0.1"],
      ["192.167.x, just below 192.168/16", "192.167.255.255"],
      ["223.x, just below multicast", "223.255.255.255"],
    ])("allows %s", (_label, address) => {
      expect(is_blocked_address(address)).toBe(false);
    });

    it("blocks an octal-looking octet rather than guessing", () => {
      // `010` is octal to some resolvers and decimal to others.
      expect(is_blocked_address("010.0.0.1")).toBe(true);
    });

    it.each([
      ["short form", "127.1"],
      ["hex", "0x7f.0.0.1"],
      ["out of range", "256.1.1.1"],
      ["empty", ""],
      ["not an address", "example.com"],
    ])("blocks an unparseable address (%s)", (_label, address) => {
      expect(is_blocked_address(address)).toBe(true);
    });
  });

  describe("IPv6", () => {
    it.each([
      ["loopback", "::1"],
      ["unspecified", "::"],
      ["unique local", "fc00::1"],
      ["unique local, fd prefix", "fd12:3456::1"],
      ["link-local", "fe80::1"],
      ["link-local with a zone id", "fe80::1%eth0"],
      ["multicast", "ff02::1"],
      ["NAT64", "64:ff9b::1"],
      ["NAT64, RFC8215 prefix", "64:ff9b:1::1"],
      ["6to4 wrapping the metadata address", "2002:a9fe:a9fe::"],
      ["Teredo", "2001:0:1234::1"],
      ["deprecated site-local", "fec0::1"],
      ["discard-only", "100::1"],
    ])("blocks %s", (_label, address) => {
      expect(is_blocked_address(address)).toBe(true);
    });

    it.each([
      ["v4-mapped loopback", "::ffff:127.0.0.1"],
      ["v4-mapped metadata", "::ffff:169.254.169.254"],
      ["v4-mapped private", "::ffff:10.1.2.3"],
    ])("unwraps and blocks %s", (_label, address) => {
      expect(is_blocked_address(address)).toBe(true);
    });

    it("allows a public v6 address", () => {
      expect(is_blocked_address("2606:2800:220:1:248:1893:25c8:1946")).toBe(
        false,
      );
    });

    it("allows a v4-mapped public address", () => {
      expect(is_blocked_address("::ffff:93.184.216.34")).toBe(false);
    });

    it("blocks a malformed v6 address", () => {
      expect(is_blocked_address("::ffff::1")).toBe(true);
    });

    it("blocks an octal-looking embedded v4 tail", () => {
      // ipaddr.js's v6 parser reads this tail as decimal, its v4 parser as octal. Refused.
      expect(is_blocked_address("::ffff:010.0.0.1")).toBe(true);
    });

    it("blocks a v6 address whose embedded tail is not an address", () => {
      expect(is_blocked_address("::ffff:1.2.3")).toBe(true);
    });
  });
});

describe("is_blocked_hostname", () => {
  it.each([
    "localhost",
    "LOCALHOST",
    "localhost.",
    "api.localhost",
    "db.local",
    "metadata.internal",
    "postgres.cluster.local",
    "redis.svc",
  ])("blocks %s", (hostname) => {
    expect(is_blocked_hostname(hostname)).toBe(true);
  });

  it.each(["example.com", "hooks.acme.co.za", "notlocalhost.com"])(
    "allows %s",
    (hostname) => {
      expect(is_blocked_hostname(hostname)).toBe(false);
    },
  );
});

describe("check_url_shape", () => {
  it("accepts an https URL", () => {
    const res = check_url_shape("https://hooks.acme.co.za/events", {
      allow_http: false,
    });

    expect(res.ok).toBe(true);
  });

  it("rejects http when it is not allowed", () => {
    const res = check_url_shape("http://hooks.acme.co.za", {
      allow_http: false,
    });

    expect([res.ok, !res.ok && res.error.message]).toEqual([
      false,
      "URL must use https",
    ]);
  });

  it("allows http when asked, so a local endpoint is testable", () => {
    const res = check_url_shape("http://hooks.acme.co.za", {
      allow_http: true,
    });

    expect(res.ok).toBe(true);
  });

  it.each([
    ["a file URL", "file:///etc/passwd"],
    ["a gopher URL", "gopher://example.com"],
    ["a data URL", "data:text/plain,hi"],
  ])("rejects %s", (_label, raw) => {
    expect(check_url_shape(raw, { allow_http: true }).ok).toBe(false);
  });

  it("rejects credentials in the URL", () => {
    const res = check_url_shape("https://user:pass@hooks.acme.co.za", {
      allow_http: false,
    });

    expect([res.ok, !res.ok && res.error.message]).toEqual([
      false,
      "URL must not contain credentials",
    ]);
  });

  it("rejects a blocked hostname before resolving anything", () => {
    expect(
      check_url_shape("https://localhost/x", { allow_http: false }).ok,
    ).toBe(false);
  });

  it("rejects an over-long URL", () => {
    const raw = `https://acme.co.za/${"x".repeat(2100)}`;

    const res = check_url_shape(raw, { allow_http: false });

    expect([res.ok, !res.ok && res.error.message]).toEqual([
      false,
      "URL is too long",
    ]);
  });

  it("rejects nonsense", () => {
    const res = check_url_shape("not a url", { allow_http: true });

    expect([res.ok, !res.ok && res.error.message]).toEqual([
      false,
      "Not a valid URL",
    ]);
  });

  it("keeps the path and query", () => {
    const res = check_url_shape("https://acme.co.za/hook?tenant=7", {
      allow_http: false,
    });

    expect(res.ok && res.data.url.href).toBe(
      "https://acme.co.za/hook?tenant=7",
    );
  });
});

describe("check_url", () => {
  it("allows a hostname resolving to a public address", async () => {
    const res = await check_url("https://hooks.acme.co.za", {
      allow_http: false,
      lookup: PUBLIC,
    });

    expect(res.ok && res.data).toEqual({
      url: new URL("https://hooks.acme.co.za"),
      addresses: ["93.184.216.34"],
    });
  });

  it("refuses a hostname that resolves to a private address", async () => {
    // The name is public, the record is not.
    const res = await check_url("https://evil.acme.co.za", {
      allow_http: false,
      lookup: lookup_to("10.0.0.5"),
    });

    expect([res.ok, !res.ok && res.error.message]).toEqual([
      false,
      "URL host resolves to an address that is not publicly routable",
    ]);
  });

  it("refuses when only one of several records is private", async () => {
    const res = await check_url("https://mixed.acme.co.za", {
      allow_http: false,
      lookup: lookup_to("93.184.216.34", "169.254.169.254"),
    });

    expect(res.ok).toBe(false);
  });

  it("refuses when resolution fails", async () => {
    const res = await check_url("https://gone.acme.co.za", {
      allow_http: false,
      lookup: async () => {
        throw new Error("ENOTFOUND");
      },
    });

    expect([res.ok, !res.ok && res.error.message]).toEqual([
      false,
      "URL host could not be resolved",
    ]);
  });

  it("refuses when resolution returns nothing", async () => {
    const res = await check_url("https://empty.acme.co.za", {
      allow_http: false,
      lookup: async () => [],
    });

    expect(res.ok).toBe(false);
  });

  it("refuses a bad shape without resolving", async () => {
    let called = false;

    const res = await check_url("https://localhost", {
      allow_http: false,
      lookup: async () => {
        called = true;
        return [];
      },
    });

    expect([res.ok, called]).toEqual([false, false]);
  });

  it("refuses a literal private IP as the host", async () => {
    const res = await check_url("https://169.254.169.254/latest/meta-data/", {
      allow_http: true,
      // `dns.lookup` echoes an IP literal straight back.
      lookup: lookup_to("169.254.169.254"),
    });

    expect(res.ok).toBe(false);
  });

  // `dns.lookup` echoes a literal without touching the network.
  it("resolves with the system resolver when no lookup is given", async () => {
    const res = await check_url("https://127.0.0.1/", { allow_http: false });

    expect([res.ok, !res.ok && res.error.message]).toEqual([
      false,
      "URL host resolves to an address that is not publicly routable",
    ]);
  });
});
