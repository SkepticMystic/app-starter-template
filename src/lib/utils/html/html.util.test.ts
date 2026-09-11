import { describe, expect, it } from "vite-plus/test";
import { HTMLUtil } from "./html.util";

describe("HTMLUtil.escape", () => {
  it("escapes the five markup characters", () => {
    expect(HTMLUtil.escape(`<b>&"'`)).toBe("&lt;b&gt;&amp;&quot;&#39;");
  });

  it("leaves ordinary text alone", () => {
    expect(HTMLUtil.escape("Ross K")).toBe("Ross K");
  });
});

describe("HTMLUtil.html", () => {
  it("escapes an interpolated value rather than rendering it as markup", () => {
    const name = "<b>bold</b>";

    expect(HTMLUtil.html`<p>Hi ${name}</p>`).toBe(
      "<p>Hi &lt;b&gt;bold&lt;/b&gt;</p>",
    );
  });

  it("keeps an ampersand in a legitimate name intact when rendered", () => {
    // `sanitize` used to rewrite this; escaping round-trips it.
    expect(HTMLUtil.html`<p>${"Ben & Jerry"}</p>`).toBe(
      "<p>Ben &amp; Jerry</p>",
    );
  });

  it("does not escape the literal parts of the template", () => {
    expect(HTMLUtil.html`<a href="/x">go</a>`).toBe('<a href="/x">go</a>');
  });

  it("closes the attribute-injection route", () => {
    const url = `" onmouseover="alert(1)`;

    expect(HTMLUtil.html`<a href="${url}">x</a>`).toBe(
      '<a href="&quot; onmouseover=&quot;alert(1)">x</a>',
    );
  });

  it("leaves a raw() value unescaped", () => {
    const sig = HTMLUtil.raw("<p>Regards</p>");

    expect(HTMLUtil.html`<div>${sig}</div>`).toBe("<div><p>Regards</p></div>");
  });

  it("handles several substitutions in order", () => {
    expect(HTMLUtil.html`${"a"}-${"<b>"}-${"c"}`).toBe("a-&lt;b&gt;-c");
  });
});
