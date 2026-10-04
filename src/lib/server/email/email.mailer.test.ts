import { EmailService } from "#lib/server/services/email.service.js";
import { describe, expect, it } from "vite-plus/test";
import { EMAIL_FIXTURES } from "./email.fixtures.js";
import { Mailer } from "./email.mailer.js";
import { EMAIL_TYPES } from "./email.registry.js";

const decode_amp = (value: string) => value.replaceAll("&amp;", "&");

describe("Mailer.render, for every template", () => {
  it.each(EMAIL_TYPES)("%s renders a whole, tagged message", async (type) => {
    const email = await Mailer.render(type, EMAIL_FIXTURES[type]);

    expect(email.html.startsWith("<!doctype html>")).toBe(true);
    // Svelte's hydration markers included.
    expect(email.html).not.toContain("<!--");

    expect(email.subject).toMatch(/^\S[^\n]*\S$/);
    expect(email.preheader.length).toBeGreaterThan(0);
    expect(email.text.length).toBeGreaterThan(0);

    expect(email.email_type).toBe(type);
    expect(email.tags).toEqual([
      { name: "type", value: type },
      { name: "env", value: "test" },
    ]);
    expect(email.idempotency_key).toMatch(
      new RegExp(String.raw`^${type}/[\da-f]{64}$`),
    );
  });

  it.each(EMAIL_TYPES)("%s links only to absolute URLs", async (type) => {
    const email = await Mailer.render(type, EMAIL_FIXTURES[type]);
    const hrefs = [...email.html.matchAll(/href="([^"]*)"/g)].map(
      ([, href]) => href,
    );

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^https?:\/\//);
  });

  it.each(EMAIL_TYPES)(
    "%s puts each button's URL in the plain text",
    async (type) => {
      const email = await Mailer.render(type, EMAIL_FIXTURES[type]);
      const buttons = [
        ...email.html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*\bdata-button\b/g),
      ].map(([, href = ""]) => decode_amp(href));

      expect(buttons.filter((href) => !email.text.includes(href))).toEqual([]);
    },
  );
});

describe("Mailer.render", () => {
  const reset = EMAIL_FIXTURES["password-reset"];

  it("escapes what a user typed, and the plain text shows it as typed", async () => {
    const name = "<img src=x onerror=alert(1)> Tom & Jerry";

    const email = await Mailer.render("password-reset", {
      ...reset,
      user: { ...reset.user, name },
    });

    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("Tom &amp; Jerry");
    expect(email.text).toContain(`Hi ${name},`);
  });

  it("greets a nameless user without a dangling space", async () => {
    const email = await Mailer.render("password-reset", {
      ...reset,
      user: { ...reset.user, name: "  " },
    });

    expect(email.text).toMatch(/^Hi,$/m);
  });

  it("keeps the preheader out of the body text", async () => {
    const email = await Mailer.render("password-reset", reset);

    expect(email.html).toContain(email.preheader);
    expect(email.text).not.toContain(email.preheader);
  });

  it("keys the same message alike and a different link apart", async () => {
    const a = await Mailer.render("password-reset", reset);
    const b = await Mailer.render("password-reset", reset);
    const c = await Mailer.render("password-reset", {
      ...reset,
      url: `${reset.url}x`,
    });

    expect(b.idempotency_key).toBe(a.idempotency_key);
    expect(c.idempotency_key).not.toBe(a.idempotency_key);
  });

  it("lets the admin reply to whoever wrote in, with their line breaks kept", async () => {
    const email = await Mailer.render("admin-contact-form", {
      name: "Grace\r\nHopper",
      email: "grace@example.com",
      message: "one\ntwo <b>three</b>",
    });

    expect(email.reply_to).toBe("grace@example.com");
    expect(email.subject).toBe("Contact form: Grace Hopper");
    expect(email.html).not.toContain("<b>");
    expect(email.text).toContain("one\ntwo <b>three</b>");
  });

  it("leaves out the details an event has no value for", async () => {
    const email = await Mailer.render("security-alert", {
      ...EMAIL_FIXTURES["security-alert"],
      device: null,
      location: null,
    });

    expect(email.text).toContain("When: ");
    expect(email.text).not.toContain("Device:");
    expect(email.text).not.toContain("Location:");
  });
});

describe("Mailer.send", () => {
  it("hands the rendered message to EmailService", async () => {
    const res = await Mailer.send(
      "user-deleted",
      EMAIL_FIXTURES["user-deleted"],
    );

    expect(res.ok).toBe(true);
    expect(EmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@example.com",
        email_type: "user-deleted",
      }),
    );
  });

  it("answers a 500 rather than throwing when a template does", async () => {
    const res = await Mailer.send("user-deleted", { user: undefined as never });

    expect(res).toMatchObject({ ok: false, error: { status: 500 } });
    expect(EmailService.send).not.toHaveBeenCalled();
  });
});
