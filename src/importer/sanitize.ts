// Publisher HTML is untrusted. Keep ordinary editorial HTML, not active or
// foreign documents. Raw rows remain unchanged; sanitize every receiving render.
import { decodeHTMLAttribute } from 'entities';

const TAGS = new Set('a abbr address article aside b bdi bdo blockquote br caption cite code col colgroup dd del details dfn div dl dt em figcaption figure footer h1 h2 h3 h4 h5 h6 header hr i img ins kbd li main mark nav ol p pre q rp rt ruby s samp section small span strong sub summary sup table tbody td th thead time tr u ul var wbr'.split(' '));
// Unlisted tags are unwrapped so their text and listed children survive
// (<picture> around an <img>, <font>, <video> fallback text). These are dropped
// whole instead: active or foreign content, and every raw-text or RCDATA
// element, whose content would turn into live markup if it were unwrapped.
const DROP = new Set('script style template noscript textarea title xmp plaintext listing noembed noframes iframe frame frameset object embed applet svg math select head base link meta form'.split(' '));
const ATTRIBUTES = new Set('alt class title width height colspan rowspan scope datetime open dir lang'.split(' '));

function safeUrl(raw: string, image: boolean) {
  // HTMLRewriter exposes encoded attribute bytes. Decode with an HTML attribute
  // parser before WHATWG URL normalization; checking literal spelling misses
  // entities and embedded tabs/newlines. Keep the original bytes after validation.
  try {
    const protocol = new URL(decodeHTMLAttribute(raw), 'https://import.invalid/').protocol;
    return (image ? ['https:', 'http:'] : ['https:', 'http:', 'mailto:', 'tel:']).includes(protocol);
  } catch { return false; }
}
export async function sanitizeHtml(html: string): Promise<string> {
  const rewriter = new HTMLRewriter().on('*', {
    element(el) {
      if (DROP.has(el.tagName)) { el.remove(); return; }
      if (!TAGS.has(el.tagName)) { el.removeAndKeepContent(); return; }
      for (const [name, value] of [...el.attributes]) {
        const key = name.toLowerCase();
        if (key === 'href' && el.tagName === 'a') {
          if (!safeUrl(value, false)) el.removeAttribute(name);
        } else if (key === 'src' && el.tagName === 'img') {
          if (!safeUrl(value, true)) el.removeAttribute(name);
        } else if (!ATTRIBUTES.has(key) && !key.startsWith('data-blyg-')) {
          // Exclude handlers, style, namespace URLs, animation, srcdoc and named
          // DOM properties rather than growing a list of known attack spellings.
          el.removeAttribute(name);
        }
      }
    },
  });
  return await rewriter.transform(new Response(html)).text();
}
