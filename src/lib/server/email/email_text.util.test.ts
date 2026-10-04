import { describe, expect, it } from "vite-plus/test";
import { EmailText } from "./email_text.util.js";

describe("EmailText.from_html", () => {
  it("gives a button its own 'Label: url' line and keeps an inline link in its sentence", () => {
    const html =
      '<p>Read <a href="https://x.test/a?b=1&amp;c=2" style="color:red">the docs</a> first.</p>' +
      '<table><tbody><tr><td><a href="https://x.test/go" target="_blank" data-button="">Go</a></td></tr></tbody></table>';

    expect(EmailText.from_html(html)).toBe(
      "Read the docs (https://x.test/a?b=1&c=2) first.\n\nGo: https://x.test/go",
    );
  });

  it("writes a link whose label is its URL once", () => {
    expect(
      EmailText.from_html('<p><a href="https://x.test">https://x.test</a></p>'),
    ).toBe("https://x.test");
  });

  it("reads source whitespace as HTML does, and paragraphs and <br> as line breaks", () => {
    expect(
      EmailText.from_html("<p>one\n    two<br />three</p>\n<p>four</p>"),
    ).toBe("one two\nthree\n\nfour");
  });

  it("reads a details row as 'Label: value'", () => {
    const html =
      '<table><tbody><tr><td data-label="">When</td><td>Today</td></tr>' +
      '<tr><td data-label="">From</td><td>Here</td></tr></tbody></table>';

    expect(EmailText.from_html(html)).toBe("When: Today\nFrom: Here");
  });

  it("drops a data-text-skip element and every comment", () => {
    const html =
      '<!--[--><p data-text-skip="">Paste <a href="https://x.test">https://x.test</a></p><p>kept</p><!--]-->';

    expect(EmailText.from_html(html)).toBe("kept");
  });

  it("decodes entities only after stripping tags, so escaped markup reads as text", () => {
    expect(
      EmailText.from_html(
        "<p>&lt;b>Tom &amp; Jerry&#39;s &#x2014; &quot;x&quot;</p>",
      ),
    ).toBe(`<b>Tom & Jerry's — "x"`);
  });
});
