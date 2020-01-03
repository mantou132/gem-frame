/**
 * 没有提供真正的沙箱，因为共享 DOM，例如:
 *
 * * `Node.ownerDocument` 就能访问到原始 `document` 对象
 * * <script> 能执行任意代码
 */
import { GemElement } from '@mantou/gem/lib/element';

import GemFrame from './index';

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
        console.warn(`Write forbidden property: \`${name}.${String(prop)}\`, ${value}`);
      }
      return true;
    },
  });
}

export function setProxy(rootElement: GemElement, doc = new Document()) {
  const allowReadDocument = {
    // https://developer.mozilla.org/en-US/docs/Web/API/Document
    body: doc.body,
    documentElement: doc.documentElement,
    get cookie() {
      return document.cookie;
    },
    get hidden() {
      return document.hidden;
    },
    get domain() {
      return document.domain;
    },
    get referrer() {
      return document.referrer;
    },
    location,
    get getSelection() {
      return rootElement.shadowRoot.getSelection;
    },
    get elementFromPoint() {
      return rootElement.shadowRoot.elementFromPoint;
    },
    get elementsFromPoint() {
      return rootElement.shadowRoot.elementsFromPoint;
    },
    get caretRangeFromPoint() {
      return rootElement.shadowRoot.caretRangeFromPoint;
    },
    get caretPositionFromPoint() {
      return rootElement.shadowRoot.caretPositionFromPoint;
    },

    // <gem-title>
    get title() {
      return document.title;
    },
    head: document.head,

    // <gem-use>
    querySelector: doc.querySelector.bind(doc),
    querySelectorAll: doc.querySelectorAll.bind(doc),

    // lit-html
    // lit-html 创建的 script 解析在 template 中，不会执行
    createElement(tag: string) {
      if (tag === 'script') {
        // 用于 webpack 的动态模块
        const script = doc.createElement('script');
        Object.defineProperty(script, 'src', {
          set(value) {
            const gemframe = new GemFrame();
            gemframe.src = value;
            gemframe.fetchScript();
            return true;
          },
        });
        return script;
      }
      return document.createElement(tag);
    },
    createComment: document.createComment.bind(document),
    createTextNode: document.createTextNode.bind(document),
    createTreeWalker: document.createTreeWalker.bind(document),
    createDocumentFragment: document.createDocumentFragment.bind(document),
    adoptNode: document.adoptNode.bind(document),
    importNode: document.importNode.bind(document),

    // event
    addEventListener: <K extends keyof DocumentEventMap>(
      type: K,
      callback: any,
      options: boolean | AddEventListenerOptions,
    ) => {
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
    cookie: true,
    // <gem-title>
    title: true,
  };

  const allowReadWindow = {
    // webpack
    get webpackJsonp() {
      return window['webpackJsonp'];
    },
    // common
    get name() {
      return window.name;
    },
    console,
    caches,
    Headers,
    Response,
    Request,
    XMLHttpRequest,
    URL,
    URLSearchParams,
    navigator,
    devicePixelRatio,
    DOMMatrix,
    DOMMatrixReadOnly,
    DOMPoint,
    DOMPointReadOnly,
    DOMQuad,
    DOMRect,
    DOMRectReadOnly,
    get innerHeight() {
      return rootElement.clientHeight;
    },
    get innerWidth() {
      return rootElement.clientWidth;
    },
    isSecureContext,
    performance,
    screen,
    visualViewport: window['visualViewport'],
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope#Methods
    atob: atob.bind(window),
    btoa: btoa.bind(window),
    fetch: fetch.bind(window),
    createImageBitmap: createImageBitmap.bind(window),
    setTimeout: setTimeout.bind(window),
    clearTimeout: clearTimeout.bind(window),
    setInterval: setInterval.bind(window),
    clearInterval: clearInterval.bind(window),
    queueMicrotask: queueMicrotask.bind(window),
    // https://developer.mozilla.org/en-US/docs/Web/API/Window#Methods
    alert: alert.bind(window),
    confirm: confirm.bind(window),
    requestAnimationFrame: requestAnimationFrame.bind(window),
    cancelAnimationFrame: cancelAnimationFrame.bind(window),
    getComputedStyle: getComputedStyle.bind(window),
    getSelection: getSelection.bind(window),
    matchMedia: matchMedia.bind(window),
    open: open.bind(window),
    postMessage: (data: any) => {
      rootElement.dispatchEvent(new MessageEvent('message', { data }));
    },
    parent: {
      postMessage: (data: any) => {
        window.dispatchEvent(new MessageEvent('message', { data }));
      },
    },
    prompt: prompt.bind(window),
    // gem
    Image,
    DOMParser,
    HTMLElement,
    customElements,
    CustomEvent,
    Node,
    location,
    localStorage,
    sessionStorage,
    history,
    __gemHistory: window.__gemHistory,
    __litHtml: window.__litHtml,
    addEventListener: <K extends keyof WindowEventMap>(
      type: K,
      callback: any,
      options: boolean | AddEventListenerOptions,
    ) => {
      if (['load', 'DOMContentLoaded'].includes(type)) {
        callback(new CustomEvent(type));
      } else if (['resize'].includes(type)) {
        // 未考虑 `removeEventListener`
        if (window.ResizeObserver) {
          let called = false; // `observe` 会立刻调用回调
          const resizeObserver = new ResizeObserver(() => {
            if (called) {
              callback(new CustomEvent(type));
            }
            called = true;
          });
          resizeObserver.observe(rootElement);
        }
      } else if (['unload', 'beforeunload'].includes(type)) {
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
    webpackJsonp: true,
    name: true,
    __gemHistory: true,
    __litHtml: true,
    litHtmlVersions: true,
  };

  const global = generateProxy(window, 'window', allowReadWindow, allowWriteWindow);
  return Object.assign(allowReadWindow, {
    document: generateProxy(document, 'document', allowReadDocument, allowWriteDocument),
    window: global,
    globalThis: global,
    self: global,
  });
}
