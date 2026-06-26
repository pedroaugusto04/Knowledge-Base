import { DOMParser, DOMImplementation } from '@xmldom/xmldom';

if (typeof globalThis.DOMParser === 'undefined' || (globalThis.DOMParser as any).__isShim !== true) {
  const OriginalDOMParser = DOMParser;
  class ShimmedDOMParser extends OriginalDOMParser {
    static __isShim = true;
    parseFromString(source: string, mimeType: string) {
      if (!source || source.trim() === '') {
        return super.parseFromString('<html />', 'text/xml');
      }
      const targetMime = mimeType === 'text/html' ? 'text/xml' : mimeType;
      return super.parseFromString(source, targetMime);
    }
  }
  globalThis.DOMParser = ShimmedDOMParser as any;
}

if (typeof globalThis.document === 'undefined') {
  const shimDoc = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null) as any;

  // Turndown's shouldUseActiveX() probe calls:
  //   document.implementation.createHTMLDocument("").open()
  // @xmldom/xmldom documents don't have .open()/.write()/.close(), so we
  // patch the DOMImplementation to return documents with those no-ops.
  // The probe only enables ActiveX if window.ActiveXObject exists (it never
  // does in a service worker), so a no-op is semantically correct.
  const originalCreateHTMLDocument = shimDoc.implementation.createHTMLDocument?.bind(shimDoc.implementation);
  if (originalCreateHTMLDocument) {
    shimDoc.implementation.createHTMLDocument = (title?: string) => {
      const doc = originalCreateHTMLDocument(title ?? '') as any;
      if (typeof doc.open !== 'function') {
        doc.open = () => doc;
        doc.write = () => {};
        doc.close = () => {};
      }
      return doc;
    };
  }

  globalThis.document = shimDoc;
}
