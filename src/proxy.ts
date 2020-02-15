/* eslint-disable @typescript-eslint/camelcase */
/**
 * 没有提供真正的沙箱，因为共享 DOM，例如:
 *
 * * `Node.ownerDocument` 就能访问到原始 `document` 对象
 * * <script> 能执行任意代码
 */
import { GemElement } from '@mantou/gem/lib/element';

import GemFrame from './index';

const emptyFunction = new Function();

function generateProxy(target: any, name: string, allowRead: object, allowWrite: object) {
  return new Proxy(target, {
    get(_, prop) {
      if (prop in allowRead) {
        return allowRead[prop];
      } else {
        console.warn(`Read forbidden property: \`${name}.${String(prop)}\``);
        return target[prop] ? emptyFunction : undefined;
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

// 避免执行子 app 中的 `render(xx, ele)` 方法
function avoidRender(ele: Element) {
  Object.assign(ele, {
    insertBefore: emptyFunction,
    querySelector: (selector: string) => {
      const e = ele.querySelector(selector);
      if (e) avoidRender(e);
      return e;
    },
  });
}

export function setProxy(frameElement: GemFrame, rootElement: GemElement, doc = new Document()) {
  const isCustomElementApp = frameElement !== rootElement;
  avoidRender(doc.body);
  const allowReadDocument = {
    // https://developer.mozilla.org/en-US/docs/Web/API/Document
    body: isCustomElementApp ? doc.body : rootElement.shadowRoot,
    documentElement: doc.documentElement,
    activeElement: null,
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

    //react
    createEvent: document.createEvent.bind(document),

    // event
    addEventListener: <K extends keyof DocumentEventMap>(
      type: K,
      callback: any,
      options: boolean | AddEventListenerOptions,
    ) => {
      // 拦截不到 react 事件，导致 react-router link 不能正常跳转
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
    get top() {
      return window.top;
    },
    console,
    caches,
    Headers,
    Response,
    Request,
    XMLHttpRequest,
    WebSocket,
    EventSource,
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
      } else if (['popstate', 'unload', 'beforeunload'].includes(type)) {
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
    //react
    get __react_router_build__() {
      return window['__react_router_build__'];
    },
  };

  const allowWriteWindow = {
    webpackJsonp: true,
    name: true,
    __litHtml: true,
    litHtmlVersions: true,
    __react_router_build__: true,
  };

  const global = generateProxy(window, 'window', allowReadWindow, allowWriteWindow);
  return Object.assign(allowReadWindow, {
    document: generateProxy(document, 'document', allowReadDocument, allowWriteDocument),
    window: global,
    global: global, // webpack dev 下会读取，chrome 会检测类型导致发生错误，类型检测原因不明，有可能是过时标准的问题
    globalThis: global,
    self: global,
  });
}
