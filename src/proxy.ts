/**
 * 没有提供真正的沙箱，因为所有 `Node` 是同文档的
 * 例如 `Node.ownerDocument` 就能访问到原始 `document` 对象
 */

const allowReadDocument = {
  // <gem-title>
  get title() {
    return document.title;
  },
  head: document.head,

  // lit-html
  createElement: document.createElement.bind(document),
  createComment: document.createComment.bind(document),
  createTextNode: document.createTextNode.bind(document),
  createTreeWalker: document.createTreeWalker.bind(document),
  importNode: document.importNode.bind(document),
};

const allowWriteDocument = {
  // <gem-title>
  title: true,
};

const proxyDocument = new Proxy(document, {
  get(_, prop) {
    return allowReadDocument[prop];
  },
  set(_, prop, value) {
    if (allowWriteDocument[prop]) {
      document[prop] = value;
    }
    return true;
  },
});

const allowReadWindow = {
  // common
  console,
  fetch,
  URL,
  URLSearchParams,
  navigator,
  // gem
  HTMLElement,
  customElements,
  CustomEvent,
  Node,
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  queueMicrotask: window.queueMicrotask.bind(window),
  location: window.location,
  __gemHistory: window.__gemHistory,
  __litHtml: window.__litHtml,
  addEventListener: (type, callback, options) => {
    window.addEventListener(type, callback, options);
  },
  // lit-html
  get litHtmlVersions() {
    return window.litHtmlVersions;
  },
};

const allowWriteWindow = {
  __gemHistory: true,
  __litHtml: true,
  litHtmlVersions: true,
};

const proxyWindow = new Proxy(window, {
  get(_, prop) {
    return allowReadWindow[prop];
  },
  set(_, prop, value) {
    if (allowWriteWindow[prop]) {
      window[prop] = value;
    }
    return true;
  },
});

export default {
  ...allowReadWindow,
  document: proxyDocument,
  window: proxyWindow,
};
