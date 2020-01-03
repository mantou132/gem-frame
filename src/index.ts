import { html, GemElement } from '@mantou/gem/lib/element';
import { attribute, property, customElement, emitter } from '@mantou/gem/lib/decorators';
import Realm from 'realms-shim';

import { setProxy } from './proxy';

const fetchedScript = new Set();

type AppElement = GemElement & { data: object };

/**
 * @attr src
 * @attr tag
 * @fires error
 */
@customElement('gem-frame')
export default class GemFrame extends GemElement {
  // 资源路径，支持 html, json, js
  @attribute src: string;
  // 自定义元素 tagName
  @attribute tag: string;
  // 传递一个对象到子 App
  @property data: object = {};
  // 加载执行时发生错误, `event.detail` 获取该错误对象
  @emitter error: Function;

  private app: AppElement;

  get useIFrame() {
    return !this.tag;
  }

  async fetchScript() {
    if (!this.src) return;
    if (fetchedScript.has(this.src)) return;
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
    const r = Realm.makeRootRealm();
    try {
      // 在当前上下文中执行，所以不能用 `Error.prepareStackTrace` 改写子 App 中的异步错误
      r.evaluate(text, setProxy(this.app, doc));
    } catch (err) {
      this.error(err);
    }
    fetchedScript.add(this.src);
  }

  private appendElement() {
    if (this.app) this.app.remove();
    this.app = document.createElement(this.tag) as AppElement;
    // 错误传播
    this.app.onerror = (err: CustomEvent) => this.error(err.detail);
    this.app.data = this.data;
    this.shadowRoot.append(this.app);
  }

  private errorHandle = (err: ErrorEvent) => {
    // 捕获到的错误不能区分来源！！！
    // 没有调用栈！！！
    this.error(err.error);
  };

  render() {
    const renderedElementTagName = this.useIFrame ? 'iframe' : this.tag;
    const renderedElement = this.useIFrame
      ? html`
          <iframe src=${this.src}></iframe>
        `
      : '';
    return html`
      <style>
        :host {
          all: initial;
          display: block;
        }
        ${renderedElementTagName} {
          border: none;
          overflow: scroll;
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
      ${renderedElement}
    `;
  }

  mounted() {
    if (!this.useIFrame) {
      this.appendElement();
      this.fetchScript();
    }
    window.addEventListener('error', this.errorHandle);
    return () => {
      window.removeEventListener('error', this.errorHandle);
    };
  }

  attributeChanged(name: string) {
    if (name === 'src') {
      this.fetchScript();
    }
    if (name === 'tag') {
      this.appendElement();
    }
  }

  propertyChanged(name: string, _oldValue: any, value: any) {
    if (this.app && name === 'data') this.app[name] = value;
  }
}
