/**
 * 没有提供真正的沙箱，因为共享 DOM，例如:
 *
 * * `Node.ownerDocument` 就能访问到原始 `document` 对象
 * * <script> 能执行任意代码
 */
import { GemElement } from '@mantou/gem/lib/element';

function generateProxy(target: any, name: string, allowRead: object, allowWrite: object) {
  return new Proxy(target, {
    get(_, prop) {
      if (prop in allowRead) {
        return allowRead[prop];
      } else {
        console.warn(`Read forbidden property: \`${name}.${String(prop)}\``);
        return new Function();
      }
    },
    set(_, prop, value) {
      if (allowWrite[prop]) {
        target[prop] = value;
      } else {
        console.warn(`Write forbidden property: \`${name}.${String(prop)}\``);
      }
      return true;
    },
  });
}

export function setProxy(realm: any, rootElement: GemElement, doc?: Document) {
  const allowReadDocument = {
    // <gem-title>
    get title() {
      return document.title;
    },
    head: document.head,

    // <gem-use>
    querySelector: doc && doc.querySelector.bind(doc),
    querySelectorAll: doc && doc.querySelectorAll.bind(doc),

    // lit-html
    createElement: document.createElement.bind(document),
    createComment: document.createComment.bind(document),
    createTextNode: document.createTextNode.bind(document),
    createTreeWalker: document.createTreeWalker.bind(document),
    createDocumentFragment: document.createDocumentFragment.bind(document),
    adoptNode: document.adoptNode.bind(document),
    importNode: document.importNode.bind(document),

    // event
    addEventListener: (type, callback, options) => {
      if (['visibilitychange'].includes(type)) {
        document.addEventListener(type, callback, options);
        const unmounted = rootElement.unmounted;
        rootElement.unmounted = () => {
          unmounted && unmounted();
          document.removeEventListener(type, callback, options);
        };
      } else {
        // mouse event, pointer event, keyboard event...
        rootElement.addEventListener(type, callback, options);
      }
    },
    removeEventListener: (type, callback, options) => {
      rootElement.removeEventListener(type, callback, options);
    },
  };

  const allowWriteDocument = {
    // <gem-title>
    title: true,
  };

  const allowReadWindow = {
    // common
    get name() {
      return window.name;
    },
    console,
    Headers,
    Response,
    Request,
    fetch,
    XMLHttpRequest,
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
    localStorage,
    sessionStorage,
    history,
    __gemHistory: window.__gemHistory,
    __litHtml: window.__litHtml,
    addEventListener: (type, callback, options) => {
      if (['load', 'DOMContentLoaded'].includes(type)) {
        callback();
      } else if (['unload'].includes(type)) {
        window.addEventListener(type, callback, options);
        const unmounted = rootElement.unmounted;
        rootElement.unmounted = () => {
          unmounted && unmounted();
          window.removeEventListener(type, callback, options);
        };
      } else {
        // mouse event, pointer event, keyboard event...
        rootElement.addEventListener(type, callback, options);
      }
    },
    removeEventListener: (type, callback, options) => {
      rootElement.removeEventListener(type, callback, options);
    },
    // lit-html
    get litHtmlVersions() {
      return window.litHtmlVersions;
    },
  };

  const allowWriteWindow = {
    name: true,
    __gemHistory: true,
    __litHtml: true,
    litHtmlVersions: true,
  };

  Object.assign(realm.global, {
    ...allowReadWindow,
    document: generateProxy(document, 'document', allowReadDocument, allowWriteDocument),
    window: generateProxy(window, 'window', allowReadWindow, allowWriteWindow),
  });
}
