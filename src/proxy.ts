/* eslint-disable @typescript-eslint/camelcase */
/**
 * 没有提供真正的沙箱，因为共享 DOM，例如:
 *
 * * `Node.ownerDocument` 就能访问到原始 `document` 对象
 * * `<script>` 能执行任意代码
 */
import GemFrame from './index';

// React 事件系统使用 `ownerDocument` 监听事件，无法拦截
// 导致 `Event.target` 错误
// 这里修正了 `Event.target` 的问题，但是可能对外部系统产生影响
Object.defineProperty(Event.prototype, 'target', {
  configurable: true,
  get() {
    return this.composedPath()[0];
  },
});

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
  return ele;
}

export function getGlobalObject(frameElement: GemFrame, doc = new Document()) {
  let globalProxy: any;
  let documentProxy: any;
  const allowReadDocument = {
    // https://developer.mozilla.org/en-US/docs/Web/API/Document
    body: frameElement.tag ? avoidRender(doc.body) : frameElement.shadowRoot,
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
      return frameElement.shadowRoot.getSelection;
    },
    get elementFromPoint() {
      return frameElement.shadowRoot.elementFromPoint;
    },
    get elementsFromPoint() {
      return frameElement.shadowRoot.elementsFromPoint;
    },
    get caretRangeFromPoint() {
      return frameElement.shadowRoot.caretRangeFromPoint;
    },
    get caretPositionFromPoint() {
      return frameElement.shadowRoot.caretPositionFromPoint;
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
            gemframe._fetchScript();
            return true;
          },
        });
        return script;
      }
      // 防止 React 注册到 document 导致不能 GC
      const ele = document.createElement(tag);
      Object.defineProperty(ele, 'ownerDocument', {
        configurable: true,
        get() {
          return documentProxy;
        },
      });
      return ele;
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
      if (['visibilitychange'].includes(type)) {
        frameElement._addProxyEventListener(document, type, callback, options);
      } else {
        // mouse event, pointer event, keyboard event...
        frameElement._addProxyEventListener(frameElement, type, callback, options);
      }
    },
    removeEventListener: (type, callback, options) => {
      if (['visibilitychange'].includes(type)) {
        frameElement._removeProxyEventListener(document, type, callback, options);
      } else {
        frameElement._removeProxyEventListener(frameElement, type, callback, options);
      }
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
      return frameElement.clientHeight;
    },
    get innerWidth() {
      return frameElement.clientWidth;
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
      frameElement.dispatchEvent(new MessageEvent('message', { data }));
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
        // 未考虑 `removeEventListener`
        // 直接执行
        setTimeout(() => callback(new CustomEvent(type)));
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
          resizeObserver.observe(frameElement);
        }
      } else if (['popstate', 'unload', 'beforeunload'].includes(type)) {
        frameElement._addProxyEventListener(window, type, callback, options);
      } else {
        // mouse event, pointer event, keyboard event...
        frameElement._addProxyEventListener(frameElement, type, callback, options);
      }
    },
    removeEventListener: (type, callback, options) => {
      if (['popstate', 'unload', 'beforeunload'].includes(type)) {
        frameElement._removeProxyEventListener(window, type, callback, options);
      } else {
        // mouse event, pointer event, keyboard event...
        frameElement._removeProxyEventListener(frameElement, type, callback, options);
      }
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

    // vue
    setImmediate: true,
  };

  globalProxy = generateProxy(window, 'window', allowReadWindow, allowWriteWindow);
  documentProxy = generateProxy(document, 'document', allowReadDocument, allowWriteDocument);

  return Object.assign(allowReadWindow, {
    document: documentProxy,
    window: globalProxy,
    global: globalProxy, // webpack dev 下会读取，chrome 会检测类型导致发生错误，类型检测原因不明，有可能是过时标准的问题
    globalThis: globalProxy,
    self: globalProxy,
    ...frameElement.context,
  });
}
