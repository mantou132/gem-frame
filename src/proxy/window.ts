import { generateProxy } from '../utils';

import GemFrame from '../index';

const allowListenerEvent = ['popstate'];

export function getWindow(frameElement: GemFrame) {
  const allowWriteWindow = {
    __litHtml: true,
  };

  const allowReadWindow = {
    // common
    top,
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
    HTMLIFrameElement,
    customElements,
    CustomEvent,
    Node,
    location,
    localStorage,
    sessionStorage,
    history,
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
      } else if (allowListenerEvent.includes(type)) {
        frameElement._addProxyEventListener(window, type, callback, options);
      } else {
        // mouse event, pointer event, keyboard event...
        frameElement._addProxyEventListener(frameElement, type, callback, options);
      }
    },
    removeEventListener: (type, callback, options) => {
      if (allowListenerEvent.includes(type)) {
        frameElement._removeProxyEventListener(window, type, callback, options);
      } else {
        // mouse event, pointer event, keyboard event...
        frameElement._removeProxyEventListener(frameElement, type, callback, options);
      }
    },
  };
  const globalProxy = generateProxy(frameElement._currentRealm.global, window, allowReadWindow, allowWriteWindow);
  return { allowReadWindow, globalProxy };
}