/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Document
 */
import { generateProxy } from '../utils';

import GemFrame from '../index';

import { getLocation } from './location';

const allowListenerEvent = ['visibilitychange'];

export function getDocument(frameElement: GemFrame) {
  const execScript = async (value: string) => {
    // 如果 <gem-frame> 的 src 是完整 url，则需要调整域名
    // 如果是路径，则不需要调整域名
    const { href } = new URL(value, frameElement._url);

    console.time(href);
    try {
      frameElement._execScript(await (await fetch(href)).text());
    } finally {
      console.timeEnd(href);
    }
  };

  let documentProxy: any = null;
  const locationProxy = getLocation(frameElement);

  const allowWriteDocument = {
    cookie: true,
    // <gem-title>
    title: true,
  };

  const allowReadDocument = {
    // https://developer.mozilla.org/en-US/docs/Web/API/Document
    documentElement: generateProxy(frameElement, frameElement.shadowRoot, {}, {}),
    head: frameElement.shadowRoot,
    body: frameElement.shadowRoot,
    activeElement: null,
    get hidden() {
      return document.hidden;
    },
    get visibilityState() {
      return document.visibilityState;
    },
    domain: document.domain,
    referrer: document.referrer,
    location: locationProxy,
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

    // <gem-use>
    querySelector: frameElement.shadowRoot.querySelector.bind(frameElement.shadowRoot),
    querySelectorAll: frameElement.shadowRoot.querySelectorAll.bind(frameElement.shadowRoot),

    getElementById: frameElement.shadowRoot.getElementById.bind(frameElement.shadowRoot),
    getElementsByClassName(name: string) {
      // 类型不匹配
      return frameElement.shadowRoot.querySelectorAll(`.${name}`);
    },
    getElementsByTagName(name: string) {
      // 类型不匹配
      return frameElement.shadowRoot.querySelectorAll(name);
    },

    // lit-html
    // lit-html 创建的 script 解析在 template 中，不会执行
    createElement(tag: string) {
      if (tag === 'script') {
        // 用于 webpack 的动态模块
        const script = document.createElement('script');
        Object.defineProperty(script, 'src', {
          set(value) {
            execScript(value);
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
    addEventListener: (type: string, callback: Function, options: any) => {
      if (allowListenerEvent.includes(type)) {
        frameElement._addProxyEventListener(document, type, callback, options);
      } else {
        // mouse event, pointer event, keyboard event...
        frameElement._addProxyEventListener(frameElement, type, callback, options);
      }
    },
    removeEventListener: (type: string, callback: Function, options: any) => {
      if (allowListenerEvent.includes(type)) {
        frameElement._removeProxyEventListener(document, type, callback, options);
      } else {
        frameElement._removeProxyEventListener(frameElement, type, callback, options);
      }
    },
  };
  documentProxy = generateProxy({}, document, allowReadDocument, allowWriteDocument);
  return documentProxy;
}
