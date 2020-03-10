import { GemElement, render, html } from '@mantou/gem/lib/element';
import { attribute, customElement, emitter, property, adoptedStyle } from '@mantou/gem/lib/decorators';
import { createCSSSheet, css } from '@mantou/gem/lib/utils';

import Realm from 'realms-shim';

import { getGlobalObject } from './proxy';

// 由于 js 的问题导致不兼容 Safari
// 所以这里重新使用 constructor stylesheet，以便子应用操作 `ShadowDOM`
// 但是优先级比 `<style>` 高
const frameStyle = createCSSSheet(css`
  :host {
    all: initial;
    display: block;
    border: none;
    overflow: auto;
    position: relative;
  }
`);

/**
 * @custom-element gem-frame
 * @prop context
 * @attr src
 * @attr basepath
 * @fires error
 * @fires unload
 */
@customElement('gem-frame')
@adoptedStyle(frameStyle)
export default class GemFrame extends GemElement {
  // 资源路径，支持 html, json, js
  @attribute src: string;
  @attribute basepath: string;
  // 执行时发生错误, `event.detail` 获取该错误对象
  @emitter error: Function;
  @emitter unload: Function;
  // 共享到子 app 的对象
  @property context: object = {};

  get _shape() {
    return this.outerHTML;
  }

  get _url() {
    const src = this.src.startsWith('//') ? `${location.protocol}${this.src}` : this.src;
    return new URL(src, location.origin);
  }

  _loaded = false;
  _currentRealm = null;
  _currentRealmIFrameElement: HTMLIFrameElement = null;
  _proxyObject = null;

  _errorEventHandler = ({ error }: ErrorEvent) => {
    this.error(error);
  };

  _initFrame = async () => {
    if (this._loaded) return;
    if (!this.src) return;

    console.time(this._shape);
    try {
      this._currentRealm = Realm.makeRootRealm({ errorHandler: this._errorEventHandler });
      this._currentRealmIFrameElement = document.querySelector('body iframe:last-child');
      this._proxyObject = getGlobalObject(this);
      for await (let text of await this._fetchScript()) {
        this._execScript(text);
      }
    } catch {}
    this._loaded = true;
    console.timeEnd(this._shape);
  };

  _fetchScript = async () => {
    const url = this._url;
    let src = this.src;
    let doc: Document;
    if (url.pathname.endsWith('.json')) {
      // webpack manifest
      // 假设第一个字段就是 output
      // 相对路径可能有问题
      const manifest = await (await fetch(`${src}?t=${Date.now()}`)).json();
      src = new URL(manifest[Object.keys(manifest)[0]], url).toString();
    } else if (url.pathname.endsWith('.js')) {
      // 不能自动更新
      src = this.src;
    } else {
      // html
      const text = await (await fetch(`${src}?t=${Date.now()}`)).text();
      const parse = new DOMParser();
      doc = parse.parseFromString(text, 'text/html');
      const elements = doc.querySelectorAll('body > *:not(script)');
      this.shadowRoot.append(...[...elements].map(e => e.cloneNode(true)));
      const scripts = doc.querySelectorAll('script');
      return [...scripts]
        .sort(script => (script.defer ? 1 : -1))
        .map(async script => {
          if (script.src) {
            const { pathname, search } = new URL(script.src);
            const src = new URL(`${pathname}${search}`, url).toString();
            return await (await fetch(src)).text();
          } else {
            return script.textContent;
          }
        });
    }
    if (!src) return; // 静默失败
    return await (await fetch(src)).text();
  };

  _execScript = (text: string) => {
    try {
      return this._currentRealm.evaluate(text, this._proxyObject);
    } catch (err) {
      this.error(err);
    }
  };

  _eventListenerList: [EventTarget, string, any, boolean | AddEventListenerOptions][] = [];

  _addProxyEventListener = (
    target: EventTarget,
    event: string,
    callback: any,
    options: boolean | AddEventListenerOptions,
  ) => {
    target.addEventListener(event, callback, options);
    this._eventListenerList.push([target, event, callback, options]);
  };

  _removeProxyEventListener = (
    target: EventTarget,
    event: string,
    callback: any,
    options: boolean | AddEventListenerOptions,
  ) => {
    target.removeEventListener(event, callback, options);
    const index = this._eventListenerList.findIndex(([_target, _event, _callback, _options]) => {
      return (
        target === _target &&
        event === _event &&
        callback === _callback &&
        (typeof options === 'object' && typeof _options === 'object'
          ? options.capture === _options.capture &&
            options.once === _options.once &&
            options.passive === _options.passive
          : options === _options)
      );
    });
    if (index !== -1) this._eventListenerList.splice(index, 1);
  };

  _clean = () => {
    // 模拟子 app window unload 事件
    this.unload();
    // 清空 DOM 内容
    render(html``, this.shadowRoot);
    // 清除 `<gem-frame>` 以及 `window`, `document` 上的事件监听器
    this._eventListenerList.forEach(([target, event, callback, options]) => {
      target.removeEventListener(event, callback, options);
    });
    this._eventListenerList = [];
    if (this._currentRealmIFrameElement) {
      this._currentRealmIFrameElement.remove();
      this._currentRealmIFrameElement = null;
    }
    this._loaded = false;
  };

  mounted() {
    new IntersectionObserver(entries => {
      if (entries[0].intersectionRatio <= 0) return;
      this._initFrame();
    }).observe(this);
  }

  unmounted() {
    this._clean();
  }

  attributeChanged() {
    this._clean();
    this._initFrame();
  }
}
