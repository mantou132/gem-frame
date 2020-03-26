import { generateProxy } from '../utils';
import GemFrame from '../index';

import { getDocument } from './document';
import { getHistory } from './history';

const allowListenerEvent = ['popstate', 'hashchange'];

export function getWindow(frameElement: GemFrame) {
  const documentProxy = getDocument(frameElement);
  const historyProxy = getHistory(frameElement);

  const allowWriteWindow = {};

  const allowReadWindow = {
    document: documentProxy,
    history: historyProxy,
    location: documentProxy.location,
    // common
    scrollTo: frameElement.scrollTo.bind(frameElement),
    top: window.top,
    console,
    caches,
    Headers,
    Response,
    Request: function(req: RequestInfo, init?: RequestInit) {
      if (typeof req === 'string') {
        return new Request(new URL(req, frameElement._url).href, init);
      } else {
        return new Request(req, init);
      }
    },
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
    screen: window.screen,
    visualViewport: window['visualViewport'],
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope#Methods
    atob: atob.bind(window),
    btoa: btoa.bind(window),
    fetch: (req: RequestInfo, init: RequestInit) => {
      if (typeof req === 'string') {
        return fetch(new URL(req, frameElement._url).href, init);
      } else {
        return fetch(req, init);
      }
    },
    createImageBitmap: createImageBitmap.bind(window),
    setTimeout: setTimeout.bind(window),
    clearTimeout: clearTimeout.bind(window),
    setInterval: setInterval.bind(window),
    clearInterval: clearInterval.bind(window),
    queueMicrotask: queueMicrotask.bind(window),
    // https://developer.mozilla.org/en-US/docs/Web/API/Window#Methods
    alert: alert.bind(window),
    confirm: window.confirm.bind(window),
    requestAnimationFrame: requestAnimationFrame.bind(window),
    cancelAnimationFrame: cancelAnimationFrame.bind(window),
    getComputedStyle: getComputedStyle.bind(window),
    getSelection: getSelection.bind(window),
    matchMedia: matchMedia.bind(window),
    open: window.open.bind(window),
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
    HTMLTemplateElement,
    SVGSVGElement,

    customElements,
    CustomEvent,
    Node,
    localStorage,
    sessionStorage,
    addEventListener: (type: string, callback: Function, options: any) => {
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
    removeEventListener: (type: string, callback: Function, options: any) => {
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
