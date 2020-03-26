import { GemElement } from '@mantou/gem/lib/element';
import { attribute, customElement, emitter, property, adoptedStyle } from '@mantou/gem/lib/decorators';
import { createCSSSheet, css } from '@mantou/gem/lib/utils';

import Realm from 'realms-shim';

import urlChangeTarget from './url-change-hack';
import { getGlobalObject } from './proxy';

const keepAliveFrame: Record<string, GemFrame> = {};
const callbackWeakMap = new WeakMap<Function, Function>();

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
 * @attr {'on' | 'off'} keep-alive
 * @fires error
 * @fires unload
 * @fires load
 */
@customElement('gem-frame')
@adoptedStyle(frameStyle)
export default class GemFrame extends GemElement {
  // 资源路径，支持 html, json, js
  @attribute src: string;
  // GemApp 不允许设置 basepath
  @attribute basepath: string;
  // GemApp 必须开启 keepAlive
  @attribute keepAlive: 'on' | 'off';
  // 执行时发生错误, `event.detail` 获取该错误对象
  @emitter error: Function;
  @emitter unload: Function;
  @emitter load: Function;
  // 用于执行 frame 内回调
  @emitter hostUrlChanged: Function;
  // 共享到子 app 的对象
  @property context: object = {};

  get _shape() {
    return this.outerHTML;
  }

  get _url() {
    const src = this.src.startsWith('//') ? `${window.location.protocol}${this.src}` : this.src;
    return new URL(src, window.location.origin);
  }

  // 用来标记 content
  get _key() {
    return `${this.src}/${this.basepath}`;
  }

  // keepAlive 开启时展示内容的实际 gem-frame 元素
  get _keepAliveFrame() {
    return keepAliveFrame[this._key];
  }

  set _keepAliveFrame(v: GemFrame) {
    keepAliveFrame[this._key] = v;
  }

  // 标记当前元素是否是 keepAlive 开启时保存的实际 gem-frame 元素
  _keepAlive = false;
  // 内容是否已经加载
  _loaded = false;
  // 元素是否时活动的，keepAlive 开启时，元素卸载其值变为 true
  _active = false;
  // 当前执行脚本的 Realm
  _currentRealm = null;
  // Reaml 中用到的 iframe 元素
  _currentRealmIFrameElement: HTMLIFrameElement = null;
  // 当前执行脚本的代理（沙箱）对象
  _proxyObject = null;

  _errorEventHandler = ({ error }: ErrorEvent) => {
    this.error(error);
  };

  _initFrame = async () => {
    if (this._loaded) return;
    this._loaded = true;
    if (!this.src) return;

    if (this.keepAlive === 'on') {
      if (!this._keepAliveFrame) {
        const app = new GemFrame();
        app._keepAlive = true;
        app.basepath = this.basepath;
        app.src = this.src;
        app.context = this.context;
        app.error = this.error;
        app.unload = this.unload;
        app.load = this.load;
        app.setAttribute('style', 'height: 100%;');
        this._keepAliveFrame = app;
        this.shadowRoot.append(this._keepAliveFrame);
      } else {
        console.time(this._keepAliveFrame._shape);
        this.shadowRoot.append(this._keepAliveFrame);
        this._keepAliveFrame.hostUrlChanged();
        console.timeEnd(this._keepAliveFrame._shape);
      }
    } else {
      console.time(this._shape);
      try {
        const realm = Realm.makeRootRealm({ errorHandler: this._errorEventHandler });
        this._currentRealm = realm;
        this._currentRealmIFrameElement = document.querySelector('body iframe:last-child');
        this._proxyObject = getGlobalObject(this);
        for await (const text of await this._fetchScript()) {
          if (realm === this._currentRealm) {
            this._execScript(text);
          }
        }
      } catch {}
      console.timeEnd(this._shape);
      this.load();
    }
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
            const srcAttr = script.getAttribute('src');
            const { pathname, search } = new URL(script.src);
            const src = new URL(`${pathname}${search}`, srcAttr.match(/^(https?:)?\/\//) ? script.src : url).toString();
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
    const frame = this._keepAliveFrame || this;
    try {
      return frame._currentRealm.evaluate(text, frame._proxyObject);
    } catch (err) {
      this.error(err);
    }
  };

  _eventListenerList: [EventTarget, string, any, boolean | AddEventListenerOptions][] = [];
  _getEventListenerIndex = (
    target: EventTarget,
    event: string,
    callback: any,
    options: boolean | AddEventListenerOptions,
  ) => {
    return this._eventListenerList.findIndex(([_target, _event, _callback, _options]) => {
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
  };

  _addProxyEventListener = (
    target: EventTarget,
    event: string,
    callback: any,
    options: boolean | AddEventListenerOptions,
  ) => {
    const fn = (e: Event) => {
      if (!this._active) return;
      return callback(e);
    };
    callbackWeakMap.set(callback, fn);
    target.addEventListener(event, fn, options);
    const index = this._getEventListenerIndex(target, event, callback, options);
    if (index !== -1) return;
    this._eventListenerList.push([target, event, callback, options]);
  };

  _removeProxyEventListener = (
    target: EventTarget,
    event: string,
    callback: any,
    options: boolean | AddEventListenerOptions,
  ) => {
    const fn = callbackWeakMap.get(callback) as any;
    target.removeEventListener(event, fn, options);
    const index = this._getEventListenerIndex(target, event, callback, options);
    if (index !== -1) this._eventListenerList.splice(index, 1);
  };

  _clean = () => {
    if (this._keepAlive) return;
    // 模拟子 app window unload 事件
    this.unload();
    // 清空 DOM 内容
    this.shadowRoot.innerHTML = '';
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

  // 防止删除非 lit-html 插入的内容
  render() {
    return undefined;
  }

  mounted() {
    urlChangeTarget.addEventListener('change', this.hostUrlChanged as any);
    this._active = true;

    // lazy loading
    new IntersectionObserver(entries => {
      if (entries[0].intersectionRatio <= 0) return;
      this._initFrame();
    }).observe(this);
  }

  updated() {
    this._clean();
    this._initFrame();
  }

  unmounted() {
    urlChangeTarget.removeEventListener('change', this.hostUrlChanged as any);
    this._active = false;
    this._clean();
  }
}
