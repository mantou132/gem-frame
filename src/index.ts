import { GemElement } from '@mantou/gem/lib/element';
import { attribute, customElement, emitter, property, adoptedStyle } from '@mantou/gem/lib/decorators';
import { css, createCSSSheet } from '@mantou/gem/lib/utils';
import Realm from 'realms-shim';

import { getGlobalObject } from './proxy';

// 方便清空内容
const frameStyle = createCSSSheet(css`
  :host {
    all: initial;
    display: block;
    border: none;
    overflow: auto;
    position: relative;
  }
`);

const fetchedScript = new Set();

/**
 * @custom-element gem-frame
 * @prop context
 * @attr src
 * @attr tag
 * @fires error
 */
@customElement('gem-frame')
@adoptedStyle(frameStyle)
export default class GemFrame extends GemElement {
  // 资源路径，支持 html, json, js
  @attribute src: string;
  // 自定义元素 tagName
  @attribute tag: string;
  // 执行时发生错误, `event.detail` 获取该错误对象
  @emitter error: Function;
  // 共享到子 app 的对象
  @property context: object = {};

  async _fetchScript() {
    if (!this.src) return;
    // 自定义元素不需要重复执行
    if (this.tag && fetchedScript.has(this.src)) return;
    // react app 执行前清空内容
    if (!this.tag) this._cleanContent();
    let src = this.src.startsWith('//') ? `${location.protocol}${this.src}` : this.src;
    let doc: Document;
    const url = new URL(src, location.origin);
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
      const script: HTMLScriptElement = doc.querySelector('script[src]');
      const { pathname, search } = new URL(script.src);
      src = new URL(`${pathname}${search}`, url).toString();
    }
    if (!src) return; // 静默失败
    const text = await (await fetch(src)).text();
    const r = Realm.makeRootRealm({ errorHandler: this._errorEventHandler });
    try {
      r.evaluate(text, getGlobalObject(this, doc));
    } catch (err) {
      this.error(err);
    }
    fetchedScript.add(this.src);
  }

  _updateElement() {
    if (this.tag) {
      this._cleanContent();
      const app = document.createElement(this.tag) as GemElement;
      // 错误传播
      app.addEventListener('error', (err: CustomEvent) => this.error(err.detail));
      this.shadowRoot.append(app);
    }
  }

  _eventListenerList: [EventTarget, string, any, boolean | AddEventListenerOptions][] = [];

  _addProxyEventListener(
    target: EventTarget,
    event: string,
    callback: any,
    options: boolean | AddEventListenerOptions,
  ) {
    target.addEventListener(event, callback, options);
    this._eventListenerList.push([target, event, callback, options]);
  }

  _removeProxyEventListener(
    target: EventTarget,
    event: string,
    callback: any,
    options: boolean | AddEventListenerOptions,
  ) {
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
  }

  _cleanContent() {
    this.shadowRoot.innerHTML = '';
  }

  _cleanEventListener() {
    // 清除 `<gem-frame>` 以及 `window`, `document` 上的事件监听器
    this._eventListenerList.forEach(([target, event, callback, options]) => {
      target.removeEventListener(event, callback, options);
    });
    this._eventListenerList = [];
  }

  _errorEventHandler = ({ error }: ErrorEvent) => {
    this.error(error);
  };

  mounted() {
    this._updateElement();
    this._fetchScript();
  }

  unmounted() {
    this._cleanEventListener();
  }

  attributeChanged(name: string) {
    this._cleanEventListener();

    if (name === 'src') {
      this._fetchScript();
    }
    if (name === 'tag') {
      this._updateElement();
    }
  }
}
