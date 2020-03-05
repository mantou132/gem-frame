import { GemElement, render, html } from '@mantou/gem/lib/element';
import { attribute, customElement, emitter, property, adoptedStyle } from '@mantou/gem/lib/decorators';
import { createCSSSheet, css } from '@mantou/gem/lib/utils';
import '@mantou/gem/lib/history';

import Realm from 'realms-shim';

import { getGlobalObject } from './proxy';

const tagFrameMap: Record<string, GemFrame> = {};

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
 * @attr tag
 * @fires error
 * @fires unload
 */
@customElement('gem-frame')
@adoptedStyle(frameStyle)
export default class GemFrame extends GemElement {
  // 资源路径，支持 html, json, js
  @attribute src: string;
  // 自定义元素标签，如果正确的元素标签，则不会重复执行，适用于单元素 app
  // 不同的 app 不能写相同的名称，否则找不到 tag 对应的原始 `<gem-frame>`
  @attribute tag: string;
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
    if (this.tag && customElements.get(this.tag)) {
      if (tagFrameMap[this.tag] === this) {
        const app = document.createElement(this.tag) as GemElement;
        render(app, this.shadowRoot);
      } else {
        this.replaceWith(tagFrameMap[this.tag]);
      }
    } else {
      try {
        this._currentRealm = Realm.makeRootRealm({ errorHandler: this._errorEventHandler });
        // 是自定义元素时 `<iframe>` 不能移除，chrome bug?
        if (!this.tag || tagFrameMap[this.tag]) {
          this._currentRealmIFrameElement = document.querySelector('body iframe:last-child');
        }
        this._proxyObject = getGlobalObject(this);
        this._execScript(await this._fetchScript());
      } catch {}
    }
    this._loaded = true;
    console.timeEnd(this._shape);
    // 初次执行自定义元素记录绑定的 `<gem-frame>`
    if (this.tag && !(this.tag in tagFrameMap)) tagFrameMap[this.tag] = this;
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
      // TODO：允许多个脚本
      const text = await (await fetch(`${src}?t=${Date.now()}`)).text();
      const parse = new DOMParser();
      doc = parse.parseFromString(text, 'text/html');
      const elements = doc.querySelectorAll('body > *:not(script)');
      this.shadowRoot.append(...elements);
      const script: HTMLScriptElement = doc.querySelector('script[src]');
      const { pathname, search } = new URL(script.src);
      src = new URL(`${pathname}${search}`, url).toString();
    }
    if (!src) return; // 静默失败
    return await (await fetch(src)).text();
  };

  _execScript = (text: string) => {
    try {
      this._currentRealm.evaluate(text, this._proxyObject);
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

  attributeChanged(name: string) {
    this._clean();
    if (name === 'src') {
      this._initFrame();
    }
  }
}
