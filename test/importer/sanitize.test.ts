// §12/§3.3: fetched content_html must be sanitized before rendering.
import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "../../src/importer/sanitize.ts";

describe("sanitizeHtml()", () => {
  it("removes <script> tags and their content", async () => {
    const out = await sanitizeHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("<p>hi</p>");
  });

  it("strips inline event-handler attributes", async () => {
    const out = await sanitizeHtml('<img src="x.png" onerror="alert(1)">');
    expect(out).not.toContain("onerror");
    expect(out).toContain('src="x.png"');
  });

  it("strips javascript: URLs from href/src", async () => {
    const out = await sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("removes iframe/object/embed/form", async () => {
    const out = await sanitizeHtml('<iframe src="evil"></iframe><object></object><embed><form></form>');
    expect(out).not.toContain("<iframe");
    expect(out).not.toContain("<object");
    expect(out).not.toContain("<embed");
    expect(out).not.toContain("<form");
  });

  it("unwraps unlisted tags instead of deleting what they contain", async () => {
    const out = await sanitizeHtml('<figure><picture><source srcset="a.webp"><img src="https://x.test/a.png" alt="A"></picture></figure><p><font color="red">legacy text</font> <video src="https://x.test/v.mp4">fallback</video></p>');
    expect(out).toContain('<img src="https://x.test/a.png" alt="A">');
    expect(out).toContain("legacy text");
    expect(out).toContain("fallback");
    expect(out).not.toMatch(/<(picture|source|font|video)\b/);
  });

  it("drops raw-text and foreign elements whole, so unwrapping cannot revive markup", async () => {
    for (const tag of ["textarea", "title", "xmp", "noscript", "noembed", "noframes", "style", "template"]) {
      const out = await sanitizeHtml(`<p>ok</p><${tag}><img src=x onerror=alert(1)></${tag}>`);
      expect(out, tag).not.toContain("onerror");
      expect(out, tag).not.toContain(`<${tag}`);
    }
    for (const tag of ["svg", "math"]) {
      const out = await sanitizeHtml(`<${tag}><a href="javascript:alert(1)">x</a><style><img src=x onerror=alert(1)></style></${tag}>`);
      expect(out, tag).toBe("");
    }
  });

  it("leaves ordinary safe markup untouched", async () => {
    const out = await sanitizeHtml('<p>hello <strong>world</strong> <a href="https://example.com">link</a></p>');
    expect(out).toContain("<strong>world</strong>");
    expect(out).toContain('<a href="https://example.com">link</a>');
  });
});

// Partial transclusion (spec §16.4, plan §7.3 P6). The plan says "assert, not
// assume": the whole construct is invisible to a reader if the sanitizer eats
// either class or the data attributes, and allowlist-by-removal keeping them is
// a property of what is on the DISALLOWED list today, not a promise.
describe("a partial transclusion survives import intact", () => {
  it("keeps both classes and every data-blyg attribute", async () => {
    const baked =
      '<blockquote class="blyg-transclusion blyg-partial" data-blyg-id="7c9wk2mhq0v3xj8tn5rzfd41bg"' +
      ' data-blyg-version="3" data-blyg-origin="https://example.com/blyg/">\n' +
      "<p>Stigmergy is what a protocol looks like from inside.</p>\n</blockquote>";
    const out = await sanitizeHtml(baked);
    // blyg-partial is what tells a reader this is a part rather than the whole.
    // Losing it would render a passage as if it were the entire item.
    expect(out).toContain("blyg-transclusion");
    expect(out).toContain("blyg-partial");
    expect(out).toContain('data-blyg-id="7c9wk2mhq0v3xj8tn5rzfd41bg"');
    expect(out).toContain('data-blyg-version="3"');
    expect(out).toContain('data-blyg-origin="https://example.com/blyg/"');
    expect(out).toContain("Stigmergy is what a protocol looks like from inside.");
  });

  it("still strips a handler smuggled onto the same blockquote", async () => {
    const out = await sanitizeHtml(
      '<blockquote class="blyg-transclusion blyg-partial" onclick="alert(1)" data-blyg-id="x"><p>q</p></blockquote>',
    );
    expect(out).not.toContain("onclick");
    expect(out).toContain("blyg-partial");
  });
});
